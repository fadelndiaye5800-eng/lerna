-- ============================================================================
-- LERNA — schéma Supabase (document maître §15) avec Row Level Security partout
-- À exécuter une fois dans Supabase → SQL Editor → New query → Run.
-- Puis exécuter seed.sql (écoles + opportunités).
-- ============================================================================

-- ---------- Utilisateurs (profil public lié à auth.users) ----------
create table if not exists public.users (
  id                 uuid primary key references auth.users(id) on delete cascade,
  email              text unique not null,
  nom                text,
  prenom             text,
  pays               text,
  niveau_etudes      text,
  bio                text check (char_length(bio) <= 150),
  date_inscription   timestamptz default now(),
  is_premium         boolean default false,
  premium_expiry     timestamptz,
  avatar_url         text,
  ls_customer_id     text,
  ls_subscription_id text,
  ls_portal_url      text,
  ref_code           text unique                      -- code de parrainage (lien lerna.world/?ref=CODE)
);
alter table public.users add column if not exists ref_code text unique;
-- v5 : pseudo (salutation), rôle (admin), version A/B attribuée, préférences (Paramètres)
alter table public.users add column if not exists pseudo text check (char_length(pseudo) <= 24);
alter table public.users add column if not exists role text not null default 'user' check (role in ('user', 'admin'));
alter table public.users add column if not exists ab jsonb not null default '{}'::jsonb;
alter table public.users add column if not exists prefs jsonb;
-- v7 : infos données à l'inscription (avatar choisi = genre ; date de naissance pour les offres avec limite d'âge)
alter table public.users add column if not exists genre text check (genre in ('h', 'f', 'x'));
alter table public.users add column if not exists date_naissance date;
alter table public.users enable row level security;
drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users for select using (auth.uid() = id);
drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users for update using (auth.uid() = id) with check (auth.uid() = id);
-- L'utilisateur ne peut modifier QUE ces colonnes : jamais is_premium / premium_expiry (réservés au webhook)
revoke update on public.users from authenticated, anon;
-- (jamais role non plus : un compte ne peut pas se nommer admin lui-même)
grant update (nom, prenom, pseudo, pays, niveau_etudes, bio, avatar_url, ab, prefs, genre, date_naissance) on public.users to authenticated;

-- Code de parrainage unique (6 caractères sans 0/O/1/I pour éviter les confusions)
create or replace function public.lerna_new_ref_code() returns text
language plpgsql volatile security definer set search_path = public as $$
declare c text; a text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
begin
  loop
    c := '';
    for i in 1..6 loop c := c || substr(a, 1 + floor(random() * length(a))::int, 1); end loop;
    exit when not exists (select 1 from public.users where ref_code = c);
  end loop;
  return c;
end $$;

-- Création automatique de la ligne users à l'inscription (email, Google ou Apple)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, ref_code, prenom, nom, pseudo, pays, niveau_etudes, ab, genre, date_naissance)
  values (
    new.id, lower(new.email), public.lerna_new_ref_code(),
    coalesce(new.raw_user_meta_data->>'prenom', new.raw_user_meta_data->>'given_name', split_part(coalesce(new.raw_user_meta_data->>'full_name', ''), ' ', 1)),
    coalesce(new.raw_user_meta_data->>'nom', new.raw_user_meta_data->>'family_name'),
    nullif(left(trim(coalesce(new.raw_user_meta_data->>'pseudo', '')), 24), ''),
    new.raw_user_meta_data->>'pays',
    new.raw_user_meta_data->>'niveau',
    case when jsonb_typeof(new.raw_user_meta_data->'ab') = 'object' then new.raw_user_meta_data->'ab' else '{}'::jsonb end,
    case when new.raw_user_meta_data->>'genre' in ('h', 'f', 'x') then new.raw_user_meta_data->>'genre' end,
    case when coalesce(new.raw_user_meta_data->>'naissance', '') ~ '^\d{4}-\d{2}-\d{2}$' then (new.raw_user_meta_data->>'naissance')::date end
  )
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
update public.users set ref_code = public.lerna_new_ref_code() where ref_code is null;

-- Petite fonction utilitaire : l'utilisateur courant est-il Premium ?
create or replace function public.is_premium_user() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.is_premium and (u.premium_expiry is null or u.premium_expiry > now())
  );
$$;

-- ---------- Profils (réponses au questionnaire) ----------
create table if not exists public.profils (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references public.users(id) on delete cascade,
  age_range          text, niveau text, bac text, pays_actuel text,
  langues            text[], matieres_fortes text[], matieres_faibles text[],
  profil_type        text, style_travail text, a_laise_avec text,
  vision_10ans       text, objectif_pro text, destination text[],
  priorites          text[], secteurs text[],
  financement        text[], budget text, mobilite text, travail_pendant text, duree_formation text,
  mode_apprentissage text, theorique_pratique text, reconnaissance text, organisation text, vie_campus text,
  langues_niveaux    jsonb,                           -- {"fr":"aise","en":"inter"}
  autres             jsonb,                           -- réponses « Autre » écrites par l'élève, par question
  note_libre         text,                            -- « Autre chose que LERNA devrait savoir ? »
  source             text default 'ai',
  date_creation      timestamptz default now()
);
-- Mise à niveau d'une base créée avec l'ancienne version (destination / financement à choix unique)
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profils' and column_name = 'destination' and data_type = 'text') then
    alter table public.profils alter column destination type text[] using case when destination is null then null else array[destination] end;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profils' and column_name = 'financement' and data_type = 'text') then
    alter table public.profils alter column financement type text[] using case when financement is null then null else array[financement] end;
  end if;
end $$;
alter table public.profils add column if not exists langues_niveaux jsonb;
alter table public.profils add column if not exists autres jsonb;
alter table public.profils add column if not exists note_libre text;
alter table public.profils add column if not exists source text default 'ai';
alter table public.profils enable row level security;
drop policy if exists profils_own on public.profils;
create policy profils_own on public.profils for select using (auth.uid() = user_id);

-- ---------- Recommandations ----------
create table if not exists public.recommandations (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references public.users(id) on delete cascade,
  session_id       text,
  resume           text,
  reco_1_json      jsonb,
  reco_2_json      jsonb,
  reco_3_json      jsonb,
  reco_4_json      jsonb,
  reco_5_json      jsonb,
  conseil          text,
  source           text default 'ai',
  date_generation  timestamptz default now()
);
alter table public.recommandations add column if not exists reco_4_json jsonb;
alter table public.recommandations add column if not exists reco_5_json jsonb;
alter table public.recommandations enable row level security;
drop policy if exists reco_select_own on public.recommandations;
create policy reco_select_own on public.recommandations for select using (auth.uid() = user_id);
drop policy if exists reco_insert_own on public.recommandations;
create policy reco_insert_own on public.recommandations for insert with check (auth.uid() = user_id);

-- ---------- Écoles (lecture publique) ----------
create table if not exists public.ecoles (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text unique not null,          -- identifiant utilisé par l'application (ex : "ucad")
  nom                  text not null,
  pays                 text,
  ville                text,
  type                 text,                          -- Publique / Privée / En ligne
  domaines             text[],
  frais_locaux_usd     integer,
  frais_etrangers_usd  integer,
  langue_enseignement  text[],
  duree_min            integer,
  duree_max            integer,
  conditions_admission text,
  description          text,
  points_forts         text[],
  points_faibles       text[],
  note_globale         numeric(2,1),
  nombre_avis          integer default 0,
  site_officiel        text,
  image_url            text,
  date_ajout           timestamptz default now(),
  active               boolean default true
);
alter table public.ecoles enable row level security;
drop policy if exists ecoles_read on public.ecoles;
create policy ecoles_read on public.ecoles for select using (active);

-- ---------- Opportunités (Premium protégé par RLS) ----------
create table if not exists public.opportunites (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique,
  type             text check (type in ('stage', 'emploi', 'bourse', 'investisseur')),
  titre            text,
  organisation     text,
  pays             text,
  ville            text,
  domaine          text,
  montant_usd      integer,
  montant_texte    text,
  duree            text,
  niveau_requis    text,
  date_limite      date,
  description      text,
  lien             text,
  is_premium       boolean default false,
  data             jsonb,                             -- fiche complète bilingue renvoyée par /api/opps
  date_publication timestamptz default now(),
  active           boolean default true
);
alter table public.opportunites add column if not exists data jsonb;
alter table public.opportunites enable row level security;
drop policy if exists opps_read on public.opportunites;
create policy opps_read on public.opportunites for select
  using (active and (not is_premium or public.is_premium_user()));

-- ---------- Favoris ----------
create table if not exists public.favoris (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  ecole_id    text not null,                           -- slug de l'école
  date_ajout  timestamptz default now(),
  unique (user_id, ecole_id)
);
alter table public.favoris enable row level security;
drop policy if exists favoris_own on public.favoris;
create policy favoris_own on public.favoris for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Offres sauvegardées (bourses, stages…) ----------
create table if not exists public.opp_favoris (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  opp_id      text not null,
  date_ajout  timestamptz default now(),
  unique (user_id, opp_id)
);
alter table public.opp_favoris enable row level security;
drop policy if exists opp_favoris_own on public.opp_favoris;
create policy opp_favoris_own on public.opp_favoris for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Avis (publiés après modération) ----------
create table if not exists public.avis (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id) on delete cascade,
  ecole_id         text not null,
  note_cours       integer check (note_cours between 1 and 5),
  note_campus      integer check (note_campus between 1 and 5),
  note_prix        integer check (note_prix between 1 and 5),
  note_insertion   integer check (note_insertion between 1 and 5),
  note_globale     numeric(2,1) generated always as (round(((note_cours + note_campus + note_prix + note_insertion)::numeric / 4), 1)) stored,
  commentaire      text check (char_length(commentaire) <= 1500),
  date_publication timestamptz default now(),
  valide           boolean default false,
  unique (user_id, ecole_id)
);
alter table public.avis enable row level security;
drop policy if exists avis_read on public.avis;
create policy avis_read on public.avis for select using (valide or auth.uid() = user_id);
drop policy if exists avis_insert_own on public.avis;
create policy avis_insert_own on public.avis for insert with check (auth.uid() = user_id and valide = false);

-- ---------- Limitation de débit des appels IA (service_role uniquement) ----------
create table if not exists public.rate_limits (
  k    text not null,
  day  date not null default current_date,
  n    integer not null default 0,
  primary key (k, day)
);
alter table public.rate_limits enable row level security;   -- aucune policy : invisible pour anon/authenticated

create or replace function public.lerna_usage(p_key text) returns integer
language sql security definer set search_path = public as $$
  select coalesce((select n from public.rate_limits where k = p_key and day = current_date), 0);
$$;
create or replace function public.lerna_hit(p_key text) returns integer
language plpgsql security definer set search_path = public as $$
declare cur integer;
begin
  insert into public.rate_limits (k, day, n) values (p_key, current_date, 1)
  on conflict (k, day) do update set n = public.rate_limits.n + 1
  returning n into cur;
  delete from public.rate_limits where day < current_date - 7;   -- ménage
  return cur;
end $$;
revoke execute on function public.lerna_usage(text) from public, anon, authenticated;
revoke execute on function public.lerna_hit(text) from public, anon, authenticated;
grant execute on function public.lerna_usage(text) to service_role;
grant execute on function public.lerna_hit(text) to service_role;

-- ============================================================================
-- PARRAINAGE — 3 amis inscrits débloquent les écoles n°3 et n°4
-- Un ami compte quand : compte créé via le lien, email confirmé, questionnaire terminé.
-- Les utilisateurs voient seulement leurs propres parrainages ; écriture réservée au serveur.
-- ============================================================================
create table if not exists public.referrals (
  id            uuid primary key default gen_random_uuid(),
  referrer_id   uuid not null references public.users(id) on delete cascade,
  referred_id   uuid not null unique references public.users(id) on delete cascade,
  code          text not null,
  created_at    timestamptz default now(),
  confirmed_at  timestamptz,
  check (referrer_id <> referred_id)
);
alter table public.referrals enable row level security;
drop policy if exists referrals_own on public.referrals;
create policy referrals_own on public.referrals for select using (auth.uid() = referrer_id);

create or replace function public.lerna_confirm_referred(p_user uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  update public.referrals r set confirmed_at = now()
  where r.referred_id = p_user and r.confirmed_at is null
    and exists (select 1 from auth.users u where u.id = p_user and u.email_confirmed_at is not null)
    and exists (select 1 from public.profils p where p.user_id = p_user);
  get diagnostics n = row_count;
  return n > 0;
end $$;

create or replace function public.lerna_claim_referral(p_user uuid, p_code text) returns text
language plpgsql security definer set search_path = public as $$
declare ref uuid; created timestamptz;
begin
  select id into ref from public.users where ref_code = upper(p_code);
  if ref is null then return 'unknown_code'; end if;
  if ref = p_user then return 'self'; end if;
  if exists (select 1 from public.referrals where referred_id = p_user) then return 'already'; end if;
  select u.created_at into created from auth.users u where u.id = p_user;
  if created is null or created < now() - interval '48 hours' then return 'too_late'; end if;
  insert into public.referrals (referrer_id, referred_id, code) values (ref, p_user, upper(p_code)) on conflict (referred_id) do nothing;
  perform public.lerna_confirm_referred(p_user);
  return 'ok';
end $$;

create or replace function public.lerna_referral_status(p_user uuid) returns json
language plpgsql security definer set search_path = public as $$
declare c text; conf integer; pend integer; r record;
begin
  for r in select referred_id from public.referrals where referrer_id = p_user and confirmed_at is null loop
    perform public.lerna_confirm_referred(r.referred_id);
  end loop;
  select ref_code into c from public.users where id = p_user;
  if c is null then
    c := public.lerna_new_ref_code();
    update public.users set ref_code = c where id = p_user;
  end if;
  select count(*) filter (where confirmed_at is not null), count(*) filter (where confirmed_at is null)
    into conf, pend from public.referrals where referrer_id = p_user;
  return json_build_object('code', c, 'confirmed', conf, 'pending', pend);
end $$;

revoke execute on function public.lerna_new_ref_code() from public, anon, authenticated;
revoke execute on function public.lerna_confirm_referred(uuid) from public, anon, authenticated;
revoke execute on function public.lerna_claim_referral(uuid, text) from public, anon, authenticated;
revoke execute on function public.lerna_referral_status(uuid) from public, anon, authenticated;
grant execute on function public.lerna_confirm_referred(uuid) to service_role;
grant execute on function public.lerna_claim_referral(uuid, text) to service_role;
grant execute on function public.lerna_referral_status(uuid) to service_role;
grant execute on function public.lerna_new_ref_code() to service_role;

-- ============================================================================
-- AVIS SUR LERNA (étoiles) — publiés seulement si la personne l'accepte ET après validation
-- Pour valider un avis : Supabase → Table editor → avis_app → cocher "valide".
-- ============================================================================
create table if not exists public.avis_app (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users(id) on delete set null,
  prenom      text check (char_length(prenom) <= 40),
  pays        text,
  note        integer not null check (note between 1 and 5),
  commentaire text check (char_length(commentaire) <= 600),
  publier     boolean default false,
  valide      boolean default false,
  lang        text,
  source      text,
  created_at  timestamptz default now()
);
alter table public.avis_app enable row level security;
drop policy if exists avis_app_read on public.avis_app;
create policy avis_app_read on public.avis_app for select using (valide and publier);


-- ============================================================================
-- v5 — administration, A/B, signalements, contact, « Mon dossier »
-- Pour devenir admin (une seule fois, dans le SQL Editor) :
--   update public.users set role = 'admin' where email = 'ton-adresse@exemple.com';
-- ============================================================================

-- L'utilisateur courant est-il admin ? (security definer : pas de boucle avec la policy de users)
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'admin');
$$;

-- L'admin voit tous les comptes (statistiques de /admin), sans pouvoir les modifier ici
drop policy if exists users_admin_read on public.users;
create policy users_admin_read on public.users for select using (public.is_admin());

-- Offres : date de vérification et gestion complète par l'admin
alter table public.opportunites add column if not exists verifie date;
alter table public.opportunites add column if not exists ouverture date;
drop policy if exists opps_admin on public.opportunites;
create policy opps_admin on public.opportunites for all using (public.is_admin()) with check (public.is_admin());

-- Réglages décidés depuis /admin : test A/B en cours ou version gagnante, taux de change
create table if not exists public.app_config (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id) on delete set null
);
alter table public.app_config enable row level security;
drop policy if exists app_config_admin on public.app_config;
create policy app_config_admin on public.app_config for all using (public.is_admin()) with check (public.is_admin());
insert into public.app_config (key, value) values
  ('ab', '{"couleurs": "test"}'::jsonb),
  ('fx', '{"EUR": 0.8913, "XOF": 584.7, "date": "2026-10-09"}'::jsonb),
  ('ab_history', '[]'::jsonb)
on conflict (key) do nothing;

-- « Signaler une offre expirée » (écrit par /api/message avec la clé serveur)
create table if not exists public.signalements (
  id         uuid primary key default gen_random_uuid(),
  opp_id     text not null,
  raison     text not null default 'expiree' check (raison in ('expiree', 'lien_casse', 'info_fausse', 'autre')),
  message    text check (char_length(message) <= 600),
  user_id    uuid references auth.users(id) on delete set null,
  statut     text not null default 'nouveau' check (statut in ('nouveau', 'traite', 'rejete')),
  created_at timestamptz default now()
);
alter table public.signalements enable row level security;
drop policy if exists signalements_admin on public.signalements;
create policy signalements_admin on public.signalements for all using (public.is_admin()) with check (public.is_admin());

-- Messages de la page Contact (écrits par /api/message, transférés en privé par email si Resend est configuré)
create table if not exists public.messages_contact (
  id         uuid primary key default gen_random_uuid(),
  sujet      text not null check (sujet in ('probleme', 'ajout', 'retrait', 'question', 'partenariat', 'donnees')),
  nom        text check (char_length(nom) <= 80),
  email      text not null check (char_length(email) <= 160),
  message    text not null check (char_length(message) <= 3000),
  page       text,
  lang       text default 'fr',
  user_id    uuid references auth.users(id) on delete set null,
  transfere  boolean default false,
  statut     text not null default 'nouveau' check (statut in ('nouveau', 'lu', 'repondu', 'archive')),
  created_at timestamptz default now()
);
alter table public.messages_contact enable row level security;
drop policy if exists messages_admin on public.messages_contact;
create policy messages_admin on public.messages_contact for all using (public.is_admin()) with check (public.is_admin());

-- « Mon dossier » : une candidature par école choisie (étapes, documents, brouillons, suivi)
create table if not exists public.dossiers (
  user_id    uuid not null references auth.users(id) on delete cascade,
  school_id  text not null check (school_id ~ '^[a-z0-9-]{1,40}$'),
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  primary key (user_id, school_id)
);
alter table public.dossiers enable row level security;
drop policy if exists dossiers_own on public.dossiers;
create policy dossiers_own on public.dossiers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Coffre-fort de candidature : fichiers privés de chaque étudiant (Supabase Storage)
-- Compartiment « coffre » NON public ; chaque personne ne voit que son dossier « <id du compte>/… ».
-- La fiche (texte) est dans public.dossiers, ligne school_id = 'coffre'.
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('coffre', 'coffre', false, 5242880, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
    on conflict (id) do nothing;
    execute 'drop policy if exists coffre_select on storage.objects';
    execute 'drop policy if exists coffre_insert on storage.objects';
    execute 'drop policy if exists coffre_update on storage.objects';
    execute 'drop policy if exists coffre_delete on storage.objects';
    execute $p$create policy coffre_select on storage.objects for select using (bucket_id = 'coffre' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
    execute $p$create policy coffre_insert on storage.objects for insert with check (bucket_id = 'coffre' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
    execute $p$create policy coffre_update on storage.objects for update using (bucket_id = 'coffre' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
    execute $p$create policy coffre_delete on storage.objects for delete using (bucket_id = 'coffre' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
  end if;
end $$;

-- ---------- Paiement Premium par Wave / Orange Money (vérifié à la main par le propriétaire) ----------
-- L'élève envoie l'argent au numéro affiché, puis déclare son paiement (formule, moyen, numéro qui a payé, référence).
-- Le propriétaire compare avec le message reçu sur son téléphone, puis valide depuis /admin.html → le Premium s'active tout de suite.
-- Toutes les écritures passent par deux fonctions sécurisées : personne ne peut s'activer Premium tout seul.
create table if not exists public.paiements_momo (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  email            text,
  formule          text not null check (formule in ('mois', 'an')),
  montant          integer not null check (montant > 0),
  moyen            text not null check (moyen in ('wave', 'orange_money')),
  numero_payeur    text not null check (char_length(numero_payeur) between 7 and 16),
  reference        text check (char_length(reference) <= 60),
  statut           text not null default 'en_attente' check (statut in ('en_attente', 'valide', 'refuse')),
  created_at       timestamptz not null default now(),
  traite_at        timestamptz,
  traite_par       uuid references auth.users(id) on delete set null,
  premium_jusqu_au timestamptz
);
create index if not exists paiements_momo_statut_idx on public.paiements_momo (statut, created_at desc);
create index if not exists paiements_momo_user_idx on public.paiements_momo (user_id, created_at desc);
alter table public.paiements_momo enable row level security;
drop policy if exists momo_select_own on public.paiements_momo;
create policy momo_select_own on public.paiements_momo for select using (auth.uid() = user_id);
drop policy if exists momo_admin_read on public.paiements_momo;
create policy momo_admin_read on public.paiements_momo for select using (public.is_admin());
revoke insert, update, delete on public.paiements_momo from anon, authenticated;
grant select on public.paiements_momo to authenticated;

-- Réglages (numéro qui reçoit, prix en FCFA, marche/arrêt), modifiables depuis /admin.html
insert into public.app_config (key, value) values
  ('momo', '{"numero": "+221786655769", "prix_mois": 3000, "prix_an": 24000, "actif": true}'::jsonb)
on conflict (key) do nothing;

-- L'élève déclare son paiement (le montant vient des réglages, jamais du navigateur)
create or replace function public.lerna_momo_demande(p_formule text, p_moyen text, p_numero text, p_reference text)
returns json language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid(); cfg jsonb; prix integer; n integer; em text; rid uuid;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select value into cfg from public.app_config where key = 'momo';
  if cfg is null or coalesce((cfg->>'actif')::boolean, false) = false then raise exception 'momo_off'; end if;
  if p_formule not in ('mois', 'an') then raise exception 'bad_formule'; end if;
  if p_moyen not in ('wave', 'orange_money') then raise exception 'bad_moyen'; end if;
  p_numero := regexp_replace(coalesce(p_numero, ''), '[^0-9+]', '', 'g');
  if char_length(p_numero) < 7 or char_length(p_numero) > 16 then raise exception 'bad_numero'; end if;
  p_reference := left(btrim(coalesce(p_reference, '')), 60);
  select count(*) into n from public.paiements_momo where user_id = uid and statut = 'en_attente';
  if n >= 3 then raise exception 'too_many'; end if;
  select count(*) into n from public.paiements_momo where user_id = uid and created_at > now() - interval '1 day';
  if n >= 6 then raise exception 'too_many'; end if;
  prix := case when p_formule = 'mois' then (cfg->>'prix_mois')::integer else (cfg->>'prix_an')::integer end;
  if prix is null or prix <= 0 then raise exception 'momo_off'; end if;
  select email into em from auth.users where id = uid;
  insert into public.paiements_momo (user_id, email, formule, montant, moyen, numero_payeur, reference)
  values (uid, em, p_formule, prix, p_moyen, p_numero, nullif(p_reference, ''))
  returning id into rid;
  return json_build_object('id', rid, 'montant', prix);
end $$;
revoke all on function public.lerna_momo_demande(text, text, text, text) from public, anon;
grant execute on function public.lerna_momo_demande(text, text, text, text) to authenticated;

-- Le propriétaire valide (Premium ajouté : 1 mois ou 1 an, à la suite du Premium en cours) ou refuse
create or replace function public.lerna_momo_traiter(p_id uuid, p_decision text)
returns json language plpgsql security definer set search_path = public as $$
declare
  r public.paiements_momo; cur timestamptz; fin timestamptz;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select * into r from public.paiements_momo where id = p_id for update;
  if not found then raise exception 'not_found'; end if;
  if r.statut <> 'en_attente' then raise exception 'already_done'; end if;
  if p_decision = 'refuse' then
    update public.paiements_momo set statut = 'refuse', traite_at = now(), traite_par = auth.uid() where id = p_id;
    return json_build_object('statut', 'refuse');
  elsif p_decision <> 'valide' then
    raise exception 'bad_decision';
  end if;
  select premium_expiry into cur from public.users where id = r.user_id;
  fin := greatest(now(), coalesce(cur, now())) + case when r.formule = 'an' then interval '1 year' else interval '1 month' end;
  update public.users set is_premium = true, premium_expiry = fin where id = r.user_id;
  update public.paiements_momo set statut = 'valide', traite_at = now(), traite_par = auth.uid(), premium_jusqu_au = fin where id = p_id;
  return json_build_object('statut', 'valide', 'jusqu_au', fin);
end $$;
revoke all on function public.lerna_momo_traiter(uuid, text) from public, anon;
grant execute on function public.lerna_momo_traiter(uuid, text) to authenticated;

-- ---------- Paiement automatique PayDunya (Wave, Orange Money, Free Money, carte) ----------
-- L'élève paie le marchand « LERNA » : le numéro du propriétaire n'est plus jamais affiché.
alter table public.paiements_momo add column if not exists provider text not null default 'manuel';
alter table public.paiements_momo add column if not exists token text;
create unique index if not exists paiements_momo_token_idx on public.paiements_momo (token) where token is not null;
alter table public.paiements_momo alter column numero_payeur drop not null;
alter table public.paiements_momo drop constraint if exists paiements_momo_moyen_check;
alter table public.paiements_momo add constraint paiements_momo_moyen_check check (moyen in ('wave', 'orange_money', 'free_money', 'carte'));
alter table public.paiements_momo drop constraint if exists paiements_momo_numero_payeur_check;
alter table public.paiements_momo add constraint paiements_momo_numero_payeur_check check (numero_payeur is null or char_length(numero_payeur) between 7 and 16);
-- Le numéro personnel n'est plus utilisé
update public.app_config set value = value - 'numero' where key = 'momo';
-- L'ancienne déclaration manuelle (qui montrait le numéro) est fermée
revoke execute on function public.lerna_momo_demande(text, text, text, text) from authenticated;

-- Activation après paiement confirmé par PayDunya (appelée seulement par le serveur LERNA)
create or replace function public.lerna_pay_valider(p_token text)
returns json language plpgsql security definer set search_path = public as $$
declare
  r public.paiements_momo; cur timestamptz; fin timestamptz;
begin
  select * into r from public.paiements_momo where token = p_token for update;
  if not found then raise exception 'not_found'; end if;
  if r.statut = 'valide' then return json_build_object('statut', 'valide', 'jusqu_au', r.premium_jusqu_au); end if;
  select premium_expiry into cur from public.users where id = r.user_id;
  fin := greatest(now(), coalesce(cur, now())) + case when r.formule = 'an' then interval '1 year' else interval '1 month' end;
  update public.users set is_premium = true, premium_expiry = fin where id = r.user_id;
  update public.paiements_momo set statut = 'valide', traite_at = now(), premium_jusqu_au = fin where id = r.id;
  return json_build_object('statut', 'valide', 'jusqu_au', fin);
end $$;
revoke all on function public.lerna_pay_valider(text) from public, anon, authenticated;
grant execute on function public.lerna_pay_valider(text) to service_role;

-- ---------- Flammes, points et badges gardés sur le compte (nouvel appareil, appli écran d'accueil) ----------
alter table public.users add column if not exists progress jsonb;
grant update (progress) on public.users to authenticated;

-- ---------- Statistiques du propriétaire (visites, sorties, fonctions utilisées, IA) ----------
-- Une ligne par événement : « page » (page ouverte), « leave » (page quittée + durée), fonctions (questionnaire_done…), « ai:… » (appels IA).
-- sid = identifiant anonyme tiré au hasard sur l'appareil ; aucune adresse IP n'est enregistrée.
create table if not exists public.events (
  id    bigserial primary key,
  at    timestamptz not null default now(),
  sid   text not null check (char_length(sid) between 6 and 40),
  uid   uuid,
  ev    text not null check (ev ~ '^[a-z0-9_:.-]{1,40}$'),
  page  text check (char_length(page) <= 40),
  meta  jsonb
);
create index if not exists events_at_idx on public.events (at desc);
create index if not exists events_ev_at_idx on public.events (ev, at desc);
alter table public.events enable row level security;
drop policy if exists events_admin_read on public.events;
create policy events_admin_read on public.events for select using (public.is_admin());
revoke insert, update, delete on public.events from anon, authenticated;
grant select on public.events to authenticated;

create or replace function public.lerna_log(p_sid text, p_ev text, p_page text, p_meta jsonb default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_sid is null or char_length(p_sid) not between 6 and 40 then return; end if;
  if p_ev is null or p_ev !~ '^[a-z0-9_:.-]{1,40}$' or p_ev like 'ai:%' then return; end if;
  if p_meta is not null and pg_column_size(p_meta) > 1500 then p_meta := null; end if;
  insert into public.events (sid, uid, ev, page, meta) values (p_sid, auth.uid(), p_ev, left(p_page, 40), p_meta);
end $$;
revoke all on function public.lerna_log(text, text, text, jsonb) from public;
grant execute on function public.lerna_log(text, text, text, jsonb) to anon, authenticated;

create or replace function public.lerna_stats(p_days integer default 30)
returns json language plpgsql security definer set search_path = public as $$
declare d integer := least(greatest(coalesce(p_days, 30), 1), 365); since timestamptz := now() - make_interval(days => d); out json;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select json_build_object(
    'days', d,
    'visitors_today', (select count(distinct sid) from events where ev = 'page' and at >= date_trunc('day', now())),
    'visitors_7', (select count(distinct sid) from events where ev = 'page' and at >= now() - interval '7 days'),
    'visitors_n', (select count(distinct sid) from events where ev = 'page' and at >= since),
    'views_n', (select count(*) from events where ev = 'page' and at >= since),
    'per_day', (select coalesce(json_agg(x order by x.day), '[]'::json) from (select to_char(date_trunc('day', at), 'YYYY-MM-DD') as day, count(distinct sid) as visitors, count(*) as views from events where ev = 'page' and at >= since group by 1) x),
    'top_pages', (select coalesce(json_agg(x), '[]'::json) from (select page, count(*) as n, count(distinct sid) as people from events where ev = 'page' and at >= since group by page order by n desc limit 12) x),
    'exit_pages', (select coalesce(json_agg(x), '[]'::json) from (select page, count(*) as n from (select distinct on (sid, date_trunc('day', at)) sid, page from events where ev = 'page' and at >= since order by sid, date_trunc('day', at), at desc) l group by page order by n desc limit 10) x),
    'avg_seconds', (select round(avg(least((meta->>'s')::numeric, 3600))) from events where ev = 'leave' and at >= since and (meta->>'s') ~ '^[0-9]{1,6}$'),
    'features', (select coalesce(json_agg(x), '[]'::json) from (select ev, count(*) as n, count(distinct sid) as people from events where ev not in ('page', 'leave') and ev not like 'ai:%' and at >= since group by ev order by n desc limit 30) x),
    'signups_n', (select count(*) from users where date_inscription >= since),
    'users_total', (select count(*) from users),
    'premium_active', (select count(*) from users where is_premium and (premium_expiry is null or premium_expiry > now())),
    'revenue_n', (select coalesce(sum(montant), 0) from paiements_momo where statut = 'valide' and coalesce(traite_at, created_at) >= since),
    'payments_n', (select count(*) from paiements_momo where statut = 'valide' and coalesce(traite_at, created_at) >= since),
    'ai_per_day', (select coalesce(json_agg(x order by x.day), '[]'::json) from (select to_char(date_trunc('day', at), 'YYYY-MM-DD') as day, count(*) as calls, count(*) filter (where meta->>'ok' = 'false') as errors from events where ev like 'ai:%' and at >= since group by 1) x),
    'ai_modes', (select coalesce(json_agg(x), '[]'::json) from (select substr(ev, 4) as mode, count(*) as n, count(*) filter (where meta->>'ok' = 'false') as errors, count(*) filter (where meta->>'p' = 'groq') as groq from events where ev like 'ai:%' and at >= since group by 1 order by n desc) x)
  ) into out;
  return out;
end $$;
revoke all on function public.lerna_stats(integer) from public, anon;
grant execute on function public.lerna_stats(integer) to authenticated;

-- Donner ou retirer Premium à la main (propriétaire seulement). p_days <= 0 : retire.
create or replace function public.lerna_admin_premium(p_user uuid, p_days integer)
returns json language plpgsql security definer set search_path = public as $$
declare fin timestamptz;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if coalesce(p_days, 0) <= 0 then
    update public.users set is_premium = false, premium_expiry = now() where id = p_user;
    return json_build_object('premium', false);
  end if;
  select greatest(now(), coalesce(premium_expiry, now())) + make_interval(days => least(p_days, 3650)) into fin from public.users where id = p_user;
  update public.users set is_premium = true, premium_expiry = fin where id = p_user;
  return json_build_object('premium', true, 'jusqu_au', fin);
end $$;
revoke all on function public.lerna_admin_premium(uuid, integer) from public, anon;
grant execute on function public.lerna_admin_premium(uuid, integer) to authenticated;

-- Centre IA : marche/arrêt et plafond d'appels par jour (réglables depuis /admin.html)
insert into public.app_config (key, value) values ('ai', '{"actif": true, "plafond_jour": 3000}'::jsonb) on conflict (key) do nothing;

-- Le serveur LERNA (clé service) écrit les paiements et les statistiques
grant all on public.paiements_momo to service_role;
grant all on public.events to service_role;
grant usage, select on sequence public.events_id_seq to service_role;

-- ---------- Octobre 2026 : Pack Candidature + offres toutes visibles ----------
-- Pack Candidature : paiement unique, 6 mois d'accès complet (une saison de candidatures : Campus France, Parcoursup, universités)
alter table public.paiements_momo drop constraint if exists paiements_momo_formule_check;
alter table public.paiements_momo add constraint paiements_momo_formule_check check (formule in ('mois', 'an', 'pack'));
update public.app_config set value = value || '{"prix_pack": 12000}'::jsonb where key = 'momo' and not (value ? 'prix_pack');

create or replace function public.lerna_pay_valider(p_token text)
returns json language plpgsql security definer set search_path = public as $$
declare
  r public.paiements_momo; cur timestamptz; fin timestamptz;
begin
  select * into r from public.paiements_momo where token = p_token for update;
  if not found then raise exception 'not_found'; end if;
  if r.statut = 'valide' then return json_build_object('statut', 'valide', 'jusqu_au', r.premium_jusqu_au); end if;
  select premium_expiry into cur from public.users where id = r.user_id;
  fin := greatest(now(), coalesce(cur, now())) + case when r.formule = 'an' then interval '1 year' when r.formule = 'pack' then interval '6 months' else interval '1 month' end;
  update public.users set is_premium = true, premium_expiry = fin where id = r.user_id;
  update public.paiements_momo set statut = 'valide', traite_at = now(), premium_jusqu_au = fin where id = r.id;
  return json_build_object('statut', 'valide', 'jusqu_au', fin);
end $$;
revoke all on function public.lerna_pay_valider(text) from public, anon, authenticated;
grant execute on function public.lerna_pay_valider(text) to service_role;

create or replace function public.lerna_momo_traiter(p_id uuid, p_decision text)
returns json language plpgsql security definer set search_path = public as $$
declare
  r public.paiements_momo; cur timestamptz; fin timestamptz;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select * into r from public.paiements_momo where id = p_id for update;
  if not found then raise exception 'not_found'; end if;
  if r.statut <> 'en_attente' then raise exception 'already_done'; end if;
  if p_decision = 'refuse' then
    update public.paiements_momo set statut = 'refuse', traite_at = now(), traite_par = auth.uid() where id = p_id;
    return json_build_object('statut', 'refuse');
  elsif p_decision <> 'valide' then
    raise exception 'bad_decision';
  end if;
  select premium_expiry into cur from public.users where id = r.user_id;
  fin := greatest(now(), coalesce(cur, now())) + case when r.formule = 'an' then interval '1 year' when r.formule = 'pack' then interval '6 months' else interval '1 month' end;
  update public.users set is_premium = true, premium_expiry = fin where id = r.user_id;
  update public.paiements_momo set statut = 'valide', traite_at = now(), traite_par = auth.uid(), premium_jusqu_au = fin where id = p_id;
  return json_build_object('statut', 'valide', 'jusqu_au', fin);
end $$;
revoke all on function public.lerna_momo_traiter(uuid, text) from public, anon;
grant execute on function public.lerna_momo_traiter(uuid, text) to authenticated;

-- Les offres publiques ne sont plus cachées : tout le monde voit toutes les bourses, stages et investisseurs.
-- Premium paie l'aide pour postuler (dossier, lettres, entretien, alertes), pas l'information.
update public.opportunites set is_premium = false, data = coalesce(data, '{}'::jsonb) || '{"premium": false}'::jsonb where is_premium;

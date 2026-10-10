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

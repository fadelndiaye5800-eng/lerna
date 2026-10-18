# LERNA — Ton orientation, enfin claire

Application web progressive (PWA) d'orientation par IA. 15 pages HTML, mobile d'abord, FR/EN, conforme au document maître v3.0.
Version 4 : questionnaire en images, deux accueils, parrainage, offres Premium masquées, vrais avis, rétention quotidienne.
Version 5 : offres revérifiées avec règles automatiques, test A/B des couleurs mesuré avec PostHog, modes clair et sombre,
localisation (pays, drapeaux de la région, FCFA / euro / dollar), 3 niveaux de langue, salutations selon l'heure + pseudo,
Paramètres complets, page Contact, « Comment candidater ici » et « Mon dossier », page /admin.
Version 6 : couleurs claires et accueillantes (A = blanc chaud, B = crème plus présent ; sombre seulement au choix), sensation au doigt
(vibration Android, retour haptique iPhone, effet d'appui et « pop »), sauvegarde avec compte obligatoire, textes des offres revus.
Version 7 : logo officiel (ruban orange) partout + écran d'ouverture animé, 43 offres vérifiées, guide « Comprendre les financements »,
IA branchée (« Est-ce pour moi ? », « Mon projet est-il prêt ? », aide admin), coffre-fort de candidature, connexion Apple prête,
« Ce que LERNA sait de toi », barre du bas corrigée.

Version 8 (oct. 2026) — modèle Premium revu : **l'information est gratuite, Premium paie l'aide pour décrocher sa place**.
Toutes les offres sont visibles par tous (plus d'offre masquée) ; **Pack Candidature** (paiement unique, 6 mois, prix `prix_pack`
réglé dans /admin, 25 000 FCFA) ; onglet **Budget** dans Mon dossier (coût réel de la 1re année + plan B, Premium) ;
**alertes ciblées** Premium (nouvelle offre du domaine de la personne, étiquettes OneSignal `premium`, `d1`–`d3`) ;
page Premium centrée sur le résultat, bouton « Envoyer à mes parents » et FAQ « Pourquoi payer si les infos sont gratuites ? ».

## Ce que contient le projet

```
index.html            Accueil découverte (nouveaux visiteurs) : hero, stats, 3 étapes, vrais avis (dès 3 avis vérifiés)
aujourdhui.html       Accueil personnel une fois le questionnaire fait : parcours de X jours, niveau, mission du jour,
                      bourse du jour, mot du jour, quiz, mes écoles + échéances, invitation, alertes, assistant
questionnaire.html    25 questions en images (stickers), « Autre » + champ libre, niveau par langue,
                      question ouverte à la fin ; ?update=1 = mise à jour mensuelle en 5 questions
loading.html          Analyse IA (5 s minimum), sceau LERNA animé
resultats.html        Résumé, 5 écoles : 2 visibles, n°3-4 avec 3 amis invités (ou Premium), n°5 Premium
explorer.html         32 établissements, 6 filtres, pagination, favoris
ecole.html            Fiche : Présentation | Filières | Admission | Coûts | Vie étudiante | Avis (vérifiés + lien Google)
opportunites.html     Stages | Bourses | Emplois | Investisseurs ; offres Premium sans titre ni organisme ; sauvegarde
espace.html           Profil, recommandations, rappels, offres sauvegardées, assistant IA, comparateur, candidatures, compte
premium.html          Comparatif : 4 900 FCFA (7.99$)/mois, Pack Candidature 25 000 FCFA (39.99$) pour 6 mois, 39 000 FCFA (59.99$)/an, envoi aux parents
auth.html             Inscription (avec pseudo facultatif) / connexion / Google / mot de passe oublié
dossier.html          « Mon dossier » par école : étapes (avec dates officielles), documents, atelier lettre de motivation,
                      entraînement à l'entretien, CV en PDF, demande de recommandation, visa, suivi
parametres.html       Compte, apparence (thème, texte, animations), langue, notifications, sons, orientation, accueil,
                      confidentialité, abonnement et parrainage, aide
contact.html          Formulaire (problème, ajout, retrait, question, partenariat, données) — sans téléphone ni WhatsApp
admin.html            Réservé à l'équipe (/admin) : offres, signalements, messages, tests A/B, taux de change
404.html              Page introuvable

assets/css/lerna.css      Design system unique : couleurs par variables (--bg, --surface, --panel…), thèmes clair (A/B) et sombre
assets/js/boot.js         Chargé en premier : applique le thème (A/B ou choix de la personne) avant l'affichage, sans clignotement
assets/js/guides.js       Guides « Comment candidater ici » (Parcoursup, Études en France, DAP, CAQ…) et liens officiels vérifiés
assets/js/core.js         Navigation, FR/EN, compte, favoris, sons, sceau LERNA, stickers,
                          parcours/points/niveaux, parrainage, avis, installation, notifications
assets/js/questions.js    Les 25 questions (+ EN), stickers, « Autre », niveaux de langue, drapeaux des pays
assets/js/daily.js        Contenu du jour : missions, 36 mots, 30 quiz, bourse du jour
assets/js/data-schools.js Établissements (frais indicatifs en USD, points forts ET faibles)
assets/js/data-opps.js    Offres publiques complètes + APERÇU des offres Premium (sans nom ni titre)
assets/js/engine.js       Moteur de correspondance de secours (si l'IA ne répond pas)
assets/stickers/          115 stickers WebP (questionnaire et accueil)  — générés par scripts/build-stickers.py
assets/flags/             206 drapeaux WebP (choix du pays, écoles)

api/analyze.js     Analyse Claude (claude-sonnet-4-6), 5 écoles — 1 analyse/jour/IP en gratuit
api/chat.js        Assistant IA — 5 messages/jour en gratuit ; mode « lettre » et « entretien » pour Mon dossier (3/jour en gratuit)
api/profile.js     Sauvegarde du questionnaire fait avant la création du compte
api/referral.js    Parrainage : code, compteur d'amis, rattachement d'un nouvel inscrit
api/opps.js        Fiches complètes des offres Premium (Premium payé, ou tous avant le lancement)
api/review.js      Avis sur LERNA (envoi + lecture des avis validés)
api/cron-daily.js  Notification quotidienne (OneSignal), lancée chaque jour par Vercel Cron
api/config.js      Configuration publique (aucune clé secrète) + pays vu par Vercel + réglages A/B et taux décidés dans /admin
api/message.js     « Signaler une offre expirée » et formulaire Contact (transfert privé par email avec Resend)
api/webhook.js     Lemon Squeezy → statut Premium (signature HMAC vérifiée)
api/account.js     Suppression définitive du compte
supabase/schema.sql        Tables + règles RLS + parrainage + avis + limitation de débit
supabase/seed.sql          Écoles et opportunités (généré par `npm run seed`)
supabase/opps-premium.cjs  Fiches complètes des offres Premium (jamais publié sur le site)
```

## Tester tout de suite (mode aperçu)

Sans aucune clé, l'app fonctionne en « mode aperçu » : comptes dans le navigateur, recommandations calculées par le moteur local, offres Premium en aperçu flouté.

```bash
python3 -m http.server 8000      # puis ouvre http://localhost:8000
```

## Mise en ligne (≈ 45 minutes)

### 1. GitHub (dépôt PRIVÉ)
Crée un dépôt **privé**, puis pousse ce dossier. Le `.gitignore` empêche d'envoyer un fichier `.env`.
Le fichier `.vercelignore` empêche de publier sur le site `supabase/`, `scripts/` et la documentation
(sinon les fiches des offres Premium seraient lisibles à l'adresse du fichier).

### 2. Supabase
1. Crée un projet sur supabase.com.
2. **SQL Editor** → colle `supabase/schema.sql` → Run. Puis `supabase/seed.sql` → Run. (Les deux peuvent être relancés sans risque.)
3. **Authentication → Providers** : Email activé, « Confirm email » activé (indispensable : un ami parrainé ne compte qu'après confirmation). Active **Google**.
4. **Authentication → URL Configuration** : Site URL = `https://ton-domaine`, Redirect URLs : `https://ton-domaine/**`.
5. **Project Settings → API** : note l'URL, la clé `anon` et la clé `service_role`.

### 3. OneSignal (notifications)
1. Crée une application « Web » sur onesignal.com avec l'adresse de ton site.
2. Choisis l'intégration « Custom Code ». Ne télécharge pas leur fichier de service worker : LERNA a déjà le sien (`sw.js`), qui charge OneSignal tout seul.
3. Note l'**App ID** et la **clé API REST** (Settings → Keys & IDs).

### 4. Vercel
1. Importe le dépôt GitHub (Framework : Other, aucune commande de build).
2. **Settings → Environment Variables** — saisis les valeurs de `.env.example`.
3. Redeploy. Dès que `/api/config` répond, l'app passe du mode aperçu au mode réel.
4. La notification quotidienne est déjà programmée dans `vercel.json` (9 h UTC, livrée à 18 h heure locale de chaque personne). Elle n'envoie rien tant que `CRON_SECRET` et OneSignal ne sont pas configurés.

### 5. Lemon Squeezy
1. Produit « LERNA Premium » avec deux variantes : 7.99 $/mois et 59.99 $/an.
2. Copie les liens de paiement dans `LEMON_SQUEEZY_CHECKOUT_MONTHLY` / `_YEARLY`.
3. Redirection après achat : `https://ton-domaine/premium.html?payment=success`.
4. **Settings → Webhooks** : URL `https://ton-domaine/api/webhook`, événements `subscription_*`, « signing secret » dans `LEMON_SQUEEZY_WEBHOOK_SECRET`.

### 6. Anthropic (l'IA)
Crée la clé sur console.anthropic.com, mets-la dans `ANTHROPIC_API_KEY` sur Vercel et fixe une **limite de dépense mensuelle**.
Rien d'autre à changer : tout est déjà branché. Sans clé, chaque bouton IA affiche « disponible dès la mise en ligne ».
Tout passe par deux fonctions : `/api/analyze` (analyse du questionnaire) et `/api/chat`, avec un « mode » :

| Mode | Où | Gratuit / jour | Premium |
|---|---|---|---|
| `chat` | Assistant de Mon espace | 5 | illimité (garde-fou 300) |
| `lettre`, `entretien` | Mon dossier | 3 chacun | illimité |
| `offre` | « Est-ce pour moi ? » sur chaque offre | 3 | illimité |
| `projet` | « Mon projet est-il prêt ? » (onglet Investisseurs) | 2 | illimité |
| `admin_offre` | /admin → Nouvelle offre → « Préparer avec l'IA » (lit la page officielle et prépare la fiche, à relire) | admins seulement (100) | — |

Avant le lancement du Premium (`PREMIUM_ENABLED=false`), tout est ouvert (garde-fou anti-abus seulement).

### 7b. Connexion avec Apple (iPhone)
Le bouton « Continuer avec Apple » est codé mais caché tant que `APPLE_LOGIN_ENABLED` n'est pas à `true` (aperçu : `auth.html?apple=1`).
1. Compte Apple Developer (environ 99 $ par an) et domaine lerna.world acheté.
2. developer.apple.com → Certificates, IDs & Profiles : un **App ID** avec « Sign in with Apple », puis un **Services ID** (ex. `world.lerna.web`).
   Dans le Services ID : domaine `lerna.world` et adresse de retour `https://<projet>.supabase.co/auth/v1/callback`.
3. **Keys** → nouvelle clé « Sign in with Apple » → télécharge le fichier `.p8` (une seule fois !) et note le Key ID et le Team ID.
4. Supabase → Authentication → Providers → **Apple** : active, colle le Services ID, puis la « secret key » générée à partir du `.p8`
   (Supabase indique comment). Cette clé **expire tous les 6 mois** : note la date et refais l'étape 4 avant.
5. Vercel : `APPLE_LOGIN_ENABLED=true`, puis Redeploy.
Apple peut cacher l'email de la personne (adresse relais) et n'envoie son nom qu'à la première connexion : LERNA lui demande alors
son avatar et sa date de naissance une seule fois (2 appuis).

### 7. Avis Google (quand la fiche Google de LERNA existera)
Mets le lien « Laisser un avis » de ta fiche Google Business dans `GOOGLE_REVIEW_URL`. Il apparaît alors après chaque avis donné dans l'app et sur l'accueil.

## Ce qui fait revenir chaque jour

- **Parcours de X jours** : démarre à la 3e visite ; un jour manqué par semaine est pardonné. Célébrations à 7, 30, 100 et 365 jours.
- **Points et niveaux** (Explorateur → Chercheur → Stratège → Expert) : ils ne descendent jamais.
- **Mission du jour** : 3 actions utiles (fiche d'une école recommandée, bourse à sauvegarder, quiz…), cochées automatiquement.
- **Contenu du jour** : bourse du jour (jamais la même deux jours de suite), mot du jour, quiz du jour.
- **Mise à jour du profil** proposée tous les 30 jours (5 questions).
- **Notifications** : demandées seulement après 48 h et 2 jours de visite ; une par jour au maximum, à 18 h heure locale, et seulement si la personne n'est pas venue depuis 18 h. Sur iPhone, elles fonctionnent une fois LERNA ajouté à l'écran d'accueil (l'app guide l'élève).

## Parrainage (débloquer des écoles en invitant)

- L'IA propose 5 écoles. Les n°1 et 2 sont visibles par tous.
- **3 amis inscrits** débloquent les n°3 et 4. La n°5 reste Premium. Tant que `PREMIUM_ENABLED=false`, les n°3, 4 et 5 se débloquent toutes par parrainage.
- Un ami compte quand il s'inscrit avec le lien (dans les 48 h), **confirme son email** et **termine son questionnaire**. Tout est vérifié côté serveur.
- Le bouton Premium est toujours proposé en premier.

## Avis

- Plus aucun faux témoignage. La section d'avis de l'accueil s'affiche seule à partir de **3 avis vérifiés**.
- L'app demande une note après un bon moment (résultats lus, bourse sauvegardée), jamais à la première visite.
- Un avis n'est public que si la personne l'accepte, qu'elle a un compte, et après ta validation :
  **Supabase → Table editor → avis_app → cocher `valide`**. Les avis d'écoles se valident pareil dans la table `avis`.
- Le lien Google est proposé à tout le monde, quelle que soit la note (Google interdit de ne le proposer qu'aux avis positifs).

## Version 7 : ce qu'il faut savoir

- **Logo** : le ruban est dessiné en un seul tracé (`Lerna.mark()` dans core.js) et utilisé partout ; icônes de l'app, favicon et image de
  partage dans `assets/icons/`. L'original est dans `_brand/`. Écran d'ouverture : une fois par session (`?splash=1` pour le revoir).
- **Coffre-fort de candidature** (`dossier.html?coffre=1`, code dans `assets/js/coffre.js`) : fiche remplie une fois, rangée dans l'ordre
  d'Études en France / Parcoursup, bouton « Copier » sur chaque champ ; documents réduits au bon poids (photo < 50 Ko, fichiers < 500 Ko,
  règles de Campus France Sénégal) et renommés `NOM_Prenom_Document`. Fichiers dans Supabase Storage, compartiment privé `coffre`
  (créé par `schema.sql`, chaque compte ne voit que son dossier). LERNA n'est pas un agent : rien n'est déposé à la place de l'étudiant.
- **Ce que LERNA sait de toi** : avatar (garçon, fille, neutre) pré-sélectionné d'après le prénom puis confirmé, date de naissance,
  pays deviné, langue et type d'appareil, domaines consultés. Tout est visible et modifiable dans Paramètres. Les offres avec une limite
  d'âge (`ageMin` / `ageMax`) ou réservées aux femmes (`pourQui: 'f'`) s'adaptent. Jamais : religion, origine, santé, revenus.
- **Offres investisseurs** : champs `genre`, `equity` (true = prend des parts, false = sans prise de parts) et `stade` (idee, produit, clients).

## Version 5 : ce qu'il faut savoir

- **Offres** : une offre n'apparaît que si elle est sûre. Date limite passée → « Clôturée ». Ni date ni « à tout moment » → jamais affichée.
  Vérifiée il y a plus de 30 jours → masquée jusqu'à ce que tu cliques « Revérifiée aujourd'hui » dans /admin. Chaque offre a un bouton
  « Signaler une offre expirée » (les signalements arrivent dans /admin). Relancer `seed.sql` désactive les anciennes offres retirées.
- **Test A/B** : chaque visiteur reçoit au hasard la version A (blanc chaud, touches crème) ou B (crème plus présent, blocs pêche),
  et la garde (téléphone, puis compte). Mesures dans PostHog (`POSTHOG_KEY`) avec la propriété `ab_couleurs`. Règle : au moins 2 semaines et
  ≈ 300 personnes par version. Dans /admin : arrêter le test, donner la gagnante à tout le monde ou le relancer. Chacun peut changer de thème
  dans Paramètres (le changement est mesuré : `theme_change`).
- **Devenir admin** (une seule fois, SQL Editor de Supabase) : `update public.users set role = 'admin' where email = 'ton-adresse';` puis ouvre `/admin`.
- **Localisation** : le pays vient de l'en-tête Vercel `x-vercel-ip-country` (aucune autorisation, aucun GPS), sinon du fuseau horaire.
  La personne confirme (« Tu es au Sénégal ? ») ou change. Montants convertis depuis le dollar (taux modifiables dans /admin).
- **Contact** : rien n'est affiché tant que `CONTACT_PUBLIC_EMAIL` est vide (mets contact@lerna.world une fois le domaine acheté).
  Les messages arrivent dans /admin et, si Resend est configuré, dans ta boîte perso (`CONTACT_FORWARD_TO`, jamais affichée).
  Réseaux sociaux : `SOCIAL_*` + `SHOW_SOCIALS=true`.
- **Fonctions Vercel** : 11 fonctions (le plan gratuit en autorise 12). Pour en ajouter une, regroupe-la dans une fonction existante.

## Sécurité (déjà en place)

- Aucune clé dans le code : tout passe par les variables Vercel. `/api/config` ne renvoie que des valeurs publiques.
- RLS sur toutes les tables : un utilisateur ne voit et ne modifie que ses données ; il ne peut pas se donner le Premium, ni se créer des filleuls, ni changer son code de parrainage, ni se nommer admin (testé).
- /admin : signalements, messages, réglages A/B et taux ne sont lisibles et modifiables que par un compte `role = 'admin'` (fonction `is_admin()`, testé).
- Les offres Premium ne sont **pas** dans le code du site : seul un aperçu sans nom ni titre y est. Les fiches complètes viennent de `/api/opps`.
- Limitation de débit côté serveur (IP hachées), appels refusés depuis un autre site.
- Webhook de paiement vérifié par signature HMAC ; tâche quotidienne protégée par `CRON_SECRET`.
- En-têtes de sécurité (CSP, HSTS, X-Frame-Options…) dans `vercel.json`.

## Mettre à jour les données

- Offres publiques : `assets/js/data-opps.js`. Offres Premium : `supabase/opps-premium.cjs` (et leur aperçu dans `data-opps.js`, avec `masked: true`).
- Écoles : `assets/js/data-schools.js`.
- Puis `npm run seed` pour régénérer `supabase/seed.sql`, et relance-le dans Supabase.
- Stickers : `python3 scripts/build-stickers.py` (police Noto Color Emoji). Quand les stickers officiels du léopard existeront, remplace les fichiers de `assets/stickers/` en gardant les mêmes noms.

## Crédits

Stickers et drapeaux dessinés à partir de **Noto Color Emoji** (Google, licence SIL Open Font License 1.1 / Apache 2.0).

## Décisions prises là où les documents se contredisaient

- **Logo** : N en orange (décision finale du dashboard de septembre 2026). Le **sceau LERNA** (carré marron encadré d'orange, L crème et N orange) remplace l'ancienne étoile, trop proche de celle de Gemini.
- **Remise annuelle** : affichée « −34 % » (39 000 FCFA au lieu de 58 800 FCFA ; 59.99 $ au lieu de 95.88 $).
- **Couleurs** : aucun vert/rouge/bleu dans l'interface. Les stickers et drapeaux gardent leurs vraies couleurs.
- **Premium** : `PREMIUM_ENABLED=false` ouvre les fonctions Premium (phase de lancement), sauf les écoles n°3 à 5 qui se débloquent par parrainage.

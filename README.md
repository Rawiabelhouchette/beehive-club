# Beehive Club : site vitrine, programme et réservations

Site bilingue (français / anglais) pour Beehive Club, à l'Hôtel Acquaviva (Gammarth) :

- accueil « Ce soir dans la ruche » : le spectacle du soir dans l'hexagone lumineux de l'enseigne, les soirs de la semaine en alvéoles (cliquables pour réserver) et le statut en direct « ouvert jusqu'à 4 h / ouvre ce soir à 20 h 30 ». Sans spectacle ce soir : le prochain ; sans programme annoncé : la semaine passée. Entre minuit et 4 h, c'est encore la soirée de la veille ;
- la page suit la bio Instagram : « Come for the music. » (collectifs invités), « No, it's not for sharing!! » (cuisine), « Stay for one more drink. » (cocktails signatures) ;
- page carte prête à recevoir la carte du restaurant lounge (rubriques, plats, prix : `src/content/menu.ts`), programme de la semaine, infos pratiques (horaires, conditions d'entrée, tenue, FAQ, plan) et mentions légales ;
- réservation de table en ligne (1 à 12 personnes) avec message WhatsApp prérempli ;
- page **Privatisation** : demande pour un groupe de 13 à 300 invités (un espace, ou tout le club) ;
- liens vers **IJA** (l'application de sorties où Beehive a déjà sa page) ;
- en démo : **suivi des visites** du lien envoyé (espace équipe, partie « Visites de la démo ») ;
- espace équipe protégé : confirmer ou refuser, couverts attendus par soir, filtre Privatisations, réponse WhatsApp au client dans sa langue, **export CSV** pour Excel ;
- contenu modifiable par le client dans Sanity (facultatif) ;
- SEO et partage : métadonnées FR/EN, image d'aperçu pour WhatsApp et Facebook, données structurées `NightClub`, sitemap, robots ;
- icônes pour l'ajout à l'écran d'accueil du téléphone, page d'erreur et page 404.

Stack : Next.js 15 (App Router), React 19, TypeScript, CSS sur mesure.
Aucune autre dépendance d'exécution : Supabase, Sanity et Resend sont appelés directement par leur API HTTP.

---

## 1. Lancer le site en local

```bash
npm install
cp .env.example .env.local      # puis ajustez si besoin
npm run dev                     # http://localhost:3000
```

Sans aucune configuration, tout fonctionne :

- le contenu vient de `src/content/` ;
- les réservations sont enregistrées dans `.data/reservations.json` ;
- l'espace équipe est sur `/fr/admin`, avec le mot de passe `ADMIN_PASSWORD` (`change-me` par défaut).

Autres commandes :

```bash
npm test            # tests de la logique (soirée en cours, horaires, carte, validation, stockage, sessions)
npm run typecheck   # vérification TypeScript
npm run build && npm start
```

---

## 2. Préparer la démo pour le propriétaire

Le fichier `netlify.toml` est prêt : Netlify compile le site avec Node 22 et son module Next.js officiel.
Déploiement depuis le terminal (sans GitHub) :

```bash
npx netlify-cli login
npx netlify-cli sites:create --name beehive-club-demo
npx netlify-cli link --name beehive-club-demo
npx netlify-cli env:set NOM_DE_LA_VARIABLE "valeur"   # une fois par variable de .env.example
npx netlify-cli deploy --build --prod
```



1. Dans `.env.local` :
   - `NEXT_PUBLIC_DEMO_MODE=true` : affiche le bandeau « Démo privée » et bloque l'indexation Google ;
   - `DEMO_PASSWORD=un-mot-de-passe` : tout le site demande un identifiant (`DEMO_USER`, `beehive` par défaut).
     Le lien `https://votre-site/fr?acces=un-mot-de-passe` ouvre la démo directement, sans fenêtre de mot de passe : c'est celui à envoyer sur Instagram ou WhatsApp, dont les navigateurs intégrés n'affichent souvent pas cette fenêtre. Sans le code dans le lien, une page demande le code d'accès.
2. Déployez sur **votre** compte (ex. Netlify), sous un sous-domaine à vous : ne réservez pas leur nom de domaine avant leur accord.
3. Pendant le rendez-vous, montrez :
   - le site sur son téléphone (QR code) ;
   - une réservation faite en direct, qui arrive dans `/fr/admin` ;
   - la confirmation envoyée au client par WhatsApp en un clic.

⚠️ Sur un hébergement serverless (Netlify, Vercel), le stockage fichier ne dure pas : configurez Supabase (section 4) même pour la démo en ligne. Le stockage fichier convient en local ou sur un VPS.

---

## 3. Contenu à valider avec le propriétaire

| Fichier | À vérifier |
| --- | --- |
| `src/content/settings.ts` | horaires, infoline 27 777 172 (Google affiche aussi le 29 155 165), WhatsApp, e-mail, conditions d'entrée, tenue, FAQ |
| `src/content/menu.ts` | carte et prix repris du menu PDF (novembre 2026) : à revérifier (`price: null` = prix masqué) |
| `src/content/events.ts` | programme de la semaine repris des affiches d'octobre 2026 : heures de début (23 h) et artistes à confirmer |
| `src/content/gallery.ts` | les photos de `public/images/` viennent des publications de l'établissement (démo) : demander les originaux haute définition avant la mise en ligne |
| `src/i18n/dictionaries.ts` | textes du site (ex. « table gardée 15 minutes ») |
| Mentions légales | raison sociale, matricule fiscal, hébergeur |

N'inventez ni avis clients ni prix : tout ce qui n'est pas confirmé reste marqué comme exemple.

---

## 4. Réservations avec Supabase (recommandé)

1. Créez un projet sur supabase.com.
2. Dans **SQL Editor**, exécutez `supabase/schema.sql`.
3. Dans **Settings → API Keys**, copiez l'URL du projet et la clé secrète (`sb_secret_…`, bouton « Reveal ») :

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...   # clé serveur, ne jamais l'exposer côté navigateur
```

Une ancienne clé `service_role` (qui commence par `eyJ`) fonctionne aussi.

La table a la sécurité au niveau des lignes (RLS) activée, sans aucune règle publique : seul le serveur du site y accède.

Le script peut être relancé sans risque : il ajoute aussi les colonnes des privatisations (`kind`, `event_type`, `event_space`, `company`) à une table déjà créée.

### E-mail à chaque nouvelle demande (facultatif)

Avec [Resend](https://resend.com) :

```
RESEND_API_KEY=re_...
NOTIFY_EMAIL=reservation@leur-domaine.tn
RESEND_FROM="Beehive Club <reservations@votre-domaine.tn>"   # domaine vérifié dans Resend
```

---

## 5. CMS Sanity (facultatif, pour que le client modifie tout seul)

Le studio est un projet séparé dans `studio/`.

1. Créez un projet sur sanity.io/manage et notez son **Project ID**.
2. Créez `studio/.env` :

```
SANITY_STUDIO_PROJECT_ID=xxxx
SANITY_STUDIO_DATASET=production
```

3. Lancez le studio :

```bash
cd studio
npm install
npx sanity login
npm run dev                # http://localhost:3333
npm run deploy             # met le studio en ligne (ex. beehive.sanity.studio)
```

Puis, côté site, dans `.env.local` :

```
SANITY_PROJECT_ID=xxxx
SANITY_DATASET=production
```

Le studio propose :

- un document unique « Infos de l'établissement » ;
- des listes Soirées, Rubriques de la carte, Boissons et plats, Galerie.

Gardez les identifiants de rubrique `tapas` et `sushi` : ce sont eux qui sont mis en avant sur l'accueil.

Si Sanity est vide ou indisponible, le site affiche automatiquement le contenu de `src/content/`.

---

## Image de partage et icônes

- `public/og/beehive-fr.jpg` et `beehive-en.jpg` (1200 × 630) : l'aperçu affiché quand le lien est partagé sur WhatsApp, Facebook ou Instagram. Remplacez-les par une vraie photo du lieu au même format, en gardant les mêmes noms.
- `public/icons/` et `src/app/apple-icon.png` : icônes pour l'ajout à l'écran d'accueil (Android et iPhone).
- Tant que `DEMO_PASSWORD` est actif, WhatsApp ne peut pas lire la page : l'aperçu n'apparaîtra qu'après la mise en ligne publique.

## Espace équipe

- `/fr/admin` : demandes de la semaine passée et à venir, regroupées par soir, avec le total de couverts attendus (en attente + confirmés).
- Filtre **Privatisations** : type d'événement, formule, entreprise, message du client.
- Bouton **WhatsApp** : ouvre une conversation avec le client et un message prêt à envoyer, dans sa langue.
- **Exporter (CSV)** : fichier pour Excel (séparateur `;`, accents conservés).

---

## 6. Mise en ligne après l'accord du client

- [ ] Devis signé et acompte reçu.
- [ ] Nom de domaine acheté **au nom du client** (.tn via un registrar agréé ATI, ou .com).
- [ ] Vrai contenu intégré (photos, carte, prix, soirées, téléphone).
- [ ] Supabase configuré, avec un `ADMIN_PASSWORD` fort et un `ADMIN_SESSION_SECRET` aléatoire (`openssl rand -base64 32`).
- [ ] `NEXT_PUBLIC_DEMO_MODE=false`, `DEMO_PASSWORD` vide, `NEXT_PUBLIC_SITE_URL=https://leur-domaine`.
- [ ] Fiche Google Business : ajouter le lien du site et le lien de réservation `/fr/reservation`.
- [ ] Google Search Console : soumettre `/sitemap.xml`.
- [ ] Remise des accès (Sanity, espace équipe) et 30 minutes de prise en main.

---

## Structure

```
src/
  app/[locale]/         pages FR et EN (accueil, carte, soirées, privatisation, infos, réservation, mentions légales, admin)
  app/api/              réservations, privatisations (validation, anti-robot, limite de fréquence), export CSV
  middleware.ts         langue, mot de passe de démo, protection de l'espace équipe
  components/           en-tête, haut de page « Ce soir dans la ruche », formulaires, listes, pied de page
  views/                contenu des pages (indépendant de Next, facile à tester)
  content/              contenu par défaut, à valider avec le client
  lib/                  soirée en cours, horaires, réservations, sessions, Sanity, e-mails
  i18n/                 textes FR / EN
studio/                 CMS Sanity
supabase/schema.sql     table des réservations
tests/                  tests de la logique serveur
```

## Partager un projet Supabase gratuit avec une autre démo

Le plan gratuit de Supabase ne permet que deux projets. Beehive peut utiliser le projet d'une autre démo
avec ses propres tables, préfixées par `bee_` :

1. Dans ce projet Supabase : SQL Editor > New query > coller tout `supabase/schema-bee.sql` > Run.
2. Dans Netlify : `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` de ce projet, plus `SUPABASE_TABLE_PREFIX=bee_`.

Les réservations et les visites de Beehive vont alors dans `bee_reservations` et `bee_demo_visits`,
sans se mélanger avec celles de l'autre démo.

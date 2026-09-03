# CLAUDE.md

## Périmètre de travail

Ne jamais lire, explorer, rechercher ou modifier des fichiers en dehors de
`/Users/jcb/Desktop/Homonyme/back-office`, sauf si l'utilisateur le demande
explicitement dans sa requête.

- Pas d'exploration des dossiers parents ou des projets voisins.
- Pas de `grep`/`find`/`ls` sur des chemins hors de ce répertoire.
- Si une tâche semble nécessiter un accès extérieur, le signaler et demander
  l'autorisation avant d'y accéder.

## Maintenance de ce fichier

À chaque création d'un nouveau fichier ou dossier sous `src/`, ajouter son
entrée dans la « Carte du code » ci-dessous dans le même changement. La carte
doit rester exhaustive pour que retrouver un fichier ne demande aucune
exploration.

## Projet

Back-office Homonyme — dashboard admin **front-end uniquement**. Aucun backend,
aucune API, aucune persistance : chaque tableau / graphe / écran de détail est
alimenté par des fixtures dans `src/lib/mock/`. Le projet est un squelette
d'architecture + d'écrans pour designer dessus.

- Stack : Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- Basé sur le template TailAdmin (free-nextjs-admin-dashboard), gardé proche du stock
- Alias d'import : `@/*` → `./src/*`
- Graphiques : ApexCharts · Calendrier : FullCalendar · Drag & drop : react-dnd

### Cible d'affichage

Pour l'instant : **desktop uniquement**. Ne pas concevoir ni implémenter de
version mobile / responsive (pas de breakpoints mobiles, pas d'adaptation
tactile). Travailler la mise en page pour un écran large.

### Thème : light uniquement

L'UI produit est en **mode clair exclusivement**. Ne pas ajouter de variantes
`dark:` dans le code produit (pages `(admin)/`, `layout/`, `components/back-office/`,
`components/header/`, `components/ui/`…). Pas de sélecteur de thème dans l'UI.
Les `dark:` déjà présents dans le template sont à retirer au fil des fichiers
touchés. Seule exception : la vitrine `src/app/design-system/` peut conserver sa
bascule de thème pour la démonstration.

### Langue : français uniquement

La plateforme est **intégralement en français** : libellés, placeholders,
messages, `aria-label`, titres de page/`metadata`, textes de données fictives.
Tout texte anglais rencontré dans un fichier touché doit être traduit dans le
même changement. `<html lang="fr">`.

### Commandes

- `npm run dev` — serveur de dev (http://localhost:3000)
- `npm run build` — build de production
- `npm run start` — serveur de production
- `npm run lint` — ESLint

## Utilisateurs de la plateforme

Le scope est pour l'instant limité à **un seul utilisateur : la propriétaire**.
Tout écran généré doit être pensé pour elle, pas pour un admin générique.

### La propriétaire

Dirigeante-exploitante d'un réseau de salons de beauté / coiffure à Dakar
(marque « Beauty & Co », plusieurs salons — Almadies, Sea Plaza…). Elle gère
elle-même l'exploitation : rendez-vous, clientèle, équipe, stock, paiements.
Monnaie FCFA, interface en français.

**Ce qui la décrit** (ce ne sont pas des règles de design — les arbitrages se
font via « Les 3 questions » ci-dessous, en gardant ce portrait en tête) :

- **Rythme d'usage** : les deux registres. Elle ouvre l'outil plusieurs fois par
  jour pour des coups d'œil courts (RDV du jour, encaissements) et s'y installe
  une fois par jour pour une vraie session de gestion.
- **Son rapport à l'outil** : opérationnelle sur le planning / les rendez-vous,
  la clientèle et l'argent (paiements, encaissements) — elle fait les gestes
  elle-même. Plutôt en pilotage sur l'équipe, le stock et les emails.
- **Ce qui l'occupe en premier** : le chiffre d'affaires et les encaissements —
  combien a-t-on fait aujourd'hui, ce mois, par salon.
- **Aisance logicielle** : moyenne. À l'aise avec un tableau et un formulaire
  classiques ; les patterns inhabituels, les actions groupées obscures ou une
  forêt de filtres la perdent.
- **Contexte matériel** : supposé poste fixe, grand écran, au bureau (cohérent
  avec « desktop uniquement »). À confirmer.
- **Échelle** : quelques salons, de l'ordre des fixtures `beautyandco.ts`
  (2 salons, ~3-6 RDV/jour/salon) — des dizaines de lignes par écran, pas des
  milliers. À confirmer.
- **Outils actuels** : inconnus (probablement agenda papier + WhatsApp). Elle
  vient d'un monde sans logiciel de gestion dédié. À confirmer.
- **Registre de langue** : vouvoiement, sobre et professionnel. À confirmer.

## Les 3 questions avant tout design

Avant de concevoir ou générer **n'importe quel écran**, répondre explicitement à
ces trois questions. Le reste (alignement, espacement, cohérence avec le design
system, accessibilité) en découle.

1. **Qu'est-ce que l'utilisateur essaie de faire ici, et dans quel état il
   arrive sur cet écran ?**
   Pressé, stressé, en pleine exploration, de retour après six mois… Ça
   détermine le niveau de détail, le ton, ce qu'on peut cacher ou pas. Sans
   réponse claire à ça, tout le reste est du bricolage.

2. **Qu'est-ce qui doit sauter aux yeux en premier ?**
   Sur n'importe quel écran, il y a une action ou une info qui compte plus que
   les autres. Si on n'arrive pas à la nommer clairement, la hiérarchie visuelle
   sera forcément floue, peu importe le soin apporté au reste.

3. **Qu'est-ce qui se passe quand ça ne se passe pas comme prévu ?**
   Écran vide, erreur, chargement long, données manquantes… Un design qui n'a
   pensé qu'au cas nickel n'est pas terminé, il est juste joli.

## Carte du code

### Racine `src/`

- `svg.d.ts`, `../jsvectormap.d.ts`, `../next-env.d.ts` — déclarations de types
- `icons/index.tsx` — barrel de **tous** les icônes SVG (importer `@/icons`)

### `src/app/` — routes (App Router)

- `layout.tsx` — root layout : polices, `ThemeProvider`, `SidebarProvider`, metadata
- `not-found.tsx` — page 404 globale
- `(admin)/` — pages dans le shell dashboard (sidebar + header)
  - `layout.tsx` — shell : `AppSidebar` + `AppHeader` + `Backdrop`, marge dynamique
  - `page.tsx` — dashboard d'accueil
  - `activity/`, `analytics/`, `notifications/`, `reports/` — pages simples
  - `customers/`, `invoices/`, `orders/`, `products/`, `support/`, `team/`,
    `transactions/` — chacune : `page.tsx` (liste) + `[id]/page.tsx` (détail)
  - `products/categories/page.tsx`, `team/roles/page.tsx` — sous-pages
  - `settings/` — `layout.tsx` + `page.tsx` + onglets `api-keys/`, `billing/`,
    `integrations/`, `notifications/`, `security/`
  - `(others-pages)/` — pages de démo du template : `blank/`, `calendar/`,
    `profile/`, `(chart)/{bar,line}-chart/`, `(forms)/form-elements/`,
    `(tables)/basic-tables/`
  - `(ui-elements)/` — vitrines du template : `alerts/`, `avatars/`, `badge/`,
    `buttons/`, `images/`, `modals/`, `videos/`
- `(full-width-pages)/` — pages hors shell (pleine largeur)
  - `layout.tsx`
  - `(auth)/` — `signin/`, `signup/`, `forgot-password/`, `reset-password/` (+ `layout.tsx`)
  - `(error-pages)/` — `error-404/`, `error-500/`, `maintenance/`
- `design-system/` — vitrine du design system maison
  - `page.tsx` — toutes les sections (couleurs, typo, boutons, composants back-office…)
  - `layout.tsx`, `Shell.tsx` — chrome dédié à cette page

> Note : `AppSidebar` référence une nav FR cible (`/rendez-vous`, `/clients`,
> `/planning`, `/services`, `/paiement`…) dont la plupart des pages **n'existent
> pas encore** — les routes réelles sont encore celles du template en anglais.

### `src/components/`

- `back-office/` — **composants maison du back-office** (les plus importants) :
  `PageHeader`, `DataTable`, `DefinitionList`, `FormCard` (+ `ToggleRow`),
  `StatCards`, `StatCard`s, `StatusBadge`, `PageHeader`, `SettingsTabs`,
  `DashboardKpiCards`, `RevenueChart`, `PopularServices`
- `ui/` — primitives du template : `alert/`, `avatar/`, `badge/`, `button/`,
  `dropdown/`, `images/`, `modal/`, `table/`, `video/`
- `form/` — contrôles de formulaire : `input/`, `switch/`, `group-input/`,
  `form-elements/` (démos), + `Form`, `Label`, `Select`, `MultiSelect`, `date-picker`
- `auth/` — formulaires : `SignInForm`, `SignUpForm`, `ForgotPasswordForm`, `ResetPasswordForm`
- `charts/` — `bar/BarChartOne`, `line/LineChartOne` (wrappers ApexCharts)
- `ecommerce/` — widgets dashboard du template (métriques, ventes, carte pays…)
- `calendar/Calendar.tsx` — wrapper FullCalendar
- `tables/` — `BasicTableOne`, `Pagination`
- `header/` — `NotificationDropdown`, `UserDropdown`
- `user-profile/` — cartes de la page profil
- `common/` — `ComponentCard`, `PageBreadCrumb`, `ChartTab`, `GridShape`,
  `ThemeToggleButton`, `ThemeTogglerTwo`
- `videos/`, `example/ModalExample/` — démos du template

### `src/context/`

- `ThemeContext.tsx` — thème clair/sombre (`useTheme`)
- `SidebarContext.tsx` — état sidebar : `isExpanded`, `isHovered`, `isMobileOpen` (`useSidebar`)

### `src/hooks/`

- `useModal.ts` — ouverture/fermeture de modale
- `useGoBack.ts` — navigation retour

### `src/layout/`

- `AppSidebar.tsx` — sidebar : logo BeautyAndCo, sélecteur de lieu, nav FR
  (tableau `menuGroups`, 5 groupes). Pas de bloc utilisateur / déconnexion ici.
- `AppHeader.tsx` — barre du haut : recherche centrée + notifications + compte.
  Pas de bascule de thème.
- `Backdrop.tsx` — overlay mobile
- `SidebarWidget.tsx` — encart bas de sidebar (non utilisé par `AppSidebar`)

### `src/lib/mock/` — couche de données fictives (front-end only)

- `index.ts` — barrel (`@/lib/mock`) + helpers `currency`, `shortDate`, `dateTime`
- `types.ts` — types partagés (`Kpi`, `Customer`, `Order`, `SeriesPoint`, `StatusTone`…)
- `customers.ts`, `products.ts`, `orders.ts`, `finance.ts`, `team.ts`,
  `analytics.ts`, `system.ts` — jeux de fixtures par domaine
- `beautyandco.ts` — fixtures BeautyAndCo (salons Dakar, FCFA). **Indépendant du
  barrel** : importer directement `@/lib/mock/beautyandco`

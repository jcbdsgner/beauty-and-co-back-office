# CLAUDE.md

## Périmètre de travail

Ne jamais lire, explorer, rechercher ou modifier des fichiers en dehors de
`/Users/jcb/Desktop/Homonyme/back-office`, sauf si l'utilisateur le demande
explicitement dans sa requête.

- Pas d'exploration des dossiers parents ou des projets voisins.
- Pas de `grep`/`find`/`ls` sur des chemins hors de ce répertoire.
- Si une tâche semble nécessiter un accès extérieur, le signaler et demander
  l'autorisation avant d'y accéder.

## Design produit

Toutes les règles de design (thème, couleurs de marque, langue, format des
montants, cible d'affichage, portrait de l'utilisatrice, méthode des 3
questions) vivent dans @design.md, pas dans ce fichier. **S'y référer avant de
concevoir ou modifier n'importe quel écran.** Ce fichier-ci (`CLAUDE.md`) couvre
le périmètre de travail, la stack, les commandes et l'architecture du code
(« Carte du code » ci-dessous).

@design.md

## Maintenance de ce fichier

À chaque création d'un nouveau fichier ou dossier sous `src/`, ajouter son
entrée dans la « Carte du code » ci-dessous dans le même changement. La carte
doit rester exhaustive pour que retrouver un fichier ne demande aucune
exploration. Les règles de design elles-mêmes se maintiennent dans
`design.md`, pas ici.

## Projet

Back-office Homonyme — dashboard admin **front-end uniquement**. Aucun backend,
aucune API, aucune persistance : chaque tableau / graphe / écran de détail est
alimenté par des fixtures dans `src/lib/mock/`. Le projet est un squelette
d'architecture + d'écrans pour designer dessus.

- Stack : Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- Basé sur le template TailAdmin (free-nextjs-admin-dashboard), gardé proche du stock
- Alias d'import : `@/*` → `./src/*`
- Graphiques : ApexCharts · Planning / Agenda RDV : l'écran Planning de
  point-de-vente (`components/back-office/equipe/planning-board/`), monté à la
  fois dans Équipe › Planning et dans la vue « Par praticienne » de
  `/rendez-vous` (2026-09-28, voir « Planning unique » en bas de fichier) ; `react-dnd` / `jsvectormap` / `@fullcalendar/*`
  sont des dépendances résiduelles non utilisées, à retirer de `package.json`

Cible d'affichage, thème, couleurs de marque, langue et format des montants →
voir @design.md.

### Commandes

- `npm run dev` — serveur de dev (http://localhost:3000)
- `npm run build` — build de production
- `npm run start` — serveur de production
- `npm run lint` — ESLint

Portrait de l'utilisatrice (Sokhna Ndour) et méthode « Les 3 questions avant
tout design » → voir @design.md.

## Carte du code

### Racine du projet

- `next.config.ts` — `@svgr/webpack` (webpack + turbopack, `removeViewBox: false`)
  pour les imports `.svg` → composants ; `images.dangerouslyAllowSVG` + CSP
  restrictive pour servir nos SVG statiques via `next/image` (logo de marque,
  illustrations d'erreur — tous first-party).
- `public/images/logo/` — `beautyandco-wordmark.svg` (wordmark noir Beauty & Co)
  + `beautyandco-mark.jpg` (mark aquarelle) : les deux vrais logos, consommés par
  `AppSidebar`. Le reste (`logo.svg`, `logo-icon.svg`, `logo-dark.svg`,
  `auth-logo.svg`) = template TailAdmin, non utilisé.
- `public/images/produits/` — photos produit réelles du catalogue Kérastase
  (reprises de point-de-vente), référencées par `Product.image` dans
  `src/lib/mock/services.ts` et affichées par défaut sur la fiche `/stock`
  (`StockDetail`, remplaçables par une photo de session).
- `public/images/rdv/` + `public/images/accueil/` (2026-09-28) — pictogrammes,
  photos boissons / boutique et visuels de packs du parcours de prise de RDV,
  copiés de point-de-vente avec `components/prise-rdv/` (Pretty Latte et deux
  visuels `gallery-*` manquent aussi à la source).
- `public/images/equipe/` (2026-09-28) — photos de l'équipe copiées de
  point-de-vente, référencées par `Member.photo` (`@/lib/mock/staff`).
- `public/images/boissons/` — photos réelles des boissons du bar Beauty & Co,
  mêmes usage/référencement que `produits/` (certaines boissons n'ont pas de
  photo source, ex. Pretty Latte : `Product.image` absent → placeholder).

### Racine `src/`

- `svg.d.ts`, `../next-env.d.ts` — déclarations de types
- `lib/markdown-lite.ts` (2026-09-28) — `markdownToHtml` (gras, italique,
  liens http(s), puces, titres `#`/`##`, paragraphes, `&nbsp;` = espace ;
  texte échappé d'abord) et `markdownToPlain` (version SMS), pour
  `messagerie/EnvoyerMessage`
- `lib/utils.ts` (2026-09-27) — `cn()` (clsx + tailwind-merge), même helper que
  point-de-vente, requis par ses composants (`ui/atoms`, `ui/molecules`)
- `icons/index.tsx` — barrel de **tous** les icônes SVG (importer `@/icons`). Les 7
  pictogrammes de catégorie de service (`service-*.svg`) ont été **retirés le
  2026-09-27** : une catégorie porte désormais une image importée
  (`Service.image`), voir `shared/CategoryThumb` / `shared/ImagePicker`.
- `public/images/categories/` (2026-09-27) — visuels réels des catégories de la
  réservation b&co (copiés de `point-de-vente/public/images/rdv/`), valeur
  initiale de `Service.image`. `public/images/notation/` — photos réelles des
  réponses de préférence onglerie (copiées de `point-de-vente/public/notation/`),
  valeur initiale de `PreferenceOption.photo`.

### `src/app/` — routes (App Router)

- `layout.tsx` — root layout : polices, `SidebarProvider`, metadata FR
- `not-found.tsx` — page 404 globale (FR, light, renvoie au tableau de bord)
- `(admin)/` — pages dans le shell dashboard (sidebar + header)
  - `layout.tsx` — shell : `LocationProvider` > `AccountProvider` >
    `NotificationsProvider` + `AppSidebar` (plus de header depuis le 2026-09-28), marge
    dynamique + slot parallèle `{modal}` (fiches client / rendez-vous en modal,
    voir `@modal/` ci-dessous)
  - `@modal/` — slot parallèle porté par `layout.tsx`, dédié aux fiches
    présentées en panneau latéral droit (client, rendez-vous — voir « Fiches en
    panneau latéral » plus bas). `default.tsx` (rendu par défaut, `null`) ;
    `(.)clients/[id]/page.tsx` — route interceptée : tout clic depuis
    l'intérieur de l'admin vers `/clients/[id]` atterrit ici au lieu de la page
    dédiée, affichée en panneau par-dessus l'écran d'origine resté monté
    (fermeture = `router.back()`). `(.)rendez-vous/[id]` **supprimée le
    2026-09-28** : la fiche rendez-vous est désormais une page (voir « Fiche
    rendez-vous en page » en bas de fichier)
  - `page.tsx` — tableau de bord (rend `<Dashboard />`, cf. `components/back-office/`)
  - `satisfaction/page.tsx` — satisfaction client (rend `<Satisfaction />`)
  - `rapports/page.tsx` — générateur de rapports paramétrables (rend `<Rapports />`)
  - `messagerie/page.tsx` — boîte de réception SMS + WhatsApp (rend `<Messagerie />`)
    ; `messagerie/envoyer/page.tsx` (2026-09-28) — « Envoyer un email » (rend
    `<EnvoyerMessage />` dans `<Suspense>` pour `?client=<id>` — adresse
    préremplie). Atteint par le bouton du bandeau de Messagerie et par l'e-mail
    des fiches cliente (`ClientDetailModal`, ligne E-mail + repli de
    « Contacter ») et rendez-vous (`RendezVousDetail`) — plus de `mailto:`
  - `rendez-vous/page.tsx` — rendez-vous : deux vues (Liste triable + Agenda —
    frise horaire maison par praticienne, voir plus bas), fiche latérale avec
    affectation d'une praticienne par
    prestation, « Nouveau rendez-vous » manuel (rend `<RendezVous />`, dans
    `<Suspense>` pour `?nouveau=1` — ouverture directe du dialog de réservation
    depuis le bouton « Nouveau RDV » de `dashboard/DashboardHeader`, même
    motif que `?produit=`/`?membre=` sur Stock/Équipe). Pas
    d'étape de confirmation (un RDV réservé est « à venir »), pas d'affichage de
    l'acompte (le même montant pour toutes, réglé dans `/reglages`) ; les RDV
    annulés sont masqués des listes, retrouvables par leur n° de rendez-vous (bouton « Rétablir ») ;
    `rendez-vous/[id]/page.tsx` — fiche rendez-vous, présentée en **panneau
    latéral droit** (rend `<RendezVousDetail closeMode="list" />`), `notFound()`
    si l'id est inconnu. Fallback pleine page pour la navigation directe
    uniquement (URL tapée, rechargement) — depuis l'admin, cette même fiche
    s'ouvre en panneau par-dessus l'écran d'origine via la route interceptée
    `@modal/(.)rendez-vous/[id]/page.tsx` (`closeMode="back"`)
  - `equipe/` — Équipe, **trois onglets = trois routes** (2026-09-27, voir
    « Réduction des onglets imbriqués » en bas de fichier) : `layout.tsx`
    (monte `equipe/EquipeData` — état membres + demandes RH partagé entre les
    deux routes), `page.tsx` = onglet **Membres** (annuaire + fiche membre à
    3 onglets : **Activité** (satisfaction client + charge de RDV + demandes
    d'avance / de congé avec décision Accepter / Refuser) / **Identité & accès**
    (coordonnées, rôles, membre actif, accès plateforme + récap
    autorisations, lien vers Réglages › Autorisations) / **Compétences** ; rend `<Equipe tab="membres" />` dans `<Suspense>` pour
    `?membre=<id>` ; **redirige `?vue=planning` vers `/equipe/planning`**,
    compatibilité des anciens liens), `planning/page.tsx` = onglet **Planning**
    (copie de l'écran Planning de point-de-vente — vues Jour / Semaine par
    praticienne, voir `equipe/planning-board/` ; rend
    `<Equipe tab="planning" />`), `pointage/page.tsx` = onglet **Pointage**
    (2026-10-02, auparavant une vue du Journal — heures d'arrivée / départ
    badgées, voir `equipe/PointageView` ; rend `<Equipe tab="pointage" />`).
    Plus d'onglet Autorisations : la matrice est dans Réglages.
  - `journal/page.tsx` — Journal d'activité : liste antéchronologique des actions
    de l'équipe (encaissements, RDV, stock, décisions RH), filtre par rôle de
    l'auteur (Manager / Caisse / Praticiennes — **Manager par défaut**) + salon
    global + période (préréglages + plage personnalisée). Wrapper serveur
    (metadata) qui rend `<Journal />`
  - `stock/page.tsx` — Stock : niveaux par produit / salon, couverture, projection
    de réappro (rend `<Stock />`, dans `<Suspense>` pour `?produit=<id>`)
  - `salons/page.tsx` — **redirige vers `/reglages?section=salons`** depuis le
    2026-10-01 (les salons se règlent dans Réglages, groupe « Établissement »)
  - `fidelite/cartes-cadeaux/page.tsx` (2026-10-05) — onglet **Cartes cadeaux**
    de Fidélité (rend `<CartesCadeaux />` dans `<Suspense>` pour
    `?format=physique` — défaut digitales). Barre `fidelite/FideliteTabs`
    (Abonnements & packs / Cartes cadeaux) sur les deux routes de Fidélité.
  - `fidelite/page.tsx` — « Fidélité & abonnements » : wrapper serveur (metadata)
    qui rend `<Fidelite />` — depuis le 2026-09-27, **le seul suivi**
    (abonnements souscrits + packs vendus, côte à côte, sans onglets) ; la
    configuration (programme de points, paliers, récompenses, forfaits &
    packs) est dans Réglages. Modèle de données repris du spec b&co
    (`docs/backoffice-spec.md`, hors dépôt)
  - `services/` — parcours « Services » unifié : catégories + prestations
    facturables + questions d'accueil + recettes de consommation + boissons.
    **Deux onglets = deux routes** (2026-09-27) : `layout.tsx` (monte
    `services/ServicesData` — état du catalogue, monté par le layout
    `(admin)` depuis le 2026-09-28, `services/layout.tsx` supprimé), `page.tsx` = **Prestations** (carte des services, rend
    `<Services section="prestations" />`), `boissons/page.tsx` = **Boissons**
    (`<Services section="boissons" />`). Remplace les anciennes routes
    séparées Gestion / Prestations / Questions / Inventaire·Recettes.
  - `clients/page.tsx` — clientèle : tableau triable + recherche (rend `<Clients />`) ;
    `clients/[id]/page.tsx` — fiche cliente, présentée en **panneau latéral
    droit** (rend `<ClientDetailModal closeMode="list" />`) : mise en page à
    **deux colonnes** (refonte 2026-09-21, calquée sur une référence fournie,
    voir `ClientDetailModal` dans la carte du code ci-dessous pour le détail
    complet) — à gauche l'identité (carte héros teintée de marque : avatar,
    badge de segment, CTA « Nouveau rendez-vous », action
    `<ClientDetailActions />` ; puis infos personnelles — genre, adresse,
    salon, email, téléphone — ; puis préférences par thème) ; à droite ce qui
    se mesure (4 stats égales dernière visite/total dépensé/rendez-vous/points
    de fidélité, répartition des rendez-vous par statut, **avantages en
    cours** — abonnement, pack **et carte cadeau de la cliente** en cartes
    cliquables ouvrant le détail, jointure sur `clientId` avec
    `@/lib/mock/abonnements` + `@/lib/mock/rendezvous` ; lien « Gérer » →
    `/fidelite` —, rendez-vous à venir, historique). Ancres `#abonnements`,
    `#rendez-vous` et `#historique` (scroll natif dans le corps défilant du
    panneau). `notFound()` si l'id est inconnu. Fallback
    pleine page pour la navigation directe uniquement — depuis l'admin, cette
    même fiche s'ouvre en panneau par-dessus l'écran d'origine via la route
    interceptée `@modal/(.)clients/[id]/page.tsx` (`closeMode="back"`)
  - `compte/page.tsx` — « Mon compte » : wrapper serveur qui rend `<Compte />`
    (identité, connexion + changement de mot de passe, canaux de notification).
    Atteignable depuis le menu compte du header, pas dans la sidebar.
  - `reglages/page.tsx` — « Réglages » : **page de paramètres classique**
    (2026-09-27) — colonne de sections à gauche, contenu à droite : Paiement
    / Emails / Préférences clientes / Programme de fidélité / Forfaits &
    packs / Autorisations (rend `<Reglages />`, dans `<Suspense>` pour
    `?section=<paiement|emails|preferences|fidelite|offres|autorisations>`,
    qui porte la section active). Réunit toute la configuration :
    Paiement + Emails (fusion du 2026-09-14), Préférences clientes, et depuis
    le 2026-09-27 ce qui était dans Fidélité et Équipe.
- `(full-width-pages)/` — pages hors shell (pleine largeur)
  - `layout.tsx`
  - `signin/page.tsx` — connexion, **hors du groupe `(auth)`** depuis le
    2026-09-28 (plein écran, sans le panneau de marque de `(auth)/layout`),
    même URL `/signin`.
  - `(auth)/` — `forgot-password/`, `reset-password/` (+ `layout.tsx`).
    Refonte FR / light / marque Beauty & Co (2026-09-04) : `layout` = formulaire à
    gauche + panneau `brand-950` à droite (logo B&C, masqué < `lg`), plus de
    `ThemeProvider` / bascule de thème. Authentification **notionnelle** (démo
    front-end) : « Se connecter » → `/`, « Envoyer le lien » → écran de
    confirmation, « Enregistrer le mot de passe » → `/signin`. `signup/` supprimé
    (outil mono-utilisateur, pas d'inscription). `/signin` atteignable via
    « Se déconnecter ».
- `design-system/` — vitrine du design system maison
  - `page.tsx` — toutes les sections (couleurs, typo, boutons, composants back-office…)
  - `layout.tsx`, `Shell.tsx` — chrome dédié à cette page

> **2026-10-02 : Journal revient dans la sidebar** (après Équipe, icône
> `History` — **10 entrées**) et quitte « Autres écrans » du tableau de bord
> (`dashboard/AccesRapides` : Rapports, Avis clients). Le même jour, son
> Pointage part dans Équipe (onglet après Membres et Planning) : le Journal ne
> montre plus que les actions de l'équipe.
>
> **2026-09-28 : Stock revient dans la sidebar** (entre Services et
> Fidélité, icône `Package` — **9 entrées**) et quitte « Autres écrans » du
> tableau de bord (`dashboard/AccesRapides` : Rapports, Avis clients, Journal).
> Ce qui suit sur les 8 entrées est historique.
>
> Note : `AppSidebar` liste ses modules à plat (plus de regroupement par
> catégorie ni d'en-têtes de section, retirés le 2026-09-14). Depuis le
> 2026-09-27, elle n'en compte plus que **8** : Tableau de bord (`/`),
> Rendez-vous, Messagerie, Clients, Équipe, Services, Fidélité
> (`/fidelite`), Réglages (Stock retiré le 2026-09-27, déjà dans les « Accès
> Rapides » du tableau de bord) — sidebar jugée trop chargée à 13 items,
> simplifiée en retirant les écrans redondants ou de consultation occasionnelle
> (voir « Simplification de la sidebar » plus bas). Toutes les routes du
> back-office restent implémentées et atteignables (sidebar, menu compte ou
> raccourcis du tableau de bord). Plus d'entrée « Calendrier »
> (dissoute dans la vue Agenda de `/rendez-vous`) ni « Créneaux horaires »
> (absorbée par `/salons`) ni « Planning » (fusionnée dans `/equipe`, onglet
> Planning, le 2026-09-14) ni entrées séparées « Emails » / « Paiement »
> (fusionnées dans `/reglages` le 2026-09-14). Les routes template en anglais (`customers`, `orders`,
> `products`, `invoices`, `transactions`, `support`, `team`, `activity`,
> `analytics`, `settings`, `(others-pages)`, `(ui-elements)`, `(error-pages)`) ont
> été **supprimées** — voir « Nettoyage du template » plus bas.

### `src/components/`

- `back-office/` — **composants maison du back-office** (les plus importants) :
  `PageHeader` (bandeau de titre commun à **tous** les écrans — carte bordée
  reprise du Figma tableau de bord, voir « Harmonisation des titres de page »
  plus bas : titre seul, pas de sous-titre explicatif, + prop `actions?`
  optionnelle pour un contenu aligné à droite — filtre salon (`SegmentedControl
  variant="tinted"`) et/ou action primaire en bouton plein `brand-500`. Tous
  les écrans avec une action principale (Dashboard, RendezVous, Services,
  Salons, Équipe onglet Membres) la portent désormais dans `actions` ; Fidélité
  n'en a pas (Forfaits/Packs s'éditent via un formulaire toujours visible dans
  le panneau, pas un bouton « + »). Les écrans sans action principale (Clients,
  Stock, Journal, Rapports, Satisfaction, Réglages, Compte) n'utilisent que
  `title`), `PageTabs` (2026-09-27 — barre d'onglets soulignée sous le
  titre, un `<Link>` par onglet vers sa propre route, `aria-current` ; pour
  les sous-écrans d'un module (Équipe : Membres / Planning, Services :
  Prestations / Boissons). Même habillage que `ui/molecules/tabs`, mais en
  liens : réservée à la navigation, les pastilles `SegmentedControl` /
  `SegmentedToggle` ne servent plus qu'aux filtres et bascules de vue),
  `DataTable`,
  `DefinitionList`, `StatCards` / `StatCard`,
  `FormCard` (+ `ToggleRow`) et `StatusBadge` (ces trois-là ne servent plus
  qu'à la vitrine `design-system` — `StatCards` n'est plus consommé par
  `Dashboard` depuis sa refonte Figma du 2026-09-21, voir cette entrée),
  `Dashboard` (**refondu une 2ᵉ fois le 2026-09-27, structure « Décider d'abord » —
  voir « Refonte de l'accueil » en bas de fichier, qui prime sur tout ce qui suit
  concernant `Dashboard`, `dashboard/*`, `TodayAppointments`, `NotificationsPanel`,
  `PopularServices` ; `TodayAppointments.tsx` et `dashboard/NotificationsPanel.tsx`
  sont supprimés, remplacés par `dashboard/{today.ts,DayDecisions,DayFeed}`.** Historique :
  shell client du tableau de bord — **refondu le 2026-09-21 sur
  le Figma « Tableau de bord » (node 286:6/286:31), voir « Refonte Figma
  tableau de bord » plus bas** : grille unique 65/35, plus le découpage
  précédent en sections empilées « rendez-vous → indicateurs de la période →
  tendances » — colonne principale = `TodayAppointments` (RDV du jour) +
  `dashboard/TodayKpiCards` (3 KPI, toujours « aujourd'hui ») +
  `PopularServices` (30 derniers jours) ; colonne de droite `xl:sticky` =
  `dashboard/NotificationsPanel` (« Actions à traiter ») +
  `dashboard/AccesRapides` (« Accès Rapides »). Retirés (absents du Figma, non
  supprimés du dépôt) : la grille de 5 cartes `StatCards` « Indicateurs de la
  période » (dont `recurringRevenueKpi`), `TrendChart`, et la section
  « Autres écrans » en bas de page — `AccesRapides` en reprend les raccourcis
  (Rapports/Avis clients/Journal) et y ajoute Stock. En-tête
  `dashboard/DashboardHeader` — depuis le 2026-09-21 un fin wrapper autour de
  `PageHeader` (`title="Tableau de bord"` + `actions` = filtre salon teinté +
  bouton « Nouveau RDV »), plus une implémentation séparée : voir
  « Harmonisation des titres de page » plus bas. Toujours à la place de la
  bascule de période du Figma (voir cette entrée pour le détail de l'écart)),
  `Compte` (écran `/compte` : une carte, sections Identité / Connexion /
  Notifications ; brouillon local + « Enregistrer » gaté sur `dirty` ; changement
  de mot de passe en bloc séparé avec sa propre action ; validation email /
  téléphone / mot de passe ; consomme `useAccount()`. **2026-09-22** (audit de
  parité point-de-vente) : import de photo fonctionnel (`FileReader` →
  `dataURL` de session, même pattern que `stock/StockDetail.tsx` — commit
  immédiat via `updateAccount`, indépendant du brouillon « Enregistrer » ;
  « Retirer » repasse aux initiales) ; le changement de mot de passe vérifie
  désormais réellement le champ « actuel » contre `account.password`) ;
  sous-dossier `dashboard/` : `NotificationsPanel` (widget « Actions à traiter »
  du tableau de bord, restylé le 2026-09-21 sur le node Figma 286:296 — voir
  « Refonte Figma tableau de bord » plus bas ; une action = une notif non lue de
  ton `warning`/`error`, `isActionable`, dérivé du `tone` déjà porté par
  `AppNotification`. **Écart assumé par rapport à la version du 2026-09-14** :
  le flux général « Toutes les notifications » (historique, tons info/success)
  n'a pas d'équivalent dans le mockup et a été retiré — rien d'autre dans
  l'app ne le consommait ; le compteur/pastille + `markAllRead` de
  `useNotifications()` associés disparaissent avec lui, `markRead` reste
  utilisé (les cartes d'action l'appellent au clic). En-tête bandeau + pastille
  `bg-error-100`/`text-error-800` = nombre d'actions ; pastilles de filtre par
  domaine (Toutes/Stock/RH/RDV, boutons locaux plutôt que `ui/segmented/
  SegmentedControl` — chrome différent du Figma) ; carte par action (icône
  catégorie, badge nom pour une action équipe (`brand-100`/`brand-700`,
  reparsé depuis `body` = « Nom — détail » de `requestNotifications()`) — le
  badge « Urgent » d'une action stock (littéraux `#fdf4e7`/`#f6ddbe`/`#b87a28`,
  hors palette du projet) retiré le 2026-09-21 (passe de nettoyage hiérarchie/
  couleurs, voir « Nettoyage hiérarchie visuelle » plus bas) : redondant, ce
  panneau ne montre déjà que des actions qui demandent une décision), bouton(s)
  d'action par catégorie — pour une
  demande de congé, « Refuser »/« Valider » pointent tous deux vers la fiche
  membre (`href`) : aucun état RH n'est partagé entre écrans (cf. `rh.ts`), ce
  ne sont que des raccourcis vers l'endroit où la décision se prend réellement,
  pas une décision inline. Bordures `border-[#efe9e8]` (littéral repris de
  `AppSidebar`, pas `gray-100`) et texte `#2d2626`/`#6a6060` (littéraux chauds,
  hors palette `gray-*` du projet) pour rester visuellement cohérent avec le
  reste de la refonte Figma),
  `AccesRapides` (widget « Accès Rapides » du tableau de bord, ajouté le
  2026-09-21 sur le node Figma 286:363 — grille 2×2 de raccourcis carte-lien :
  Rapports d'activité, Avis clients, Gestion des stocks, Journal d'équipe ;
  absorbe et remplace l'ancienne section « Autres écrans » de `Dashboard.tsx`
  — Stock rejoint les 3 raccourcis existants, la note de satisfaction et les
  descriptions n'ont pas d'équivalent dans le mockup, retirées),
  `DashboardHeader` (bandeau de tête du tableau de bord, nouveau le 2026-09-21
  sur le node Figma 286:8 : titre + date figée (`today.label`, complétée «
  2026 ») + bouton primaire « Nouveau RDV » → `/rendez-vous?nouveau=1` (lu par
  `RendezVous`, ouvre `BookingDialog` directement). **Écart assumé** : les
  pastilles de période du Figma (Aujourd'hui/Cette semaine/Ce mois)
  remplacées par le filtre salon (`Tous les salons`/`Almadies`/`Sea Plaza`) —
  après la refonte, plus aucune section de la page ne varie avec une période
  (RDV du jour, KPIs du jour et prestations populaires sont tous figés sur
  « aujourd'hui »/« 30 derniers jours », cf. `Dashboard`), des pastilles de
  période n'auraient donc rien piloté ; le filtre salon, lui, reste une
  fonctionnalité réelle que le mock Figma n'a pas besoin de montrer. Pas de
  `position: sticky` (voir commentaire du fichier : `AppHeader` l'est déjà,
  empiler les deux aurait demandé de figer sa hauteur exacte)),
  `TodayKpiCards` (3 cartes « KPIs Opérationnels du Jour », nouveau
  le 2026-09-21 sur le node Figma 286:197 — réutilise `dashboardKpis(scope,
  "today")` (déjà la source historique des cartes « Indicateurs de la
  période » quand la période valait « today ») en écartant le CA, absent de ce
  widget ; sous-légendes propres au widget : répartition par salon
  (`salonsToday`) pour « Rendez-vous », légende fixe pour « Nouveaux
  clients », `satisfaction(scope, "90").count` pour « Satisfaction ». Sens de
  la variation (`direction`) laissé à la donnée réelle plutôt que copié du
  Figma — son mock affiche une flèche verte sur toutes les cartes y compris
  « Nouveaux clients », dont la donnée du projet est en réalité en baisse),
  `equipe/PointageView` + `equipe/PointageLog` (onglet **Pointage** d'Équipe,
  `/equipe/pointage` — 2026-10-02, auparavant une vue du Journal ; barre
  personne + « Seulement les écarts », puis `journal/JournalPeriodPicker` ;
  salon dans le bandeau d'Équipe) : heures badgées de toute l'équipe active
  groupées par jour (« 9 personnes au travail · 1 absence · 1 retard ·
  4 départs anticipés · 1 badge oublié » — écarts en ocre, décomptés par
  `tallyPointages` / `anomalyParts`, 2026-10-02), bilan de la période à droite
  de la période (vue équipe ; « N journées avec un écart » sous le filtre),
  tableau à colonnes
  fixes Personne (→ fiche membre) · Salon · Prévu · Arrivée · Départ · Présence
  (une absence garde son salon attendu, pastille « Absence · <type> » + motif) ;
  menu « Toute l'équipe / <une personne> » → bilan de la période
  (`shared/PointageCells.PointageSummaryBar`) + un seul tableau avec colonne
  Jour ; « Seulement les écarts » ; états vides (rien sur la période → 30 j,
  aucun écart → tout afficher). `Journal` (shell client de `/journal`,
  actions seules depuis le 2026-10-02) : liste
  antéchronologique des actions de l'équipe groupée par jour, filtre rôle `SegmentedControl` (Manager / Caisse /
  Praticiennes — **Manager** par défaut) + salon global `useLocation()` +
  `JournalPeriodPicker` + recherche libre. Mise en page (passe `impeccable
  layout`, 2026-09-28) : bandeau = titre + salon seul ; barre d'outils = rôle
  (compact) + recherche à droite ; en-tête de liste = période + total ; jours
  en intertitres (« Hier · 2 actions ») ; chaque ligne en 3 colonnes heure ·
  pictogramme teinté par le ton · « <Auteur> <action> » puis détail puis
  domaine — plus de pastille de rôle ni d'initiales (redondants avec le
  filtre) ; `sensitive` = fond `error-25` + pastille « Action sensible » (plus
  de bord gauche coloré), `<Link>` si l'action a une page cible ; états
  vides : rôle jamais actif ici / recherche sans résultat (« Effacer la
  recherche ») / rien sur la période (« Élargir aux 30 derniers jours ») ; piloté
  par `@/lib/mock/journal`) ; sous-dossier `journal/` : `JournalPeriodPicker`
  (préréglages Aujourd'hui / 7 j / 30 j + « Personnalisé » → popover Du/Au via
  flatpickr ; émet une plage `{ from, to }` concrète, contrairement à
  `PeriodFilter`),
  `PeriodFilter` (options fixes + « Personnalisé » → popover Du/Au/Filtrer :
  champ date unique au format FR jj/mm/aaaa via flatpickr, sans `altInput` ;
  bouton « Filtrer » désactivé si la plage est incomplète ou inversée),
  `TodayAppointments` (restylé le 2026-09-21 sur le Figma node 286:33 — une
  carte unique enveloppant les colonnes par salon, badge « PROCHAIN »
  (bordure `border-brand-500`) sur la prochaine prestation ; badge « Confirmé »
  du mock volontairement omis, un RDV réservé ici n'a pas d'étape de
  confirmation, cf. plus haut), `TrendChart` (graphe d'aire avec bascule
  Revenus / Rendez-vous, piloté par `trendChart(scope, période, métrique)` —
  **n'est plus utilisé par `Dashboard`** depuis la refonte Figma du
  2026-09-21, absent de ce mock ; fichier conservé, pas d'autre usage
  actuellement), `PopularServices` (restylé le 2026-09-21 sur le Figma node
  286:249 : bandeau titre/sous-titre, barres pleine largeur sans rang numéroté ;
  données réelles inchangées ; pastille « Tendances du mois » du mock Figma
  retirée le 2026-09-21 (passe de nettoyage hiérarchie/couleurs, voir
  « Nettoyage hiérarchie visuelle » plus bas) : redondante avec le sous-titre
  juste au-dessus, qui dit déjà « 30 derniers jours »),
  `RendezVous` (shell client de l'écran rendez-vous, salon-scopé : bascule
  **Liste** (défaut) / **Agenda**, chip « N prestation(s) sans praticienne » qui bascule un filtre
  `assignOnly`, « + Nouveau rendez-vous » ouvre `rendezvous/BookingDialog.tsx`
  (parcours de réservation manuelle « saisi au salon », repris du dialog centré
  unique de point-de-vente — pas de stepper : salon + date + payeuse via
  `shared/ClientSearchField`, N lignes prestation pour elle (menu par catégorie
  de service + praticienne ou « première disponible » + 2ᵉ praticienne si
  `Prestation.twoPractitioners`), **« + Ajouter une personne »** (2026-09-21,
  parité point-de-vente — groupe supplémentaire avec son propre
  `ClientSearchField` + ses propres lignes de prestation, pour un RDV visant
  plusieurs bénéficiaires), section **Boissons** facultative (`sellableExtras`
  de `@/lib/mock/services` → `RdvDetail.extras`), puis un seul horaire de
  départ pour toute la visite — les lignes de TOUTES les personnes s'enchaînent
  depuis cet horaire (principe inchangé), mais chaque `RdvPrestation.start` est
  désormais écrit explicitement à la création plutôt que dérivé à l'affichage ;
  pastilles de créneaux calculées sur la capacité par poste du salon **sur
  toute la fenêtre de la visite** (pas seulement l'instant de départ,
  2026-09-21 — fixe un écart audité vs point-de-vente) ET sur la disponibilité
  réelle de chaque praticienne nommément choisie (`isStaffFreeForWindow` de
  `@/lib/mock/rendezvous`) ; RDV créé avec `staffGlobal: null` — affectation
  fine laissée au tableau/fiche). État de session
  `useState<RdvDetail[]>(allRendezvous())` — affecter / modifier / annuler
  (avec motif) / rétablir / déplacer / supprimer / créer + toasts « cliente
  prévenue ». Vue Liste
  (`rendezvous/ListView.tsx` — grille de cartes façon accueil-day-list de
  point-de-vente : une carte par RDV, avatar + nom + téléphone cliente,
  créneau début–fin, jusqu'à 3 prestations puis « +N de plus », composition
  (« N personnes », 2026-09-21, si le RDV vise plusieurs bénéficiaires),
  pastille
  « À affecter » ou praticienne, total, pied « Voir les détails » / « Affecter
  une praticienne » — pas d'« Encaisser », pas de caisse ici ; tri Date & heure /
  Cliente / Statut / Total) ; filtres `À venir` (défaut) /
  `Aujourd'hui` / `Passés` / `Annulés` / `Tous` + filtre praticienne (toutes les
  praticiennes actives, indépendant du salon affiché — une praticienne n'est
  rattachée à aucun salon fixe) → panneau
  latéral (mène par le nom de la cliente ; pour un RDV clos, plus de `select`
  d'affectation ; en-tête bandeau `brand-950`, prestations en icône-cercle
  colorée par praticienne affectée — teinte d'identité, pas de marque, voir
  `@/lib/mock/staff-colors` — `select` d'affectation teinté pareil). Vue Agenda
  (2026-09-21, refonte — voir « Refonte Planning/Agenda » en bas de fichier) :
  frise horaire maison par praticienne, plus de FullCalendar. `DayTimeline`
  (une ligne par praticienne présente ce jour-là dans le périmètre —
  `weekPresence(scope, monday, planningData)`, **lit désormais le
  `PlanningContext` live** (2026-09-21) plutôt que les seeds figées — + ligne
  « À affecter » épinglée en tête si des prestations
  sont sans praticienne ; blocs positionnés via `prestationSlots` de
  `@/lib/mock/rendezvous` (lit `RdvPrestation.start` directement — des
  bénéficiaires différents peuvent apparaître en parallèle sur deux lignes),
  teintés par l'accent de la praticienne, libellé = bénéficiaire · prestation
  (pas toujours le nom du payeur) + mention « à deux » ; une prestation « à
  deux » apparaît sur les DEUX lignes concernées (principale et 2ᵉ
  praticienne) ; glisser-déposer HTML5 natif — prend
  n'importe quel bloc du RDV, déplace tout le RDV en conservant l'écart entre
  prestations ; ligne « maintenant » `brand-500`, zones hors horaire grisées,
  « Repos » / motif d'absence en filigrane. **Menu par ligne** (2026-09-21,
  `⋯`, `ui/dropdown`) : Isoler cette ligne / Afficher toute l'équipe (état
  `isolated`, local à `AgendaView` — filtre `rows` côté écran, pas partagé
  avec Planning) / Marquer absente aujourd'hui (visible seulement `isToday` —
  ouvre `planning/AbsenceDialog` préremplie Du=Au=aujourd'hui, `onSubmit` →
  `addAbsence` du `PlanningContext`, reflété immédiatement dans l'agenda ET
  l'onglet Planning d'Équipe). **Réordonnancement des lignes par glisser-
  déposer** (2026-09-21, poignée sur l'étiquette — drag séparé du déplacement
  d'un bloc RDV — état `rowOrder`, local, confort d'affichage uniquement)) ;
  `WeekTimeline` (même grammaire
  que `PlanningGrid`, une cellule = horaire + pastille « N RDV » teintée, clic
  → bascule Jour sur ce jour **et isole la praticienne** (2026-09-21 — le
  paramètre `memberId` de `onPickDay`, ignoré jusque-là, pilote désormais
  `isolated`) ; même menu par ligne que `DayTimeline` (Isoler/Afficher tout/
  Marquer absente, pas de réordonnancement ici)) ; bandeau capacité par type de
  poste inchangé),
  `RendezVousDetail` (fiche `/rendez-vous/[id]`, présentée en **panneau
  latéral droit** via `detail/DetailModal` — colonne unique, plus de mise en
  page 2 colonnes ;
  prop `closeMode: "back" | "list"` selon que la fiche a été ouverte par
  interception (retour à l'écran d'origine) ou en accès direct (retour à
  `/rendez-vous`) : `detail/DetailIdentityHeader` (cliente = payeuse, badge
  statut, réf.,
  grille Date/Créneau/Salon/Durée), rangée de `detail/StatTile` (Total à payer
  — inclut les extras, via `rdvTotal`, Prestations, Avantages mobilisés — plus
  de tuile « Encaissement », retirée le 2026-09-21 : l'encaissement a toujours
  lieu à la fin de la visite, l'indiquer par RDV n'apportait rien), statut en
  état local, Alert
  « praticienne demandée absente ce jour-là », « Rétablir le rendez-vous » (RDV
  annulé, affiche `cancelReason` s'il existe) — plus de « Marquer la visite
  terminée » (retiré le 2026-09-21 : le
  passage à « terminé » est automatique côté encaissement, pas une action
  manuelle de cette fiche),
  **prestations regroupées par bénéficiaire** (2026-09-21, `byBeneficiary` —
  carte + sous-total par personne, visible seulement si le RDV en vise
  plusieurs ; puis par catégorie comme avant dans chaque groupe ; chaque ligne
  affiche son horaire propre et « (à deux) » le cas échéant), **section
  Boissons & produits** (si `extras.length > 0`, lecture seule, `productName` +
  `extraPrice`),
  carte Affectation visible seulement si « à venir » — « assigner tout le RDV
  à » + un `select` par prestation via
  `presentPractitionersForPrestation(prestationId, salon, jour, planningData)`
  (compétence +
  présence réelle ce jour-là dans ce salon, **planningData live** 2026-09-21 —
  une praticienne n'est pas
  rattachée à un salon fixe, cf. `@/lib/mock/planning`) + « Première
  disponible », **2ᵉ `select` si la prestation est `twoPractitioners` et une
  1ʳᵉ praticienne choisie** (2026-09-21, écrit `secondStaff` via
  `onUpdatePrestation`), warning si personne de compétent et présent, fin de
  créneau via `rdvEnd` ; **préférences client en lecture rapide** (2026-09-21 —
  `clientDetail(client.id).preferences` de `beautyandco.ts`, groupées par
  `PREFERENCE_GROUPS`, affichées seulement si non vides, dans la carte
  Coordonnées) ; carte « Avantages » :
  `AdvantageItem` résout `RdvAdvantage` (référence par id) contre
  `@/lib/mock/abonnements` — abonnement : forfait + `Badge` statut + prestations
  disponibles ce cycle + reconduction ; pack : prestations restantes / total +
  prestations couvertes ; carte cadeau : solde ; reste au niveau du RDV entier,
  pas par bénéficiaire). Actions de gestion : **« Modifier »** (2026-09-21,
  remplace le bouton d'annulation instantanée — ouvre
  `rendezvous/EditRdvDialog.tsx`), « Déplacer (depuis l'agenda) », **« Nouveau
  rendez-vous »** (2026-09-21, si `onOpenBooking` fourni — seulement depuis le
  panneau ouvert par clic dans `/rendez-vous`, pas la page standalone ni la
  route interceptée, cf. limitation `rendezvousDetail(id)` déjà documentée),
  suppression confirmée « aucun email ». Nouvelles props facultatives
  (branchées seulement en mode session, cf. `RendezVous.tsx`) : `rdvs`,
  `onUpdatePrestation` / `onAddPrestation` / `onRemovePrestation` /
  `onCancelWithReason`, `onOpenBooking`, `planningData`),
  `EditRdvDialog` (2026-09-21, nouveau — édition d'un rendez-vous existant,
  inspiré de point-de-vente/components/planning/edit-rendez-vous-dialog.tsx :
  par ligne (`LineRow`) — service / horaire / bénéficiaire / praticienne / 2ᵉ
  praticienne, « Enregistrer » actif seulement si modifié, valide via
  `isStaffFreeForWindow` (erreur inline en cas de conflit, RDV en cours exclu
  de son propre calcul) ; « Retirer » une ligne si plus d'une active
  (`AddLineForm` pour en ajouter une) ; **annulation du RDV entier avec
  confirmation + motif libre** (remplace l'ancien changement de statut
  instantané) — pas d'annulation par ligne séparée avec son propre motif
  (point-de-vente en a une en plus de l'annulation globale ; simplification
  assumée, « Retirer » couvre l'essentiel du besoin d'édition)),
  `Satisfaction` (shell client de l'écran satisfaction : filtre salon + fenêtre
  30/90 j, piloté par `satisfaction(scope, fenêtre)`),
  `Rapports` (générateur de rapports : état salon + période + axe de regroupement
  + indicateurs cochés, piloté par `buildReport(...)`),
  `ReportBuilderPanel` (panneau de composition : « Regrouper par » — menu
  déroulant `GroupSelect` (choix unique de l'axe) — + cases « Indicateurs » qui
  se grisent quand l'indicateur n'a pas de sens sur l'axe + actions), `ReportTable` (tableau généré : 1re colonne = l'axe, 1 colonne par
  indicateur, ligne Total en pied, état vide), `ReportActions` (export CSV
  `;` + BOM construit côté client, `window.print()`).
  Impression : `AppSidebar` / `AppHeader` / marge du shell portent `print:hidden`
  / `print:!ml-0` pour ne sortir que le rapport,
  `Messagerie` (shell client de la boîte de réception : deux panneaux, état
  canal / recherche / conversation sélectionnée, filtre salon global, réponses
  ajoutées en mémoire — piloté par `@/lib/mock/messagerie`. Lit `?client=<id>`
  (2026-09-22, `useSearchParams`, même motif que `?produit=`/`?membre=` —
  page dans `<Suspense>`) pour sélectionner le fil d'une cliente arrivée
  depuis sa fiche (`ClientDetailModal`, lien « Voir les échanges »), bascule
  sur « Tous les salons » si le fil n'est pas dans le salon filtré) ; sous-dossier
  `messagerie/` : `ConversationList` (panneau gauche : recherche + filtre canal +
  liste), `ConversationThread` (panneau droit : en-tête + fil groupé par jour +
  pied), `MessageComposer` (réponse : bascule de canal + repli WhatsApp quand le
  SMS est coupé + `⌘`+Entrée), `EnvoyerMessage` (2026-09-28, sur une capture fournie — formulaire à
  gauche : canaux Email / SMS / WhatsApp cumulables, « Envoyer à toutes les
  clientes » (confirmation avant l'envoi groupé), destinataires séparés par
  des virgules (SMS / WhatsApp = numéros des fiches reconnues par l'adresse),
  objet (email seulement), message Markdown + compteur SMS 480 ; aperçu email
  à droite (wordmark, objet, rendu `@/lib/markdown-lite`, pied « site web »
  = `defaultSiteLink`) ; « Envois récents » en état de session, rien ne part ;
  **2026-10-01** : titre « Envoyer un message », aperçu par canal coché
  (email, ou bulle SMS / WhatsApp en texte brut + nombre de SMS), « Quand
  l'envoyer ? » Maintenant / Programmer (date + heure, refus d'un moment
  passé), « Envois programmés » avec Envoyer maintenant / Annuler),
  `glyphs` (pictos WhatsApp / SMS /
  actualiser / recherche / alerte / image + `ChannelIcon`),
  `Clients` (shell client de l'écran clientèle : recherche nom/email/téléphone +
  filtre `Toutes / Actives / À relancer / Nouvelles` (2026-09-22, dernier —
  `isNewClient`, créée il y a ≤ 30 j, aligné sur le filtre `FILTERS` de
  point-de-vente) + contrôle « Trier par » (Dernière
  visite / Nom / Total dépensé / Points fidélité) + toggle asc/desc + filtre
  salon global, suppressions locales avec « Annuler » — piloté par
  `useClientsData().rows(scope)` (2026-09-22, remplace l'appel direct à
  `clients(scope)` pour inclure les clientes créées en session). Bouton
  « Nouvelle cliente » dans `actions` du `PageHeader` + affordance de création
  sur une recherche sans résultat → `NewClientDialog` (`ClientEditDialogs.tsx`),
  écarts de parité point-de-vente comblés le 2026-09-22 — voir « Audit de
  parité point-de-vente » plus bas),
  `ClientCards` (grille de cartes clientes façon répertoire de point-de-vente
  — remplace l'ancien `ClientsTable` tabulaire le 2026-09-21 : avatar
  initiales + badge « À relancer », dernière visite (repère n°1 avec le total
  dépensé, cf. persona), total dépensé + RDV/points en pied de carte, actions
  « Détails » + `ClientRowActions`; le tri par clic sur en-tête de colonne n'a
  plus de sens en grille, remplacé par le contrôle de `Clients`),
  `ClientRowActions` (bouton `Détails` + menu `⋯` rendu en portail : « Voir les
  rendez-vous » / « Supprimer »),
  `ClientDetailActions` (client — l'unique action destructive de la fiche
  cliente, restylée le 2026-09-21 (refonte ci-dessous) en simple lien discret
  gris → `error-600` au survol (au lieu d'un bouton bordé) pour ne plus
  concurrencer le CTA « Nouveau rendez-vous » ; confirme en ligne puis renvoie
  vers `/clients`, aucune persistance — l'ancien bouton « Historique complet »
  qu'elle portait aussi est sorti du composant, devenu un lien texte dans le
  héros de `ClientDetailModal`),
  `ClientEditDialogs.tsx` (2026-09-22, nouveau — trois dialogs de formulaire
  calqués sur point-de-vente `components/clientele/{new-client-dialog,
  edit-coordonnees-dialog,edit-preferences-dialog}.tsx` : `NewClientDialog`
  (création — identité, genre, salon, coordonnées ; consommée par `Clients.tsx`,
  bouton « Nouvelle cliente » du `PageHeader` + affordance « + Créer une fiche
  pour … » sur une recherche sans résultat), `EditCoordonneesDialog` /
  `EditPreferencesDialog` (édition — consommées par `ClientDetailModal.tsx`).
  Chrome `ui/modal`, primitives `fidelite/ui`. Toutes écrivent dans
  `ClientsContext`, jamais dans `@/lib/mock/beautyandco`),
  `ClientDetailRoute.tsx` (2026-09-22, nouveau — wrapper client des deux
  routes `/clients/[id]` (dédiée + interceptée `@modal`) : résout la fiche via
  `useClientsData().getDetail(id)` au lieu de `clientDetail()` directement,
  pour qu'une cliente créée en session ait elle aussi une fiche accessible par
  URL ; `notFound()` reste appelé si l'id est inconnu des deux côtés),
  `ClientDetailModal` (fiche `/clients/[id]`, présentée en **panneau latéral
  droit** via `detail/DetailModal` (`widthClassName="max-w-5xl"`, élargi
  depuis `max-w-4xl` pour la mise en page 2 colonnes ci-dessous) —
  **refonte complète le 2026-09-21** (demande explicite de l'utilisatrice,
  skills `design-critique` → `frontend-design` → `impeccable` en séquence,
  voir cette section plus bas) puis **réorganisation le 2026-09-21**
  (deuxième demande explicite, skill `impeccable`, calquée sur une référence
  fournie — fiche patient à deux colonnes) : prop `closeMode: "back" | "list"`
  selon que la fiche a été ouverte par interception ou en accès direct.
  N'utilise plus `detail/DetailIdentityHeader` ni `detail/StatTile` (toujours
  utilisés par `RendezVousDetail` / `StockDetail`, inchangés). Grille
  `grid-cols-[300px_1fr]` : **colonne gauche** = identité — carte héros
  teintée `brand-50→white` (avatar large `brand-100`/`brand-700`, nom + badge
  de segment `SEGMENT_META`, CTA primaire unique « Nouveau rendez-vous »
  `/rendez-vous?nouveau=1`, « Historique complet » + suppression en liens
  discrets sous le CTA), puis « Informations » (définitions genre / adresse /
  salon / email / téléphone, contact en texte simple — pas d'icônes mélangées
  à poids de trait différents) et « Préférences » (inchangée, redescendue
  sous Informations). **Colonne droite** = ce qui se mesure — 4
  `StatCard` égales (dernière visite, total dépensé, rendez-vous, points de
  fidélité ; remplace les anciennes `HeroStat` à deux tailles, uniformisées
  pour matcher la référence), répartition par statut (bande fine, inchangée),
  **« Avantages en cours »** (ex-« Abonnements & packs », `id="abonnements"`
  conservé — renommée et passée d'une liste à une grille de cartes cliquables
  `AdvantageCard`, calquée sur le bloc « rapports » de la référence : une
  carte par abonnement actif, pack en cours, **et carte cadeau** — cette
  dernière n'est rattachée à aucune fixture « cliente » directe, retrouvée en
  scannant `allRendezvous()` de `@/lib/mock/rendezvous` pour les avantages
  `kind: "carte-cadeau"` du client ; clic → `AdvantageDetailOverlay`, fenêtre
  de détail locale (prestations incluses/consommées, échéance, code —
  résolution identique à `AdvantageItem` de `RendezVousDetail.tsx`, présentée
  en fenêtre plutôt qu'en ligne ; le fond assombri ne couvre que le panneau,
  pas l'écran entier, le panneau glissant portant un `transform` qui devient
  le conteneur de tout `position: fixed` descendant), « Rendez-vous à venir »
  et « Historique des visites » (`id="rendez-vous"` / `id="historique"`
  conservés, `<DataTable>` inchangé pour les deux). Aucune info/stat retirée
  par rapport à la version précédente, uniquement redisposée. **2026-09-22**
  (audit de parité point-de-vente, voir « Audit de parité point-de-vente » plus
  bas) : badge de palier de fidélité à côté du badge de segment (dérivé des
  points via `defaultTiers` de `@/lib/mock/fidelite`, seuils par défaut
  uniquement — pas l'état de session édité sur `/fidelite`) ; « Informations »
  et « Préférences » gagnent chacune une icône crayon → `EditCoordonneesDialog`
  / `EditPreferencesDialog` (`ClientEditDialogs.tsx`) ; téléphone/email
  cliquables (`tel:`/`mailto:`) ; nouvelle section « Notes internes » (texte +
  historique, `ClientsContext.addNote`) ; lien « Voir les échanges » vers
  `/messagerie?client=<id>` si `conversationByClientId` trouve un fil
  (`@/lib/mock/messagerie`), affiché uniquement quand ce fil existe) ;
  sous-dossier `detail/` (partagé avec `RendezVousDetail` et `stock/StockDetail`,
  **plus avec `ClientDetailModal`** depuis cette refonte) :
  `DetailModal` (chrome commun du panneau latéral droit — panneau `fixed`
  plein hauteur ancré à droite, fond assombri `bg-gray-900/20`, transition
  d'entrée en glissement, sur le même gabarit que le panneau rapide déjà
  utilisé dans l'écran Rendez-vous ; barre de titre fixe + corps défilant
  `min-h-0` ; plus de dépendance à `ui/modal`, converti depuis un modal centré
  le 2026-09-21, voir « Fiches en panneau latéral » plus bas),
  `DetailIdentityHeader` (+ `DetailAvatar` : bandeau avatar/pictogramme + nom +
  badges à gauche, grille label/valeur à droite), `StatTile` (tuile de
  résumé),
  `CartesCadeaux` (2026-10-05, `/fidelite/cartes-cadeaux` — **refait le même
  jour après critique `impeccable`** : bascule **Digitales / Physiques**
  (`role=tab`, `?format=`, total + pastille rouge des envois digitaux en échec — aucune alerte sur les cartes physiques pas encore remises, demande du 2026-10-05) et
  recherche sur une ligne, puis une ligne discrète « N cartes en cours · encore
  dû X FCFA » (les 6 chiffres des anciennes cartes de format et les en-têtes de
  colonnes sont retirés) ; sections — digitales : Envoi en échec, Envoi
  programmé, En circulation ; physiques : À imprimer, Prêtes à remettre, En
  circulation — puis « Épuisées ou expirées » replié. Une ligne = acheteur +
  « Pour <destinataire> · n° de carte » / ce qui reste (solde, « sur X » si
  entamée ; ou « N prestations » + noms) / état (canal · date d'envoi, motif
  d'échec en rouge, lieu de retrait ou de livraison + date d'impression ou de
  remise) / action (« Corriger et renvoyer » → fiche, « Imprimer », « Marquer
  comme remise / expédiée »). L'adresse d'envoi n'est plus dans la ligne
  (fiche). Recherche vide qui trouve dans l'autre format → lien ; « Régler la
  livraison » → `/reglages?section=livraison` ; état de session + toasts),
  `Fidelite` (shell client de « Fidélité & abonnements », **suivi seul**
  depuis le 2026-09-27 : `AbonnementsPanel` + `PackSalesPanel` côte à côte
  (grille 2 colonnes, plus aucun onglet), bouton « Régler les offres » →
  `/reglages?section=offres` ; **2026-10-02** : champ de recherche commun aux
  deux suivis sous le bandeau (nom de la souscriptrice / bénéficiaire /
  acheteuse, n° client, téléphone, nom du forfait ou du pack — `query` passé
  aux deux panneaux), confirmations en `ui/molecules/toast` ;
  `abonnements` / `packPurchases` en état local, forfaits / packs lus via
  `useFideliteConfig()` (`@/context/FideliteContext`) — fixtures
  `@/lib/mock/abonnements`) ;
  sous-dossier `fidelite/` (les panneaux de configuration ci-dessous sont
  montés par `Reglages` depuis le 2026-09-27, sections « Programme de
  fidélité » et « Forfaits & packs ») : `AccrualSettings` (
  paramètres : brouillon local + bouton « Enregistrer » actif seulement si
  modifié, bandeau si programme désactivé, champ variable selon la base
  d'accumulation), `TiersPanel` (onglet Paliers : liste triée par seuil +
  formulaire ajout/édition + suppression confirmée en ligne), `RewardsPanel`
  (onglet Récompenses : idem avec type de récompense ; **2026-09-28** : type
  « Prestation offerte » / « Produit offert » → `RewardItemPicker` sous le type
  au lieu du champ valeur, `LoyaltyReward.itemId`, nom proposé d'office),
  `RewardItemPicker` (2026-09-28 — choix unique de la prestation (groupée par
  catégorie) ou du produit (groupé par marque, vignette photo) offert :
  recherche pliée sans accent + liste défilante `max-h-80`),
  `ForfaitsPanel` (CRUD forfaits : label, description, **prix libre**, cycle
  (`CYCLE_PRESETS` + jours si « Personnalisé »), `PrestationPicker` sans prix —
  prestations résolues affichées, jamais de somme), `PacksPanel` (CRUD packs :
  label, description, `PrestationPicker` avec prix, **prix packagé dérivé −20 %**
  affiché + `Toggle` « Forcer un prix » → `priceOverrideFcfa`),
  `PrestationPicker` (multi-sélection du catalogue `@/lib/mock/services` groupé
  par service + recherche pliée sans accent ; `showPricing` masque prix/durée
  pour les forfaits ; partagé Forfaits/Packs),
  `AbonnementsPanel` (suivi, **refonte 2026-10-02** : carte titrée
  « Abonnements » + compteur « N en cours · N à régler » (rouge) + bouton
  « Souscrire un forfait » ; une ligne par abonnement, **« À régler » en tête**
  puis par échéance — `HolderName` (nom + n° client → fiche) + badge statut +
  « Voir la fiche » ; forfait · prix / cycle, « Pour <bénéficiaire> » ; pied
  échéance (« En retard depuis le … » en rouge) + prestations restantes du
  cycle, bouton **Encaisser** (plein si à régler, bordé sinon → `PayControl` :
  stepper cycles 1–12 + montant + prochaine échéance → `markAbonnementPaid`) et
  menu `⋯` « Révoquer l'abonnement » (confirmation inline →
  `revokeAbonnement`) ; « Révoqués (N) » repliés ; formulaire **Souscrire un
  forfait** en panneau latéral `reglages/kit.EditorPanel`),
  `PackSalesPanel` (suivi, même grammaire : « Packs » + « N en cours · N
  prestations à honorer » + « Vendre un pack » ; lignes en cours (les plus
  récentes d'abord) — `HolderName` + « Voir la fiche », pack · date d'achat,
  barre à cases (une par prestation) + « N sur M utilisées », « Reste : … »,
  bouton **Utiliser** (cases des prestations restantes → `redeemPrestations`,
  définitif) ; « Entièrement utilisés (N) » repliés ; vente en `EditorPanel`),
  `HolderRef` (2026-10-02 — `HolderName` (nom + n° client en lien vers
  `/clients/[id]`, panneau latéral par la route interceptée ; « Hors fichier »
  sans lien), `HolderFicheLink` (« Voir la fiche ↗ ») et `holderMatches`
  (recherche pliée sans accent sur noms / libellés, chiffres sur n° client et
  téléphones)), `FollowUpSection` (2026-10-02 — liste repliable des éléments
  clos, dépliée d'office quand une recherche y trouve quelque chose ; `NoMatch`
  « Aucun … pour « x » » + « Effacer la recherche »),
`FideliteTabs` (2026-10-05 — onglets des deux routes de Fidélité),
  `GiftCardDetail` (fiche panneau latéral `detail/DetailModal`, ordre refait
  le 2026-10-05 : titre « Carte de 50.000 FCFA » / « Carte de 2 prestations »
  + n° · date et lieu d'achat ; **d'abord ce qui attend un geste** (envoi en
  échec : motif + adresse corrigeable + « Renvoyer la carte » ; carte physique
  pas encore remise : lieu + étapes Commandée → Imprimée → Remise·Expédiée +
  bouton) ; puis ce qui reste (solde + barre seulement si entamée, sinon « Pas
  encore utilisée » ; prestations cochées) + validité ; Offerte par / Pour
  (contact, lien fiche) + message ; Envoi (« Renvoyer » discret) ou Remise
  faite ; Utilisations seulement s'il y en a). `GiftCardVisual` supprimé le 2026-10-05 (plus
  d'aperçu de carte),
  `ContactField` (choix souscriptrice / acheteuse : « Cliente du fichier »
  (recherche `shared/ClientSearchField` par nom ou téléphone, depuis le
  2026-10-02) ou « Hors fichier » (coordonnées libres) ; « Ajouter … » dans la
  recherche bascule sur Hors fichier prérempli → `{ clientId, contact }`),
  `ui` (primitives de
  formulaire / liste éditable, **partagées avec le parcours Services** :
  `SectionCard`, `Divider`, `Toggle` (role=switch), `SettingRow`, `TextInput`,
  `SelectField`, `EditableRow`, `EmptyList`, classes `btnPrimary` / `btnGhost`),
  `Services` (shell client du parcours catalogue — **carte des services en
  sections continues depuis le 2026-09-27, voir « Carte des services » en
  bas de fichier** (remplace le tableau Kanban du 2026-09-22) : état `view` =
  `list` (défaut) / `category` (fiche panneau, id `null` = création) /
  `prestation` (fiche panneau, id `null` = création ; bouton d'en-tête
  « Nouvelle prestation » l'ouvre sur la 1ʳᵉ catégorie, changeable dans la
  fiche), salon global, tout édité en mémoire de session — fixtures
  `@/lib/mock/services` ; prop `section: "prestations" | "boissons"` fournie
  par la route (`/services` / `/services/boissons`, barre `PageTabs`,
  2026-09-27), état du catalogue lu dans `services/ServicesData`) ;
  sous-dossier `services/` : `ServicesData` (contexte d'état de session —
  catégories, prestations, questions, boissons — `useServicesData`, monté
  par `app/(admin)/services/layout.tsx` pour survivre au changement
  d'onglet, 2026-09-27),
  `ServicesCatalog` (la page Prestations — grille sommaire 288px + contenu
  (sommaire agrandi le 2026-09-28 : libellés 17px sur deux lignes au besoin,
  vignettes 36px) :
  sommaire `sticky` des catégories (vignette, nom, nombre, point d'alerte si
  prestations non réservables, section courante suivie par
  `IntersectionObserver`, clic = défilement doux, « Nouvelle catégorie » en
  pied) ; recherche sur tout le catalogue (pliée sans accent) + filtres
  pastilles Toutes / Non réservables / Inactives / À deux avec compteurs ;
  mention « N prestations non proposées à <salon> sont masquées » sous un
  filtre salon ; section `UnassignedSection` en tête s'il y a des
  orphelins ; une `CategorySection` par catégorie ; états vides recherche /
  filtre / aucune catégorie. Ordre des catégories changeable uniquement sur
  « Tous les salons »),
  `CategorySection` (une catégorie : en-tête vignette/nom/compteurs (du
  salon affiché) + interrupteur actif + « Modifier » (→ `CategoryPanel`) +
  menu `⋯` Radix (Monter / Descendre d'un rang, Supprimer → `ConfirmDialog`) ;
  corps = carte bordée, ligne d'en-têtes de colonnes, sous-catégories en
  intertitres (+ « Ajouter » par sous-catégorie), « Ajouter une prestation »
  en pied ; sous un filtre, sous-catégories vides et boutons d'ajout masqués),
  `PrestationRow` (une prestation = bloc bordé sur une ligne, grille
  `ROW_GRID` partagée avec l'en-tête : nom + pastilles Inactive / Non
  réservable + pictogramme discret « à deux » (`Users`, pas une pastille :
  77 prestations sur 107), durée, prix aligné à droite en chiffres
  tabulaires, interrupteur actif inline ; clic / Entrée = fiche),
  `UnassignedSection` (section « Sans catégorie » en ton warning,
  prestations et questions orphelines en blocs avec sélecteur « Rattacher
  à… » + suppression ; rendue seulement s'il y a quelque chose à ranger),
  `CategoryPanel` (fiche
  panneau latéral d'une catégorie, `detail/DetailModal` — `ServiceInfoForm`
  (Informations) toujours visible, + `SubcategoriesPanel` et `QuestionsPanel`
  une fois l'id connu (pas en création) ; plus d'onglet Prestations, gérées
  directement sur la page), `SubcategoriesPanel` (CRUD bloc des
  sous-catégories d'une catégorie : renommage en ligne, réordonnancement par
  flèches, suppression confirmée — détache les prestations vers « Autres »,
  jamais perdues, cf. `Services.deleteSubcategory`), `PrestationPanel`
  (fiche panneau latéral d'une prestation — remplace l'ancien formulaire
  inline de `PrestationsPanel`, supprimé : prix, durée, statut,
  **catégorie** (prop `services` — c'est ici qu'on recatégorise depuis le
  retrait du Kanban ; changer de catégorie remet sous-catégorie et salons aux
  défauts du nouveau parent, `onSave` renvoie `serviceId`) + sous-catégorie
  (si la catégorie en a), salons, « à deux »,
  « Réalisée par » en lecture seule, `RecipeEditor`, suppression confirmée),
  `FicheGroup` (2026-10-07 — grammaire de la fiche prestation, sur le modèle
  de `reglages/kit` : `FicheGroup` (bloc titré + compteur + action),
  `FicheRule` (ligne libellé 176px → contenu), `RuleLine` (valeur à gauche,
  action à droite), `Muted`, `AddLink` (« + … » texte de marque)). **Refonte
  de `PrestationPanel` le même jour** (skill `impeccable`, demande « du point
  de vue de la manager, pas un texte qui explique l'app ») : identité en tête
  (nom, prix, durée, active, catégorie), puis bloc **Réservation** — Salons
  (pastilles), Jours et horaires (bascule Ceux du salon / Jours précis +
  `HoursEditor`), Pauses (`PausesEditor` réduit au contenu de la ligne :
  liste + « Mettre en pause » qui déplie Du / Au / Motif), À deux praticiennes
  (« Oui — 3 h → 1 h 30 »), Pas avec (pastilles + `PrestationPicker` déplié),
  Réalisée par (prénoms + lien Équipe, « Personne — non réservable » sinon) ;
  puis **Questions à la cliente** et **Produits consommés** (`RecipeEditor` en
  bloc, formulaire d'ajout replié). Plus aucune phrase d'explication,
 le même jour « du point de
  vue de la manager », sans texte explicatif — section « Questions à la
  réservation » de `PrestationPanel`, après « Incompatible avec » : chaque
  question = champ « Question » + liste « Réponses », une ligne par réponse
  avec toutes les actions visibles (miniature cliquable, champ du nom,
  « Changer / Ajouter une photo », ↑ ↓, corbeille — désactivée sous 2
  réponses), « + Ajouter une réponse », corbeille de question confirmée en
  ligne (liste préférée aux tuiles le même jour, plus claire à éditer) ; plus de mode
  édition ni de bouton par question : tout part avec « Enregistrer » de la
  fiche, bloqué avec le motif (`questionsProblem`) si une question est
  incomplète. `PrestationRow` affiche « N question(s) », libellés au survol),
  `ServiceInfoForm` (création & édition d'une catégorie : nom, vignette
  émoji, description, cases salons, statut ; brouillon + dirty en mode
  édition ; `ServiceDraft` omet désormais `subcategories`, gérées à part par
  `SubcategoriesPanel` — l'appelant les préserve par spread lors de la mise
  à jour), `RecipeEditor` (recette de consommation : lignes produit /
  quantité / unité, stock déduit à la fin de la visite), `QuestionsPanel`
  (« Questions de réservation » : libellé, type Oui-Non / Texte + texte
  d'aide, statut — plus de « Choix multiple » depuis le 2026-09-27),
  `BoissonsPanel` (2026-09-27 — onglet **Boissons**, route `/services/boissons` : grille de
  cartes photo / nom / composition / prix, fiche panneau latéral
  (`detail/DetailModal`) pour éditer photo (`shared/ImagePicker`), nom, prix,
  composition, disponibilité, ou supprimer ; la carte du bar, famille à part
  sans stock), `ui` (réexport des
  primitives de `../fidelite/ui` — plus de `BackButton` local, supprimé :
  plus aucun flux plein-page dans ce parcours, tout est panneau latéral).
  Supprimés (remplacés par ce qui précède) : `ServicesList`, `ServiceDetail`,
  `PrestationsPanel`, `OrphansPanel`, puis le 2026-09-27 `ServicesBoard`,
  `CategoryColumn`, `PrestationCard`, `UnassignedColumn` (Kanban).
  **2026-10-01 — Salons dans Réglages** : section « Salons » (groupe
  « Établissement », en tête, section par défaut) qui monte `Salons` ; la vue
  vit dans l'URL (`&salon=<id>` / `&salon=nouveau`) ; état (`useSalonsState`,
  exporté par `Salons.tsx`) tenu par `Reglages`. Menu compte et `journal.ts`
  pointent vers `/reglages?section=salons`.
  `reglages/LivraisonPanel` (2026-10-01 — Réglages › **Livraison**, groupe
  « Cartes cadeaux », `?section=livraison` : quartiers + prix de livraison
  d'une carte cadeau, ajout / modification en `kit/EditorPanel`, doublon de
  nom refusé ; état tenu par `Reglages` pour survivre au changement de section),
  `reglages/kit` (2026-09-28 — primitives de l'écran Réglages : `SettingsGroup`,
  `SettingsRow`, `UnitInput`, `SaveBar`, `ItemRow`, `EditorPanel`… voir
  « Refonte de l'écran Réglages » en bas de fichier),
  `Reglages` (**refonte 2026-09-27, « Réduction des onglets imbriqués »** :
  page de paramètres — colonne de sections groupées (Encaissement : Paiement ·
  Clientèle : Emails, Préférences clientes, Programme de fidélité, Forfaits &
  packs · Équipe : Autorisations), chaque entrée est un `<Link>`
  `/reglages?section=…` (section lue dans l'URL, pas d'état local — retour
  navigateur et liens directs), contenu à droite sous un titre de section.
  Programme de fidélité = `AccrualSettings` + `TiersPanel` + `RewardsPanel`,
  Forfaits & packs = `ForfaitsPanel` + `PacksPanel` (via
  `useFideliteConfig()`), Autorisations = `equipe/RolePermissions` (via
  `useAutorisations()`). Le texte qui suit sur la bascule `SegmentedControl`
  est historique. Avant : 3ᵉ section **Préférences clientes**,
  `?section=preferences`, rend `reglages/PreferencesConfigPanel` — voir
  « Intégration de la logique métier point-de-vente » en bas de fichier ;
  sous-dossier `reglages/` : `PreferencesConfigPanel` (**refonte 2026-09-28**,
  skill `impeccable` — plus de domaines fixes : filtre « Questions posées
  après » (toutes / une catégorie, compteurs), un `SettingsGroup` par rubrique
  (catégorie du catalogue, ordre du catalogue, + Boissons) avec « + Question »
  préciblé, une ligne par question — méta, « Posée après » en puces (catégorie
  entière ou « N prestations sur M »), réponses en pastilles photo, ↑↓ dans la
  rubrique, « Modifier » — puis bloc « Rien n'est demandé après » listant les
  catégories sans question active ; éditeur `kit/EditorPanel` (`widthClassName`
  ajouté) : question, consigne, libellé fiche, **sélecteur « Posée après »**
  (cases de catégorie à trois états, dépliables en prestations par
  sous-catégorie, recherche pliée sans accent, « Boissons du bar » ; ligne
  « Concerne » au lieu de « Posée après » si la question n'est pas posée à la
  caisse), 3 interrupteurs, réponses **avec photo obligatoire**
  (`shared/ImagePicker` en mode `compact` — vignette seule, ajouté le
  2026-09-28), manque écrit si
  l'enregistrement est bloqué, suppression confirmée ; lit / écrit
  `usePreferenceConfig()`). Shell client de l'écran « Réglages » : `SegmentedControl`
  **Paiement** / **Emails**, lecture `?section=<paiement|emails>`
  (`useSearchParams`) pour l'ouverture directe d'une section depuis un lien
  externe (ex. Journal), même motif que `?membre=` sur `Equipe`. Fusion des
  écrans autrefois séparés Paiement et Emails — 2026-09-14, tous deux à une
  carte, rarement visités) ; sous-dossier `reglages/` : `PaiementPanel` (une
  carte, brouillon local + bouton « Enregistrer » actif seulement si modifié —
  fixtures `@/lib/mock/paiement`) ; trois sections — encaissement réel / mode
  test (bandeau info ou avertissement selon l'état), acompte à la réservation
  (montant fixe / pourcentage / aucun, champ variable + plancher 100 FCFA),
  paiement mobile — Wave / Orange Money, deux toggles (2026-09-22, remplace le
  règlement PayPal en USD : absent de point-de-vente, voir « Audit de parité
  point-de-vente »). Primitives inline
  dans le fichier ; `EmailsPanel` (lien du site + automatisations +
  bibliothèque de modèles + panneau d'édition, tout en mémoire de session —
  fixtures `@/lib/mock/emails`) ; sous-dossier `reglages/emails/` :
  `SettingsCards` (bloc « Général » : lien du site seul depuis le 2026-09-28),
  `TemplateList` (liste rangée par occasion d'envoi, colonne « Quand » =
  `templateSendLabel` + éclair si automatique ; bouton « Nouveau modèle »),
  `SendSettings` (2026-09-28 — réglage d'envoi d'un modèle dans l'éditeur :
  Manuel / Automatique, « À l'occasion de », délai + unité + avant / après,
  phrase de relecture, avertissement si « avant » un achat),
  `TemplateEditorPanel` (panneau latéral **large à deux colonnes** depuis le
  2026-10-05 : formulaire à gauche, **aperçu** à droite (`shared/EmailPreview`,
  bascule Exemple — variables remplies avec une cliente type + lien du site
  des réglages — / Variables) ; nom, envoi (`SendSettings`, ou
  déclencheur figé en lecture seule), objet + corps,
  chips de variables insérées au curseur, modèles système non renommables /
  non supprimables, suppression confirmée en ligne, Échap / clic sur le fond pour
  fermer), `ui` (primitives locales : `SectionCard`, `Toggle`, `MiniSelect`,
  `fieldClass`, `btnPrimary` / `btnGhost`)
  `Equipe` (shell client de l'écran Équipe, prop `tab: "membres" |
  "planning"` fournie par la route — `/equipe` ou `/equipe/planning`, barre
  `PageTabs` sous le titre (2026-09-27) ; état `members` + `staffRequests`
  lu dans `equipe/EquipeData` (layout de la route, survit au changement
  d'onglet), autorisations lues via `useAutorisations()` pour le récap de la
  fiche membre, dont le bouton « Régler les autorisations par rôle » ouvre
  `/reglages?section=autorisations` ; vues liste / fiche / ajout ; `absences`
  / `shiftOverrides` du Planning consommés via `usePlanningData()`
  (`@/context/PlanningContext`, 2026-09-21) pour rester synchronisés avec
  l'action rapide « Marquer absente aujourd'hui » de l'agenda `/rendez-vous`.
  Pas de filtre salon sur **Membres** — une personne n'est rattachée à aucun
  salon fixe (cf. `@/lib/mock/planning`) ; le **Planning** garde le filtre
  salon global. Lecture `?membre=<id>` (ouverture d'une fiche depuis une
  notification) via `useSearchParams`, décision sur les demandes avec
  `decidedAt` horodaté réel — fixtures `@/lib/mock/staff` + `@/lib/mock/rh`
  + `@/lib/mock/planning`) ; sous-dossier `equipe/` : `EquipeData` (contexte
  d'état de session membres + demandes, `useEquipeData`, 2026-09-27),
  `EquipeList` (recherche + filtre rôle `SegmentedControl` + **grille de
  cartes** — remplace l'ancien `DataTable` le 2026-09-22, passage listes →
  blocs, même grammaire que `ClientCards` : avatar initiales, badges rôles /
  accès, « Cette semaine » = `weekSalonSummary(memberId)` de
  `@/lib/mock/planning` (résumé dérivé du planning, ex. « 3j Almadies · 2j Sea
  Plaza » — pas un rattachement figé), pastille `Badge`
  « N demande(s) » ton warning sur un membre qui a des demandes en attente),
  `MemberDetail` (fiche : en-tête (badge salon remplacé par
  `weekSalonSummary(member.id)`) + « supprimer définitivement » ; 4 onglets —
  **Activité** (défaut, rend `MemberActivityPanel` ; pastille de compte des
  demandes en attente sur le libellé) / **Présence** (2026-09-28,
  `MemberPresencePanel`) / **Identité & accès** (`MemberIdentityForm`
  + `MemberAccessPanel` empilés) / **Compétences** (`MemberSkillsPanel` ; bloc « Horaires habituels »
  retiré le 2026-09-28 à la demande de la propriétaire — la trame
  `baseHours` reste dans les données, lue par le Planning)),
  `MemberActivityPanel` (onglet « Activité » : `PendingRequestsBanner` (décision
  Accepter / Refuser) + toast local « Congé enregistré / Avance accordée /
  Demande refusée » (pattern `notice` de `RendezVousDetail`) ; bloc **Satisfaction
  client** (`staffSatisfaction(prénom)` de `beautyandco` — note moyenne +
  `RatingStars` + tendance + 3 derniers commentaires ; masqué pour caisse /
  manager ; « trop peu d'avis » sous 4 avis ; état vide si aucun avis) ; bloc
  **Rendez-vous à venir** (compteur dérivé de `rdvDays` + `TODAY_ISO` de
  `planning`, lien `/rendez-vous`) ; `MemberRequestsPanel` (historique)),
  `MemberRequestsPanel` (historique daté des demandes + statut coloré, état vide
  « Aucune demande » ; export nommé
  `PendingRequestsBanner` : une carte de décision par demande en attente, montant
  OU dates + mot de la collaboratrice, alerte chiffrée si un congé chevauche des
  rendez-vous déjà pris), `MemberIdentityFields` (champs
  contrôlés partagés création / édition — identité, métier, rôles ; plus de
  salons de rattachement, le salon dépend du planning (`baseHours`) — `identityValid` / `trimIdentity` /
  `BLANK_IDENTITY`), `MemberIdentityForm` (édition : brouillon + dirty +
  Enregistrer + Toggle actif avec confirmation), `MemberAccessPanel` (bas de
  l'onglet « Identité & accès » : état du compte — Inviter / Renvoyer / Annuler /
  Révoquer — **puis** carte « Ce que ce membre peut faire » : union des
  autorisations de ses rôles (`capabilitiesForRoles`), groupée par domaine, en
  lecture seule, bouton « Régler les autorisations par rôle » →
  `onOpenPermissions` (ouvre Réglages › Autorisations) ; mention si le
  compte n'est pas encore actif ; consomme `autorisations`),
  `RolePermissions` (monté par `Reglages`, section **Autorisations**,
  depuis le 2026-09-27 : matrice `<table>` autorisation
  × rôle (Praticienne / Caisse / Manager), `Toggle` par cellule, en-têtes de
  domaine (`CAPABILITY_GROUPS`), pastille « Sensible », cascade des prérequis
  via `onChange` → `applyCapability`, compteur + « Réinitialiser » par colonne
  quand `roleDiffersFromDefault`, `Alert` d'avertissement si un rôle n'a aucune
  autorisation, carte info « vos accès à vous ne changent pas » via
  `useAccount()`), `MemberSkillsPanel` (**2026-09-28, passe `impeccable`** —
  récap écrit en lecture : prestations réalisées par catégorie (« 24 sur
  41 », liste en 2 colonnes, mention « seule à la réaliser »), ligne « Non
  réalisées », Alert si praticienne sans compétence ; bouton « Modifier les
  compétences » → `SkillsDialog`), `SkillsDialog` (2026-09-28 — grande fenêtre
  `ui/molecules/dialog` `max-w-5xl` × 86vh : sommaire des catégories avec
  compteurs à gauche, recherche pliée sans accent sur tout le catalogue (nom +
  sous-catégorie), lignes à cocher (sous-catégorie, durée · prix, « Seule
  praticienne à la réaliser »), « Tout cocher » par groupe / « Cocher ces
  résultats » en recherche ; brouillon local, pied « N cochées · N ajoutées,
  N retirées » + alerte des prestations qui deviendraient non réservables,
  Enregistrer actif seulement si modifié ; exporte `SKILL_GROUPS`,
  `SKILL_TOTAL`, `soleProviderIds`), `MemberPresencePanel` (2026-09-28 —
  onglet « Présence » : période Cette semaine / Semaine dernière / 30 derniers
  jours + « Afficher seulement les écarts » ; bande de bilan (temps de
  présence vs prévu, jours travaillés + absences, retards + cumul, départs
  anticipés) + ligne d'erreur si départ non badgé ; registre `<table>` groupé
  par semaine (total de la semaine) : jour, salon, prévu, arrivée (+N min en
  ocre si retard > 5 min), départ (−N min si > 10 min avant, « En poste »
  aujourd'hui, « Départ non badgé »), présence ; absences en ligne muette ;
  états vides — lit `@/lib/mock/pointage`), `AddMemberFlow` (création : identité +
  compétences — trame horaire par défaut lun–sam, plus éditable —, puis « inviter maintenant ? »), `ui` (`BackButton`,
  `CheckPill`, `Avatar` + réexport des primitives de `../fidelite/ui`),
  sous-dossier `equipe/schedule/` (2026-09-28, onglet **Planning** d'Équipe,
  mode **Horaires** — par défaut ; bascule Horaires / Rendez-vous portée par
  `Equipe.tsx`, le mode Rendez-vous = `PlanningBoard` ci-dessous, prop
  `toolbarStart`) : `ScheduleEditor` (grille semaine membres × jours, toute
  l'équipe active groupée Coiffure / Esthétique / Accueil, gestion & entretien ;
  navigation par semaine, filtre salon global, « Copier la semaine précédente »,
  « Rétablir l'habituel », « Ajouter une absence » ; case = horaire + salon (ou
  nb de rdv sous un filtre salon), point de marque si modifié ce jour, absence en
  ton warning, autre salon hachuré, colonne fermée grisée ; pied « Praticiennes
  sur place » par salon, rouge à 0 ; toast avec « Annuler » après chaque
  changement), `ShiftForm` (popover Radix d'une case : Travaille / Repos /
  Absent·e, salon, arrivée / départ au pas de 30 min dans les heures du salon,
  « Tous les <jour>s » = horaire habituel, « y revenir », alerte si des rdv
  affectés sortent du créneau), `AbsenceDialog` (absence sur plage Du / Au),
  `schedule` (transformations pures : `applyDay`, `restoreDay`, `resetWeek`,
  `copyPreviousWeek`, `weekChanges`, `rdvOutside`, `timeSteps`…),
  sous-dossier `equipe/planning-board/` (2026-09-27, onglet **Planning** de
  `Equipe` — **copie de l'écran Planning de point-de-vente**
  (`components/planning/{planning-board,period-nav,day-timeline,week-timeline}.tsx`),
  demande explicite de la propriétaire, remplace l'ancienne matrice de présence
  `PlanningPanel` + `planning/PlanningGrid`, supprimées) : `PlanningBoard`
  (filtres métier Tous / Coiffeurs / Esthéticiens (`Member.category`) + salon
  (filtre global `useLocation`), `PeriodNav`, vue Jour / Semaine, écran « salon
  fermé ce jour-là » ; isolement d'une praticienne, réordonnancement des
  colonnes (état local) ; « Marquer absente aujourd'hui » → `addAbsence` du
  `PlanningContext` (type `repos`, visible aussi dans l'agenda `/rendez-vous`) ;
  clic sur un rendez-vous → `/rendez-vous/[id]` en panneau latéral (route
  interceptée) au lieu de la feuille d'encaissement de point-de-vente ;
  **2026-10-02** : clic sur une demi-heure libre de la vue Jour → `PriseRdvModal`
  monté par le planning, pré-réglé (prop `pickedSlot` : jour, heure, salon de la
  plage, praticienne posée d'office si libre) — RDV créé remis à `onCreateRdv`
  (`RendezVous.create`), sinon gardé en état local (Équipe › Planning)),
  `PeriodNav` (libellé de période = bouton qui ouvre `ui/molecules/date-picker`,
  « Aujourd'hui », bascule Jour / Semaine), `DayTimeline` (une colonne par
  praticienne, temps vertical 10h→21h, fermé après 20h, hors horaire
  grisés, autre salon hachuré, blocs de prestation empilés en sous-colonnes si
  chevauchement, trait « maintenant » à l'heure de démo `today.currentTime`
  (13:20, plus l'horloge réelle) et passé du jour légèrement grisé ; survol
  d'une demi-heure libre = cadre pointillé « + 13:30 », `onPickSlot` — ni
  passée, ni prise, ni hors plage ni absente), `WeekTimeline` (une ligne par
  praticienne × 7 jours : amplitude + « N rdv », Repos / Absente / Fermé /
  « Aux Almadies » ; clic → vue Jour isolée), `data` (adaptateur : présence
  `presenceFor` → une plage `Shift[]` d'un seul tenant (plus de coupure depuis le 2026-09-28), prestations de
  `allRendezvous()` → `PlanningRow` rattachées par nom complet à un `Member`,
  helpers de dates ISO — « aujourd'hui » = `TODAY_ISO` du monde de démo).
  **Perdu avec l'ancienne matrice** (absent de point-de-vente) : bandeau des trous
  de couverture, pose d'une absence sur une plage de dates depuis l'onglet,
  « rétablir les horaires habituels de la semaine ». Sous-dossier `planning/` :
  ne reste que `AbsenceDialog` (Modal : motif `SelectField` + plage Du / Au +
  Alert de conflit si RDV déjà pris sur la période + lien — consommé par l'agenda
  de `RendezVous.tsx`),
  `Stock` (shell client de l'écran /stock : filtre salon `useLocation` +
  `SegmentedControl`, liste toujours montée + fiche produit en **panneau
  latéral droit** superposée par-dessus quand `view.kind === "detail"` (plus
  de bascule plein écran depuis le 2026-09-21), état de session
  `extraMovements` (ajustements + transferts) + `thresholds`
  (`ThresholdOverride` : seuils salon / entreprise édités) + `photos`
  (`Record<productId, dataURL>`), bandeau d'alerte **à deux niveaux** — « à
  commander » (total entreprise sous le seuil, scope « all ») ou « à
  réapprovisionner à <salon> » (salon sous son seuil) —, lit `?produit=<id>`
  (`useSearchParams`) pour ouvrir la fiche produit au montage (deep-link
  depuis une notification stock) — fixtures `@/lib/mock/stock`) ;
  sous-dossier `stock/` : `StockList` (**grille de cartes produit**,
  réduite le 2026-09-28 (skill `impeccable`, demande de la propriétaire) à
  **photo + nom + quantité + statut** — plus de marque, réserve, seuil,
  conso/sem ni sparkline (`Sparkline.tsx` supprimé). Photo = photo de session
  (prop `photos` de `Stock`) sinon `Product.image`, repli `BoxIcon`. Statut =
  pastille + phrase : « N jours de stock » (rouge < 7 j, orange < 14 j),
  « En rupture », « Sous le seuil », « Aucune sortie récente », « Jamais
  inventorié ». Filtres Tous / Sous le seuil / À commander + marque +
  recherche conservés ; le détail reste dans la fiche au clic),
  `StockDetail` (**refonte 2026-09-28, passe `impeccable`, disposition « état
  d'abord »** — panneau `max-w-6xl` : en-tête photo 112px + marque · gamme · prix
  + stock entreprise et couverture ; bandeau **Réapprovisionnement** (verdict
  « Commander N unités avant le … » / « Rien à commander », rupture estimée,
  date limite, rythme retenu) ; **Où est le stock** (une barre par emplacement
  sur une échelle commune, repère au seuil, seuils éditables, ligne total) ;
  puis 2 colonnes — courbe + Consommation (sorties + recettes) | Mouvement
  (Ajuster / Transférer en bascule) + Derniers mouvements. Les quantités de
  stock sont des unités, plus affichées en `defaultUnit` (ml = unité de
  recette). Ce qui suit est l'ancienne description :
  fiche produit présentée en **panneau latéral droit** via
  `detail/DetailModal` (converti depuis une page unique déroulante avec
  `BackButton` le 2026-09-21, voir « Fiches en panneau latéral » plus bas) ;
  en-tête = photo (import fonctionnel `FileReader` → dataURL de session, `next/image`
  + placeholder `BoxIcon`) + stock entreprise + badge couverture ; sections :
  **Niveaux & seuils** (réserve centrale + salons, seuils salon / entreprise
  éditables en ligne via `ThresholdInput` — `key={value}`, commit au blur, pas
  d'effet), **Ajuster ou transférer** (`AdjustForm` : emplacement incl. réserve,
  inventaire / réception / casse ; `TransferForm` : réserve → salon = 2
  mouvements `transfer`), **Évolution du stock** (`StockLevelChart`), **Répartition
  de la consommation** (2 barres `ConsoBar` ventes vs prestations, honore le
  filtre salon global) + alerte « recette à jour ? », **Utilisé dans ces
  prestations** (`prestationsUsing` : liste complète + quantité/visite + lien
  `/services`), **Projection de rupture — Beauty & Co** (niveau entreprise,
  sélecteur de modèle, alerte « indicative » si < 4 sem.), **Journal des
  mouvements** (12 derniers, tous emplacements, `locationName`)),
  `StockLevelChart` (ApexCharts `dynamic` ssr:false, aire ; bascule Total /
  Détaillé = aires empilées réserve vs salons ; style calqué sur `TrendChart` —
  `#886666` / `#dcb0aa`, police Poppins ; `history` = `levelHistory`),
  `ui` (`BackButton` + réexport `../fidelite/ui`),
  `Salons` (shell client de l'écran /salons, **non** filtré par le salon global :
  vues liste / fiche / nouveau, `salonConfigs` + `salonClosures` en état de
  session — fixtures `@/lib/mock/beautyandco`) ; sous-dossier `salons/` :
  `SalonsList` (carte par salon : capacité détaillée, badge Ouvert / Fermé
  aujourd'hui / Inactif, prochaine fermeture + « Ajouter un salon »), `SalonDetail`
  (fiche : Identité + Toggle actif (refus de désactiver le dernier salon actif),
  Postes par type + total, Heures (`HoursEditor`), Fermetures exceptionnelles
  (liste + formulaire plage / motif / portée, fermetures « réseau » non
  supprimables ici), miroir lecture seule « N sur M prestations proposées ici »
  → lien `/services`), `HoursEditor` (éditeur 7 jours : Toggle ouvert / fermé +
  heures (plus de coupure depuis le 2026-09-28), `dayHasError` / `hoursHaveError` avec message inline, partagé
  fiche + création), `SalonForm` (création : Identité + Postes + Heures, id
  généré, state only), `ui` (`BackButton`, `timeFieldClass` + dérivés locaux
  `salonOpenState` / `nextClosure` / `posteSummary` / `posteCount`).
- `back-office/shared/` (compléments 2026-09-28, voir « RDV et clientèle repris de
  point-de-vente » en bas de fichier) — `board` (`Legend`, `Board`, `BoardEmpty`,
  `ChipFilter` : primitives « Le Tableau » de point-de-vente), `ClientAdvantages`
  (abonnements / packs / carte cadeau d'une cliente : `AbonnementsPacksBoard`,
  `AvantageChip`, `rdvCoverage`), `BirthdaySelect` (anniversaire jour + mois). `PointageCells` (2026-10-01 —
  `ArrivalValue`, `DepartureValue`, `PointageFigure`, `PointageSummaryBar` :
  lecture d'un pointage, partagée par `equipe/MemberPresencePanel` et
  `equipe/PointageLog`).
  `rendezvous/DayList` et `rendezvous/ReservationCalendar` (vues Liste /
  Calendrier de `/rendez-vous`) remplacent `rendezvous/ListView` (supprimé) ;
  `rendezvous/RescheduleRdvDialog` (2026-10-02) remplace `EditRdvDialog`
  (supprimé), voir « Reprogrammer un rendez-vous » en bas de fichier ;
  `ClientRowActions` et `shared/ClientPreferencesView` supprimés.
- `back-office/shared/EmailPreview.tsx` (2026-10-05) — aperçu d'un email
  (wordmark, objet, corps `markdownToHtml`, pied « site web ») ; `variables`
  remplace les `{{jetons}}` (valeur surlignée, jeton sans valeur en pastille),
  `lineBreaks` garde les retours à la ligne. Utilisé par
  `messagerie/EnvoyerMessage` et `reglages/emails/TemplateEditorPanel`.
- `back-office/shared/SalonFilter.tsx` (2026-10-02) — **le** filtre salon global
  de tous les écrans (bandeaux d'Accueil, Rendez-vous, Clients, Services, Stock,
  Journal, Rapports, Satisfaction, Équipe › Pointage, Planning, Horaires). Jusqu'à
  2 salons : la bascule `SegmentedControl` habituelle ; à partir de 3 : bouton +
  menu à cases (Radix) — « Tous les salons », raccourcis **par ville**
  (`salonIdsOfCity`), puis les salons un par un ; menu ouvert pendant qu'on
  coche, le dernier salon coché ne se décoche pas. Voir « Filtre salon
  multi-sélection » en bas de fichier.
- `back-office/shared/` (compléments 2026-09-27) — `CategoryThumb` (image d'une
  catégorie, chemin `public/` ou dataURL, sinon pastille à l'initiale — plus de
  pictogramme prédéfini ; consommé par `services/CategoryColumn`,
  `salons/SalonDetail`, `fidelite/PrestationPicker`), `ImagePicker` (import d'une
  image unique par `FileReader` → dataURL de session : aperçu + Importer /
  Remplacer / Retirer ; image de catégorie dans `services/ServiceInfoForm`,
  photo de boisson, photo d'option de préférence), `ClientPreferencesView`
  (préférences d'une cliente en lecture seule, grammaire de la fiche
  point-de-vente : par domaine, réponses en pastilles photo, « ×N », dernière
  réponse en `highlight-rose`, note libre ; utilisé par `ClientDetailModal`).
  `ClientEditDialogs.EditPreferencesDialog` réécrit sur les questions
  configurées (onglets de domaine, tuiles à cocher, note libre, cheveux / réf.
  couleur ; réponses modifiées = nouveau passage daté).
- `prise-rdv/` (2026-09-28) — **parcours « Nouveau rendez-vous » copié tel
  quel de point-de-vente** (`components/prise-rdv/`, lui-même le site b&co) :
  grand dialogue mis à l'échelle, étapes Clientes → Services → Créneau →
  Confirmation, dialogues nombre de personnes / prestations déjà payées / pack /
  acompte / quitter / confirmé, CSS `.bco` et polices propres. Seuls écarts :
  `prise-rdv-modal.tsx` lit `ClientsContext`, `@/lib/mock/abonnements` et rend un
  `RdvDetail` via `onCreate` (à la fermeture de « Rendez-vous confirmé ! ») ;
  pas de mode « Modifier » (→ `rendezvous/EditRdvDialog`) ; bouton « Encaisser
  maintenant » retiré de `steps/confirmation-step.tsx` ; `booking-calendar`
  ancré sur `TODAY_ISO`. Monté par `RendezVous.tsx` (`?nouveau=1`, `?client=`
  → payeuse pré-remplie). Remplace `rendezvous/BookingDialog.tsx`, supprimé —
  les mentions de `BookingDialog` plus haut sont historiques.
- `shared/` — composants transverses réutilisés par plusieurs écrans (pas liés
  à un seul module `back-office/<écran>/`) : `PersonCard` (ligne compacte
  avatar initiales + nom + méta + badge — initiales sur fond `brand-50` /
  texte `brand-700`, jamais la palette arc-en-ciel d'`ui/avatar/AvatarText`,
  hors charte ; export `initialsOf`), `ClientSearchField` (menu contextuel de
  recherche cliente, inspiré de point-de-vente — combobox maison sans cmdk ni
  Radix : trigger + popover positionné dessous, filtrage synchrone nom/téléphone
  sans debounce sur `clients(scope)`, résultats en `PersonCard` cliquables,
  navigation clavier ↑/↓/Entrée/Échap, item de création à la volée toujours
  visible en pied de liste — retourne un `ClientPick` = cliente existante ou
  brouillon `{ name, phone }` ; consommé par `rendezvous/BookingDialog.tsx`).
- `ui/atoms/` + `ui/molecules/` (2026-09-27) — **composants de
  point-de-vente copiés tels quels** (mêmes chemins d'import qu'là-bas, voir
  « Reprise du design system point-de-vente » en bas de fichier). Atomes :
  `avatar`, `badge` (tons soft daisyUI + point de statut, paliers de fidélité),
  `button` (`Button` + `buttonVariants` cva, daisyUI `btn`), `card`,
  `checkbox`, `field-label`, `icon-button` (+ `CloseButton`), `progress-bar`,
  `search-input`, `select` (Radix ; + prop `aria-label` ajoutée le 2026-09-28), `separator`, `skeleton`, `spinner`,
  `switch` (Radix), `text-input`, `textarea`, `tooltip`. Molécules : `alert`,
  `confirm-dialog`, `dialog` (Radix — variantes center / sheet / side ; **écart
  back-office** : fermable par Échap / clic extérieur dès qu'on lui passe
  `onClose`, quelle que soit la variante), `dropdown-menu` (Radix),
  `date-picker` (2026-09-27, calendrier mensuel en popover Radix, copié pour
  le `PeriodNav` du Planning d'Équipe),
  `empty-state`, `field`, `person-card`, `pills`, `popover`, `radio-group`,
  `segmented-toggle` (+ prop `aria-label` ajoutée), `stat-tile`, `tabs`,
  `toast`. **À utiliser directement dans tout nouveau code.**
- `ui/` (anciennes primitives TailAdmin, API conservée) — `alert/Alert`,
  `badge/Badge`, `button/Button`, `modal` (`Modal`), `segmented/
  SegmentedControl` sont désormais de **fines enveloppes** des composants
  ci-dessus (Alert → `molecules/alert`, Badge → `atoms/badge`, Button →
  `atoms/button`, Modal → `molecules/dialog`, SegmentedControl →
  `molecules/segmented-toggle` ; `variant="tinted"` = taille compacte
  d'en-tête), gardées pour leurs ~40 consommateurs. `dropdown/` (menu maison,
  clic extérieur à la main) garde sa logique mais porte l'habillage du popover
  de point-de-vente — pas converti en Radix : PeriodFilter / JournalPeriodPicker
  y montent un calendrier flatpickr attaché au `<body>`. `avatar/`, `images/`,
  `table/` : inchangés.
  + `rating/RatingStars` (note en étoiles, remplissage partiel pour les moyennes —
  représentation unique de la note)
- `form/` — contrôles de formulaire réellement utilisés : `Label`, `Select`,
  `switch/Switch`, `input/{InputField,TextArea,Checkbox,Radio}` (consommés par
  `auth/`, `ReportBuilderPanel`, la vitrine `design-system`)
- `auth/` — formulaires FR / light : `SignInForm` (**2026-09-28 : copie de
  l'écran de verrouillage de point-de-vente** `components/shell/lock-screen.tsx`
  — photo `public/images/connexion/lock-screen-spa.jpg` plein écran, logo
  aquarelle en haut à gauche, carte blanche à droite ; sans choix de ville
  Dakar / Abidjan ni fond de caisse ; « Mot de passe oublié ? » →
  `/forgot-password` ; `router.replace("/")` au submit),
  `ForgotPasswordForm` (saisie e-mail → écran « Vérifiez votre boîte mail » en
  état local), `ResetPasswordForm` (nouveau mot de passe + confirmation →
  `/signin`). Chaque écran porte le logo B&C.
- `header/` — `UserDropdown` (menu compte, `DropdownMenu` Radix de
  point-de-vente depuis le 2026-09-27 — pastille statique au rendu serveur,
  menu Radix une fois hydraté (l'id `useId` du déclencheur ne coïncidait pas
  SSR/client) ; nom + photo lus depuis
  `useAccount()` (photo repliée sur les initiales si `avatarUrl` vide, 2026-09-22
  — `avatarUrl` n'a plus de valeur par défaut factice) ; « Mon compte » → `/compte`, « Se déconnecter » → `/signin`). Plus de cloche de notifications
  (`NotificationDropdown`, supprimé 2026-09-14) : le bloc notifications vit sur
  le tableau de bord, voir `back-office/dashboard/NotificationsPanel`.
  **Pas** de `SalonSwitcher` : le filtre salon global est le `SegmentedControl`
  que chaque écran monte lui-même via `useLocation()`.
- `common/` — `ComponentCard`, `GridShape` (utilisés par `design-system` et les
  pages hors shell), `ThemeToggleButton` (vitrine `design-system` uniquement)

### `src/context/`

- `ThemeContext.tsx` — thème clair/sombre (`useTheme`) — **utilisé uniquement par
  la vitrine `design-system`** (elle a sa propre bascule). Retiré du root layout
  et des pages `(auth)`. L'UI produit est light, sans provider de thème.
- `SidebarContext.tsx` — état sidebar : `isExpanded`, `isHovered`, `isMobileOpen` (`useSidebar`)
- `LocationContext.tsx` — filtre salon global (`useLocation` → `scope` / `setScope`),
  persisté en `localStorage` (« all » ou ids séparés par des virgules,
  normalisés par `scopeFromIds`), fourni par `(admin)/layout.tsx`
- `NotificationsContext.tsx` — notifications + état lu/non-lu (`useNotifications` →
  `notifications` / `markRead` / `markAllRead` / `unreadCount`), état de session
  (PAS de persistance), fourni par `(admin)/layout.tsx`. Fusionne les seeds
  `@/lib/mock/notifications` avec `requestNotifications(staffRequests)` de
  `@/lib/mock/rh`
- `AccountContext.tsx` — compte de la propriétaire (`useAccount` → `account` /
  `updateAccount(patch)`), état de session (PAS de persistance), fourni par
  `(admin)/layout.tsx`. Source de vérité unique pour son identité (nom, photo,
  email) : partagée entre `/compte` et le menu compte du header (changer son nom
  se voit tout de suite dans le header)
- `PlanningContext.tsx` (2026-09-21) — présence de l'équipe (`usePlanningData` →
  `absences` / `overrides` / `data: PlanningData` / `addAbsence`), état de
  session (PAS de persistance), fourni par `(admin)/layout.tsx`. Lève
  `absences`/`shiftOverrides` (auparavant état local à `Equipe.tsx`) en source
  unique : l'action rapide « Marquer absente aujourd'hui » de l'agenda
  `/rendez-vous` (voir « Refonte fonctionnelle RDV/Planning » plus bas) et
  l'onglet Planning de `/equipe` lisent et modifient la même donnée — poser une
  absence depuis l'un se voit immédiatement dans l'autre
  **2026-09-28** : + `baseHours` / `setBaseHours` (horaires habituels modifiés
  depuis l'éditeur, par membre — inclus dans `data.baseHours`) ; `data` mémoïsé.
- `AutorisationsContext.tsx` (2026-09-27) — autorisations par rôle
  (`useAutorisations` → `autorisations` / `setRoleCapability` (cascade
  `applyCapability`) / `resetRole`), état de session, fourni par
  `(admin)/layout.tsx`. Écrit par Réglages › Autorisations, lu par la fiche
  membre d'Équipe — levé hors de `Equipe.tsx` quand la matrice a changé
  d'écran.
- `FideliteContext.tsx` (2026-09-27) — configuration fidélité et offres
  (`useFideliteConfig` → `settings` / `tiers` / `rewards` / `forfaits` /
  `packs` + setters), état de session, fourni par `(admin)/layout.tsx`.
  Écrit par Réglages (Programme de fidélité, Forfaits & packs), lu par
  `/fidelite` (souscrire un forfait, vendre un pack).
- `PreferencesContext.tsx` (2026-09-27) — configuration des préférences
  clientes (`usePreferenceConfig` → `questions` / `upsertQuestion` /
  `deleteQuestion` / `moveQuestion`), état de session, fourni par
  `(admin)/layout.tsx`. Écrit par `reglages/PreferencesConfigPanel`, lu par
  `ClientDetailModal` (`shared/ClientPreferencesView`), `EditPreferencesDialog`
  et `RendezVousDetail`.
- `ClientsContext.tsx` (2026-09-22 ; **2026-09-27** : `updatePreferences(id,
  prefs)` remplace les préférences entières au format `ClientPreferences` de
  `@/lib/mock/preferences`, notes internes initialisées depuis
  `CLIENT_NOTE_SEEDS`) — overlay de session sur la clientèle
  (`useClientsData` → `rows(scope)` / `getDetail(id)` / `notesFor(id)` /
  `updateCoordonnees` / `updatePreferences` / `addNote` / `createClient`), état
  de session (PAS de persistance), fourni par `(admin)/layout.tsx`. Comble un
  manque repéré par comparaison avec point-de-vente (`NewClientDialog`,
  `EditCoordonneesDialog`, `EditPreferencesDialog`, notes internes de
  `fiche-cliente-view.tsx`) : `clients()`/`clientDetail()` de
  `@/lib/mock/beautyandco` restent des dérivations pures des seeds, cette
  couche ajoute par-dessus coordonnées éditées, préférences éditées, notes
  internes et clientes créées en session, sans toucher au module mock lui-même.
  `getDetail(id)` résout aussi bien une fiche seed qu'une fiche créée cette
  session — consommé par `ClientDetailRoute` pour que les deux routes
  `/clients/[id]` (dédiée + interceptée) restent valides pour une cliente
  fraîchement créée.

### `src/layout/`

- `AppSidebar.tsx` — sidebar du Figma « Point de vente » **node `381:497`**
  (remise le 2026-09-27 sur demande explicite, après un bref passage au rail
  104px de point-de-vente) : 260px fixe, **toujours dépliée** (plus de repli
  80px ni de survol, plus de `useSidebar`), fond blanc, bordure droite +
  séparateur sous le logo `#efe9e8`, wordmark `public/images/logo/
  beautyandco-wordmark.svg` 95×44 centré (le placeholder texte du Figma est
  rendu par le vrai wordmark), liens `px-4 py-3 gap-3 rounded-lg` pleine
  largeur (harmonisés le 2026-09-28 : tous de la même taille), icône 18px + libellé Poppins Medium 16px, inactif `#6a6060`, actif
  pastille pleine `bg-primary` (#886666) texte blanc. Nav FR (`menuItems`,
  8 modules à plat — Stock retiré le 2026-09-27, atteignable via
  `dashboard/AccesRapides` ; Rapports / Satisfaction / Journal / Salons retirés
  le 2026-09-21, voir « Simplification de la sidebar »), icônes `lucide-react`
  (`LayoutDashboard`, `CalendarCheck2`, `MessageCircle`, `FileUser`,
  `UserRoundGroup`, `Sparkles`, `Gift`, `Settings`). `isActive` en match
  préfixe. Pas de bloc utilisateur ni de filtre salon ici. Miroir :
  `ml-[260px] min-w-0` sur la colonne de contenu de `(admin)/layout.tsx`
  (`min-w-0` indispensable : sans lui le tableau Kanban de `/services`
  élargit toute la page).
- `AppHeader.tsx` — **supprimé le 2026-09-28** : plus de barre du haut. Le
  menu compte (`header/UserDropdown` — avatar, nom, rôle, menu ouvert vers le
  haut) est en pied de `AppSidebar`, sous un filet `#efe9e8`.
- `Backdrop.tsx` — overlay mobile (plus monté par `(admin)/layout.tsx` depuis
  le 2026-09-27, sidebar fixe — fichier conservé)

### `src/lib/prise-rdv/` (2026-09-28)

Copie de `point-de-vente/lib/prise-rdv/` (catalogue `data/booking-services.ts`,
ids identiques à `@/lib/mock/services`, panier, packs, boissons, boutique,
questions…), sauf : `planifier.ts` **réécrit** sur le back-office (même
algorithme — personnes en parallèle, moins chargée d'abord, choix manuel parmi
les libres ; compétences `canPerform`, présence `coversWindow` + planning live,
heures `salonConfig`, occupation = `RdvDetail` de session ; une praticienne =
son nom complet ; `DEMO_TODAY_ISO` ; `planAt(…, preferredStaffId?)` pose d'abord
la praticienne du créneau cliqué au Planning si elle est libre), `clientes.ts` (nouveau — adaptateur
`ClientRow` → `Cliente` du parcours), `data/forfaits.ts` non repris (inutilisé).

### `src/lib/mock/` — couche de données fictives (front-end only)

Plus de barrel : chaque fichier s'importe en direct (`@/lib/mock/<domaine>`). Le
type partagé `Kpi` (cartes `StatCards`) vit dans `beautyandco.ts`. Anciens
fichiers template supprimés : `index.ts`, `types.ts`, `customers.ts`,
`products.ts`, `orders.ts`, `finance.ts`, `team.ts`, `analytics.ts`, `system.ts`.

- `beautyandco.ts` — fixtures BeautyAndCo (salons Dakar, FCFA). **Indépendant du
  barrel** : importer directement `@/lib/mock/beautyandco`. Inclut `satisfaction(scope,
  fenêtre)` (avis clients → note moyenne + tendance, répartition, note par
  collaboratrice, commentaires), `staffSatisfaction(prénom, fenêtre = "90")`
  (satisfaction d'une seule collaboratrice — mêmes avis filtrés par prénom : note
  moyenne + tendance + `lowSample` sous 4 avis + commentaires ; pour le bloc
  « Activité » de la fiche membre), `buildReport({ scope, période, group, metrics })`
  (rapport paramétrable : `REPORT_METRICS` — CA, acomptes, visites, panier moyen,
  annulations, absences, satisfaction, points fidélité, chacun avec les axes où il
  a un sens — et `REPORT_GROUPS` — salon / praticien / prestation / client /
  période ; renvoie colonnes retenues + `droppedMetrics` + lignes + ligne Total,
  colonnes additives réconciliées), `clients(scope)` / `clientDetail(id)`
  (clientèle : lignes triables — nom, email, téléphone, dernière visite, total
  dépensé, RDV honorés, points fidélité — dérivées de la liste de visites de
  chaque cliente ; `segment` active / occasionnelle / à relancer pour le filtre ;
  chaque ligne porte aussi `gender` / `address` — issus de la table à part
  `CLIENT_PROFILES` (genre, adresse, préférences), défauts si absent ;
  `clientDetail` ajoute `preferences` (modèle de point-de-vente depuis le
  2026-09-27 — `ClientPreferences` de `./preferences` : note libre par domaine +
  passages de réponses + type de cheveux / réf. couleur ; les anciennes
  consignes « Général » sont devenues des notes internes seed,
  `CLIENT_NOTE_SEEDS`, reprises par `ClientsContext`), `stats` (`ClientVisitStats` : total +
  répartition honoré / à venir / annulé), rendez-vous à venir + historique) et
  les helpers `frShortDate`, `frLongDate` (« 12 août 2026 »), `genderLabel`,
  `clientNoun` (« cliente » / « client »), `groupThousands`.
  **Configuration des salons** (section dédiée) : `Weekday` / `WEEKDAYS` /
  `WEEKDAY_LABELS` ; `PosteType` (`coiffure` / `esthetique` / `onglerie`) /
  `POSTE_TYPES` / `POSTE_TYPE_LABELS` ; `DayOpening` (fermé, ou ouvert d'un seul tenant — les
  coupures n'existent pas, retirées le 2026-09-28 ; trame par défaut mar–dim
  10:00–20:00, **lundi fermé**) ; `SalonConfig` (identité — dont `city: SalonCity`, « Dakar » ou « Abidjan »,
  `SALON_CITIES` / `SALON_CITY_OPTIONS`, menu « Ville » de la fiche et de la
  création depuis le 2026-10-02, remplace le champ libre « Quartier » —, `active`, `postes: Partial<Record<
  PosteType, number>>` — capacité par type, `hours: Record<Weekday, DayOpening>`) ;
  `salonConfigs`, `salonConfig(id)`, `posteCapacity(id)` ; `SalonClosure` +
  `salonClosures` (fermetures exceptionnelles, `scope` salon ou `"all"`) +
  `closuresFor(scope, iso)` + `isClosed(id, iso)`. Plus de `stockAlert` /
  `lowStockItems` (bandeau dédié retiré du tableau de bord le 2026-09-14, le
  stock bas est signalé par la notif `stock` de `notifications.ts`, ton
  `warning`, remontée dans le rail « À traiter »).
- `rendezvous.ts` — **2026-09-27 : seeds = les réservations de point-de-vente**
  (`PDV_RESERVATIONS`, recalées par `fitPdvSeeds` sur l'équipe du back-office —
  voir « Rendez-vous repris de point-de-vente » en bas de fichier ; seuls
  `rdv-2375` / `rdv-3006` (annulés) restent des anciens seeds, `rdv-300x` /
  `rdv-24xx` n'existent plus). Fixtures des rendez-vous (`RdvDetail` : statut `à venir` /
  `terminé` / `annulé` / `absence` — **pas d'étape de confirmation** : un RDV
  réservé est « à venir » —, `client` (le payeur), `prestations`
  (`RdvPrestation` : `prestationId` (id catalogue), catégorie, `posteType`
  (dérivé de la catégorie), prix FCFA, durée, `staff: string | null` (null = à
  affecter), `requestedStaff?` (praticienne demandée par la cliente sur le
  site) ; **2026-09-21**, extension additive pour la parité fonctionnelle avec
  point-de-vente (voir « Refonte fonctionnelle RDV/Planning » plus bas) —
  `secondStaff?` (2ᵉ praticienne, prestation « à deux », jamais divisée
  automatiquement), `start` (« HH:MM » explicite par prestation — remplace le
  chaînage implicite d'avant, permet des bénéficiaires en parallèle sur des
  lignes différentes), `beneficiaryName` (qui reçoit la prestation — le payeur
  par défaut, une autre personne sinon) + `beneficiaryClientId?`),
  `extras?: RdvExtra[]` (boissons/produits pré-commandés, `{ kind, productId,
  qty }` — ajoutés seulement à la création, jamais réédités ensuite, comme côté
  point-de-vente), `cancelReason?` (motif libre saisi à l'annulation),
  `questions`, `advantages` (`RdvAdvantage` — `{ kind: "abonnement"; abonnementId }`
  / `{ kind: "pack"; packPurchaseId }` référencent des instances de
  `@/lib/mock/abonnements`, résolus à l'affichage par `RendezVousDetail` ; la
  variante `carte-cadeau` reste autonome, hors spec — au niveau du RDV entier,
  pas par bénéficiaire), `events` (timeline)).
  **Pas de champ
  `deposit`** : l'acompte est le même pour toutes (réglé dans `paiement.ts`), il
  n'est pas suivi RDV par RDV.
  **Indépendant du barrel** : importer directement `@/lib/mock/rendezvous`.
  Expose `rendezvousList(scope)` / `rendezvousRows(list, scope)` / `rdvToRow`,
  `allRendezvous()` (RdvDetail bruts), `rendezvousDetail(id)`,
  `nextRendezvousId(scope)`, `newRdvId()`, `staffBySalon`, `RDV_STATUS_META`,
  `advantageLabel`, `posteTypeForCategory`, les dérivés `rdvTotal` (+ extras,
  via `extraPrice`) / `rdvDuration` / `rdvEnd` (amplitude min(start)→max(start+
  durée) sur toutes les prestations, plus une simple somme — des bénéficiaires
  en parallèle n'ont plus la même fin), `needsAssign` (+ `RdvRow.cancelled`,
  `RdvRow.beneficiaryCount` / `composition` — « N personnes » si >1),
  `rdvCountByStaffDay(scope)` (→ `{ date, staffFirstName, count }[]`, compte
  `staff` ET `secondStaff` — consommé par l'écran Planning, matching par
  prénom), `prestationSlots(r)` (→ `{ prestation, start, end }[]`, lit
  directement `RdvPrestation.start` — positionne chaque prestation sur la
  ligne de SA praticienne dans `rendezvous/DayTimeline.tsx`, bénéficiaires en
  parallèle inclus), `timeToMinutes` / `minutesToTime`, `staffBusyWindows(list,
  staffName, iso, excludeRdvId?)` / `isStaffFreeForWindow(...)` (2026-09-21 —
  vérifient TOUTE la fenêtre d'une prestation pour une praticienne nommément
  choisie, pas seulement l'instant de départ ; consommés par `BookingDialog` et
  `rendezvous/EditRdvDialog.tsx`), et les helpers de format
  `frLongDate` / `frFullDate` / `frDateTime` / `durationLabel`
  (+ réexport `fcfa` / `groupThousands`, `type PosteType`)
- `staff.ts` — **2026-09-28 : l'équipe = celle de point-de-vente**
  (`lib/data/praticiennes.ts`) — Bineta, Fatou, Michelle (coiffeuses), Henry
  (coiffeur, `gender: "m"`), Gnagna, Marie Dominique, Adja (esthéticiennes),
  Aïssatou (rôle `menage`, nouveau, hors matrice d'autorisations), Ndiole
  (accueil → rôle `caisse`) + Rokhaya Diallo (manager, gardée — pas
  d'équivalent côté caisse). Prénom seul (`lastName: ""`, nom facultatif dans le
  formulaire), `photo` (`public/images/equipe/`), horaires hebdomadaires de
  point-de-vente (Henry : le mardi à cheval sur deux salons → Almadies, sans
  coupure ; journées du lundi retirées, salons fermés ce jour-là). Compétences reprises de l'ancienne équipe par métier
  (Sophie → Fatou, Mariama → Michelle, Aïda → Henry, Bineta Cissé → Gnagna,
  Coumba → Adja, Awa Diagne → Ndiole — ids et noms réécrits dans `rh.ts`,
  `journal.ts`, `planning.ts`, `beautyandco.ts`, `rendezvous.ts`,
  `notifications.ts`). Helpers `initials` (mots du nom complet) et
  `memberCategoryLabel` (métier accordé au genre). Le texte qui suit décrit
  l'ancienne équipe.
- `staff.ts` — fixtures Équipe. **Indépendant du barrel** : importer directement
  `@/lib/mock/staff`. `Member` : identité, `roles: StaffRole[]` (`praticienne` /
  `caisse` / `manager`), `category` (`coiffure` / `esthetique` / `staff`),
  `account` (`active` / `invited` / `none`), `active`, `skills` (ids
  de prestations), `baseHours: Record<Weekday, DayShift>` (horaires habituels,
  trame de référence du Planning). **Pas de salon de rattachement** : une
  personne n'est pas fixée à un salon — `DayShift` (cas `off: false`) porte son
  propre `salonId`, le planning peut l'envoyer à Almadies un jour et à Sea
  Plaza le lendemain (cf. `presenceFor` dans `@/lib/mock/planning`, qui lit ce
  `salonId` jour par jour). 7 membres (5 praticiennes canon + caisse +
  manager) — Rokhaya (manager) alterne les salons en semaine, exemple de
  rotation. Expose `members`, `ROLE_LABELS` / `CATEGORY_LABELS` / `ACCOUNT_LABELS`
  (+ `ROLE_OPTIONS` / `CATEGORY_OPTIONS`), et les helpers `fullName`, `initials`,
  `memberById`, `canPerform(memberId, prestationId)`,
  `membersForPrestation(prestationId)` (actives + praticiennes + compétentes,
  tous salons confondus — la présence un jour/salon donné se vérifie via
  `presentPractitionersForPrestation` de `@/lib/mock/planning`), `newStaffId`
- `preferences.ts` (2026-09-27, **refondu 2026-09-28**) — préférences
  clientes, modèle de point-de-vente (`lib/data/notation.ts` +
  `Cliente.preferenceNotes` / `notationRounds`, ADR 0035) mais **défini ici**.
  Plus de 5 domaines fixes : `PreferenceQuestion.target: PreferenceTarget`
  (toute réponse porte une photo — pour la démo, les 5 photos d'onglerie en
  boucle ; `serviceIds` = catégories entières, `prestationIds` = prestations précises,
  `drinks` = boissons du bar ; `EMPTY_TARGET`, `targetIsEmpty`, `BAR_RUBRIC`),
  + `title`, `subtitle`, `noteLabel`, `multiple`, `askedAtCounter`, `active`,
  `options` (`label` / `hint?` / `photo?`). `preferenceQuestionSeeds` (les 10
  questions de point-de-vente avec leurs cibles — ex. « Quel soin ? » seulement
  après les rituels soins / head spa), `NotationRound`, `ClientPreferences`
  (`notes` **par rubrique** = id de catégorie ou `"bar"`, `rounds`, `hairType?`,
  `colorReference?`), `EMPTY_CLIENT_PREFERENCES`, `notationTally(prefs,
  questions)` / `takenOptions` / `latestChoices`, `newPrefId`. N'importe rien
  (cycle `beautyandco` ↔ `services` sinon) — le lien au catalogue est dans :
- `preference-targets.ts` (2026-09-28) — préférences × catalogue :
  `PREFERENCE_RUBRICS` (catégories de `services.ts` dans l'ordre + Boissons),
  `rubricOf(q)` (rubrique de la fiche = 1ʳᵉ catégorie entière, sinon catégorie
  de la 1ʳᵉ prestation, sinon bar), `rubricLabel`, `askedAfterPrestation`,
  `touchesRubric`, `targetParts` (lecture « Onglerie · toute la catégorie »),
  `rubricsWithoutQuestion`, `prestationsOf` / `catalogServices`,
  `readingByRubric` (fiche cliente), `preferenceLines` / `hasPreferences` (fiche
  RDV). Lit les seeds du catalogue, pas l'état de session de `/services`.
- `staff-colors.ts` (2026-09-21) — palette d'accent par praticienne : un
  identifiant visuel (pas la couleur de marque `brand-*`) pour repérer une même
  personne d'un coup d'œil sur l'onglet Planning d'Équipe et l'Agenda de
  `/rendez-vous`. **Indépendant du barrel**, n'importe que `members` de
  `./staff`. 8 teintes saturées distinctes (rouge/sarcelle/bleu/ambre/violet/
  rose/vert/ardoise), assignées par **position** dans l'équipe planifiable
  (praticiennes actives, ordre de `staff.ts`) — pas par hash du nom, pour
  rester stable et sans collision entre voisines de liste. Expose `StaffAccent`
  (`{ bg, border, text, dot }`), `staffAccent(index)`, `accentForMemberId(id)`,
  `accentForStaffName(name)` (résout par nom complet — `RdvPrestation.staff` ne
  référence qu'un nom — `null` → ton warning « à affecter »)
- `autorisations.ts` — fixtures des autorisations par rôle (ce que
  Praticienne / Caisse / Manager ont le droit de faire). **Indépendant du
  barrel** : importer directement `@/lib/mock/autorisations` ; n'importe que
  `ROLE_LABELS` / `type StaffRole` de `./staff`. `Capability` (23 clés en
  7 domaines : rendez-vous, encaissements, clients, équipe & planning,
  catalogue, stock, pilotage & configuration), `CapabilityDef` (`label`,
  `hint?`, `sensitive?`, `requires?` = prérequis), `CapabilityGroup`,
  `RolePolicy` = `Record<Capability, boolean>`, `Autorisations` =
  `Record<StaffRole, RolePolicy>`. Expose `CAPABILITY_GROUPS`,
  `ALL_CAPABILITIES`, `ROLE_COLUMNS` (ordre praticienne / caisse / manager),
  `defaultAutorisations` (presets : praticienne = consultation seule ; caisse =
  journée + encaissement ; **manager = tout sauf `paiement.remiseLibre`,
  `services.pricing`, `services.recipe`, `config.paiement`**), et les helpers
  `roleCan`, `capabilitiesForRoles(roles, a)` (union), `roleGrantedCount`,
  `roleDiffersFromDefault`, `applyCapability(policy, cap, value)` (propage la
  cascade `requires` dans les deux sens), `roleLabel`. Aucune application réelle
  ailleurs dans l'app (squelette front-end mono-utilisateur).
- `planning.ts` — fixtures Planning : présence de l'équipe (pas les RDV).
  **Indépendant du barrel**, n'importe RIEN de `rendezvous.ts`. `Absence` (plage
  ISO, `type: AbsenceType` `conge` / `repos` / `maladie` / `formation`),
  `ShiftOverride` (ajustement d'horaire ponctuel, un jour), `PlanningData`
  (`{ absences, shiftOverrides }`, passé par l'écran pour l'état de session).
  Expose `absences` / `shiftOverrides` (seeds — dont une absence jeu 03/09 →
  trou de couverture réel à Sea Plaza), `ABSENCE_LABELS` / `ABSENCE_TYPE_OPTIONS`,
  `TODAY_ISO`, `PLANNING_DEFAULT_MONDAY`, `presenceFor(memberId, iso, data?)`
  (absence > override > `baseHours` — le salon du jour vient de `baseHours[jour]
  .salonId`, plus de salon « par défaut » —, recoupé avec `isClosed`),
  `weekPresence(scope, mondayIso, data?)` → `{ days, rows }` (les lignes ne sont
  pas un rattachement fixe : un membre actif apparaît dès qu'il/elle est
  présent·e au moins un jour dans le salon filtré cette semaine-là),
  `coverageGaps(scope, mondayIso,
  data?)` → `{ iso, salonId }[]`, `weekHasExceptions`, `hasNoBaseHours`,
  **présence par salon pour l'affectation RDV** : `presentPractitioners(salonId,
  iso, data?)` (praticiennes actives réellement présentes dans ce salon ce
  jour-là) et `presentPractitionersForPrestation(prestationId, salonId, iso,
  data?)` (idem + compétentes — alimente les `select` d'affectation de
  `/rendez-vous`), `weekSalonSummary(memberId, mondayIso?, data?)` (résumé
  lisible « 3j Almadies · 2j Sea Plaza », remplace l'ancien badge « salons de
  rattachement » sur la fiche membre et la liste Équipe), et les
  helpers `addDays`, `mondayOf`, `shiftRangeLabel`, `newAbsenceId`,
  `newOverrideId`. **2026-09-28** (éditeur des horaires) : `ShiftOverride.off`
  (repos exceptionnel), `PlanningData.baseHours` + `baseHoursOf(member, data)`
  (lu par `presenceFor`), `dayPlan` (présence + origine habituel / ajusté /
  absence), `sameShift`, `absenceWithout` (retire un jour d'une plage),
  `isoWeekday` exporté
- `messagerie.ts` — fixtures de la boîte de réception (conversations `sms` /
  `whatsapp` — appels et chat retirés le 2026-09-28 —, événements `ThreadEvent` datés).
  **Indépendant du barrel** : importer directement `@/lib/mock/messagerie`.
  Expose `conversations`, `smsOutboundAvailable` (panne SMS simulée), les
  dérivés `needsReply` / `failedOutbound` / `previewText` /
  `writableChannels`, et le formatage `formatListStamp` / `formatClock` /
  `formatDaySeparator` / `groupEventsByDay`. **2026-09-22** :
  `Conversation.clientId?` (référence vers `@/lib/mock/beautyandco::clients()`)
  + `conversationByClientId(clientId)`, sur le modèle de point-de-vente
  (`lib/data/conversations.ts`) — 3 fils de démo rattachés (`c-awa` → `c01`,
  `c-aicha` → `c04`, `c-marieme` → `c03`), les autres restent sans cliente
  connue (numéro seul, comme avant). **2026-09-28** : + `c-sokhna` → `c11`, `c-fatou` → `c02`,
  `c-ndeye` → `c05` ; l'en-tête du fil (`messagerie/ConversationThread`) porte
  un bouton « Voir la fiche » → `/clients/<clientId>` (panneau latéral) dès
  que `clientId` est connu
- `fidelite.ts` — fixtures du programme de fidélité (`LoyaltySettings` : base
  d'accumulation `visit` / `amount`, arrondi, points — invités, expiration,
  solde min. et multiplicateur de palier retirés le 2026-09-28 à la demande de
  la propriétaire ; `LoyaltyTier` : nom + seuil + badge ; `LoyaltyReward` : nom +
  coût points + type `fixed` / `percent` / `service` / `product` + valeur).
  **Indépendant du barrel** : importer directement `@/lib/mock/fidelite`.
  Expose `defaultSettings` / `defaultTiers` / `defaultRewards`, les listes
  d'options (`ACCRUAL_BASIS_OPTIONS`, `ROUNDING_OPTIONS`, `REWARD_TYPE_OPTIONS`)
  et les helpers `points`, `rewardValueLabel`, `rewardTypeLabel`.
  **2026-09-22** (audit de parité point-de-vente) : `defaultSettings.basis`
  passé de `"visit"` à `"amount"` + `fcfaPerPoint` de 1000 à 100 — aligné sur la
  règle réellement câblée côté point-de-vente (`confirmPayment`,
  `lib/store/app-store.ts` : 10 pts / 1.000 FCFA, jamais un réglage exposé
  là-bas). **2026-09-27** : `defaultTiers` = les 4 paliers de point-de-vente
  **Silver / Gold / Platinum / VIP** (+ `LoyaltyTier.badge` → badge métallique
  de `ui/atoms/badge`, préservé par `TiersPanel`). Avant : `defaultTiers` renommés Or/Platine/Platine plus → **Argent/Or/VIP**
  (vocabulaire aligné sur `Cliente.tier` de point-de-vente, `"silver" | "gold" |
  "vip"` — jamais calculé côté point-de-vente non plus, un champ statique de
  seed ; back-office garde son mécanisme de seuils/multiplicateur, plus riche),
  multiplicateur du palier le plus haut corrigé au passage (`10` → `250`,
  incohérent avec la progression 150/200 des paliers précédents). Résolu côté
  fiche cliente par `loyaltyTierOf()` dans `ClientDetailModal.tsx` (seuils par
  défaut uniquement, pas l'état de session édité sur `/fidelite`)
- `forfaits.ts` — définitions des **forfaits d'abonnement** (gérées par l'admin).
  Modèle contractuel repris du spec b&co (`docs/backoffice-spec.md`, hors dépôt).
  **Indépendant du barrel** : importer directement `@/lib/mock/forfaits`.
  `Forfait` : `label`, médias facultatifs, `description`, `priceFcfa` **libre**
  (jamais dérivé des prestations), `cycleLabel` / `cycleDays` (`cycleDays` pilote
  toutes les échéances), `prestationIds` (réfs `@/lib/mock/services`). Expose
  `forfaitSeeds` (3 — `eclat-mensuel`, `detente-spa`, `mains-et-pieds`),
  `CYCLE_PRESETS`, `getForfaitPrestations` (résout → nom + catégorie, **jamais**
  de prix/durée), `newForfaitId`.
- `packs.ts` — définitions des **packs prépayés** (gérées par l'admin). Idem spec.
  **Indépendant du barrel** : `@/lib/mock/packs`. `Pack` : `label`, médias,
  `description`, `prestationIds`, `priceOverrideFcfa: number | null`. Expose
  `packSeeds` (4), `PACK_DISCOUNT` (0.8) / `PACK_ROUND_TO` (500),
  `getPackPrestations` (avec prix/durée), `getPackIndividualTotal`,
  `getPackPrice` = `override ?? round(total * 0.8 / 500) * 500`, `getPackSavings`,
  `newPackId`.
- `abonnements.ts` — **instances** (`Abonnement`, `PackPurchase`) + toute la
  logique métier cycle / échéance / consommation du spec. Aucun PSP, aucun
  paiement récurrent réel — l'écran `/fidelite` crée et fait évoluer ces objets
  en mémoire de session. **Indépendant du barrel** : `@/lib/mock/abonnements` ;
  n'importe de `beautyandco` que `clients` / `groupThousands` / `type Kpi`.
  `Contact` (ContactInfo simplifié, `sex: ""` toléré), `Abonnement`
  (`forfaitId`, `clientId`, `subscriber`, `beneficiary`, `subscribedAt`,
  `lastPaidAt`, `revokedAt`, `redeemedPrestationIds`), `PackPurchase`
  (`packId`, `clientId`, `buyer`, `purchasedAt`, `redeemedPrestationIds` —
  définitif). Dates au format `yyyy-mm-dd` (`todayIso`). Expose les seeds
  (`abonnementSeeds` : 5 — dont c11 mains à jour, c01 prépayé, c05 à régler, c14
  bénéficiaire distinct, c07 révoqué ; `packPurchaseSeeds` : 4 — dont c03 1/3,
  c02 2/3, c09 neuf, c12 tout consommé), `computeNextDueDate` / `isPaymentDue` /
  `abonnementStatus` (`revoked` / `due` / `current`) + `ABONNEMENT_STATUS_META`,
  `MIN_CYCLES` / `MAX_CYCLES` / `amountDueForCycles` / `estimatePrepaidDueDate` /
  `markAbonnementPaid` (reset des prestations + `lastPaidAt = now + (cycles-1) *
  cycleDays`) / `revokeAbonnement`, `availablePrestationIds` /
  `isPrestationAvailable` / `redeemPrestations` / `packRemainingIds` /
  `packFullyUsed`, le reporting (`recurringRevenue` normalisé 30 j,
  `overdueAbonnements`, `revocationRate`, `packLiability`, `recurringRevenueKpi`),
  les résolveurs (`forfaitById`, `packById`, …), `newAbonnementId` /
  `newPackPurchaseId`. Hors périmètre (mentionné dans le fichier) : vraie auth,
  parcours de souscription en ligne, dialogs d'upsell, groupement panier, le
  `DEPOSIT_AMOUNT` du spec (le back-office garde `@/lib/mock/paiement`).
- `services.ts` — **2026-09-27, aligné sur la réservation b&co**
  (`point-de-vente/lib/prise-rdv/data/booking-services.ts`, que le back-office
  définit et que la réservation / la caisse consomment) : **7 catégories**
  (**Mini & Co = une catégorie `s-mini`, sous-catégories Hair / Spa** depuis le
  2026-09-28 — elles étaient deux catégories distinctes le 2026-09-27), `Service.image: string |
  null` (image importée ou visuel `public/images/categories/` — remplace
  `icon`/`ServiceIconKey`/`SERVICE_ICON_OPTIONS`, supprimés), les **11
  sous-catégories réelles** de Coiffure, `twoPractitioners` réel (**77** des
  107 prestations, `TWO_PRACTITIONER_IDS`), questions de réservation réelles
  (`QuestionType` = `oui-non` / `texte` + `ServiceQuestion.placeholder` ;
  « choix multiple » et la question fictive « rappel la veille » retirés),
  **plus de `reservationMode`** (la réservation pose la praticienne d'office —
  remplacé dans `PrestationPanel` par l'interrupteur « Réalisable à deux
  praticiennes »), `Product.brand` / `gamme` (+ `PRODUCT_BRANDS`, marques et
  gammes Kérastase réelles de `menu.ts`), et **boissons sorties de `products`**
  → `Boisson` / `boissonSeeds` (prix et compositions réels, sans stock ;
  `sellableExtras` = boissons actives ; `productName` / `productPrice`
  résolvent produit OU boisson). Le texte qui suit décrit l'état antérieur
  pour l'historique ; en cas de contradiction, ce paragraphe prime.
- `services.ts` — **catalogue réel** Beauty & Co (repris le 2026-09-04 de
  `point-de-vente/lib/data/menu.ts` — 107 prestations, 7 catégories ; Mini&Co ·
  Hair et Mini&Co · Spa fusionnées en un seul service « Mini & Co », « Brows /
  Lashes » retiré car absent du catalogue réel). `Service` : catégorie, émoji,
  salons, statut, **`subcategories: Subcategory[]`** (2026-09-22, voir
  « Refonte Kanban du catalogue Services » plus bas — lanes optionnelles du
  tableau Kanban ; `[]` = pas de sous-catégorisation, prestations à plat ;
  seule Coiffure en a par défaut, les 6 autres catégories `[]`) ;
  `Subcategory` : `{ id, name }` ; `Prestation` : `serviceId` nullable, prix
  FCFA (réel), durée min (réelle), statut, `recipe: RecipeItem[]`,
  **`subcategoryId?: string | null`** (2026-09-22 — référence une entrée de
  `Service.subcategories` du parent ; absente/`null`/orpheline → groupe
  « Autres », cf. `groupPrestationsBySubcategory`), **`salonIds: SalonId[]`**
  (`[]` = hérite du service parent — le catalogue réel ne distingue pas les
  prestations par salon), **`reservationMode: ReservationMode`** (`named` /
  `any` / `both`, heuristique sur le prix / la sous-catégorie / la durée),
  **`twoPractitioners?: boolean`** (2026-09-21, parité point-de-vente — temps
  de chaise jamais divisé automatiquement, cf. `rendezvous.ts` — activé sur
  quelques prestations longues à rallonges/extensions via `TWO_PRACTITIONER_IDS`,
  sans toucher les 107 lignes du catalogue) ;
  `RecipeItem` : `productId` + quantité + unité ; `ServiceQuestion` : `serviceId`
  nullable, libellé, type `oui-non` / `choix-multiple` / `texte`, statut (fiche
  d'accueil — sans équivalent côté point-de-vente, restée fictive). **Indépendant
  du barrel** : importer directement `@/lib/mock/services`. Expose `serviceSeeds`
  / `prestationSeeds` (dérivé de `rawPrestations`) / `questionSeeds`, `products`
  (catalogue réel Kérastase + boissons du bar, remplace les consommables
  fictifs — `image?: string` pointe vers `public/images/produits|boissons/` ;
  **`priceFcfa?: number`** renseigné sur **tous** les produits depuis le
  2026-09-22 (audit de parité point-de-vente — `lib/data/menu.ts::PRODUITS`
  porte bien un prix réel sur les 78 produits Kérastase/marques, contrairement
  à l'hypothèse précédente ; changement inerte sur le comportement de l'app,
  `sellableExtras` continue de ne filtrer que les boissons), alimente les
  extras de rendez-vous (`rendezvous.ts`, boissons pré-commandées) ;
  `productPrice(id)` / `productKind(id)` (`"produit"` / `"boisson"`, par
  préfixe d'id) / `sellableExtras` (les 7 boissons, seules proposées en extra
  de RDV — consommées par `rendezvous/BookingDialog.tsx`) ;
  seule la catégorie Coiffure porte une recette — gammes Kérastase plausibles
  par sous-catégorie, aucune donnée de consommation réelle n'existe pour les
  autres catégories), les listes d'options (`QUESTION_TYPE_OPTIONS`,
  `RECIPE_UNIT_OPTIONS`, `SERVICE_ICON_OPTIONS` (7 clés `ServiceIconKey` — la
  vignette d'un `Service` ; composant résolu côté UI par `SERVICE_ICONS`, voir
  `components/back-office/services/serviceIcons`), `RESERVATION_MODE_OPTIONS`),
  `reservationModeLabel`, `prestationsForSalon(prestations, scope)`,
  `isUnbookable(prestation)` (active mais aucune praticienne compétente — via
  `membersForPrestation` de `./staff` ; les compétences de l'équipe ne couvrent
  qu'une partie du catalogue réel, le reste est délibérément « non réservable »
  — signal réaliste, pas un bug), le dérivé `serviceRows(services, prestations,
  questions, scope)` (ligne par catégorie filtrée salon, compteurs +
  `unbookableCount`), **`groupPrestationsBySubcategory(service, prestations)`**
  (2026-09-22 → `SubcategoryGroup[]`, une lane par sous-catégorie du service
  dans l'ordre + un groupe `subcategory: null` final « Autres » s'il reste des
  prestations non classées ; service sans sous-catégorie → un seul groupe à
  plat ; alimente les lanes de `services/CategoryColumn.tsx`),
  `orphanPrestations` / `orphanQuestions`, et les helpers
  `durationLabel`, `digitsToInt`, `recipeLine`, `productName`, `questionTypeLabel`,
  `newId`. La suppression d'une catégorie détache ses prestations / questions
  (`subcategoryId` remis à `null` au passage) ; la suppression d'une
  sous-catégorie détache seulement les prestations qui y étaient rattachées.
- `stock.ts` — **2026-09-27 : plus de boissons** (7 seeds retirées — le bar ne
  se compte pas au verre, ADR 0016 de point-de-vente). Fixtures Stock. **Indépendant du barrel** : importer directement
  `@/lib/mock/stock`. Le stock est suivi par **emplacement** : `StockLocation =
  SalonId | "reserve"` (`RESERVE`, `STOCK_LOCATIONS`, `isReserve`,
  `locationName`) — une **réserve centrale** non rattachée à un salon alimente
  les salons par transfert et sert de tampon avant commande fournisseur.
  `MovementReason` (`sale` / `recipe` / `restock` / `transfer` / `adjust` /
  `inventory`), `StockMovement` (`location`, plus `salonId`), `ProductStock`
  (`onHand`, `min` = seuil de l'emplacement (0 pour la réserve), `leadDays`, par
  produit × emplacement). `STOCK_SEEDS` porte aussi `companyMin` (seuil
  entreprise = total réserve + salons). `productStock` : niveaux courants dérivés
  du total réel `stock` de point-de-vente/lib/data/menu.ts (`PRODUITS`), réparti
  entre réserve / Almadies / Sea Plaza (répartition inventée — point-de-vente ne
  suit qu'un total, sans détail par emplacement ; `weekly` / `min` / `companyMin`
  également inventés pour que seuils et projections restent fonctionnels ;
  Kérastase = `leadDays: 21` (importé), boissons = `leadDays: 4` (réappro
  local)), `stockMovements` (synthétisés : ventes + prestations aux salons,
  transferts réserve→salon, réceptions fournisseur dans la réserve).
  Expose `stockRows(scope, { movements?, thresholds? })` (scope « all » → niveau
  + seuil **entreprise** ; un salon → niveau + seuil **de ce salon** ; tri
  couverture croissante, « jamais inventorié » en tête ; `StockRow.reserve` pour
  le sous-texte liste), `locationOnHand` / `reserveOnHand` / `companyOnHand`
  (base + mouvements de session), `productLocations`, `leadDaysFor`,
  `weeklyConsumption` / `consumptionBreakdown` (excluent les transferts),
  `coverageDays`, `coverageTone`, `levelHistory(pid, extra?, weeks=10)` →
  `LevelHistoryPoint[]` (`{ label, total, reserve, salons }`, pour
  `StockLevelChart`), `prestationsUsing(pid)` → `PrestationUse[]` (liste complète
  + quantité/visite), `usedInRecipe`, seuils de session : `ThresholdOverride` +
  `emptyThresholds` + `effectiveCompanyMin` / `effectiveSalonMin`,
  `ProjectionModel` + `PROJECTION_MODEL_OPTIONS` + `projectionModelLabel` +
  `projectRunout(pid, model, extra?)` (**niveau entreprise**, `runoutDate` /
  `reorderQty` / `reorderBy` / `reliable` — `reliable=false` si < 4 semaines),
  `ADJUST_KINDS`, `newMovementId`, `movementReasonLabel` (+ réexport `frShortDate`).
  `stockAlertNotifications()` (2026-09-21) : alerte « À traiter » du tableau de
  bord calculée en direct depuis `stockRows("all")` (produits sous le seuil
  entreprise), jamais codée en dur — corrige l'ancienne notif statique
  « Teinture Majirel » qui pointait vers un produit disparu du catalogue réel
  et ne reflétait pas l'état réel du stock ; une seule notification agrégée
  (comme le bandeau de `/stock`), lien direct vers la fiche si un seul produit
  est concerné. Câblée dans `NotificationsContext`, aux côtés de
  `requestNotifications`.
- `emails.ts` — fixtures des modèles d'email. **2026-09-28 : envoi réglé
  modèle par modèle** — `EmailTemplate.send: EmailSend` (`auto` manuel /
  automatique, `event` `EmailEvent` = rendez-vous / anniversaire /
  achat-produit / carte-cadeau / abonnement, `value` (0 = au moment même) +
  `unit` heures / jours / semaines / mois + `direction` avant / après) ; les
  emails transactionnels (confirmation, modification, annulation, bienvenue)
  gardent un `fixedTrigger` figé + `fixedGroup`. L'ancien `EmailAutomation`
  (premier / second rappel, remerciement) est supprimé : ce sont désormais des
  modèles (« Rappel de rendez-vous », « Rappel le jour même », « Merci pour
  votre visite »). Expose `defaultSiteLink`, `defaultTemplates` (13, dont 3
  exemples achat produit / carte cadeau / abonnement), `EMAIL_EVENTS` /
  `EMAIL_EVENT_OPTIONS`, `DELAY_UNIT_OPTIONS`, `DIRECTION_OPTIONS`,
  `DEFAULT_SEND`, `sendLabel` / `templateSendLabel` (« 2 jours avant le
  rendez-vous », « Dès l'achat d'une carte cadeau »), `isAutomatic`,
  `isPurchaseEvent`, `groupTemplates` (rubriques par occasion, triées par
  moment d'envoi, puis « Envoi manuel »), `TEMPLATE_VARIABLES`,
  `templateKindLabel`. **Indépendant du barrel** : `@/lib/mock/emails`.
- `cartes-cadeaux.ts` (2026-10-05) — cartes cadeaux vendues. Deux contenus,
  comme `GiftCardKind` de point-de-vente : `kind` **montant** (solde FCFA) ou
  **prestations** (`prestationIds`, `amountFcfa` = leur valeur à l'achat ;
  `GiftCardUse.prestationId` marque une prestation honorée) —
  `giftCardPrestations`, `giftCardContentLabel` ; 3 seeds prestations
  (`BC-2026-5133`, `-5127`, `-4655`). Deux formats :
  `digitale` (`DigitalSend` : e-mail / WhatsApp, `envoyee` / `programmee` /
  `echec` + motif) et `physique` (`PhysicalHandover` : retrait au salon ou
  livraison quartier + frais, étapes `a-preparer` → `prete` → `remise`).
  `GiftCardPerson` acheteuse / bénéficiaire (`clientId` ou hors fichier),
  `uses` (débits datés par salon), validité 12 mois. 15 seeds — dont
  `BC-2026-4471` (c01) et `BC-2026-1180` (c04), mêmes soldes que les RDV de
  démo. Expose `balanceOf`, `usedAmount`, `expiresAt`, `isExpired`,
  `bucketOf` (échec / à préparer / prête / programmée / en circulation /
  terminée), `needsAction`, `outstanding`, `giftCardMatches` (code, noms,
  e-mail, chiffres du téléphone), `frDayShort` / `frStamp`.
- `livraison.ts` (2026-10-01) — livraison des cartes cadeaux : `DeliveryZone`
  (`name` = quartier, `priceFcfa`, 0 = offerte), `deliveryZoneSeeds` (9
  quartiers de Dakar), `newDeliveryZoneId`, `foldZoneName` (doublons sans
  casse ni accents). Édité dans Réglages › Livraison.
- `paiement.ts` — fixtures des paramètres de paiement (`PaymentSettings` :
  `liveMode` encaissement réel / mode test, `depositMode` `fixed` / `percent` /
  `none`, `depositFixed` FCFA, `depositPercent` %, `waveEnabled` /
  `orangeMoneyEnabled`). **Indépendant du
  barrel** : importer directement `@/lib/mock/paiement`. Expose
  `defaultPaymentSettings`, `DEPOSIT_MODE_OPTIONS`, `DEPOSIT_MIN_FCFA` et le
  helper `depositSummary`. **2026-09-22** : `paypalUsd` retiré, remplacé par
  deux toggles Wave / Orange Money — PayPal n'existe nulle part dans
  point-de-vente (seuls modes réels : `wave` / `orange_money` / `especes` /
  `carte`, `lib/data/types.ts::PaymentMode`), et Wave/Orange Money traitent le
  FCFA nativement, donc plus besoin du champ de conversion USD que PayPal
  imposait (audit de parité point-de-vente, voir plus bas). L'acompte
  « identique pour toutes » (`depositFixed`/`depositPercent`) reste inchangé —
  écart plus profond avec point-de-vente (acompte variable par réservation,
  décidé par une plateforme externe) délibérément laissé de côté, voir « Audit
  de parité point-de-vente ».
- `compte.ts` — fixtures du compte de la propriétaire (`OwnerAccount` : nom, rôle,
  email, téléphone, `avatarUrl`, `password`, `notify` = canaux email / SMS /
  WhatsApp). **Indépendant du barrel** : importer directement
  `@/lib/mock/compte`. Expose
  `defaultAccount` (Sokhna Ndour), `NOTIFY_CHANNEL_LABELS`, et les validateurs
  `isValidEmail` / `isValidPhone` / `passwordError(actual, current, next, confirm)`
  (+ `PASSWORD_MIN`, `accountInitials`). **2026-09-22** : `avatarUrl` par défaut
  passé à `""` (plus de chemin `/images/avatar.png` fictif) + `password` ajouté
  — `passwordError` vérifie désormais réellement le champ « actuel » contre
  `account.password` (comme `verifyPassword` de point-de-vente,
  `lib/session.ts`), au lieu de juste contrôler qu'il n'est pas vide.
- `notifications.ts` — fixtures des notifications (`AppNotification` : `category`
  "rendez-vous" | "paiement" | "stock" | "avis" | "equipe", `tone`, `title`,
  `body`, `date` ISO, `read`, `href` non vide vers une page existante).
  **Indépendant du barrel** : importer directement `@/lib/mock/notifications`.
  N'importe RIEN de `rh.ts` ni de `stock.ts` (la fusion avec les demandes de
  l'équipe et l'alerte stock se fait dans `NotificationsContext`). Expose
  `notifications` (4 seeds système ponctuels — rendez-vous, paiement, avis ;
  plus de seed « stock » statique depuis le 2026-09-21, voir
  `stockAlertNotifications()` dans `stock.ts`), `CATEGORY_LABELS`, `TONE_DOT`,
  `unreadCount(list)`, `groupByDay(list)` (« Aujourd'hui » / « Hier » /
  « 1 sept. »).
- `remises.ts` (2026-09-28) — remises accordées à la caisse à l'encaissement
  d'un RDV (`Remise` : `at`, `salonId`, `rdvId`, `clientId` + `clientName` et
  `cashierId` + `cashierName` dénormalisés, `amountFcfa`, `reason`). Deux seeds
  du jour (Fatou Camara / Ndiole, Sokhna Ndiaye / Rokhaya — `jn-0304` du
  journal aligné). N'importe que des types. Expose `remises`, `remiseById`,
  `remiseNotificationId`, `remiseNotifications()` (concaténée dans
  `NotificationsContext`, ton `warning` → file « À régler aujourd'hui »).
- `pointage.ts` (2026-09-28) — heures d'arrivée / de départ badgées à la caisse
  (consultation seule). `PointageDay` (`worked` : salon, prévu, `arrival`,
  `departure`, `ongoing` aujourd'hui · `absent` : type d'absence) ; synthétisé
  de façon déterministe (hash FNV) sur 6 semaines depuis `presenceFor` (seeds du
  planning, pas l'état live) — surtout à l'heure, quelques retards, départs
  anticipés, rares oublis de badge. Expose `pointagesFor(memberId)`,
  `POINTAGE_PERIOD_OPTIONS` / `periodRange` / `inRange`, `LATE_TOLERANCE_MIN`
  (5) / `EARLY_TOLERANCE_MIN` (10), `lateMinutes`, `earlyLeaveMinutes`,
  `offsetMinutes`, `presenceMinutes`, `missingPunch`, `hasAnomaly`,
  `summarize`, `groupByWeek`, `hoursLabel` (« 9 h 05 »). **2026-10-01** :
  une absence porte `salonId` (salon attendu ce jour-là, d'après les horaires
  habituels) ; `teamPointagesByDay(range, scope, memberId?)` (toute l'équipe
  active, par jour, filtrée par salon — Équipe › Pointage).
- `rh.ts` — fixtures « RH » : demandes déposées par les collaboratrices.
  **Indépendant du barrel** : importer directement `@/lib/mock/rh`. `StaffRequest`
  (`kind` `avance` / `conge`, `status` `en_attente` / `acceptee` / `refusee`,
  `submittedAt`, `decidedAt?`, `amountFcfa?`, `from?` / `to?`, `note?`).
  N'importe que `type AppNotification` de `./notifications` (pas de cycle : la
  concat se fait dans `NotificationsContext`). Expose `staffRequests` (SEEDS :
  2 en attente — avance Aïda Sarr 50.000 FCFA, congé Coumba Faye 15–17 sept. —
  + 4 tranchées pour l'historique), `STAFF_REQUEST_LABELS` /
  `STAFF_REQUEST_STATUS_LABELS`, les helpers `requestSummary` / `requestTitle` /
  `leaveRange` / `leaveDays` / `requestsForMember` / `pendingRequestsForMember` /
  `pendingRequestCount` / `newRequestId`, et `requestNotifications(list?)`
  (`AppNotification[]` — une entrée par demande `en_attente`, category "equipe",
  tone "warning", `href` `/equipe?membre=<memberId>`).
- `journal.ts` — fixtures du Journal d'activité (`JournalEntry` : `at` ISO,
  `actorId` + `actorName` **dénormalisé**, `actorRole` `manager` / `caisse` /
  `praticienne` (axe de filtre), `salonId`, `domain` `rendez-vous` / `paiement` /
  `client` / `equipe` / `stock` / `parametres`, `action` + `detail`, `tone`
  `info` / `notable` / `sensitive`, `href?` vers une page réelle). **Indépendant
  du barrel** et n'importe RIEN de `staff.ts` (auteur dénormalisé → une personne
  partie reste lisible). Monde ancré au `JOURNAL_TODAY` `2026-09-03`. 3 entrées
  corrigées le 2026-09-21 (référençaient encore l'ancien catalogue fictif
  d'avant le passage au catalogue réel du 2026-09-04 — une teinture et une
  coloration qui n'existent pas chez Beauty & Co) : `jn-0290` (inventaire
  Sea Plaza, un vrai produit Kérastase au lieu de « Teinture Majirel »),
  `jn-0278` (consommation hors recette, un vrai produit au lieu de « Patine »),
  `jn-0302` (tarif « Silk Press » — une vraie prestation — au lieu de
  « Coloration complète »). Expose
  `journalEntries` (26 seeds, 25 août–3 sept.), `ACTOR_ROLES` /
  `ACTOR_ROLE_LABELS` (singulier, pastille) / `ACTOR_ROLE_FILTER_LABELS`
  (« Praticiennes » au pluriel) / `DOMAIN_LABELS`, et les helpers `filterJournal`
  (salon + rôle + plage + recherche pliée sans accent, tri antéchronologique),
  `groupJournalByDay` / `journalDayLabel` (« Aujourd'hui » / « Hier » /
  « mardi 1 sept. ») / `journalClock` / `actorInitials` / `addDaysIso` / `frDay`.

## Nettoyage du template (2026-09-04)

Le squelette TailAdmin a été purgé de tout ce que le produit n'utilise pas.
**Supprimés** : routes `(admin)/{customers,orders,products,invoices,transactions,
support,team,activity,analytics,settings}`, `(admin)/(others-pages)`,
`(admin)/(ui-elements)`, `(full-width-pages)/(error-pages)`, `(auth)/signup` ;
composants `ecommerce/`, `charts/`, `tables/`, `user-profile/`, `videos/`,
`example/`, `calendar/`, `form/form-elements/`, `ui/video/`,
`common/{PageBreadCrumb,ChartTab,ThemeTogglerTwo}`, `back-office/SettingsTabs`,
`auth/SignUpForm` ; hooks `useModal` / `useGoBack` ; `layout/SidebarWidget` ;
`ThemeProvider` retiré du root layout (thème = design-system uniquement) ;
fixtures `mock/{index,types,customers,products,orders,finance,team,analytics,
system}.ts` ; le fichier de types `jsvectormap.d.ts`. `PageHeader` a perdu sa
prop `action` (faux bouton décoratif, plus aucun écran ne s'en servait).
L'agenda de `/rendez-vous` utilisait `@fullcalendar` directement (pas le
wrapper `calendar/`) — remplacé le 2026-09-21 par une frise horaire maison,
voir « Refonte Planning/Agenda » plus bas. `(auth)/` (connexion + mots de
passe) refondu FR / light /
marque. `back-office/FormCard` et `back-office/StatusBadge` ne servent plus qu'à
la vitrine `design-system`.
**Restant à traiter** : `design-system/page.tsx` encore anglais + `dark:`
(exempté pour la démo de thème) ;
`npm run lint` = 2 erreurs `react-hooks/set-state-in-effect` (`ThemeContext`,
`LocationContext` — hydratation `localStorage` post-montage, faux positifs) +
2 warnings a11y dans `PeriodFilter` — toutes pré-existantes ;
~14 lignes de CSS mort `.jvectormap-*` dans `globals.css` ; dépendances npm
inutilisées `jsvectormap`, `react-dnd`, `react-dnd-html5-backend`, et depuis le
2026-09-21 `@fullcalendar/{core,react,timegrid,interaction}` (code retiré,
CSS `.fc-*` retirée de `globals.css` — les 4 packages restent dans
`package.json`, à désinstaller).

## Catalogue réel (2026-09-04)

Le catalogue « Services » et « Produits » (`src/lib/mock/services.ts`), inventé
jusqu'ici, a été remplacé par les vraies données Beauty & Co reprises du projet
frère `point-de-vente` (`lib/data/menu.ts` — hors périmètre de ce dépôt, lu
ponctuellement avec l'autorisation explicite de l'utilisatrice) : 107 prestations
réelles sur 7 catégories, catalogue produits (75 — Kérastase + Saryna Keys +
Nefertiti + Beccy Wave + accessoires) + boissons du bar (7 produits) avec photos
réelles (`public/images/produits/`, `public/images/boissons/`). Changements
dérivés :

- `src/lib/mock/stock.ts` — `STOCK_SEEDS` régénéré pour le nouveau catalogue
  produit (répartition réserve/salons et seuils inventés à partir du total
  réel — cf. entrée `stock.ts` ci-dessus) ; `freq()` (pondération de
  `consumptionBreakdown`) recalculée depuis la durée de la prestation plutôt
  qu'une table figée par id, le catalogue n'ayant plus d'ids fictifs stables.
- `src/lib/mock/staff.ts` — compétences (`Member.skills`) réécrites sur les ids
  réels ; volontairement partielles (une partie du catalogue reste « non
  réservable », cf. `isUnbookable` — signal réaliste, pas un trou de données).
- `src/lib/mock/rendezvous.ts` — prestations des rendez-vous de démonstration
  réaffectées à des prestations réelles proches (prix/durée à jour) ; la
  « Coloration » n'a pas d'équivalent dans le catalogue réel (Beauty & Co ne
  fait pas de coloration en salon) → remplacée par « Soin complet » partout où
  elle apparaissait (narration, questions, pack fidélité).
- `src/components/back-office/stock/StockDetail.tsx` — la photo produit
  affichée par défaut vient désormais de `Product.image` (photo réelle),
  écrasée par une photo de session si la propriétaire en importe une.
- « Brows / Lashes » (service + 2 prestations fictives) supprimé : absent du
  catalogue réel.
- **Rattrapage 2026-09-21** : 8 produits réels absents de la synchronisation
  initiale (catégories Saryna Keys, Nefertiti, Beccy Wave, Autres —
  antiseptique, huile réparatrice, extensions, correcteur, peigne bijou) ajoutés
  à `products` (`services.ts`) + `STOCK_SEEDS` (`stock.ts`), photos copiées dans
  `public/images/produits/`. Vendus au détail, sans recette. Au passage :
  `stockAlertNotifications()` ajouté (voir entrée `stock.ts`) et 3 entrées de
  `notifications.ts` / `journal.ts` qui référençaient encore l'ancien catalogue
  fictif (« Teinture Majirel », « Patine », « Coloration complète ») corrigées.
  **Reste à traiter** : « Coloration » subsiste dans `beautyandco.ts` (avis
  clients, historiques de visite, prestations populaires) et dans un rappel de
  `messagerie.ts` — non touché ici pour ne pas interférer avec la refonte
  visuelle du tableau de bord/RDV en cours au moment de ce correctif.

## Simplification de la sidebar (2026-09-21)

13 tabs à plat jugés trop nombreux pour Sokhna (aisance logicielle moyenne,
cf. « Utilisateurs de la plateforme »). Retrait de 4 entrées de
`layout/AppSidebar.tsx` (→ **9 items**), sans réintroduire de regroupement par
catégorie ni de sous-menus (déjà tenté et défait le 2026-09-14) :

- `Salons` — retiré car redondant : déjà accessible via le menu compte du
  header (`header/UserDropdown`, lien « Paramètres des salons », retiré le 2026-10-02 : les salons sont dans Réglages).
- `Rapports`, `Satisfaction`, `Journal` — retirés car ce sont des écrans de
  consultation occasionnelle (générateur utilisé au besoin, indicateur, audit),
  pas des outils de travail quotidien contrairement au reste de la sidebar.
  Remplacés par une section « Autres écrans » en bas du tableau de bord
  (`back-office/Dashboard.tsx`, composant local `ShortcutCard`) — volontairement
  après les indicateurs de la période, pour ne pas concurrencer les rendez-vous
  du jour (priorité confirmée le 2026-09-14, cf. « Utilisateurs de la
  plateforme »).

Les routes `/salons`, `/rapports`, `/satisfaction`, `/journal` elles-mêmes ne
changent pas, seuls leurs points d'entrée dans la nav bougent.

## Fiches en panneau latéral droit (2026-09-21)

Les trois fiches de détail qui se comportaient encore comme un modal centré ou
une page pleine — fiche cliente, fiche rendez-vous, fiche produit stock — sont
passées en **panneau latéral droit** (`aside` plein hauteur ancré à droite,
fond assombri léger `bg-gray-900/20`, transition d'entrée en glissement), pour
rejoindre le panneau rapide déjà utilisé dans la vue Liste de `/rendez-vous`
(`RendezVous.tsx`, l'`<aside>` ouvert par clic sur une ligne) : un seul
vocabulaire visuel pour toute fiche de détail dans l'app, au lieu de trois
traitements différents (modal centré + page plein écran + panneau).

- `back-office/detail/DetailModal.tsx` — chrome commun (déjà partagé par
  `ClientDetailModal` et `RendezVousDetail`) réécrit en panneau latéral au lieu
  d'un modal centré ; ne dépend plus de `ui/modal`. `ClientDetailModal.tsx` et
  `RendezVousDetail.tsx` n'ont pas eu besoin de changer : ils ne connaissent
  que `title` / `onClose` / `children` / `widthClassName`.
- `back-office/stock/StockDetail.tsx` — passé du même chrome `DetailModal`
  (auparavant une page pleine avec son propre `BackButton`) ; `Stock.tsx` garde
  désormais `StockList` toujours monté et superpose `StockDetail` par-dessus
  quand un produit est sélectionné, au lieu de remplacer la vue liste.
- `back-office/ClientDetailActions.tsx` — au passage, le bouton « Historique
  complet » (couleur `bg-success-500`, une teinte de statut) recoloré en style
  ghost gris pour respecter la règle « boutons pleins = couleur de marque,
  jamais une couleur de statut » (voir « Couleurs de marque »).

Vérifié par capture d'écran (Playwright + Chromium headless local) sur les
trois fiches avant/après, plus la fiche `/clients/[id]`, `/rendez-vous/[id]` et
`/stock?produit=<id>` en accès direct (fallback pleine page) pour confirmer que
le panneau s'affiche correctement même sans écran d'origine derrière.

## Refonte Planning/Agenda (2026-09-21)

Demande explicite de l'utilisatrice : reprendre les représentations visuelles
du planning et des rendez-vous du projet frère `point-de-vente`
(`/Users/jcb/Desktop/Homonyme/point-de-vente`, hors périmètre de ce dépôt, lu
avec l'autorisation explicite de sa requête), quitte à s'écarter des choix
déjà notés dans ce fichier — cette section documente les décisions prises en
autonomie sur cette base, vérifiées par capture d'écran avant/après (Playwright
+ Chromium headless local, comparaison sur `/rendez-vous` et `equipe?vue=planning`).

**Ce qui a changé** : l'écran `/rendez-vous` (vue **Agenda**) et l'onglet
**Planning** de `/equipe` partageaient déjà la même donnée (`weekPresence`) mais
pas le même vocabulaire visuel — grille FullCalendar générique d'un côté,
matrice membres × jours de l'autre. `point-de-vente/components/planning/`
(reconstruit à la lettre d'un Figma de référence chez eux, cf. leurs ADR 0020/
0024/0025) montre une seule grammaire pour les deux : **une ligne par
praticienne, teintée d'une couleur d'identité stable**, plutôt qu'un code
couleur par type de poste ou par salon. Reprise ici :

- `src/lib/mock/staff-colors.ts` (nouveau) — la palette d'accent, portée par
  position dans l'équipe planifiable. Couleurs directement reprises de
  `point-de-vente/lib/data/praticienne-colors.ts` (mêmes hex) : ce ne sont pas
  des couleurs de marque, mais des teintes d'identité choisies pour rester
  visuellement distinctes entre praticiennes voisines — la règle « brand-500 en
  texte seulement sur blanc/gray-50 » ne s'y applique pas, ces pastilles ne
  portent jamais de texte de marque.
- `equipe/planning/PlanningGrid.tsx` — restylé sur cette palette (bordure
  gauche + avatar + nom + pastille RDV teintés), data et interactions
  inchangées.
- `back-office/rendezvous/DayTimeline.tsx` + `WeekTimeline.tsx` (nouveaux) —
  remplacent l'agenda FullCalendar : une frise horaire maison, même grammaire
  que `PlanningGrid`. Écart assumé par rapport à la doc d'origine (« Calendrier :
  FullCalendar ») : le rendu générique de FullCalendar (toolbar, grille du
  mois, styles `.fc-*` du template TailAdmin) ne portait pas l'identité du
  produit et n'offrait pas de lecture par praticienne — seulement par salon/
  poste. `prestationSlots()` (nouveau, `rendezvous.ts`) dérive le créneau propre
  à chaque prestation (elles s'enchaînent depuis `RdvDetail.date`, jamais en
  parallèle) pour positionner correctement chaque bloc sur la ligne de SA
  praticienne quand un rendez-vous en mobilise plusieurs.
- Le Drawer de détail rapide de `/rendez-vous` (panneau ouvert par clic sur une
  ligne/carte) reprend la grammaire de `point-de-vente/components/planning/
  appointment-detail-sheet.tsx` : en-tête `brand-950` (bandeau sombre
  ponctuel — ne contrevient pas à « thème light uniquement », qui interdit une
  bascule `dark:` globale, pas un bloc à fond foncé assumé), prestations en
  icône-cercle + `select` d'affectation teintés par la praticienne affectée.
- FullCalendar (`@fullcalendar/{core,react,timegrid,interaction}`) n'a plus
  aucun usage dans `src/` — code retiré, CSS `.fc-*` retirée de `globals.css`
  (~140 lignes), packages laissés dans `package.json` en dépendance résiduelle
  (voir « Nettoyage du template »). La bascule de couleur « Par poste / Par
  praticienne » de l'ancien Agenda a été retirée : l'identité par praticienne
  est désormais la seule lecture, cohérente avec le Planning.

**Ce qui n'a pas changé** : le modèle de données (`rendezvous.ts`,
`planning.ts`), le bandeau de capacité par poste (toujours utile — occupation
des postes physiques, question différente de « qui est occupée »), la vue
**Liste** de `/rendez-vous` (refonte en cartes menée en parallèle par une autre
session sur la même base `point-de-vente`, voir `ListView.tsx` /
`BookingDialog.tsx` dans la carte du code), les fiches détaillées
`RendezVousDetail.tsx` / `ClientDetailModal.tsx` (panneau latéral, déjà à jour
depuis « Fiches en panneau latéral droit » ci-dessus).

## Refonte Figma tableau de bord (2026-09-21)

Demande explicite de l'utilisatrice : reprendre l'écran « Tableau de bord »
d'un fichier Figma partagé (`Point de vente`, fileKey `VUz9mOO5TVWqwWkUO2vPBX`,
node `286:6` — https://www.figma.com/design/VUz9mOO5TVWqwWkUO2vPBX/Point-de-vente?node-id=286-6),
quitte à s'écarter des règles de `design.md` où ça entre en conflit. Travail
réparti en direct entre trois sessions Claude en parallèle sur le même
working tree (`back-office-4e`, `back-office-85`, `back-office-8a`,
coordination par `SendMessage`, voir [[multi-session-shared-worktree]]).

Repères Figma utiles (le fichier est volumineux, `get_metadata` tronque avant
d'atteindre le nœud utile — passer directement par `get_design_context` sur
les IDs ci-dessous) :
- `286:6` — le cadre plein écran « Tableau de bord » (1280×1408). Sa sortie
  `get_design_context` tronque avant d'atteindre la sidebar : elle est bien un
  enfant réel du nœud (`286:396`), juste tardif dans le JSX généré.
- `286:396` — sidebar de navigation persistante (260px). Implémentée dans
  `layout/AppSidebar.tsx` (voir cette entrée dans la carte du code ci-dessus) :
  seule différence volontaire, le placeholder texte cursif « Beauty & Co »
  (police Alex Brush) du Figma est remplacé par le vrai wordmark SVG de la
  marque, au même emplacement.
- `286:8` — en-tête de page dans la zone de contenu (titre + date + pastilles
  de période + bouton « Nouveau RDV »), distinct de `layout/AppHeader.tsx`
  (bascule sidebar + `UserDropdown`) qui, lui, ne change pas : la propriétaire
  a explicitement demandé de garder le bouton de compte « Sokhna Ndour »
  visible alors que le mock Figma ne le montre pas du tout. Livré :
  `back-office/dashboard/DashboardHeader.tsx` — pastilles de période
  remplacées par le filtre salon (écart assumé, voir cette entrée dans la
  carte du code ci-dessus), bouton « Nouveau RDV » fonctionnel
  (`/rendez-vous?nouveau=1`).
- `286:31` — grille principale à 2 colonnes (rendez-vous du jour par salon,
  cartes KPI, prestations populaires). Livré : `TodayAppointments.tsx`
  (restylé) + `back-office/dashboard/TodayKpiCards.tsx` (nouveau) +
  `PopularServices.tsx` (restylé), voir leurs entrées dans la carte du code
  ci-dessus. Les anciennes sections « Indicateurs de la période »
  (`StatCards`), `TrendChart` et « Autres écrans » — absentes de ce nœud
  Figma — sont retirées de `Dashboard.tsx` (fichiers conservés, plus utilisés
  ici) ; badge « Confirmé » du mock omis (pas d'étape de confirmation dans ce
  produit).
- `286:295` — colonne de droite (« Actions à traiter » / « Accès rapides ») —
  livré : `back-office/dashboard/NotificationsPanel.tsx` (restylé, widget 1) +
  `back-office/dashboard/AccesRapides.tsx` (nouveau, widget 2) ; voir ces deux
  entrées dans la carte du code ci-dessus pour le détail (écarts assumés
  compris — flux « Toutes les notifications » retiré, note de satisfaction
  retirée des raccourcis).

Règles suivies par les trois sessions : police **Poppins** conservée partout
(demande explicite, malgré le Figma en Plus Jakarta Sans/Alex Brush) ; couleur
de bordure `#efe9e8` (littérale, distincte de `gray-100`) reprise telle quelle
sur tous les écrans concernés pour rester cohérent ; le bouton de compte
« Sokhna Ndour » reste visible dans le header global.

Les quatre nœuds (`286:396`, `286:8`, `286:31`, `286:295`) sont livrés et
vérifiés par capture d'écran locale (Playwright + Chromium headless,
`localhost:3000`, comparée au rendu du Figma) par les trois sessions — se
référer à l'état réel du code plutôt qu'à cette note pour le détail exact.

## Harmonisation des titres de page (2026-09-21)

Demande explicite de l'utilisatrice : les écrans représentaient chacun leur
titre différemment (bandeau nu `PageHeader` avec description sur 11 écrans,
carte encadrée + filtre salon teinté + CTA propre au seul `Dashboard`, deux
implémentations du filtre salon). Décision : étendre le style carte du
Dashboard à **tous** les écrans plutôt que l'inverse.

- `back-office/PageHeader.tsx` réécrit en carte bordée (`border-[#efe9e8]`,
  `shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]`, titre `text-[#2d2626]` — mêmes
  littéraux que l'ancien `DashboardHeader`, déjà documentés comme réutilisables
  tels quels par tout écran qui reprend cette charte) : c'est désormais LE
  bandeau de titre de l'app entière, plus un composant à part pour le seul
  Dashboard. Props réduites à `title` + `actions?` (slot droit) — **plus de
  `description`** : sur demande explicite de l'utilisatrice (« pas de
  sous-titre pour expliquer la page, le titre suffit »), retirée des 12 écrans
  qui la passaient (+ constantes `TAB_DESCRIPTIONS` / `SECTION_INTRO` /
  `SECTION_DESCRIPTIONS` devenues mortes, supprimées) ; `backHref`/`backLabel`
  supprimées aussi (prop jamais consommée par aucun écran — chaque flux
  « retour » utilise déjà son propre `BackButton` local, cf. `equipe/ui.tsx`,
  `services/ui.tsx`, `salons/ui.tsx`, `stock/ui.tsx`).
- `ui/segmented/SegmentedControl.tsx` — nouvelle prop `variant` (`"neutral"`
  défaut / `"tinted"`) pour porter la pastille teintée de marque de l'ancien
  radiogroup fait main de `DashboardHeader`, désormais le vrai composant
  partagé au lieu d'une réimplémentation locale.
- `dashboard/DashboardHeader.tsx` simplifié en wrapper autour de `PageHeader`
  (`actions` = `SegmentedControl variant="tinted"` du filtre salon + lien
  « Nouveau RDV » en bouton plein `brand-500`) — plus de sous-titre date (« pas
  de sous-titre », même règle que les autres écrans).
- `RendezVous.tsx` (écran pilote) aligné sur le même pattern : filtre salon +
  bouton « Nouveau rendez-vous » (converti de bouton outline gris en bouton
  plein `brand-500`, pour matcher le CTA du Dashboard) remontés dans
  `actions` ; la bascule Liste/Agenda (`SegmentedControl` neutre) reste sous le
  bandeau, ce n'est pas un filtre global mais une navigation propre à l'écran.
- Portée complétée sur trois sessions en parallèle (coordination `SendMessage`,
  voir [[multi-session-shared-worktree]]) : `Equipe.tsx` (« Ajouter un
  membre », remonté conditionnellement à `tab === "membres"` — le bouton n'a
  de sens que sur cet onglet), `Services.tsx` (filtre salon teinté +
  « Ajouter un service ») et `Salons.tsx` (« Ajouter un salon » — bouton
  déplacé hors de `salons/SalonsList.tsx`, qui ne le rend plus lui-même et a
  perdu sa prop `onAdd`) portent maintenant leur action principale dans
  `actions`, déjà en `bg-brand-500` donc sans changement de couleur. Salons
  n'a pas de filtre salon dans son bandeau : l'écran n'est délibérément pas
  salon-scopé (chaque salon est une ligne de la liste, cf. commentaire du
  fichier). `Fidelite.tsx` vérifié : pas de bouton d'ajout au niveau écran,
  rien à remonter.
  `npx tsc --noEmit` + `npm run lint` verts sur l'ensemble (mêmes 4
  problèmes pré-existants).
- Vérifié par capture d'écran (Playwright + Chromium headless local,
  `localhost:3000`) sur Dashboard / Rendez-vous / Clients / Salons / Équipe ;
  `npx tsc --noEmit` et `npm run lint` verts (mêmes 2 erreurs + 2 warnings
  pré-existants documentés en « Nettoyage du template », rien de nouveau).
- **Suite (audit back-office-48, captures Playwright sur les ~20 écrans)** :
  le point d'incohérence restant était le placement du filtre salon / période
  par rapport à la carte, pas la carte elle-même. Pattern retenu : un seul
  groupe de filtre dans le bandeau (juste le salon) → `variant="tinted"`,
  micro-label majuscule retiré ; deux groupes qui doivent cohabiter (salon +
  période) → micro-labels conservés pour la lisibilité. Les bascules de VUE
  (Liste/Agenda, Membres/Planning/Autorisations, filtre « Voir les actions »
  du Journal, pills Toutes/Actives/À relancer de Clients, contrôle « Trier
  par ») restent sous la carte : ce sont des changements d'écran ou des
  filtres de contenu, pas la portée de page. Appliqué à `Stock.tsx` (filtre
  salon seul, sans micro-label), `Clients.tsx` (filtre salon seul dans la
  carte ; pills « Affichage » + tri restent en dessous, sur leur propre
  ligne), `Satisfaction.tsx` et `Rapports.tsx` (salon + période ensemble,
  micro-labels gardés — pour Rapports, le conteneur des filtres garde
  `print:hidden`, le titre lui-même reste imprimé), `Journal.tsx` (salon +
  `JournalPeriodPicker` ensemble ; le filtre de rôle « Voir les actions »
  reste sous la carte), `equipe/PlanningPanel.tsx` (son filtre salon propre à
  l'onglet Planning passe en `variant="tinted"` pour l'harmonie visuelle, mais
  reste sous la carte — associé au navigateur de semaine, pas au bandeau de
  page). Micro-copie alignée au passage : le bouton du tableau de bord disait
  « + Nouveau RDV », RendezVous.tsx disait « + Nouveau rendez-vous » pour la
  même action — `dashboard/DashboardHeader.tsx` repris sur ce libellé.
  `npx tsc --noEmit` + `npm run lint` verts sur les fichiers touchés (mêmes 4
  problèmes pré-existants ; une erreur `tsc` intermittente sur
  `rendezvous/BookingDialog.tsx` observée pendant ce travail est due à une
  édition en cours d'une session parallèle sur `lib/mock/rendezvous.ts`, sans
  rapport avec ce chantier).

## Refonte de la fiche cliente (2026-09-21)

Demande explicite de l'utilisatrice : « changer complètement l'UI » du
panneau latéral de la fiche cliente (`/clients/[id]`), en passant par les
skills de design disponibles. Enchaînement suivi (aucun skill nommé
« impeccable » n'existait avant que le hook de design du projet ne le
révèle — voir `.claude/skills/impeccable/`, installé localement mais absent
de la liste de skills tant qu'aucun fichier UI n'avait encore été édité dans
la session) :

1. **`design-critique`** sur une capture Playwright de l'état existant —
   constats retenus : les 4 tuiles « Résumé » à poids égal noyaient
   dernière visite/total dépensé (ce que la propriétaire regarde en premier,
   cf. design.md), les deux boutons d'en-tête (« Historique complet » /
   « Supprimer ») concurrençaient une action primaire absente, aucune touche
   de marque dans tout le panneau.
2. **`frontend-design`** pour la refonte elle-même — voir `ClientDetailModal`
   dans la carte du code ci-dessus pour le détail (carte héros teintée,
   CTA unique, métriques en vedette).
3. **`impeccable`** (commande `context` puis lecture de `craft-floor.md` +
   `operate.md`) pour la passe de finition — a fait revenir la direction vers
   la restreinte attendue d'une surface *Operate* (« product defaults to
   Restrained », « consistency over surprise ») plutôt que le maximalisme que
   `frontend-design` encourage par défaut, et a fait remonter deux défauts
   concrets corrigés dans la foulée : mélange d'icônes de familles
   différentes (glyphe téléphone en trait de `messagerie/glyphs` à côté d'une
   icône enveloppe en aplat de `@/icons` — retiré, contact affiché en texte
   simple comme le reste de l'app) et quelques `text-gray-400` posés sur du
   contenu réel plutôt que sur les micro-labels (contraste insuffisant) —
   remontés en `text-gray-500`, la couleur de texte secondaire déjà standard
   du projet.

`ClientDetailActions.tsx` restylé au passage (action de suppression seule,
en lien discret plutôt qu'en bouton bordé). `detail/DetailIdentityHeader` et
`detail/StatTile` n'ont pas bougé : cette fiche ne les utilise plus (la
composition héros ne rentre pas dans leur gabarit générique), mais
`RendezVousDetail` et `StockDetail` continuent de s'appuyer dessus sans
changement. Vérifié par capture d'écran (Playwright + Chromium headless
local, avant/après/final) ; `npx tsc --noEmit` et `npm run lint` verts
(mêmes 2 erreurs + 2 warnings pré-existants, rien de nouveau).

Travail mené sur un working tree partagé avec d'autres sessions en
parallèle (voir [[multi-session-shared-worktree]]) : coordination par
`SendMessage` sur l'usage du serveur de dev (`npm run dev`) après qu'une
session voisine a signalé une corruption du cache Turbopack causée par
plusieurs `next dev` sur le même `.next/dev` — cette session est restée sur
le port 3002.

### Deuxième passe : mise en page à deux colonnes (2026-09-21)

Nouvelle demande explicite de l'utilisatrice, cette fois avec une référence
visuelle fournie (capture d'une fiche patient à deux colonnes : photo +
infos à gauche, vitals/rapports/prescriptions à droite) : reprendre cette
disposition pour la fiche cliente, en gardant absolument toute l'info/les
stats déjà présentes (rien à supprimer, seulement redisposer). Skill
`impeccable` de nouveau, cette fois en refonte incrémentale sur l'implémentation
en place plutôt qu'en nouvelle direction visuelle (le monde visuel de la
première passe — carte héros teintée, cartes blanches bordées — est
conservé, seule l'architecture d'information change).

Mapping retenu (voir `ClientDetailModal` dans la carte du code ci-dessus
pour le détail complet) : colonne gauche = identité (héros + informations +
préférences, cette dernière descendue sous les informations comme demandé) ;
colonne droite = ce qui se mesure — les « vitals » de la référence
deviennent les 4 stats du client (uniformisées, l'ancienne distinction
`HeroStat lead` disparaît au profit d'un jeu de cartes égales, plus proche
de la référence) ; les « rapports » deviennent les avantages en cours
(abonnement/pack/carte cadeau, passés d'une liste à des cartes cliquables
ouvrant une fenêtre de détail) ; les « prescriptions » deviennent les
rendez-vous (à venir + historique, tableaux `DataTable` inchangés).

Deux défauts trouvés et corrigés pendant la vérification par capture
d'écran : (1) les cartes de la grille `grid-cols-3` étaient des flex-items
`items-start` sans largeur explicite — le texte du libellé débordait de la
carte au lieu d'être tronqué (le conteneur `flex flex-col items-start`
laisse ses enfants se dimensionner à leur contenu plutôt qu'à la largeur du
parent) ; corrigé en donnant une largeur fixe à la carte et en passant du
`truncate` à `line-clamp-2` pour ne pas couper les noms de forfait au
milieu d'un mot. (2) le conteneur en `grid grid-cols-3` laissait des
colonnes fantômes visibles quand une cliente a moins de 3 avantages ;
remplacé par `flex flex-wrap` (cartes à largeur fixe `w-52`) qui ne réserve
plus d'espace pour des cartes absentes.

Carte cadeau : contrairement à l'abonnement et au pack (rattachés à la
cliente via `clientId` dans `@/lib/mock/abonnements`), elle ne vit que sur
le rendez-vous qui l'a mobilisée (`RdvAdvantage` dans
`@/lib/mock/rendezvous`) — retrouvée en scannant `allRendezvous()` pour les
avantages `kind: "carte-cadeau"` du client (aucune autre fixture ne la
rattache directement à une cliente). Vérifié sur `c01` (Awa Diop — a les
trois types : abonnement à jour + carte cadeau) et `c04` (Aïcha Ba — carte
cadeau seule, aucune préférence en boissons différente) par capture d'écran
(Playwright + Chromium headless local, port 3010, arrêté après usage —
coordination `SendMessage` avec les sessions voisines sur le cache
Turbopack partagé) ; `npx tsc --noEmit` et `npm run lint` verts sur le
fichier (aucune erreur nouvelle).

## Nettoyage hiérarchie visuelle (2026-09-21)

Demande explicite de l'utilisatrice : passer sur tous les écrans (hors
Agenda RDV et onglet Planning d'Équipe, tout juste refaits sur mesure — voir
« Refonte Planning/Agenda » plus haut) pour clarifier la hiérarchie visuelle,
aérer, retirer les tags non pertinents et remplacer les couleurs
jaunes/ambrées qui lisaient comme un remplissage générique d'IA plutôt que
comme une vraie décision de design. Revue systématique (recherche de tous
les badges/`warning-*`/littéraux ambre sur les écrans du périmètre) plutôt
qu'une réécriture large : l'essentiel des badges déjà en place (statuts RDV,
« À relancer », couverture de stock, « À affecter », demandes RH en attente…)
portent une vraie information dérivée de la donnée — laissés tels quels, ce
ne sont pas du remplissage. Trois correctifs concrets en ont découlé :

- `dashboard/NotificationsPanel.tsx` — badge « Urgent » (littéraux
  `#fdf4e7`/`#f6ddbe`/`#b87a28`, déjà signalés hors palette du projet dans la
  carte du code) retiré : ce panneau ne montre déjà que des actions qui
  demandent une décision, le badge était redondant.
- `PopularServices.tsx` — pastille « Tendances du mois » retirée : elle
  répétait ce que dit déjà le sous-titre juste au-dessus (« 30 derniers
  jours »).
- `ClientDetailModal.tsx` — barre + légende « À venir » de la répartition par
  statut passées de `warning-500` (ambre) à `blue-light-500` : la convention
  déjà en place ailleurs dans l'app (`RDV_STATUS_META`, `badgeColor` de
  `ListView`/`RendezVousDetail`) associe « à venir » au ton `info` (bleu), pas
  `warning` — la carte cliente était la seule à s'en écarter avec une couleur
  qui, en prime, lit comme le jaune « warning » générique des dashboards
  IA plutôt que comme un vrai signal d'alerte.

Le reste du périmètre (Clients, Services, Stock, Fidélité, Salons, Journal,
Rapports, Satisfaction, Réglages, Messagerie, Compte, RendezVous hors Agenda,
Équipe hors Planning) a été audité (grep exhaustif badges + couleurs +
lecture des fichiers denses type `ReportBuilderPanel`) sans trouver d'autre
tag décoratif ni d'amber hors palette — la hiérarchie/espacement de ces
écrans était déjà propre (héritage des passes « Harmonisation des titres de
page » et « Refonte Figma tableau de bord » plus haut).

### Passe de vérification formelle skill `impeccable` (suite, 2026-09-21)

L'utilisatrice a ensuite demandé explicitement une vérification via le skill
`impeccable` (`context` + captures Playwright sur le serveur de dev partagé,
plutôt que la revue de code seule ci-dessus) et l'application des correctifs
trouvés. Capture desktop 1440px de ~14 écrans (tous ceux du périmètre) : les
trois correctifs ci-dessus confirmés visuellement corrects, mais la capture a
mis en évidence un problème que la revue de code seule avait sous-estimé — le
badge « À relancer » de `ClientCards.tsx` (`Badge color="warning"`, un usage
**légitime** du token sémantique, pas un littéral hors palette) restait un
orange saturé qui lit exactement comme l'amber Tailwind générique dénoncé par
l'utilisatrice, malgré son usage correct. Corriger badge par badge aurait
laissé l'incohérence partout ailleurs (Journal, Services « Non réservable »,
alertes stock, étoiles de `Satisfaction`…).

**Correctif système retenu** : redéfinition de l'échelle `--color-warning-*`
dans `src/app/globals.css` (25 → 950), de l'amber Tailwind par défaut
(`#f79009` en 500) vers un ocre chaud propre à la marque (`#9f6528` en 500,
calculé en HSL puis vérifié au contraste WCAG — texte `warning-600` sur
`warning-50` : 5,9:1 ; blanc sur `warning-500` : 4,8:1, tous deux ≥ AA). Un
seul fichier change, tout consommateur du token (`Badge color="warning"`,
`Alert variant="warning"`, bordures/points `warning-500`/`warning-600`, etc.)
se retinte automatiquement — sémantique inchangée, seule la teinte devient
cohérente avec `brand-*`/`error-*`. Revérifié par capture d'écran sur
Clients (badges « À relancer »), Services (badges « Non réservable » + bandeau
« À ranger »), Journal (bordure gauche ton `notable`) et Satisfaction (étoiles
+ barres de répartition + bandeau d'alerte) : tous cohérents avec la palette
de marque après le changement, aucune régression de contraste.

**Écart volontaire de périmètre** : ce token est global, donc son changement
se répercute aussi visuellement sur l'Agenda RDV et le Planning d'Équipe
(exclus du reste de cette passe) — accepté sciemment : un jeton de design
system doit rester unique dans toute l'app, le laisser diverger juste sur ces
deux vues aurait recréé l'incohérence que « Refonte Planning/Agenda » avait
justement corrigée entre elles.

**Incident de working tree partagé rencontré pendant cette vérification** :
une deuxième session a démarré un second `next dev` (port 3010) pendant que
cette session utilisait déjà le serveur partagé sur le port 3002, provoquant
un verrou de cache Turbopack (routes non-root qui ne répondaient plus, 0 %
CPU) — même symptôme que l'incident déjà documenté plus haut. Coordonné par
`SendMessage` (arrêt du 3010, puis kill + suppression de `.next` + relance
propre du 3002 par cette session, communiqué aux sessions voisines avant et
après). Un autre pic de coordination a eu lieu au même moment : une session
tierce (refonte Kanban de `/services` à venir) attendait que toutes les
sessions actives passent `idle` avant de démarrer, pour éviter d'éditer le
même working tree en parallèle sans le savoir.

`npx tsc --noEmit` et `npm run lint` vérifiés après le changement de token :
aucune erreur nouvelle sur les fichiers touchés (le total de warnings du
dépôt reflète le travail non commité d'autres sessions sur ce même working
tree, pas ce chantier).

## Refonte fonctionnelle RDV/Planning (2026-09-21)

Suite de « Refonte Planning/Agenda » plus haut, qui n'avait porté que le
visuel. Demande explicite de l'utilisatrice : reprendre aussi le
FONCTIONNEMENT des écrans Rendez-vous et Planning de point-de-vente (lecture
explicitement autorisée pour cette tâche). Un audit comparatif (lecture
complète des deux codebases) a listé 9 écarts fonctionnels réels, dont un
structurel — point-de-vente modélise une **réservation multi-bénéficiaires**
(plusieurs personnes par RDV, prestation à 2 praticiennes, extras boissons/
produits) alors que back-office n'avait qu'un client par RDV. Choix explicite
de l'utilisatrice, après clarification du compromis : tout reprendre, y
compris ce modèle structurel.

**Décision de conception clé — extension additive, pas de refonte du type** :
plutôt que de restructurer `RdvDetail.prestations` en
`beneficiaires[].prestations[]` (aurait cassé tous les consommateurs), le
tableau `prestations` reste plat et `RdvPrestation` gagne des champs
optionnels/nouveaux (`secondStaff`, `start` explicite, `beneficiaryName`,
`beneficiaryClientId`) + `RdvDetail` gagne `extras`/`cancelReason` — voir
l'entrée `rendezvous.ts` dans la Carte du code pour le détail des types et des
helpers (`staffBusyWindows`/`isStaffFreeForWindow`/`timeToMinutes`/
`minutesToTime`). Les bénéficiaires multiples se lisent en groupant
`prestations` par `beneficiaryName` à l'affichage (même technique que
`beneficiaryGroups` de point-de-vente), sans nouveau niveau d'imbrication.
Grâce à cette approche additive, la quasi-totalité des ~10 écrans qui
consommaient déjà `RdvDetail` a compilé sans changement — seuls les
« écrivains » (`BookingDialog`, et le nouveau `EditRdvDialog`) ont dû être mis
à jour.

**Fichiers touchés** — voir leurs entrées dans la Carte du code ci-dessus pour
le détail : `lib/mock/rendezvous.ts` (modèle + helpers + migration des seeds +
2 RDV de démo montrant bénéficiaires multiples/à deux/extras — `rdv-3007`,
`rdv-3008`), `lib/mock/services.ts` (`Prestation.twoPractitioners`,
`Product.priceFcfa` sur les boissons, `productKind`/`sellableExtras`),
`context/PlanningContext.tsx` (nouveau — lève `absences`/`shiftOverrides` de
`Equipe.tsx` en état partagé), `(admin)/layout.tsx` (`PlanningProvider`),
`Equipe.tsx` (consomme `usePlanningData()`), `rendezvous/BookingDialog.tsx`
(bénéficiaires multiples, à deux, extras, calcul de créneau sur toute la
fenêtre + disponibilité réelle de la praticienne choisie),
`rendezvous/EditRdvDialog.tsx` (nouveau — édition d'un RDV existant),
`RendezVousDetail.tsx` (regroupement par bénéficiaire, extras, préférences
client, branchement Modifier/Nouveau RDV), `rendezvous/DayTimeline.tsx` +
`rendezvous/WeekTimeline.tsx` (menu par ligne, réordonnancement, lecture
directe de `start`), `rendezvous/ListView.tsx` (composition),
`RendezVous.tsx` (état d'isolement/ordre, `usePlanningData()`, mutations
étendues, câblage `planningData` vers `BookingDialog`/`RendezVousDetail`).

**Bug trouvé et corrigé en cours de route** : l'action rapide « Marquer
absente aujourd'hui » de l'agenda écrivait bien dans `PlanningContext`, mais
`AgendaView` appelait encore `weekPresence(scope, monday)` **sans** passer les
données du contexte — l'agenda continuait donc à lire les seeds figées de
`planning.ts` et n'affichait jamais l'absence tout juste posée (repéré par
capture d'écran, l'absence n'apparaissait pas alors que la soumission du
dialogue fonctionnait). Corrigé en passant `planningData` à `weekPresence`
dans `RendezVous.tsx`, et par cohérence propagé aux autres consommateurs de
`presentPractitioners`/`presentPractitionersForPrestation` qui ne le
recevaient pas non plus (`RendezVousDetail.tsx`, `BookingDialog.tsx`,
`EditRdvDialog.tsx`) — sans ce fil, affecter une praticienne fraîchement
posée absente serait resté possible depuis ces écrans même après correction
de l'agenda. Vérifié par capture d'écran : absence posée depuis `/rendez-vous`
→ visible immédiatement dans l'agenda (zone grisée « Congé ») ET dans
`/equipe?vue=planning` (cellule vidée, bandeau de trou de couverture mis à
jour).

**Ce qui n'a pas été porté** (périmètre assumé) :
- Pont vers l'encaissement (`Encaisser`/vente) — pas de caisse dans ce
  produit, déjà une règle établie.
- Annulation par ligne avec son propre motif (point-de-vente en a une EN PLUS
  de l'annulation globale) — seulement « Retirer » une ligne (suppression) +
  annulation du RDV entier avec motif.
- Édition des extras après création — ajout possible seulement à la création,
  comme côté point-de-vente qui ne les modifie jamais non plus.
- Avantages (abonnement/pack/carte cadeau) restent au niveau du RDV entier,
  pas par bénéficiaire.
- Isolation d'une ligne de praticienne (agenda) et réordonnancement ne sont
  PAS persistés dans l'URL (`?staff=`) contrairement à d'autres deep-links du
  projet (`?membre=`, `?produit=`) — état local à l'écran, simplification
  assumée pour ne pas inventer un nouveau pattern de sync URL bidirectionnelle.
- « Créer un RDV depuis la fiche d'un RDV existant » : seulement depuis le
  panneau ouvert par clic dans `/rendez-vous` (accès à l'état de session) —
  pas depuis la page standalone `/rendez-vous/[id]` ni la route interceptée
  (limitation déjà existante : `rendezvousDetail(id)` lit les seeds figées,
  pas l'état de session d'un autre montage).
- `Dashboard.tsx`/`TodayAppointments.tsx` (modèle `SalonAppointment` de
  `beautyandco.ts`) et `ClientDetailModal.tsx` (modèle `ClientVisit`) restent
  sur leurs modèles parallèles actuels, déjà désynchronisés de
  `rendezvous.ts` avant cette refonte — dette préexistante, hors périmètre.

Vérifié par `npx tsc --noEmit` et `npm run lint` (verts, mêmes 4 problèmes
pré-existants documentés en « Nettoyage du template » — plus les warnings de
`.claude/skills/impeccable/scripts/*.js`, des fichiers vendored d'un skill,
hors périmètre `src/`, non modifiés ici) et par capture d'écran (Playwright,
serveur de dev partagé sur le port 3002 — voir « Nettoyage hiérarchie
visuelle » ci-dessus pour le contexte de coordination multi-session) : fiche
RDV multi-bénéficiaires + extras (`rdv-3007`), prestation à deux praticiennes
(`rdv-3008`), agenda Jour (bénéficiaires en parallèle sur deux lignes, bloc
« à deux » dupliqué sur les deux lignes concernées), menu par ligne (isoler/
afficher tout), dialogue d'absence rapide + reflet croisé agenda ↔ Planning
d'Équipe.

## Refonte Kanban du catalogue Services (2026-09-22) — remplacée, voir « Carte des services » (2026-09-27)

Demande explicite de l'utilisatrice, en deux volets : (1) partout où l'app
affichait des **listes** (tableaux, lignes empilées), privilégier des
**blocs** (cartes) ; (2) refondre entièrement l'UX de l'écran **Services** en
**tableau Kanban** — colonnes = catégories, cartes = prestations, clic sur une
carte → fiche détail en **panneau latéral droit** (grammaire déjà en place
ailleurs dans l'app, cf. « Fiches en panneau latéral droit »), colonnes
**réordonnables par glisser-déposer**, catégories pouvant avoir des
**sous-catégories** (exemple donné : Coiffure → Défrisage, Tissages…).
Autorisation explicite de s'écarter de `design.md` / de ce fichier où
nécessaire pour ce chantier ; **hors périmètre** : Agenda/Planning (RDV
`DayTimeline`/`WeekTimeline`, `equipe/PlanningPanel`), déjà refaits sur mesure
et non touchés ici.

**Modèle de données** — voir l'entrée `services.ts` dans la Carte du code
ci-dessus pour le détail complet : `Service.subcategories: Subcategory[]`
(lanes optionnelles, `[]` = prestations à plat) + `Prestation.subcategoryId?`
+ le dérivé `groupPrestationsBySubcategory`. Extension additive, même
principe que la refonte RDV/Planning ci-dessus (pas de rupture de
compatibilité pour les consommateurs existants du catalogue). Seule Coiffure
(41 prestations) a reçu des sous-catégories seed (`Défrisage` /
`Extensions & tissages` / `Coiffage & poses` / `Shampoing & brushing` /
`Soins capillaires` / `Suppléments`, regroupement éditorial par famille de
geste — aucune donnée de sous-catégorie réelle n'existe côté point-de-vente) :
les 6 autres catégories n'en ont pas par défaut, la fonctionnalité étant
facultative, pas systématique.

**Écran** — voir l'entrée `Services` (+ sous-dossier `services/`) dans la
Carte du code ci-dessus pour le détail des composants. Le screen shell
(`Services.tsx`) est passé d'un modèle « vue plein écran » (liste / fiche /
nouveau / orphelins) à un modèle « plateau toujours monté + panneau
superposé » : `ServicesBoard` reste affiché en permanence, `CategoryPanel`
(fiche catégorie) et `PrestationPanel` (fiche prestation) s'ouvrent
par-dessus via `detail/DetailModal`, jamais de navigation plein écran — cf.
`view: "board" | "category" | "prestation"`.

**Glisser-déposer** — HTML5 natif (`draggable`, pas de `react-dnd`, déjà
signalé comme dépendance résiduelle à retirer), centralisé dans
`ServicesBoard` : une poignée dans l'en-tête d'une colonne réordonne les
catégories (calcul avant/après selon la position du curseur, gated sur
`scope === "all"`, même règle documentée que l'ancien réordonnancement par
flèches — un voisin masqué par le filtre salon donnerait l'impression que
rien ne bouge) ; une carte de prestation, elle, se glisse vers n'importe
quelle lane d'une autre colonne (ou vers la colonne épinglée « Sans
catégorie ») **quel que soit le filtre salon** — recatégoriser deux colonnes
déjà visibles n'a pas la même ambiguïté qu'un réordonnancement caché par le
filtre.

**Écarts assumés** :
- Suppression d'une catégorie : toujours déclenchée depuis le menu `⋯` de la
  colonne (plus de bouton dans la fiche panneau, pour ne pas dupliquer la
  confirmation à deux endroits) — la fiche `CategoryPanel` ne sert plus qu'à
  éditer, pas à supprimer.
- Une prestation orpheline (catégorie supprimée) n'ouvre pas de fiche panneau
  au clic — `PrestationPanel` a besoin du service parent pour son contexte
  (salons par défaut, sous-catégories, titre). `UnassignedColumn` remplace
  l'ancien écran `OrphansPanel` par un bloc dédié par prestation/question,
  avec son propre sélecteur « Rattacher à… » et une suppression directe.
- Le vocabulaire visible a basculé de « service » à « catégorie » dans tous
  les textes utilisateur du parcours (`ServiceInfoForm`, `QuestionsPanel`,
  `PrestationPanel`) pour matcher la grammaire du Kanban — le type de données
  reste `Service` (renommer le type aurait touché des dizaines de fichiers
  hors périmètre pour un gain cosmétique).

**Passage listes → blocs (volet 1)** — audit de tous les écrans utilisant
encore `<Table>`/`DataTable` (recherche exhaustive), en dehors du chantier
Kanban ci-dessus :
- `equipe/EquipeList.tsx` et `stock/StockList.tsx` convertis en grille de
  cartes (même grammaire que `ClientCards`, déjà passée en cartes le
  2026-09-21) — voir leurs entrées dans la Carte du code ci-dessus.
- `ClientDetailModal.tsx` (2 `DataTable` — rendez-vous à venir / historique
  des visites) et `ReportTable.tsx` (tableau généré de `/rapports`) **laissés
  en tableau** : données chronologiques/comparatives à plusieurs colonnes
  (date, prestations, montant, statut) où le tableau reste le bon outil de
  lecture, pas un remplissage par défaut — convertir en cartes aurait réduit
  la densité d'info sans bénéfice, et `ClientDetailModal` sort tout juste
  d'une refonte complète (2026-09-21) qu'il n'y avait pas lieu de rouvrir
  pour ça.
- `design-system/page.tsx` (vitrine du composant `Table` lui-même) non
  touché : exempté au même titre que le reste de cette page (démo, hors
  produit).
- Les autres listes de l'app (`Journal`, `messagerie/ConversationList`,
  avis clients de `Satisfaction`, contenu des fiches détail type
  `RendezVousDetail`/`StockDetail`) étaient déjà
  rendues en blocs bordés (`<li>`/`<div>` avec bordure, pas des lignes de
  tableau dense) ou sont des journaux chronologiques / boîtes de réception où
  une lecture en liste verticale reste le bon patron d'UI (pas des
  « produits » à parcourir) — non modifiées.

Vérifié par capture d'écran (Playwright + Chromium headless local, serveur de
dev partagé sur le port 3002 — coordination `SendMessage`, voir
[[multi-session-shared-worktree]]) : tableau complet (7 colonnes + lanes
Coiffure), fiche prestation (panneau), fiche catégorie (panneau, sous-
catégories éditables), colonne « Sans catégorie » (question orpheline seed
`q-rappel`), glisser-déposer d'une carte entre deux catégories, glisser-
déposer d'une colonne (réordonnancement), gating du réordonnancement sur
salon filtré (poignées absentes), création d'une catégorie, plus `/stock` et
`/equipe` après conversion en grille de cartes. `npx tsc --noEmit`
et `npm run lint` verts sur les fichiers touchés (mêmes problèmes
pré-existants documentés en « Nettoyage du template », rien de nouveau).

## Audit de parité point-de-vente (2026-09-22)

Demande explicite de l'utilisatrice, en son absence (« reviendra dans quelques
heures pour valider ») : comparer le userflow et les fonctionnalités de tout le
back-office avec le projet frère `point-de-vente`
(`/Users/jcb/Desktop/Homonyme/point-de-vente`, lecture explicitement autorisée
pour cette tâche), point-de-vente faisant autorité — sauf pour ce que
back-office a livré dans les dernières 24 h et que point-de-vente n'a pas
encore (parité RDV/Planning du commit `0e286e3`, panneaux latéraux,
refonte Figma du tableau de bord). Consigne : décider et corriger en
autonomie, ne remonter à l'utilisatrice que ce qui est extrêmement risqué ou
pourrait casser ce qui vient d'être stabilisé.

Méthode : 5 agents de recherche en parallèle (lecture seule) couvrant
Clients/Clientèle, Équipe/Messagerie, Compte/Réglages/Dashboard,
Fidélité/Cartes cadeaux/Salons, et Rapports/Satisfaction/Journal — chacun
avec pour consigne explicite de ne pas retraiter ce qui était déjà aligné
(Agenda RDV, Planning d'Équipe, réservation multi-bénéficiaires — refaits le
2026-09-21). Coordination avec les 3 autres sessions actives sur le même
working tree (`back-office-e3`, `-10`, `-75`, voir
[[multi-session-shared-worktree]]) : `back-office-e3` gardait Services (Kanban
en cours, comparé séparément une fois stabilisé — voir plus bas) ;
`back-office-10` et `-75` n'avaient pas reçu d'autorisation de lire
point-de-vente dans leur propre conversation (à raison, cf. règle « Périmètre
de travail » de ce fichier — un pair ne peut pas relayer cette autorisation) :
cette session a donc fait toute la lecture comparative elle-même.

**Corrigé directement (sûr, réversible, ne touche pas aux commits des
dernières 24 h)** :
- **Clientèle** : back-office n'avait aucun moyen de créer une cliente ni
  d'éditer sa fiche (`ClientsContext.tsx`, nouveau — overlay de session ;
  `ClientEditDialogs.tsx`, nouveau — `NewClientDialog` / `EditCoordonneesDialog`
  / `EditPreferencesDialog` ; `ClientDetailRoute.tsx`, nouveau — pour que les
  deux routes `/clients/[id]` restent valides sur une cliente créée en
  session) + notes internes sur la fiche + filtre « Nouvelles » + téléphone/
  email cliquables (`tel:`/`mailto:`) + badge de palier de fidélité dérivé des
  points. Voir les entrées `ClientsContext.tsx` / `ClientEditDialogs.tsx` /
  `ClientDetailRoute.tsx` / `ClientDetailModal` / `Clients` dans la carte du
  code ci-dessus pour le détail.
- **Messagerie ↔ Clientèle** : `Conversation.clientId?` + `conversationByClientId`
  + lien « Voir les échanges » depuis la fiche cliente vers
  `/messagerie?client=<id>` — les deux écrans ne se croisaient jamais.
- **Mon compte** : import de photo rendu fonctionnel (pattern déjà utilisé par
  `stock/StockDetail.tsx`, jusque-là un bouton désactivé) ; le champ « mot de
  passe actuel » vérifie désormais réellement sa valeur au lieu d'accepter
  n'importe quoi de non vide.
- **Réglages / Paiement** : `paypalUsd` remplacé par deux toggles Wave /
  Orange Money — PayPal n'existe dans aucun des deux projets, alors que
  Wave/Orange Money sont les moyens de paiement mobile réellement modélisés
  côté point-de-vente (comptoir).
- **Fidélité** : base d'accumulation par défaut alignée sur la règle réelle de
  point-de-vente (10 pts / 1.000 FCFA, « par montant dépensé » plutôt que « par
  visite ») ; vocabulaire des paliers aligné (Argent/Or/VIP, comme
  `Cliente.tier`) ; multiplicateur du palier le plus haut corrigé (`10` → `250`,
  incohérent avec la progression des paliers précédents, repéré en touchant
  cette même ligne).

**Confirmé cohérent, aucune action** : Équipe (point-de-vente n'a pas d'écran
équivalent — un seul poste partagé, roster fondu dans son Planning par son ADR
0005), Satisfaction et Journal d'activité (aucun équivalent côté point-de-vente,
fonctionnalités propres au pilotage back-office), statuts de rendez-vous et
alerte d'absence du Dashboard (mêmes principes des deux côtés — pas d'étape de
confirmation manuelle), Stock et Salons (aucune modélisation équivalente côté
point-de-vente à comparer — couches que le comptoir n'a jamais eu besoin
d'avoir), recherche par email de `Clients` (back-office en avance, pas un
écart).

**Laissé de côté — structurel ou touche un chantier tout juste stabilisé,
à trancher par l'utilisatrice** :
- **Pré-remplissage de la cliente sur « Nouveau rendez-vous »** depuis sa
  fiche (aujourd'hui il faut retaper la recherche dans `BookingDialog`) et
  **praticienne préférée** sur la fiche cliente (absente du modèle,
  contrairement à point-de-vente) — les deux touchent `BookingDialog.tsx` /
  `RendezVous.tsx` / l'affectation de praticienne, tout juste stabilisés par
  la parité RDV/Planning du commit `0e286e3`.
- **Mobilité d'une praticienne entre salons** : back-office assume qu'une
  praticienne peut travailler à un salon différent chaque jour
  (`staff.ts`/`planning.ts`), alors que point-de-vente tranche explicitement
  l'inverse dans son ADR 0028 (« une praticienne n'est jamais aux deux salons
  en même temps », `salonId` fixe et permanent). Contradiction de modèle
  directe avec l'app faisant autorité, mais reconsidérer ça reviendrait à
  redessiner tout Planning/Agenda RDV tout juste refait — hors de portée d'une
  correction autonome.
- **Cartes cadeaux** : aucun écran de gestion/consultation du grand livre
  (soldes, passif total, historique) côté back-office. Point-de-vente n'en a
  pas non plus vraiment — son écran `/cartes-cadeaux` n'est qu'une file de
  préparation physique (impression/remise), l'émission et le paiement se
  faisant sur une plateforme externe (ses ADR 0002/0012). Manque fonctionnel
  réel pour la propriétaire (aucune des deux apps ne permet de piloter les
  cartes cadeaux), mais un nouvel écran + une nouvelle fixture, pas une
  correction ponctuelle.
- **Système de relances automatisées** (anniversaire / fidélité / réactivation
  / recommandation par SMS/WhatsApp, avec délais programmables) : existe côté
  point-de-vente (son ADR 0011 renvoie explicitement leur configuration à « un
  back-office hors de cette app » — probablement celui-ci), absent de
  back-office. Recouperait `Messagerie` + `Réglages > EmailsPanel` (qui ne
  couvre que des rappels par email) + `Fidélité` — nouveau modèle de données
  et nouvelle UI de configuration, pas une correction ponctuelle. Ne pas
  confondre avec la machine à états auto/bot/réceptionniste/manager du fil de
  conversation point-de-vente, elle-même spécifique à un poste comptoir tenu
  par du personnel — n'a pas de sens telle quelle pour un back-office
  mono-utilisateur.
- **Absence de notion de vente/transaction/mode de paiement** dans le modèle
  back-office : limite ce que `Rapports` peut jamais montrer (pas de
  répartition Wave/Orange Money/Espèces/Carte comme en caisse). Changement de
  modèle de fond, pas un patch — à ne traiter que si l'utilisatrice confirme
  en avoir besoin (le générateur actuel sert du reporting de gestion, pas la
  réconciliation de caisse quotidienne, qui n'a pas d'écran en back-office).
- **Acompte « identique pour toutes »** (`paiement.ts`) contredit le modèle
  réel de point-de-vente (acompte variable par réservation, décidé par une
  plateforme externe, jamais réglé dans l'app) — déjà noté comme écart connu
  dans l'entrée `abonnements.ts` de ce fichier, confirmé par cet audit avec la
  donnée réelle. Question de modèle (faut-il simuler un acompte variable, ou
  garder un réglage centralisé simplifié ?), pas une correction de fichier.

**Services vs point-de-vente/catalogue** (comparé à part, après stabilisation
du Kanban de `back-office-e3`) :

- **Constat de méthode** : point-de-vente n'a AUCUN écran de gestion du
  catalogue de prestations (poste de vente, pas d'admin) — le Kanban de
  back-office n'a donc pas d'équivalent visuel à comparer, écran légitimement
  nouveau. En revanche `lib/data/menu.ts` (source de vérité du catalogue
  partagé) contient des données réelles que back-office affirmait à tort ne
  pas exister — le vrai sujet de cette comparaison.
- **Corrigé directement** : prix retail réel des 78 produits Kérastase/marques
  (`services.ts`, `priceFcfa` — voir cette entrée dans la carte du code
  ci-dessus) — vérifié inerte sur le comportement de l'app avant de l'ajouter
  (`sellableExtras` filtre par `productKind`, indépendant de `priceFcfa`).
  Deux commentaires factuellement faux corrigés au passage (« aucun prix
  retail réel » / « aucune sous-catégorie réelle côté point-de-vente ») sans
  toucher au comportement.
- **Laissé de côté — touche le Kanban ou la parité RDV/Planning tout juste
  stabilisés, à trancher par l'utilisatrice** :
  - `twoPractitioners` : 8 prestations éligibles côté back-office contre 77
    sur 107 dans la donnée réelle (`twoPractitionersEligible`) — corriger
    ajouterait un 2ᵉ sélecteur praticienne à des dizaines de prestations dans
    `BookingDialog`/`EditRdvDialog`, zone tout juste stabilisée (`0e286e3`).
  - Taxonomie des sous-catégories Coiffure : 6 lanes éditoriales côté
    back-office contre 11 valeurs réelles plus fines côté point-de-vente
    (`subcategory`) ; Mini & Co : Hair/Spa fusionnés en une seule catégorie
    sans sous-catégories côté back-office, alors que point-de-vente les garde
    distincts. Mécaniquement une correction de données, mais un vrai
    arbitrage UX (lanes plus fines vs plus larges, cf. aisance logicielle
    moyenne de la persona) sur un Kanban dont le nombre de lanes vient d'être
    vérifié par capture d'écran — pas tranché en autonomie.
  - Structuration des produits par gamme (`categoryId`/`subcategory` sur
    `Product`, comme `PRODUCT_CATEGORIES`/`KERASTASE_GAMMES` côté
    point-de-vente) : perte de structure sans impact actuel (Stock fonctionne
    sans), mais toucherait `Stock`/`StockList`/`StockDetail`, hors du
    périmètre strict de `/services` — piste à documenter, pas à corriger seule.
- Aucune régression de compétences/disponibilité par prestation trouvée suite
  à la refonte Kanban (`membersForPrestation`/`isUnbookable` inchangés).

`npx tsc --noEmit` vert et `npm run lint` sans nouvelle erreur (mêmes
problèmes pré-existants) sur l'ensemble des fichiers touchés par cette passe.
Smoke-test HTTP (pas de capture Playwright, indisponible dans cette session)
sur `/clients`, `/clients/c01`, `/compte`, `/reglages`, `/messagerie`,
`/fidelite`, `/messagerie?client=c01` : tous 200, contenu attendu présent
(nom de la cliente, badge de palier, lien messagerie). Rien n'a été committé
(pas de demande explicite en ce sens) — à vérifier visuellement par
l'utilisatrice à son retour.

## Reprise du design system point-de-vente (2026-09-27)

Demande explicite de l'utilisatrice : « remplace autant que possible le design
system actuel et tes composants par ceux de point-de-vente » (lecture de
`/Users/jcb/Desktop/Homonyme/point-de-vente` autorisée par cette demande).

- **Fondations** (`src/app/globals.css`) — daisyUI 5 + thème unique
  « beautyco » **identique** à point-de-vente (base-100/200/300, primary
  `#886666`, secondary `#5c4444`, accent `#f3eeee`, neutral `#3a2d2d`, rayons
  field 8px / box 12px), `tw-animate-css`, alias façon shadcn (`card`, `muted`,
  `border`, `destructive`, `ring`…), dégradés des paliers de fidélité, anneau de
  focus rose `#fdcfca`, utilitaire `highlight-rose`. **Seul écart** : densité
  `--size-field` 0.35 → 0.3rem (champs/boutons 48px au lieu de 56px — poste
  souris, pas caisse tactile). Échelles `success` / `error` / `warning` /
  `blue-light` recalculées sur les teintes de point-de-vente (500 = teinte
  exacte ; remplace notamment l'ocre `#9f6528` du 2026-09-21). Fond de page
  `bg-base-200` (#f9f9f9). Échelle typographique +2px du back-office
  **conservée** (décision de lisibilité antérieure de l'utilisatrice).
  `next/font` expose désormais `--font-poppins` (`--font-heading`/`--font-sans`).
- **Dépendances** ajoutées (versions de point-de-vente) : `daisyui` (dev),
  `@radix-ui/react-{checkbox,dialog,dropdown-menu,popover,progress,radio-group,
  select,separator,switch,tabs,tooltip,visually-hidden}`,
  `class-variance-authority`, `clsx`, `tailwind-merge` 3, `tw-animate-css`.
- **Composants** — voir `ui/atoms`, `ui/molecules` et les enveloppes `ui/*`
  dans la Carte du code. Rebâtis dessus : `fidelite/ui` (`SectionCard` → `Card`,
  `Toggle` → `Switch` (zone de clic ramenée à la piste), `TextInput` / `SelectField`
  → `Field` + `TextInput` / `Select` Radix (sentinelle pour la valeur vide),
  `btnPrimary` / `btnOutline` = `buttonVariants`, `BackButton` partagé en
  pastille bordée), `reglages/emails/ui`, `equipe/ui` (`CheckPill` = puce
  `Pills`, `Avatar` accent/secondary), `detail/DetailModal` (→ `Dialog
  variant="side"`), `detail/StatTile` (→ `StatTile`), `DataTable`
  (habillage `DataTable` de point-de-vente, garde un vrai `<table>`),
  `shared/PersonCard`, `PageHeader` (→ `BoardHeader` : titre 30px sur le fond
  crème, sans carte), `rendezvous/BookingDialog` et `reglages/emails/
  TemplateEditorPanel` (overlays faits main → `Dialog`), menu compte.
- **Balayage de vocabulaire** sur ~115 fichiers (chaînes de classes
  uniquement, formatage d'origine restauré ligne à ligne) : gris froids
  TailAdmin → neutres chauds (`text-gray-800` → `text-base-content`,
  `-600` → `/70`, `-500` → `/60`, `-400` → `/45` ; `border-gray-*` /
  `#efe9e8` → `border-base-300` ; `bg-gray-50` → `bg-base-200`, `bg-gray-100` →
  `bg-muted`), `rounded-2xl` → `rounded-box`, ombres au repos retirées,
  `bg-brand-50` → `bg-accent`, `text-brand-700` → `text-secondary`, toasts →
  `bg-neutral`, boutons pleins / bordés / fantômes écrits à la main → classes
  daisyUI `btn` du `Button` de point-de-vente, champs → focus rose + `rounded-field`,
  cases natives → `checkbox checkbox-primary`. Exclus : `design-system/`
  (vitrine exemptée).
- **Non repris** : l'univers « Le Tableau » de point-de-vente (`Board` / `Lane` /
  `FlipChip`, propre à une caisse), son `DataTable` TanStack (dépendance non
  justifiée ici), ses tailles tactiles 56px, sa sidebar rail 104px (essayée puis
  remplacée à la demande par la sidebar Figma node `381:497`).

Vérifié : `npx tsc --noEmit` vert, `npx eslint src` = les 4 problèmes
pré-existants ; captures Playwright (Chromium headless, port 3002) relues
sur tableau de bord, rendez-vous (liste, agenda, réservation), fiche cliente,
services (Kanban + fiche prestation), fidélité, stock, connexion ; équipe,
réglages, messagerie, salons, journal, rapports, satisfaction et compte
chargés sans erreur console/hydratation mais pas encore relus visuellement.

## Intégration de la logique métier point-de-vente (2026-09-27)

Demande de l'utilisatrice, relayée par la session `back-office-6e` puis
confirmée dans cette conversation : comprendre la logique de point-de-vente en
gardant en tête que **le back-office définit ce que point-de-vente (et la
réservation en ligne b&co qu'il embarque) consomme** ; intégrer ce qui en
découle, supprimer ce qui n'a pas de sens au regard de cette logique, et
définir ici les questions / options de préférences clientes. Sources lues :
`lib/data/types.ts`, `menu.ts`, `notation.ts`, `boissons.ts`, `tiers.ts`,
`lib/prise-rdv/{data/booking-services.ts,planifier.ts,questions.ts}`, ADR 0016 et
0035.

**Supprimé (sans équivalent dans la logique consommatrice)**
- Choix de la vignette d'une catégorie parmi 7 pictogrammes prédéfinis
  (`ServiceIconKey`, `SERVICE_ICON_OPTIONS`, `SERVICE_ICONS`,
  `services/serviceIcons.tsx`, les 7 `src/icons/service-*.svg`) → **image
  importée** (`Service.image`, `shared/ImagePicker`), initialisée avec les
  visuels réels de la réservation.
- `Prestation.reservationMode` (praticienne nommée / première disponible / les
  deux) : la réservation pose la praticienne d'office (la moins chargée parmi
  les libres, `planifier.ts`) → remplacé par l'interrupteur réel « Réalisable à
  deux praticiennes ».
- Type de question de réservation « choix multiple » (la réservation ne pose
  que oui/non ou texte) et les deux questions fictives (« type de cheveux »,
  « rappel la veille »).
- Boissons dans le stock : famille à part, sans stock.
- Préférences « Général / Onglerie / Coiffure / Boissons » en listes de texte
  figées (`PREFERENCE_GROUPS`) → modèle de point-de-vente ; les consignes
  « Général » deviennent des notes internes.

**Intégré** — voir les entrées `services.ts`, `preferences.ts`, `fidelite.ts`,
`stock.ts`, `PreferencesContext`, `BoissonsPanel`, `PreferencesConfigPanel` et
`shared/*` de la carte du code : catalogue aligné sur la réservation (8
catégories, 11 sous-catégories Coiffure, 77 prestations « à deux », questions
réelles avec texte d'aide), onglet **Boissons** dans `/services` (prix réels :
4.500 / 3.500 / 3.900 FCFA), marques et gammes produits + filtre marque dans
`/stock`, paliers Silver / Gold / Platinum / VIP avec badges métalliques,
**Réglages › Préférences clientes** (questions et options, photos importables,
« posée à la caisse ») consommé par la fiche cliente, son édition et la fiche
RDV.

**Laissé en l'état (a un sens côté back-office, ou pas tranché)** : capacité
par poste des salons (contrainte physique utilisée par la prise de RDV
manuelle, même si le planificateur de point-de-vente n'en tient pas compte),
acompte centralisé (`paiement.ts`, déjà signalé), rôles d'équipe du back-office
(praticienne / caisse / manager vs coiffeuse / esthéticienne / ménage / accueil
côté point-de-vente — deux usages différents des rôles).

Les boissons et le catalogue restent en état local à `/services` (comme avant
pour les prestations) : une boisson ajoutée n'apparaît pas encore dans la
prise de RDV manuelle, qui lit les seeds.

Vérifié : `npx tsc --noEmit` vert, `npx eslint src` = les 4 problèmes
pré-existants ; captures Playwright relues (port 3002) : Kanban `/services`
(images réelles, sous-catégories, « À deux »), onglet Boissons, `/stock`
(marque · gamme, plus de boissons), Réglages › Préférences clientes + éditeur,
fiche cliente `c07` (badge Silver, préférences en pastilles photo, note
interne seed), dialog d'édition, puis ajout d'une réponse → nouveau passage
(compteurs et mise en avant mis à jour), aucune erreur console.

## Réduction des onglets imbriqués (2026-09-27)

Demande de l'utilisatrice (relayée par la session `back-office-6e`, confirmée
dans la conversation) : les onglets qui cachaient des **domaines différents**
dans une même page (Équipe : Membres / Planning / Autorisations ; Fidélité :
3 sections × sous-onglets, 2 niveaux ; Réglages : Paiement / Emails /
Préférences ; Services : Prestations / Boissons) posaient trois problèmes —
même pastille pour filtrer et pour naviguer, écrans invisibles depuis la
sidebar, aucune URL par onglet (retour navigateur cassé, pas de lien direct).
Les bascules qui montrent **les mêmes données** autrement (Liste / Agenda,
Jour / Semaine) sont gardées telles quelles.

- **Configuration sortie des pages de travail, regroupée dans Réglages** :
  autorisations par rôle (ex-Équipe), programme de fidélité — accumulation,
  paliers, récompenses — et forfaits & packs (ex-Fidélité). État levé dans
  `context/AutorisationsContext.tsx` et `context/FideliteContext.tsx` pour
  que Réglages (écriture) et Équipe / Fidélité (lecture) voient la même
  donnée. Fidélité = suivi seul (abonnements + packs vendus côte à côte) ;
  le double niveau d'onglets disparaît.
- **Réglages en page de paramètres** : colonne de sections groupées à gauche,
  contenu à droite, section dans `?section=` (liens, pas d'état local).
  Nouveaux ids : `fidelite`, `offres`, `autorisations`.
- **Onglets restants = routes** : `/equipe` + `/equipe/planning`,
  `/services` + `/services/boissons`, barre soulignée `PageTabs`. L'état de
  session de chaque module vit dans un fournisseur monté par le `layout.tsx`
  de la route (`equipe/EquipeData`, `services/ServicesData`) pour survivre
  au changement d'onglet. Compatibilité : `/equipe?vue=planning` redirige
  (307) vers `/equipe/planning` ; `?membre=` inchangé ; liens internes
  (`journal.ts`, `MemberActivityPanel`) mis à jour vers `/equipe/planning`.
- **Sidebar inchangée** (8 entrées, pas de sous-menus ni de groupes).
- **Non traité** : les panneaux Paiement / Emails gardent leur état local —
  changer de section de Réglages remet un brouillon non enregistré à zéro,
  comme avant avec la bascule.

Vérifié : `npx tsc --noEmit` vert, `npx eslint` = les 2 erreurs
pré-existantes (`ThemeContext`, `LocationContext`) ; codes HTTP de toutes les
nouvelles routes + redirection `?vue=planning` ; captures Playwright
(port 3002) d'Équipe (Membres, Planning), Services (Prestations, Boissons),
Fidélité, Réglages (Paiement, Programme de fidélité, Forfaits & packs,
Autorisations) ; clic sur l'onglet Planning puis retour navigateur → revient
sur `/equipe`, clic sur une section de Réglages puis retour → section
précédente ; aucune erreur console.

## Refonte de l'accueil (2026-09-27)

Demande explicite de l'utilisatrice : critique UX de chaque choix visuel de la
page d'accueil, puis refonte complète via le skill `impeccable` (structure
choisie parmi trois tirées : **« Décider d'abord »** ; blocs secondaires
conservés, restylés). Contrat de direction : `.impeccable/surfaces/src-app-admin-page-tsx.md`.

Constats principaux de la critique : les « RDV du jour » lisaient la liste
parallèle `salonsToday` de `beautyandco.ts` (prestations hors catalogue —
« Coloration » —, rien de cliquable) au lieu des vrais rendez-vous, et les
prestations sans praticienne du jour n'apparaissaient nulle part ; le nombre de
RDV était affiché 4 fois ; noms de personnes en pastille (un tag classe, il ne
nomme pas un sujet) ; boutons « Valider » / « Refuser » / « Commander » qui ne
faisaient qu'ouvrir une autre page ; 4 filtres pour 3 actions ; « Accès
rapides » en grandes tuiles au même poids que les décisions ; pourcentages sur
des effectifs de 2 ou 3 ; satisfaction sur 90 j dans une rangée « du jour ».

Nouvelle page (`back-office/Dashboard.tsx`) :
- `dashboard/today.ts` (nouveau) — `todayVisits(scope)` : les rendez-vous du jour
  lus dans `rendezvous.ts` (début, fin, phase passé / en cours / à venir par
  rapport à `today.currentTime`, praticiennes, prestations à affecter),
  `todayTitle` (« Jeudi 3 septembre », jour dérivé de `TODAY_ISO` — l'ancien
  `today.label` « mardi » de `beautyandco.ts` est faux et n'est plus lu ici).
- `dashboard/DashboardHeader.tsx` — titre = la date du jour ; filtre salon +
  « Nouveau rendez-vous » (seul bouton plein de la page). (Phrase-bilan sous le bandeau retirée le 2026-10-01.)
- `dashboard/DayDecisions.tsx` (nouveau, remplace `NotificationsPanel`) —
  « À régler aujourd'hui » : prestations sans praticienne des RDV encore devant
  nous (→ fiche RDV, « Affecter »), demandes de l'équipe rédigées en phrase
  depuis `staffRequests` (→ fiche membre, « Examiner »), alerte stock (« Voir le
  stock »), autre notif non lue warning/error (« Ouvrir ») ; un seul bouton
  bordé par ligne, `markRead` au clic ; état vide « Tout est en ordre ».
  **2026-09-28** : + rendez-vous annulés encore à venir (« <Payeuse> a annulé son
  rendez-vous », date · prestations · salon · motif, « Voir » → fiche RDV) —
  `cancellationNotifications()` de `rendezvous.ts` (seeds) + `push` / `remove` de
  `NotificationsContext` appelés par `RendezVous.tsx` à l'annulation / au
  rétablissement pendant la session.
  **2026-09-28** : + remises accordées à la caisse (« Remise de 5.000 FCFA accordée à
  <Cliente> », auteur · motif) — `remiseNotifications()` de `@/lib/mock/remises` ;
  « Voir plus » ouvre `dashboard/RemiseDialog.tsx` sur place (montant, total avant /
  après, motif, et trois lignes cliquables : cliente → `/clients/[id]`, rendez-vous →
  `/rendez-vous/[id]`, auteur → `/equipe?membre=`) ; marquée lue à la fermeture.
  **2026-10-02** (remplace les interrupteurs du 2026-09-28) : titre « À régler
  aujourd'hui · N » (N = lignes affichées) ; liste **regroupée par famille**
  sous intertitres (Rendez-vous, Équipe, Stock, Remises accordées, Autres
  alertes) ; menu **« Affichage »** (Radix, cases à cocher + compteurs, « Tout
  afficher ») pour écarter durablement une famille — préférence mémorisée en
  `localStorage` (`bo.accueil.alertes-masquees`, `useSyncExternalStore`), le
  bouton devient une pastille « N masquées » tant qu'un réglage est en cours,
  et une ligne de pied « Masqué : … (N éléments) · Tout afficher » signale ce
  qui est caché. Les autres alertes (paiement, avis) restent toujours visibles.
- `dashboard/DayFeed.tsx` (nouveau, remplace `TodayAppointments`) — « La
  journée » : fil unique tous salons, passé replié derrière une ligne
  dépliable, trait « Maintenant · 13:20 », « En cours » / « Prochain », pastille
  d'identité de la praticienne (`staff-colors`), « À affecter » en ton warning,
  chaque ligne → `/rendez-vous/[id]` (panneau latéral) ; états « salon fermé
  aujourd'hui » (`isClosed`) / « aucun rendez-vous » / « plus aucun d'ici ce soir ».
  « Ouvrir l'agenda » ne modifie plus le filtre salon global.
- `dashboard/TodayKpiCards.tsx` — une bande à filets sans titre (2026-09-28 : intitulé « Repères » retiré ; plus 4
  cartes) : rendez-vous réels du jour + répartition par salon, chiffre
  d'affaires du jour (ajouté — priorité n°2 du portrait, après les RDV),
  nouvelles clientes (valeur de la veille au lieu d'un %), satisfaction
  explicitement « sur 90 jours ».
- `PopularServices.tsx` — liste sobre (réservations + %) ; `POPULAR_30D` de
  `beautyandco.ts` réécrit sur des prestations réelles du catalogue.
- `dashboard/AccesRapides.tsx` — « Autres écrans » : liste de liens avec une
  ligne de description, en bas de page.
- `PageHeader.tsx` — titre `whitespace-nowrap` + `flex-[1_0_auto]` : les actions
  passent à la ligne au lieu de couper le titre (vaut pour tous les écrans).

Mise en page : décisions et journée côte à côte (1:1 sous 1400 px, 5:7 au-delà),
puis Repères, puis prestations + autres écrans. Vérifié : `npx tsc --noEmit`
vert, ESLint vert sur les fichiers touchés, `impeccable detect` sans alerte,
captures Playwright 1440 / 1280 (liste dépliée, filtre Sea Plaza).

## Rendez-vous repris de point-de-vente (2026-09-27)

Demande explicite de l'utilisatrice : récupérer les rendez-vous de
point-de-vente (`lib/data/planning.ts`, `SEED_RESERVATIONS` + `sundayRush`,
lecture autorisée par la demande) et les appliquer ici. Les anciens seeds de
`rendezvous.ts` sont remplacés, sauf les deux annulés (`rdv-2375`,
`rdv-3006` — point-de-vente n'a aucune réservation entièrement annulée, le
filtre « Annulés » et « Rétablir » restent démontrables).

- **Repris tel quel** : ids de réservation (`RV-…`, aussi dans l'URL
  `/rendez-vous/[id]`) et de prestation (`rdv-1a`…), prestations, heures
  demandées, durées (« à deux » déjà divisées par deux), bénéficiaires
  (amie, enfants, mari), extras boissons / produits, acompte (mentionné dans
  l'événement « Rendez-vous créé »), réservations toutes fraîches datées
  quelques minutes avant 13:20. La prestation annulée de point-de-vente
  (`rdv-2b`) est omise : le back-office n'a pas de statut par prestation.
- **Traduit** : jours relatifs ancrés sur `TODAY_ISO` ; salons fermés le
  lundi ici (depuis le 2026-09-28) → ce qui tombait un lundi passe au mardi,
  le « dimanche chargé » reste le dimanche 6 sept. ; clientes `cl-N` → fiches `PDV_CLIENT` (cl-7 → c11
  Sokhna Mbaye, cl-9 → c14 Yacine Thiam, les autres cl-N → cN) ; jours passés
  → « terminé ». Les avantages (abonnement c11, packs c02 / c03, cartes
  cadeaux c01 / c04) sont rattachés à leur réservation du jour.
- **Praticiennes** : l'équipe de point-de-vente (Bineta, Fatou, Gnagna…)
  n'existe pas ici. `fitPdvSeeds` recale chaque prestation au chargement du
  module, comme `fitSeedToSchedules` côté caisse : compétente (`canPerform`),
  présente dans ce salon ce jour-là (`presenceFor` — horaires,
  absences seed), jamais deux rendez-vous à la fois, la moins chargée
  d'abord ; heure demandée puis premier créneau libre ; « à deux » sans binôme
  → une seule praticienne à temps plein ; le salon d'origine sauf si l'autre
  permet d'affecter plus de prestations. Personne → « à affecter » à l'heure
  demandée (8 prestations sur 62, toutes dues au planning : jeudi Bineta
  Cissé en repos et Coumba en formation, samedi Mariama absente).
- `staff.ts` — compétences ajoutées pour couvrir les prestations reprises :
  Aïda (Manucure Spa Express, Jelly Pédicure, Mini Jelly Manucure, Mini Cutie
  Pédicure), Bineta Cissé (Hydrafacial, Golden VIP Facial, Pierres chaudes),
  Coumba (Perfect Manucure russe gel).
- `notifications.ts` — notifs « Nouveau rendez-vous en ligne » (Awa Diop,
  Soin du Dos) et « Paiement encaissé » (Fatou Ndiaye, 46.000 FCFA) repointées
  vers les nouvelles réservations ; « coloration complète » → « soin
  complet ». Commentaires de `abonnements.ts` mis à jour.

Vérifié : `npx tsc --noEmit` et ESLint verts sur les fichiers touchés ;
`/`, `/rendez-vous`, une fiche `RV-…`, `/clients/c01`, `/equipe/planning`
en 200 ; captures Playwright de l'accueil et de l'agenda du jour, aucune
erreur console.

## Carte des services (2026-09-27)

Demande de l'utilisatrice : évaluer d'autres représentations des prestations
que le Kanban (« comme un UX designer senior »), puis retenir l'option
« carte de services en sections continues + sommaire » (modèle Fresha /
Treatwell / Planity). Motifs : les colonnes d'un Kanban suggèrent un flux
alors que ce sont des catégories ; son interaction principale (glisser entre
colonnes) sert la tâche la plus rare (recatégoriser) ; 8 colonnes
déséquilibrées (43 prestations en Coiffure, 2 en Mini & Co · Spa) forçaient un
défilement horizontal ; prix non comparables ; aucune recherche.

- Écran : `services/ServicesCatalog` + `CategorySection` + `PrestationRow` +
  `UnassignedSection` (voir la carte du code). Les prestations restent des
  **blocs** bordés (demande du 2026-09-22 « blocs plutôt que listes »), mais
  alignés en colonnes durée / prix.
- Glisser-déposer supprimé : recatégorisation par le champ « Catégorie » de
  `PrestationPanel`, ordre des catégories par « Monter / Descendre d'un rang »
  dans le menu de section, rattachement des orphelins par sélecteur.
- Ajouts : recherche globale, filtres à compteurs, interrupteur actif inline
  par prestation, mention des prestations masquées par le filtre salon (les
  prestations d'une catégorie visible sont désormais aussi filtrées par
  `prestationsForSalon`, ce que le Kanban ne faisait pas).
- Action principale du bandeau : « Nouvelle prestation » (tâche fréquente)
  au lieu de « Ajouter une catégorie » (rare, désormais en pied du sommaire).

Vérifié : `npx tsc --noEmit` vert, ESLint vert sur les fichiers touchés,
captures Playwright 1440 px (port 3002) : page complète, saut Spa depuis le
sommaire, recherche « tissage », filtre Non réservables, fiche prestation
avec champ Catégorie, suppression d'une catégorie → section « Sans
catégorie », filtre Sea Plaza ; aucune erreur console.

## Affectation automatique des praticiennes (2026-09-27)

Règle métier fixée par l'utilisatrice : **toute prestation est affectée
d'office à une praticienne selon la disponibilité de l'équipe** — il n'y a
plus d'état « à affecter » ni d'option « Première disponible » à choisir.

- `lib/mock/rendezvous.ts` — section « Affectation automatique » :
  `coversWindow` (présence dans le salon + horaires, planning live),
  `availablePractitioners(list, prestationId, salon, iso, start, durée, {data,
  excludeRdvId, exclude})` (compétentes, présentes, libres, moins chargée
  d'abord) et `autoAssign(list, data)` : garde chaque affectation encore
  valable, réaffecte le reste, ne touche pas aux RDV clos/annulés, renvoie les
  mêmes objets si rien ne change. `staff === null` = **conflit** (personne ne
  peut la prendre, typiquement une absence posée après la réservation) →
  libellé « Aucune praticienne disponible », action « Déplacer ».
- Appliqué partout où les RDV sont lus : `RendezVous.tsx` (état brut
  `rawRdvs` → `rdvs` dérivé via `autoAssign(…, planningData)`, donc une absence
  posée depuis l'agenda réaffecte immédiatement), `dashboard/today.ts`
  (`todayVisits(scope, planningData)`), `equipe/planning-board/PlanningBoard`.
- `BookingDialog` : « Automatique — selon les disponibilités » par défaut ; un
  créneau n'est proposé que si chaque ligne y trouve une praticienne
  (`staffingAt`), résolue à la création. `EditRdvDialog` : idem à
  l'enregistrement d'une ligne / l'ajout. `RendezVousDetail` : carte
  « Affectation » → **« Intervenantes »** (changer d'intervenante parmi celles
  qui sont libres ; plus d'« Assigner tout le rendez-vous à »). `ListView`,
  `DayFeed`, `DayDecisions`, chip de `RendezVous` : plus de « À affecter ».
- Déplacer un RDV dans l'agenda décale désormais aussi `RdvPrestation.start`
  de chaque prestation (avant : seule `date` changeait).
- Données de démo recalées pour que toutes les réservations trouvent preneuse
  (0 prestation sans praticienne) : Bineta Cissé repos le **mercredi** (jeudi
  travaillé, cohérent avec `journal.ts` `jn-0244`), maladie de Mariama passée
  au vendredi 04/09, compétences ajoutées (Aïda : Smooth Pédicure, Silk Press,
  Soin Complet ; Coumba : Relax Me Time, Glow Me Facial, Golden VIP Facial).
- `autorisations.ts` : `rdv.assign` libellé « Changer la praticienne d'un
  rendez-vous ».

## RDV et clientèle repris de point-de-vente (2026-09-28)

Demande explicite de l'utilisatrice : reprendre la disposition et les détails
des écrans rendez-vous et clients de point-de-vente (lecture autorisée), en
gardant le panneau latéral, et résoudre les incohérences en prenant
point-de-vente pour autorité. Prime sur les descriptions plus anciennes de
`RendezVous`, `RendezVousDetail`, `ListView`, `Clients`, `ClientCards`,
`ClientDetailModal`, `ClientsContext` dans la carte du code.

- **Données clientes** (`beautyandco.ts`) : les dix clientes de la caisse
  (`cl-1` … `cl-10`, rattachées via `PDV_CLIENT` de `rendezvous.ts`) portent
  leur identité point-de-vente — c01 Awa Sarr, c02 Fatou Camara, c03 Coumba
  Thiam, c04 Bineta Diagne, c05 Mariam Kane, c06 Awa Niang, c08 Ndèye Diop,
  c10 Aminata Fall, c11 Sokhna Ndiaye, c14 Yacine Wade (renommées partout :
  abonnements, journal, messagerie, notifications). `ClientRow` gagne `number`
  (« N° 1006 »), `whatsapp`, `profession`, `residenceCountry`, `birthday`
  (« MM-JJ »), `ethnicity`, `tier` (palier **stocké**, comme `Cliente.tier` —
  plus dérivé des points), `preferredStaffId` ; visites et total dépensé = ceux
  de la caisse (`totals`) ; préférences et notes signées (auteur + origine)
  reprises, dates recalées de −22 j sur le « aujourd'hui » de démo. Historique
  ancien réécrit en prestations réelles ; plus de visites « à venir » fictives.
  Helpers : `clientMatchesQuery` (nom, e-mail, n° client, téléphone / WhatsApp),
  `formatBirthday`, `clientNumberLabel`, `ETHNICITY_*`, `PAYS_OPTIONS`.
- **`ClientsContext`** : jointure avec les vraies réservations
  (`allRendezvous()`) — RDV à venir, dernière visite, historique récent ;
  notes signées (`addNote(id, text, authorId)`, « owner » = la propriétaire) ;
  « Vues récemment » (`noteClientViewed`) ; `expectedToday`.
- **Répertoire `/clients`** : recherche d'abord + « Nouvelle cliente »,
  « Vues récemment » / « Attendues aujourd'hui », « Tout l'annuaire » filtré
  Toutes / Nouvelles / Historique (≥ 5 visites) / VIP (gold+), bloc cliente de
  la caisse (palier en drapeau, visites, total dépensé), création préremplie
  depuis une recherche vide. Retirés : filtre « À relancer », tri, suppression
  depuis la liste (la suppression reste sur la fiche).
- **Fiche cliente** (panneau latéral conservé, `max-w-6xl`) : disposition de
  `fiche-cliente-view.tsx` — bandeau collant (n° client, palier, « cliente
  depuis · dernière visite », Contacter, Nouveau rendez-vous →
  `/rendez-vous?nouveau=1&client=<id>`), ligne « en un coup d'œil »,
  Préférences / Abonnements & Packs / Échanges à gauche, Coordonnées
  (+ praticienne préférée) / Carte de fidélité / Notes internes à droite
  (interverties le 2026-09-28) ; en plus
  back-office : rendez-vous à venir et dernières visites. Chaque ligne liée à une
  réservation porte un bouton « Voir le détail » → `/rendez-vous/[id]` en
  panneau latéral (2026-09-28). Formulaires
  « Nouvelle cliente » et « Modifier les coordonnées » = ceux de la caisse
  (champs obligatoires, alerte de doublon de téléphone) + genre et salon.
- **`/rendez-vous`** : section « Rendez-vous » de l'Accueil de la caisse —
  recherche cliente ou n° de rendez-vous (champ maison 56px, contrasté, en tête
  à gauche de la bascule de vue — 2026-09-28 ; dates Du / Au sur la ligne dessous) (+ fiches clientes trouvées), dates
  Du / Au (défaut aujourd'hui) — plus de bascule des annulés (retirée le 2026-09-28, masqués sauf recherche par n°) ; vues **Liste**
  (`DayList` : par jour puis tranches de 2 h sur rail horaire, cartes
  payeuse · composition, heure, 3 lignes + « + N de plus », Total) et
  **Calendrier** (`ReservationCalendar`, un seul jour : un bloc par
  réservation) ; **Par praticienne** = l'agenda d'équipe existant (glisser-
  déposer, absences), gardé en plus. Plus de filtres de statut ni de
  praticienne. `reservationComposition` / `beneficiaryKind` ajoutés à
  `rendezvous.ts` (« 1 femme + 1 enfant »).
- **Fiche rendez-vous** : panneau de `appointment-detail-sheet.tsx` — référence
  de réservation en titre, créneau + « Réservé pour … », payeuse (palier,
  Fiche, puces d'avantages, préférences, dernière note), prestations groupées
  par bénéficiaire (Homme / Enfant, sous-total, « Couverte · <offre> » et prix
  barré via `rdvCoverage`), extras, Total, Modifier / Annuler la réservation
  (motif facultatif). Gardés du back-office : changement d'intervenante inline
  (`availablePractitioners`), rétablir une réservation annulée, historique.
  Retirés : suppression définitive, « Déplacer (depuis l'agenda) ».
- **Non repris** : Encaisser / Voir la vente, bande « Réservations reçues »,
  page carte de fidélité imprimable, file des cartes cadeaux.

## Refonte de l'écran Réglages (2026-09-28)

Demande de l'utilisatrice (« actuellement c'est vilain »), skill `impeccable`,
mode Operate, dans le monde visuel existant (design system point-de-vente).

- `back-office/reglages/kit.tsx` (nouveau) — grammaire commune de l'écran :
  `SettingsGroup` (bloc blanc, titre + description courte + action à droite,
  lignes séparées par un filet), `SettingsRow` (libellé + aide à gauche,
  contrôle à droite ; `wide` pour un champ/menu de 300px, `muted` quand un
  réglage parent est coupé), `UnitInput` (champ numérique + unité FCFA / % /
  points), `SaveBar` (barre d'enregistrement sombre `bg-neutral`, collante en
  bas, **n'apparaît qu'en cas de modification**, bloquée avec le motif si un
  champ est invalide — remplace les boutons « Enregistrer » grisés en pied de
  chaque carte), `SavedNote`, `ItemHeader` / `ItemRow` / `EmptyRow` (listes
  à colonnes alignées à droite, crayon + corbeille, suppression confirmée en
  ligne), `EditorPanel` (ajout / modification en panneau latéral `Dialog
  variant="side"`, pied Annuler / action).
- `Reglages.tsx` — colonne de sections à icônes lucide (sélection `bg-accent`
  / `text-secondary`, plus de filet gauche), grille 232px + contenu, largeur de
  contenu fixe 880px (1080px pour Préférences clientes et Autorisations),
  `key={section}` pour repartir d'un brouillon propre.
- Paiement, Emails (`emails/SettingsCards` : lien du site + rappels dans UN
  brouillon, aide dynamique « Part 1 jour avant le rendez-vous. » ;
  `emails/TemplateList` : liste de lignes au lieu d'une grille de cartes),
  Programme de fidélité (`fidelite/AccrualSettings`, `TiersPanel` avec badges
  métalliques, `RewardsPanel`), Forfaits & packs (`ForfaitsPanel`,
  `PacksPanel` : prix à l'unité barré + prix du pack) réécrits sur ce kit ;
  les formulaires d'ajout toujours ouverts ont disparu au profit du panneau
  latéral. Préférences clientes : onglets soulignés avec compteur (la pastille
  segmentée débordait), méta des questions en une ligne, tuiles photo de
  hauteur fixe. Autorisations : bandeau info bleu remplacé par une phrase,
  en-têtes de domaine en casse normale.
- `fidelite/ui.tsx` inchangé (partagé par Services, Équipe, Stock, Salons).

## Planning unique (2026-09-28)

Demande explicite de l'utilisatrice : la vue « Par praticienne » de
`/rendez-vous` reprend « ni plus ni moins » l'écran Planning de point-de-vente
(Jour en colonnes verticales, Semaine, filtre Coiffeurs / Esthéticiens). **Prime
sur toute description antérieure de l'Agenda de `RendezVous.tsx`**
(`AgendaView`, frise horizontale, bandeau de capacité, glisser-déposer d'un
RDV, menu d'absence avec `AbsenceDialog`).

- `RendezVous.tsx` monte `equipe/planning-board/PlanningBoard` avec `rdvs`
  (état de session déjà affecté), `onOpenRdv` (panneau latéral local),
  `showSalonFilter={false}` (le salon se règle dans le bandeau de la page) et
  `toolbarEnd` (la bascule Liste / Calendrier / Par praticienne). Sans ces
  props, `PlanningBoard` garde son comportement d'Équipe › Planning.
- Supprimés : `rendezvous/DayTimeline.tsx`, `rendezvous/WeekTimeline.tsx`,
  `planning/AbsenceDialog.tsx` (dossier `planning/` vidé), `AgendaView` /
  `CapacityBanner` / `occupancyAt` / `move` de `RendezVous.tsx`. Déplacer un
  RDV passe désormais par « Modifier » (`EditRdvDialog`), comme côté caisse ;
  une absence se pose par « Marquer absente aujourd'hui » du Planning.
- `planning-board/data.ts` : `schedulableMembers` inclut le ménage et trie
  coiffure → esthétique → ménage (`ROLE_RANK` de point-de-vente).
- Métier d'un membre : `equipe/MemberIdentityFields` — choix segmenté
  **Coiffure / Esthétique / Autre** (une praticienne doit être coiffure ou
  esthétique, sinon enregistrement bloqué) + **Genre** Femme / Homme
  (`Member.gender`, accorde « Coiffeuse » / « Coiffeur »). `EquipeList` filtre
  par Tous / Coiffeurs / Esthéticiens / Caisse / Managers / Ménage.

## Fiche rendez-vous en page (2026-09-28)

Demande de l'utilisatrice, sur une référence fournie (skill `impeccable`) : la
fiche rendez-vous n'est plus un panneau latéral mais une **page**. **Prime sur
toute description antérieure de `RendezVousDetail`** (panneau `Dialog
variant="side"`, prop `closeMode`, route interceptée).

- `RendezVousDetail.tsx` — barre du haut « ← Retour » / **« Modifier »**
  (`RescheduleRdvDialog` depuis le 2026-10-02, RDV à venir) ou « Rétablir le rendez-vous » (annulé) ; plus
  de « Reprogrammer ». En-tête : nom de la payeuse + palier + statut, n° de
  rendez-vous, Date / Horaire (+ durée) / Salon / Réservé pour, total à droite.
  Colonne principale : tableau **Prestations** (colonnes Prestation · Horaire
  début–fin + durée · Praticienne(s) avec photo, sélecteur pour changer
  d'intervenante et 2ᵉ praticienne si « à deux » · Prix, barré si couvert),
  groupé par bénéficiaire si plusieurs, boissons & produits, Total ; questions
  de réservation ; historique ; « Annuler le rendez-vous ». Colonne droite
  collante : payeuse (Fiche, téléphone / WhatsApp / e-mail cliquables,
  avantages, préférences, dernière note) + préférences des autres
  bénéficiaires qui ont une fiche. Alertes : praticienne demandée absente,
  prestations sans praticienne disponible.
- `RendezVous.tsx` — un clic sur un rendez-vous (Liste, Calendrier, Par
  praticienne) affiche la fiche **à la place de l'écran**, branchée sur l'état
  de session ; « Retour » rend la liste telle qu'on l'a laissée.
- `/rendez-vous/[id]` (tableau de bord, fiche cliente, notifications, URL
  directe) rend la même page, autonome (seeds) ; « Retour » = historique du
  navigateur, sinon `/rendez-vous`.
- Pas de « Supprimer définitivement » (retiré le 2026-09-28 au profit de
  l'annulation, cf. « RDV et clientèle repris de point-de-vente »).

## Disponibilité des prestations et stock vente / prestations (2026-09-28)

Demande de l'utilisatrice. **Prime sur les descriptions antérieures** de
`Prestation`, `PrestationPanel`, `ServicesData`, `stock.ts`, `StockList`,
`StockDetail`, `Stock`.

- **Jours de disponibilité d'une prestation** — `Prestation.availability?:
  PrestationAvailability | null` (`services.ts`, même forme que les heures d'un
  salon ; absent = heures d'ouverture du salon) + `defaultAvailability`,
  `prestationAvailableAt`, `availabilitySummary`, `weekdayOfIso`.
  `PrestationPanel` : « Jours de disponibilité » — Comme le salon / Jours
  précis (réutilise `salons/HoursEditor`, qui gagne `closedLabel` /
  `openLabel`). `PrestationRow` : mention « Jours limités » (détail au
  survol). Appliqué à la prise de rendez-vous : `PlanContext.availabilityOf`
  dans `lib/prise-rdv/planifier.ts` (`planAt` refuse un horaire hors des jours /
  heures de la prestation), alimenté par `prise-rdv-modal.tsx` depuis
  `useServicesData()`. Pour ça, `ServicesDataProvider` est monté par
  `app/(admin)/layout.tsx` (et `app/(admin)/services/layout.tsx` supprimé).
- **Périodes d'indisponibilité** (2026-10-01) — `Prestation.unavailablePeriods?:
  PrestationPause[]` (`{ id, from, to, reason }`, bornes ISO incluses, en plus
  des jours de la semaine) + `pauseOn`, `upcomingPauses`, `pauseRangeLabel`
  (« du 1 au 12 sept. 2026 »), `pauseDayLabel`, `newPauseId` ; seeds
  `PAUSE_SEEDS` (Hydrafacial en cours, Silk Press à venir).
  `prestationAvailableAt` prend désormais les règles de la prestation
  (`availability` + `unavailablePeriods`) et `PlanContext.availabilityOf`
  renvoie la prestation entière. `services/PausesEditor.tsx` (nouveau) —
  bloc « Périodes d'indisponibilité » de `PrestationPanel`, sous les jours de
  disponibilité : liste (« En cours », motif, nombre de RDV déjà pris sur la
  période via `allRendezvous()`), ajout Du / Au / Motif facultatif (dates
  inversées ou chevauchant une autre période refusées, avertissement si des
  RDV existent — ils restent maintenus), retrait, compteur des périodes
  passées. `PrestationRow` : « Pause jusqu'au 12 sept. » (en cours, ocre) ou
  « Pause prévue » (à venir), détail au survol — « aujourd'hui » =
  `TODAY_ISO` de `@/lib/mock/planning`.
- **Deux stocks par salon** (`stock.ts`) : `StockUse` = `vente` /
  `prestations` (`STOCK_USES`, `STOCK_USE_LABELS`), `ProductUsage` = `vente` /
  `prestations` / `mixte` (`PRODUCT_USAGE_OPTIONS`, `productUsage`, `usesOf` —
  déduit des recettes pour les seeds : présent dans une recette = mixte).
  `ProductStock.prestations` = part du niveau réservée aux prestations (seeds :
  35 % pour un produit mixte). `StockMovement.use?` (déduit sinon :
  prestation → prestations, le reste → vente), `movementUse`, `poolOnHand`,
  `scopePoolOnHand` ; `StockRow.uses` / `pools`. La réserve centrale reste un
  seul stock, affecté au transfert. Totaux, seuils et projections inchangés
  (sur le total).
  - `StockList` : bascule « Tout le stock / Stock vente / Stock prestations » ;
    en « Tout », répartition « Vente · Prestations · Réserve » sous la
    quantité (ou « Vente uniquement » / « Prestations uniquement »).
  - `StockDetail` : répartition par salon dans « Où est le stock » ; Ajuster
    choisit le stock (Vente / Prestations) dans un salon ; Transférer choisit
    le stock de destination ; nouveau mode **Répartir** (`SplitForm`, d'un
    stock à l'autre dans un salon).
- **Ajout d'un produit** : bouton « Nouveau produit » du bandeau de `Stock` →
  `stock/NewProductPanel.tsx` (panneau latéral : photo, nom, marque, gamme,
  usage, prix de vente si vendu, unité de recette si utilisé en cabine, stock
  de départ par emplacement et par stock, seuils salon / entreprise, délai
  fournisseur). `registerProduct` / `newProductId` (`stock.ts`) ajoutent le
  produit au catalogue du module mock pour la session (liste, fiche, recettes
  de Services) — pas de persistance ; la fiche du nouveau produit s'ouvre.

## Incompatibilités entre prestations (2026-10-01)

Demande de l'utilisatrice : certaines prestations ne vont pas ensemble. Portée
retenue : **pas pour la même personne dans la même visite** (pas de délai
entre deux visites) ; l'effet est sur la **prise de rendez-vous**.

- `services.ts` — `Prestation.incompatibleWith?: string[]` ; relation
  symétrique : `incompatiblesOf(prestations, id)` la lit des deux côtés,
  `setIncompatibilities(prestations, id, ids)` l'écrit des deux côtés,
  `conflictWith(prestations, id, selected)` renvoie la prestation déjà choisie
  qui bloque. Seeds de démo `INCOMPATIBLE_SEEDS` : Soin Kératine ↔ les deux
  défrisages, Hydrafacial Deep Clean ↔ épilation menton / sourcils.
- `services/PrestationPanel` — section « Incompatible avec » (pastilles
  retirables + `fidelite/PrestationPicker`, qui gagne `label` / `catalog` /
  `excludeId`) ; `Services.tsx` applique `setIncompatibilities` à
  l'enregistrement et nettoie les références à la suppression.
  `PrestationRow` : mention « N incompatibles » (noms au survol).
- Prise de RDV (`prise-rdv-modal` → `steps/services-step` →
  `category-prestation-list`) : par bénéficiaire, une prestation incompatible
  avec ce qu'il ou elle a déjà choisi est grisée, non cliquable, avec « Ne
  peut pas être combinée avec <X> lors de la même visite. » ; le toggle du
  modal refuse aussi l'ajout ; les suggestions « Beaucoup ajoutent aussi » ne
  proposent jamais une prestation incompatible. Lit l'état de session de
  Services (`useServicesData`).
- **Non couvert** : `rendezvous/EditRdvDialog` (édition d'un RDV existant) ne
  contrôle pas ; un pack dont le contenu serait incompatible n'est pas signalé.

## Reprogrammer un rendez-vous (2026-10-02)

Demande de l'utilisatrice, sur une capture de référence (fenêtre
« Reprogrammer le rendez-vous » du site b&co), puis passe `impeccable polish`.
**Prime sur toute description antérieure d'`EditRdvDialog`** (supprimé :
édition ligne par ligne, praticienne / bénéficiaire / horaire par prestation,
annulation — l'annulation reste sur la fiche, l'intervenante se change sur la
ligne de la fiche).

- `rendezvous/RescheduleRdvDialog.tsx` — ouvert par « Modifier » sur la fiche
  rendez-vous. Rappel de l'existant sous le titre (« actuellement jeudi 3
  septembre 2026 à 15:00, Almadies ») ; **Nouvelle date** (`DatePicker`, pas de
  jour passé) ; **Salon** (une carte par salon actif : nom, adresse, « Ouvert
  de 10:00 à 20:00 » ou « Fermé ce jour-là » ce jour-là — à la place du
  « Prix rendez-vous » de la référence, l'acompte étant le même partout) ;
  **Horaire** (créneaux par demi-heure groupés Matin / Après-midi / Soir,
  calculés par `availableTimes` de `@/lib/prise-rdv/planifier` sur toute la
  visite, rendez-vous en cours exclu de l'occupation ; horaire actuel en
  pointillé) ; **Prestations** repliées (résumé « N prestations · durée ·
  total », « Modifier les prestations » → onglets par personne si plusieurs,
  pastilles des prestations choisies, recherche pliée sans accent, liste à
  cocher par catégorie avec durée et prix, incompatibilités grisées). États :
  salon fermé, prestation non proposée dans le salon choisi, aucun horaire
  libre, aucune prestation. Pied : nouveau rendez-vous en une ligne + « La
  cliente sera prévenue par email », « Confirmer la reprogrammation » actif
  seulement si un horaire est choisi et que quelque chose a changé.
- Confirmation : `planAt` repose chaque prestation (une personne enchaîne les
  siennes, les personnes en parallèle) en gardant l'intervenante actuelle si
  elle reste libre (2ᵉ praticienne d'une prestation « à deux » idem), sinon la
  moins chargée. `RendezVous.tsx` (`reschedule`) écrit date, salon,
  prestations et une entrée d'historique « Rendez-vous reprogrammé » (ancien →
  nouveau) ; route `/rendez-vous/[id]` autonome : changement local à la fiche.
- Les durées des lignes gardées sont celles du rendez-vous (« à deux » déjà
  divisées) ; une ligne ajoutée prend la durée et le prix du catalogue de
  session (`useServicesData`).

## Filtre salon multi-sélection (2026-10-02)

Demande de la propriétaire : prévoir un 3ᵉ salon (Abidjan). La bascule à
pastilles ne tient plus et ne sait pas dire « Almadies + Sea Plaza » → menu à
cases avec raccourcis par ville (`shared/SalonFilter`). **Rien ne change tant
qu'il y a 2 salons.**

- `beautyandco.ts` — `SalonScope` = `"all" | SalonId | readonly SalonId[]`
  (une liste a toujours 2+ salons sans les avoir tous). Helpers : `scopeIds`,
  `inScope(scope, id)` (**toujours** tester l'appartenance avec, jamais
  `=== scope`), `singleSalon` (le salon unique ou `null`), `scopeFromIds`
  (normalise), `sameScope`, `salonIdsOfCity` ; `salonName` nomme une ville
  entière par la ville (« Dakar »). `factor` additionne les parts des salons
  cochés.
- **Simulation** : `SIMULER_SALON_ABIDJAN` (faux par défaut) ajoute le salon
  **Cocody** (Abidjan, sans RDV / équipe / stock) à `salons` et
  `salonConfigs`. `SalonId` inclut toujours `"cocody"` : les
  `Record<SalonId, …>` (`SHARE`, `REVENUE`, `APPOINTMENTS`, `staffBySalon`)
  ont une entrée pour lui.
- Plusieurs salons cochés : `stockRows` additionne les salons cochés (sans
  la réserve) ; Planning / Horaires lisent comme « tous » restreint aux salons
  cochés (pas de hachures « autre salon », salon écrit dans les cases).
- Vérifié : `npx tsc --noEmit` vert ; captures avec la simulation active
  (menu, raccourci Dakar → accueil, rendez-vous, stock, clients, services,
  planning) puis inactive (bascule inchangée).


## Un seul bloc pour créer et modifier un rendez-vous (2026-10-02)

Demande de l'utilisatrice : « pour créer un rdv, ça doit être exactement le
même bloc que pour modifier un rdv ». **Prime sur toute description antérieure
de `prise-rdv/` (« Nouveau rendez-vous ») et de `RescheduleRdvDialog`.**

- `rendezvous/RescheduleRdvDialog.tsx` → **`rendezvous/RdvDialog.tsx`** : avec
  `detail` = « Reprogrammer le rendez-vous » (inchangé) ; sans `detail` =
  « Nouveau rendez-vous » (`initialClientId`, `defaultSalonId`, `pickedSlot`,
  `onCreate`). Mêmes sections Date / Salon / Horaire / Prestations ; la
  création ajoute seulement **Cliente** en tête (recherche nom / téléphone /
  n° client sur `useClientsData().rows`, « Créer la fiche » →
  `NewClientDialog`), ouvre les prestations d'emblée, bouton « Créer le
  rendez-vous ». Dans les deux modes : « + Ajouter une personne » (prénom
  facultatif, « Personne N » sinon). Créneau cliqué au Planning : jour, heure
  et praticienne préférée (`planAt(…, preferredStaffId)`).
- Branché dans `RendezVous.tsx` (bouton, `?nouveau=1`, `?client=`) et
  `equipe/planning-board/PlanningBoard` (clic sur une demi-heure libre).
- **Perdu par rapport au parcours b&co** : boissons / produits, questions de
  réservation, prestations couvertes par un abonnement / pack, acompte,
  « à deux praticiennes » choisi à la main. `components/prise-rdv/` et
  `lib/prise-rdv/` (hors `planifier.ts`, utilisé par `RdvDialog`) ne sont plus
  montés nulle part — conservés, à supprimer si le choix est confirmé.

## Fenêtre rendez-vous alignée sur point-de-vente (2026-10-05)

Demande de l'utilisatrice : « le back-office doit avoir le même modal avec la même
logique » que la fenêtre rendez-vous de point-de-vente (ADR 0041 révisé là-bas).
**Prime sur la section « Un seul bloc pour créer et modifier un rendez-vous ».**

- `rendezvous/RdvDialog.tsx` — fenêtre large (1200 px) en **deux colonnes vues
  d'un coup**, même fenêtre en création et en modification (« Modifier le
  rendez-vous » / « Confirmer la modification »). À gauche : cliente (création),
  prestations par personne (catégories **repliées**, une seule ouverte, compteur,
  recherche qui ouvre tout, sous-catégories, en-tête collant ; incompatibilités
  `conflictWith` gardées), date puis salon sur une rangée (« Fermé » compact),
  horaires en une seule rangée. À droite : **« 2 praticiennes »** (un seul
  interrupteur, appliqué là où c'est faisable — `Prestation.twoPractitioners` ET
  deux praticiennes libres ensemble ; bloc rose `brand-100/40` qui tremble une fois,
  `attention-shake-once` de `globals.css`, gain « 2 h → 1 h », détail par prestation
  à l'horaire choisi), **Questions** b&co, **Extensions** (cheveux Beccy Wave /
  Nefertiti, seulement si une personne en coiffure répond « Non » à « propres
  extensions »), **Bar Beauty** (`boissonSeeds`, toujours replié par défaut),
  **Notes**. Blocs encadrés repliables (`Block`, `ExtraBlock`) ; en modification
  tout s'ouvre replié. Pied : jour · heure, salon · durée, total extras compris.
  Personne ajoutée = **nom complet obligatoire**. Peu de sous-titres d'aide.
- `rendezvous/RdvQuestions.tsx` (nouveau) — questions de catégorie par personne ×
  catégorie (Oui / Non ou texte) ; `missingAnswers` compte les « sans réponse ».
- `lib/mock/booking-questions.ts` (nouveau) — `BOOKING_QUESTIONS` (verbatim b&co,
  clés = ids `serviceSeeds` : `s-coiffure`, `s-manucure`, `s-spa`, `s-visage`) ;
  stockage dans `RdvDetail.questions` (liste à plat) avec l'id
  `bq:<personne>:<service>:<question>` (`questionsFromAnswers` /
  `answersFromQuestions`), les autres questions gardées telles quelles.
- `lib/prise-rdv/planifier.ts` — « 2 praticiennes » devient une **préférence** :
  repli à une praticienne (durée pleine) quand deux ne sont pas libres, donc aucun
  horaire retiré ; `overrides` garde les praticiennes voulues encore libres et
  complète (une ligne passée à deux garde la sienne).
- `lib/mock/rendezvous.ts` — `RdvDetail.staffNote` (note libre) ; `Reschedule`
  (exporté par `RdvDialog`) porte aussi `extras`, `questions`, `staffNote`, repris
  par `RendezVous.reschedule` (événement « Rendez-vous modifié » quand le créneau
  ne bouge pas) et `RendezVousDetail` (bloc « Notes » sur la fiche).
- **Questions de prestation** (2026-10-07, `Prestation.questions`) : dans
  `RdvDialog`, sous une prestation cochée qui en a, `AnswerTiles` (local) —
  réponses en tuiles photo 4:5 (3 colonnes, tuile texte sans photo, coche
  pastille 40px), cadre ocre « À choisir » tant que vide ; réponse rappelée sur
  la pastille de la prestation (« · à préciser » sinon) et dans le résumé
  replié. Choix obligatoire : le pied l'écrit (« Choisissez une réponse pour
  <prestation> ») et ce motif ouvre et fait défiler jusqu'à la question.
  Décocher efface la réponse. Écrites dans `RdvPrestation.answers`
  (`answersFor`), reprises en modification. `RendezVousDetail` : vignette +
  réponse sous le nom de la prestation, question en sous-texte.

## Questions par prestation (2026-10-07)

Demande de l'utilisatrice : une prestation peut porter ses propres questions à
choix unique, **obligatoires**, avec une photo par réponse (facultative).
Distinctes des `ServiceQuestion` (Oui / Non ou texte, posées pour toute une
catégorie).

- `services.ts` — `Prestation.questions?: PrestationQuestion[]`
  (`{ id, label, options: { id, label, photo }[] }`),
  `prestationQuestionValid` (libellé + ≥ 2 réponses nommées), type
  `PrestationAnswer` (libellés + photo recopiés) ; seeds
  `PRESTATION_QUESTION_SEEDS` : **Mini Hair Treat + Braids** (« Quel type de
  tresses… » — nattes collées, box braids, couettes tressées) et **Silk Press**
  (« Quelles boucles… » — serrées, souples, ondulations). `rendezvous.ts` —
  `RdvPrestation.answers?`.
- `public/images/prestation-questions/` — les 6 photos des seeds, trouvées via
  le serveur MCP Pinterest du projet ouatesape, choisies pour mettre la
  coiffure en avant plutôt que le modèle, recadrées en 4:5.
- Édition : `services/PrestationQuestionsEditor` (voir Carte du code). Prise
  de RDV : `RdvDialog` (tuiles photo sous la prestation cochée) et fiche RDV —
  voir la dernière puce de « Fenêtre rendez-vous alignée sur point-de-vente ».
- **Site de réservation** (`../b&co`, modifié avec l'accord explicite de
  l'utilisatrice) : `BookingSubService.choiceQuestions` (mêmes ids que les
  seeds ci-dessus, photos copiées dans `public/images/rdv/choix/`), composant
  `components/booking/prestation-choice.tsx` sous la prestation sélectionnée,
  validation dans `lib/booking/questions.ts` (`missingChoices`,
  `choiceAnswerId`), réponse rappelée dans le résumé et la confirmation
  (`CartItem.choiceLabels`). Pas de synchronisation réelle entre les deux
  projets : les questions du site sont recopiées à la main.

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
- Graphiques : ApexCharts · Planning / Agenda RDV : frise horaire maison par
  praticienne (`components/back-office/rendezvous/{DayTimeline,WeekTimeline}.tsx`,
  glisser-déposer HTML5 natif) — remplace FullCalendar (2026-09-21, voir « Refonte
  Planning/Agenda » en bas de fichier) ; `react-dnd` / `jsvectormap` / `@fullcalendar/*`
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
- `public/images/boissons/` — photos réelles des boissons du bar Beauty & Co,
  mêmes usage/référencement que `produits/` (certaines boissons n'ont pas de
  photo source, ex. Pretty Latte : `Product.image` absent → placeholder).

### Racine `src/`

- `svg.d.ts`, `../next-env.d.ts` — déclarations de types
- `icons/index.tsx` — barrel de **tous** les icônes SVG (importer `@/icons`). Inclut
  7 pictogrammes de catégorie de service (`service-coiffure.svg`,
  `service-manucure-pedicure.svg`, `service-onglerie.svg`, `service-spa.svg`,
  `service-visage.svg`, `service-epilation.svg`, `service-mini.svg`) — repris
  tels quels du site vitrine b&co (`public/images/rdv/service-*.svg` /
  `icon-onglerie.svg` / `icon-sparkle.svg`, hors périmètre de ce dépôt, lus avec
  l'autorisation explicite de l'utilisatrice — 2026-09-14), stroke recoloré en
  `currentColor` pour suivre la convention du projet. `service-mini.svg` (Mini &
  Co) est un substitut : b&co n'a pas d'icône ligne pour cette catégorie
  (seulement une photo), l'étincelle générique (`icon-sparkle`) fait office de
  vignette la plus proche disponible.

### `src/app/` — routes (App Router)

- `layout.tsx` — root layout : polices, `SidebarProvider`, metadata FR
- `not-found.tsx` — page 404 globale (FR, light, renvoie au tableau de bord)
- `(admin)/` — pages dans le shell dashboard (sidebar + header)
  - `layout.tsx` — shell : `LocationProvider` > `AccountProvider` >
    `NotificationsProvider` + `AppSidebar` + `AppHeader` + `Backdrop`, marge
    dynamique + slot parallèle `{modal}` (fiches client / rendez-vous en modal,
    voir `@modal/` ci-dessous)
  - `@modal/` — slot parallèle porté par `layout.tsx`, dédié aux fiches
    présentées en panneau latéral droit (client, rendez-vous — voir « Fiches en
    panneau latéral » plus bas). `default.tsx` (rendu par défaut, `null`) ;
    `(.)clients/[id]/page.tsx` et `(.)rendez-vous/[id]/page.tsx` — routes
    interceptées : tout clic depuis l'intérieur de l'admin vers `/clients/[id]`
    ou `/rendez-vous/[id]` atterrit ici au lieu de la page dédiée, affichée en
    panneau par-dessus l'écran d'origine resté monté (fermeture = `router.back()`)
  - `page.tsx` — tableau de bord (rend `<Dashboard />`, cf. `components/back-office/`)
  - `satisfaction/page.tsx` — satisfaction client (rend `<Satisfaction />`)
  - `rapports/page.tsx` — générateur de rapports paramétrables (rend `<Rapports />`)
  - `messagerie/page.tsx` — boîte de réception multicanal (rend `<Messagerie />`)
  - `rendez-vous/page.tsx` — rendez-vous : deux vues (Liste triable + Agenda —
    frise horaire maison par praticienne, voir plus bas), fiche latérale avec
    affectation d'une praticienne par
    prestation, « Nouveau rendez-vous » manuel (rend `<RendezVous />`). Pas
    d'étape de confirmation (un RDV réservé est « à venir »), pas d'affichage de
    l'acompte (le même montant pour toutes, réglé dans `/reglages`) ; les RDV
    annulés restent consultables (filtre « Annulés », bouton « Rétablir ») ;
    `rendez-vous/[id]/page.tsx` — fiche rendez-vous, présentée en **panneau
    latéral droit** (rend `<RendezVousDetail closeMode="list" />`), `notFound()`
    si l'id est inconnu. Fallback pleine page pour la navigation directe
    uniquement (URL tapée, rechargement) — depuis l'admin, cette même fiche
    s'ouvre en panneau par-dessus l'écran d'origine via la route interceptée
    `@modal/(.)rendez-vous/[id]/page.tsx` (`closeMode="back"`)
  - `equipe/page.tsx` — Équipe : bascule **Membres** (annuaire + fiche membre à
    3 onglets : **Activité** (satisfaction client + charge de RDV + demandes
    d'avance / de congé avec décision Accepter / Refuser) / **Identité & accès**
    (coordonnées, rôles, salons, membre actif, accès plateforme + récap
    autorisations) / **Compétences & horaires**) / **Planning** (matrice de
    présence de l'équipe × 7 jours, trous de couverture, congés / absences —
    fusionné depuis l'ancienne page `/planning` le 2026-09-14, voir
    `PlanningPanel`) / **Autorisations** (matrice « autorisation × rôle » réglée
    par la propriétaire — voir `RolePermissions`) (rend `<Equipe />`, dans
    `<Suspense>` pour la lecture de `?membre=<id>` (ouverture d'une fiche depuis
    une notification) et `?vue=planning` (ouverture directe de l'onglet
    Planning depuis un lien externe, ex. Journal))
  - `journal/page.tsx` — Journal d'activité : liste antéchronologique des actions
    de l'équipe (encaissements, RDV, stock, décisions RH), filtre par rôle de
    l'auteur (Manager / Caisse / Praticiennes — **Manager par défaut**) + salon
    global + période (préréglages + plage personnalisée). Wrapper serveur
    (metadata) qui rend `<Journal />`
  - `stock/page.tsx` — Stock : niveaux par produit / salon, couverture, projection
    de réappro (rend `<Stock />`, dans `<Suspense>` pour `?produit=<id>`)
  - `salons/page.tsx` — Salons : identité, postes par type, heures d'ouverture,
    fermetures exceptionnelles (rend `<Salons />`)
  - `fidelite/page.tsx` — « Fidélité & abonnements » : wrapper serveur (metadata)
    qui rend `<Fidelite />`. Trois sections (`SegmentedControl`) : **Fidélité**
    (accumulation, paliers, récompenses), **Forfaits & Packs** (CRUD des offres —
    forfaits d'abonnement récurrents + packs prépayés), **Abonnements** (suivi des
    abonnements souscrits et des packs vendus : échéances, révocations,
    consommation). Modèle de données repris du spec b&co
    (`docs/backoffice-spec.md`, hors dépôt)
  - `services/page.tsx` — parcours « Services » unifié : catégories + prestations
    facturables + questions d'accueil + recettes de consommation, un seul écran
    (rend `<Services />`). Remplace les anciennes routes séparées Gestion /
    Prestations / Questions / Inventaire·Recettes.
  - `clients/page.tsx` — clientèle : tableau triable + recherche (rend `<Clients />`) ;
    `clients/[id]/page.tsx` — fiche cliente, présentée en **panneau latéral
    droit** (rend `<ClientDetailModal closeMode="list" />`) : bandeau identité
    (avatar, badges, actions `<ClientDetailActions />`, infos personnelles —
    genre, téléphone, adresse, membre depuis), résumé (statistiques +
    répartition des rendez-vous par statut), préférences par thème,
    **abonnements & packs de la cliente** (jointure sur `clientId` avec
    `@/lib/mock/abonnements` — statut, prochaine échéance, prestations de pack
    restantes ; lien « Gérer » → `/fidelite`), rendez-vous à venir, historique.
    Ancres `#abonnements`, `#rendez-vous` et `#historique` (scroll natif dans le
    corps défilant du panneau). `notFound()` si l'id est inconnu. Fallback
    pleine page pour la navigation directe uniquement — depuis l'admin, cette
    même fiche s'ouvre en panneau par-dessus l'écran d'origine via la route
    interceptée `@modal/(.)clients/[id]/page.tsx` (`closeMode="back"`)
  - `compte/page.tsx` — « Mon compte » : wrapper serveur qui rend `<Compte />`
    (identité, connexion + changement de mot de passe, canaux de notification).
    Atteignable depuis le menu compte du header, pas dans la sidebar.
  - `reglages/page.tsx` — « Réglages » : bascule **Paiement** (encaissement réel /
    mode test, acompte à la réservation, règlement PayPal) / **Emails** (lien du
    site, délais des rappels / remerciement, bibliothèque de modèles éditables)
    (rend `<Reglages />`, dans `<Suspense>` pour `?section=<paiement|emails>`).
    Fusion des anciennes pages séparées `/paiement` et `/emails/modeles`
    (2026-09-14) : deux réglages à une carte, rarement visités.
- `(full-width-pages)/` — pages hors shell (pleine largeur)
  - `layout.tsx`
  - `(auth)/` — `signin/`, `forgot-password/`, `reset-password/` (+ `layout.tsx`).
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

> Note : `AppSidebar` liste ses modules à plat (plus de regroupement par
> catégorie ni d'en-têtes de section, retirés le 2026-09-14). Depuis le
> 2026-09-21, elle n'en compte plus que **9** : Tableau de bord (`/`),
> Rendez-vous, Messagerie, Clients, Équipe, Services, Stock, Fidélité
> (`/fidelite`), Réglages — sidebar jugée trop chargée à 13 items,
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
  `PageHeader`, `DataTable`, `DefinitionList`, `StatCards` / `StatCard`,
  `FormCard` (+ `ToggleRow`) et `StatusBadge` (ces deux-là ne servent plus qu'à
  la vitrine `design-system`),
  `Dashboard` (shell client du tableau de bord : état période + composition ;
  ajoute une carte `recurringRevenueKpi` — revenu récurrent / 30 j, salon-
  indépendant — à la suite de `dashboardKpis`, KPI `rdv` remonté en tête de
  liste. Ordre de lecture de haut en bas (redesign du 2026-09-14, priorité
  confirmée par la propriétaire) : d'abord **rendez-vous du jour** (colonne
  principale) + rail latéral `xl:sticky` `dashboard/NotificationsPanel` —
  l'opérationnel qu'elle vérifie plusieurs fois par jour, toujours la journée
  en cours quelle que soit la période choisie plus bas —, puis les indicateurs
  de la période sélectionnée, puis tendances + prestations populaires ; plus
  de bandeau « À traiter » séparé en tête de page (fusionné dans le rail le
  2026-09-14, voir `NotificationsPanel` ci-dessous) — consultée aussi souvent
  que les rendez-vous, elle reste à l'écran plutôt que derrière un clic ; en
  bas d'écran, section « Autres écrans » (`ShortcutCard`, local au fichier) —
  raccourcis Satisfaction (note `satisfaction(scope, "90")` + `RatingStars`) /
  Rapports / Journal, ajoutés le 2026-09-21 quand ces 3 écrans ont quitté la
  sidebar (voir « Simplification de la sidebar » plus bas) ; volontairement en
  dernier, pour ne pas concurrencer les rendez-vous ni les indicateurs),
  `Compte` (écran `/compte` : une carte, sections Identité / Connexion /
  Notifications ; brouillon local + « Enregistrer » gaté sur `dirty` ; changement
  de mot de passe en bloc séparé avec sa propre action ; validation email /
  téléphone / mot de passe ; consomme `useAccount()` ; pas d'import de photo) ;
  sous-dossier `dashboard/` : `NotificationsPanel` (bloc « À traiter » du
  tableau de bord — fusionne l'ancienne alerte stock isolée en tête de page
  avec le flux de notifications, 2026-09-14 : une alerte = une notif non lue de
  ton `warning`/`error` (`isActionable`, dérivé du `tone` déjà porté par
  `AppNotification`, aucun objet « alerte » séparé) — remplace `Notifications` /
  `/notifications` et `header/NotificationDropdown`, supprimés, et l'ancien
  bandeau `stockAlert` de `beautyandco.ts`, retiré. En-tête titre « À traiter »
  + sous-titre (compte d'alertes, sinon non-lues, sinon « Tout est lu ») +
  « tout marquer lu » ; section alertes toujours visible (jamais derrière un
  survol) — carte par alerte (icône catégorie sur fond `warning`/`error`, lien
  d'action libellé par catégorie + « Marquer comme lu ») ou état neutre « Rien
  à traiter » ; section « Toutes les notifications » — filtre catégorie
  `SegmentedControl` (`wrap`), liste chronologique groupée par jour (exclut les
  alertes déjà remontées au-dessus, pour ne jamais doubler une même entrée),
  conteneur scrollable à hauteur bornée, « Lu » par ligne au survol, chaque
  ligne = `<Link>` vers une page existante, 2 états vides ; consomme
  `useNotifications()`),
  `Journal` (shell client de `/journal` : liste antéchronologique des actions de
  l'équipe groupée par jour, filtre rôle `SegmentedControl` (Manager / Caisse /
  Praticiennes — **Manager** par défaut) + salon global `useLocation()` +
  `JournalPeriodPicker` + recherche libre ; chaque ligne = auteur + pastille de
  rôle + action + détail + heure, ton `info` / `notable` / `sensitive` (bord
  gauche coloré + mention « Action sensible »), `<Link>` si l'action a une page
  cible ; 2 états vides (rôle jamais actif ici / rien sur la période) ; piloté
  par `@/lib/mock/journal`) ; sous-dossier `journal/` : `JournalPeriodPicker`
  (préréglages Aujourd'hui / 7 j / 30 j + « Personnalisé » → popover Du/Au via
  flatpickr ; émet une plage `{ from, to }` concrète, contrairement à
  `PeriodFilter`),
  `PeriodFilter` (options fixes + « Personnalisé » → popover Du/Au/Filtrer :
  champ date unique au format FR jj/mm/aaaa via flatpickr, sans `altInput` ;
  bouton « Filtrer » désactivé si la plage est incomplète ou inversée),
  `TodayAppointments`, `TrendChart` (graphe d'aire avec bascule Revenus /
  Rendez-vous, piloté par `trendChart(scope, période, métrique)`), `PopularServices`,
  `RendezVous` (shell client de l'écran rendez-vous, salon-scopé : bascule
  **Liste** (défaut) / **Agenda**, chip « N prestation(s) sans praticienne » qui bascule un filtre
  `assignOnly`, « + Nouveau rendez-vous » ouvre `rendezvous/BookingDialog.tsx`
  (parcours de réservation manuelle « saisi au salon », repris du dialog centré
  unique de point-de-vente — pas de stepper : salon + date + cliente via
  `shared/ClientSearchField`, N lignes prestation (menu par catégorie de
  service + praticienne ou « première disponible » par ligne), puis un seul
  horaire de départ pour toute la visite — pastilles de créneaux calculées sur
  la durée cumulée des prestations et la capacité par poste du salon sur la
  plage choisie, mêmes règles que le bandeau de capacité de l'agenda ; RDV créé
  avec `staffGlobal: null` — affectation fine laissée au tableau/fiche). État de session
  `useState<RdvDetail[]>(allRendezvous())` — affecter / annuler / rétablir /
  déplacer / supprimer / créer + toasts « cliente prévenue ». Vue Liste
  (`rendezvous/ListView.tsx` — grille de cartes façon accueil-day-list de
  point-de-vente : une carte par RDV, avatar + nom + téléphone cliente,
  créneau début–fin, jusqu'à 3 prestations puis « +N de plus », pastille
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
  `weekPresence` — + ligne « À affecter » épinglée en tête si des prestations
  sont sans praticienne ; blocs positionnés via `prestationSlots` de
  `@/lib/mock/rendezvous` (prestations enchaînées, pas en parallèle), teintés
  par l'accent de la praticienne ; glisser-déposer HTML5 natif — prend
  n'importe quel bloc du RDV, déplace tout le RDV en conservant l'écart entre
  prestations ; ligne « maintenant » `brand-500`, zones hors horaire grisées,
  « Repos » / motif d'absence en filigrane) ; `WeekTimeline` (même grammaire
  que `PlanningGrid`, une cellule = horaire + pastille « N RDV » teintée, clic
  → bascule Jour sur ce jour) ; bandeau capacité par type de poste inchangé),
  `RendezVousDetail` (fiche `/rendez-vous/[id]`, présentée en **panneau
  latéral droit** via `detail/DetailModal` — colonne unique, plus de mise en
  page 2 colonnes ;
  prop `closeMode: "back" | "list"` selon que la fiche a été ouverte par
  interception (retour à l'écran d'origine) ou en accès direct (retour à
  `/rendez-vous`) : `detail/DetailIdentityHeader` (cliente, badge statut, réf.,
  grille Date/Créneau/Salon/Durée), rangée de `detail/StatTile` (Total à payer,
  Prestations, Avantages mobilisés, Encaissement), statut en état local, Alert
  « praticienne demandée absente ce jour-là », action primaire « Marquer la
  visite terminée » (RDV à venir), « Rétablir le rendez-vous » (RDV annulé),
  carte Affectation visible seulement si « à venir » — « assigner tout le RDV
  à » + un `select` par prestation via
  `presentPractitionersForPrestation(prestationId, salon, jour)` (compétence +
  présence réelle ce jour-là dans ce salon — une praticienne n'est pas
  rattachée à un salon fixe, cf. `@/lib/mock/planning`) + « Première
  disponible », warning si personne de compétent et présent, suppression
  confirmée « aucun email », fin de créneau via `rdvEnd` ; carte « Avantages » :
  `AdvantageItem` résout `RdvAdvantage` (référence par id) contre
  `@/lib/mock/abonnements` — abonnement : forfait + `Badge` statut + prestations
  disponibles ce cycle + reconduction ; pack : prestations restantes / total +
  prestations couvertes ; carte cadeau : solde),
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
  ajoutées en mémoire — piloté par `@/lib/mock/messagerie`) ; sous-dossier
  `messagerie/` : `ConversationList` (panneau gauche : recherche + filtre canal +
  liste), `ConversationThread` (panneau droit : en-tête + fil groupé par jour +
  pied), `MessageComposer` (réponse : bascule de canal + repli WhatsApp quand le
  SMS est coupé + `⌘`+Entrée), `glyphs` (pictos téléphone / WhatsApp / SMS /
  chat / actualiser / recherche / alerte / image + `ChannelIcon`),
  `Clients` (shell client de l'écran clientèle : recherche nom/email/téléphone +
  filtre `Toutes / Actives / À relancer` + contrôle « Trier par » (Dernière
  visite / Nom / Total dépensé / Points fidélité) + toggle asc/desc + filtre
  salon global, suppressions locales avec « Annuler » — piloté par
  `clients(scope)`),
  `ClientCards` (grille de cartes clientes façon répertoire de point-de-vente
  — remplace l'ancien `ClientsTable` tabulaire le 2026-09-21 : avatar
  initiales + badge « À relancer », dernière visite (repère n°1 avec le total
  dépensé, cf. persona), total dépensé + RDV/points en pied de carte, actions
  « Détails » + `ClientRowActions`; le tri par clic sur en-tête de colonne n'a
  plus de sens en grille, remplacé par le contrôle de `Clients`),
  `ClientRowActions` (bouton `Détails` + menu `⋯` rendu en portail : « Voir les
  rendez-vous » / « Supprimer »),
  `ClientDetailActions` (client — les deux boutons d'en-tête de la fiche cliente :
  « Historique complet » ancre vers `#historique` (style ghost gris, corrigé
  le 2026-09-21 — portait `bg-success-500`, une couleur de statut, pas la
  couleur d'action de marque), « Supprimer » confirme en
  ligne puis renvoie vers `/clients`, aucune persistance),
  `ClientDetailModal` (fiche `/clients/[id]`, présentée en **panneau latéral
  droit** via `detail/DetailModal` — même contenu que l'ancienne page dédiée, prop
  `closeMode: "back" | "list"` selon que la fiche a été ouverte par
  interception ou en accès direct : `detail/DetailIdentityHeader` (avatar
  initiales, badges, grille Genre/Téléphone/Adresse/Membre depuis), rangée de
  `detail/StatTile` (résumé), répartition par statut, préférences, abonnements
  & packs, rendez-vous à venir, historique — `<DataTable>`) ; sous-dossier
  `detail/` (partagé avec `RendezVousDetail` et `stock/StockDetail`) :
  `DetailModal` (chrome commun du panneau latéral droit — panneau `fixed`
  plein hauteur ancré à droite, fond assombri `bg-gray-900/20`, transition
  d'entrée en glissement, sur le même gabarit que le panneau rapide déjà
  utilisé dans l'écran Rendez-vous ; barre de titre fixe + corps défilant
  `min-h-0` ; plus de dépendance à `ui/modal`, converti depuis un modal centré
  le 2026-09-21, voir « Fiches en panneau latéral » plus bas),
  `DetailIdentityHeader` (+ `DetailAvatar` : bandeau avatar/pictogramme + nom +
  badges à gauche, grille label/valeur à droite), `StatTile` (tuile de
  résumé),
  `Fidelite` (shell client de « Fidélité & abonnements » : `SegmentedControl` de
  tête à 3 sections — **Fidélité** / **Forfaits & Packs** / **Abonnements** —,
  chacune avec sa barre de sous-onglets ; tout l'état (`settings`, `tiers`,
  `rewards`, `forfaits`, `packs`, `abonnements`, `packPurchases`) en mémoire de
  session, toast `notice` partagé — fixtures `@/lib/mock/fidelite` +
  `@/lib/mock/forfaits` + `@/lib/mock/packs` + `@/lib/mock/abonnements`) ;
  sous-dossier `fidelite/` : `AccrualSettings` (onglet
  Paramètres : brouillon local + bouton « Enregistrer » actif seulement si
  modifié, bandeau si programme désactivé, champ variable selon la base
  d'accumulation), `TiersPanel` (onglet Paliers : liste triée par seuil +
  formulaire ajout/édition + suppression confirmée en ligne), `RewardsPanel`
  (onglet Récompenses : idem avec type de récompense),
  `ForfaitsPanel` (CRUD forfaits : label, description, **prix libre**, cycle
  (`CYCLE_PRESETS` + jours si « Personnalisé »), `PrestationPicker` sans prix —
  prestations résolues affichées, jamais de somme), `PacksPanel` (CRUD packs :
  label, description, `PrestationPicker` avec prix, **prix packagé dérivé −20 %**
  affiché + `Toggle` « Forcer un prix » → `priceOverrideFcfa`),
  `PrestationPicker` (multi-sélection du catalogue `@/lib/mock/services` groupé
  par service + recherche pliée sans accent ; `showPricing` masque prix/durée
  pour les forfaits ; partagé Forfaits/Packs),
  `AbonnementsPanel` (suivi : liste des abonnements actifs — souscripteur (+
  bénéficiaire), forfait, `Badge` statut `ABONNEMENT_STATUS_META`, prochaine
  échéance, prestations disponibles ce cycle — actions **Marquer payé**
  (`PayControl` : stepper cycles 1–12 + montant `amountDueForCycles` + aperçu
  `estimatePrepaidDueDate` → `markAbonnementPaid`) et **Révoquer** (confirm
  inline → `revokeAbonnement`) ; section « Abonnements révoqués » grisée ;
  formulaire **Souscrire un forfait** (`ContactField` souscripteur + forfait +
  `Toggle` bénéficiaire distinct → `ContactField`)),
  `PackSalesPanel` (suivi : liste des packs vendus — acheteur, pack, acheté le,
  N/total consommées, `Badge` « Entièrement utilisé » ; action **Consommer une
  prestation** (cases des prestations restantes → `redeemPrestations`,
  définitif) ; formulaire **Enregistrer une vente** (`ContactField` + pack)),
  `ContactField` (choix souscripteur/acheteur : une cliente du fichier
  (`clients("all")`) ou coordonnées libres → `{ clientId, contact }`),
  `ui` (primitives de
  formulaire / liste éditable, **partagées avec le parcours Services** :
  `SectionCard`, `Divider`, `Toggle` (role=switch), `SettingRow`, `TextInput`,
  `SelectField`, `EditableRow`, `EmptyList`, classes `btnPrimary` / `btnGhost`),
  `Services` (shell client du parcours catalogue unifié : état de vue
  liste / fiche / nouveau / « sans catégorie », salon global, tout édité en
  mémoire de session — fixtures `@/lib/mock/services`) ; sous-dossier `services/` :
  `ServicesList` (tableau des catégories : vignette émoji, compteurs
  prestations / questions, statut, badges salons, réordonnancement par flèches
  seulement sur « Tous les salons », suppression confirmée en ligne — détache les
  prestations / questions au lieu de les perdre), `ServiceDetail` (fiche : entête
  + onglets Informations / Prestations / Questions, suppression confirmée),
  `ServiceInfoForm` (création & édition : nom, vignette émoji, description,
  cases salons, statut ; brouillon + dirty en mode édition), `PrestationsPanel`
  (liste + formulaire ajout/édition d'une prestation : prix, durée, statut,
  recette), `RecipeEditor` (recette de consommation : lignes produit / quantité /
  unité, stock déduit à la fin de la visite), `QuestionsPanel` (liste + formulaire
  question : libellé, type Oui-Non / Choix multiple / Texte, statut),
  `OrphansPanel` (écran « sans catégorie » : rattacher chaque prestation /
  question à un service, ou supprimer), `serviceIcons` (`SERVICE_ICONS` —
  `Record<ServiceIconKey, IconComponent>`, résout la vignette d'un service vers
  son icône `@/icons` ; consommé par `ServicesList` / `ServiceDetail` /
  `ServiceInfoForm` et, hors du dossier `services/`, par `salons/SalonDetail`
  et `fidelite/PrestationPicker`), `ui` (`BackButton` + réexport des
  primitives de `../fidelite/ui`)
  `Reglages` (shell client de l'écran « Réglages » : `SegmentedControl`
  **Paiement** / **Emails**, lecture `?section=<paiement|emails>`
  (`useSearchParams`) pour l'ouverture directe d'une section depuis un lien
  externe (ex. Journal), même motif que `?membre=` sur `Equipe`. Fusion des
  écrans autrefois séparés Paiement et Emails — 2026-09-14, tous deux à une
  carte, rarement visités) ; sous-dossier `reglages/` : `PaiementPanel` (une
  carte, brouillon local + bouton « Enregistrer » actif seulement si modifié —
  fixtures `@/lib/mock/paiement`) ; trois sections — encaissement réel / mode
  test (bandeau info ou avertissement selon l'état), acompte à la réservation
  (montant fixe / pourcentage / aucun, champ variable + plancher 100 FCFA),
  règlement PayPal (montant en USD, grisé si aucun acompte). Primitives inline
  dans le fichier ; `EmailsPanel` (lien du site + automatisations +
  bibliothèque de modèles + panneau d'édition, tout en mémoire de session —
  fixtures `@/lib/mock/emails`) ; sous-dossier `reglages/emails/` :
  `SettingsCards` (carte « Lien du site » + carte « Rappels & remerciement » :
  brouillon local, bouton « Enregistrer » actif seulement si modifié, délais
  grisés quand la règle est coupée), `TemplateList` (grille de cartes de modèles :
  badge Système / Personnalisé, aperçu objet + corps, clic = édition ; bouton
  « Nouveau modèle »), `TemplateEditorPanel` (panneau latéral : objet + corps,
  chips de variables insérées au curseur, modèles système non renommables /
  non supprimables, suppression confirmée en ligne, Échap / clic sur le fond pour
  fermer), `ui` (primitives locales : `SectionCard`, `Toggle`, `MiniSelect`,
  `fieldClass`, `btnPrimary` / `btnGhost`)
  `Equipe` (shell client de l'écran Équipe : bascule `SegmentedControl`
  **Membres** / **Planning** / **Autorisations** ; état `members` +
  `staffRequests` + `autorisations` (`defaultAutorisations`) + `absences` +
  `shiftOverrides` (ces deux derniers pour l'onglet Planning, levés ici pour
  survivre à un changement d'onglet — pattern `autorisations`) en mémoire de
  session, vues liste / fiche / ajout. Pas de filtre salon sur la vue
  **Membres** — une personne n'est rattachée à aucun salon fixe, ça dépend du
  planning (cf. `@/lib/mock/planning`) ; l'onglet **Planning** garde le filtre
  salon global (`useLocation`), lecture légitime de « qui est où cette
  semaine », pas une appartenance. Lecture `?membre=<id>` (ouverture d'une
  fiche depuis une
  notification) et `?vue=planning` (ouverture directe de l'onglet Planning
  depuis un lien externe, ex. Journal, ou la fiche membre après un congé
  accepté) via `useSearchParams`, décision sur les demandes avec `decidedAt`
  horodaté réel, `setRoleCapability` (via `applyCapability`) / `resetRole` pour
  la matrice — fixtures `@/lib/mock/staff` + `@/lib/mock/rh` +
  `@/lib/mock/autorisations` + `@/lib/mock/planning`) ; sous-dossier `equipe/` :
  `EquipeList` (recherche + filtre rôle `SegmentedControl`
  + `DataTable` : avatar initiales, badges rôles / accès, colonne « Cette
  semaine » = `weekSalonSummary(memberId)` de `@/lib/mock/planning` (résumé
  dérivé du planning, ex. « 3j Almadies · 2j Sea Plaza » — pas un rattachement
  figé), pastille `Badge`
  « N demande(s) » ton warning sur un membre qui a des demandes en attente),
  `MemberDetail` (fiche : en-tête (badge salon remplacé par
  `weekSalonSummary(member.id)`) + « supprimer définitivement » ; 3 onglets —
  **Activité** (défaut, rend `MemberActivityPanel` ; pastille de compte des
  demandes en attente sur le libellé) / **Identité & accès** (`MemberIdentityForm`
  + `MemberAccessPanel` empilés) / **Compétences & horaires** (`MemberSkillsPanel`
  + `MemberSchedulePanel` empilés)),
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
  salons de rattachement, le salon dépend du planning (cf.
  `MemberSchedulePanel`) — `identityValid` / `trimIdentity` /
  `BLANK_IDENTITY`), `MemberIdentityForm` (édition : brouillon + dirty +
  Enregistrer + Toggle actif avec confirmation), `MemberAccessPanel` (bas de
  l'onglet « Identité & accès » : état du compte — Inviter / Renvoyer / Annuler /
  Révoquer — **puis** carte « Ce que ce membre peut faire » : union des
  autorisations de ses rôles (`capabilitiesForRoles`), groupée par domaine, en
  lecture seule, bouton « Régler les autorisations par rôle » →
  `onOpenPermissions` (bascule sur la sous-vue Autorisations) ; mention si le
  compte n'est pas encore actif ; consomme `autorisations`),
  `RolePermissions` (sous-vue **Autorisations** : matrice `<table>` autorisation
  × rôle (Praticienne / Caisse / Manager), `Toggle` par cellule, en-têtes de
  domaine (`CAPABILITY_GROUPS`), pastille « Sensible », cascade des prérequis
  via `onChange` → `applyCapability`, compteur + « Réinitialiser » par colonne
  quand `roleDiffersFromDefault`, `Alert` d'avertissement si un rôle n'a aucune
  autorisation, carte info « vos accès à vous ne changent pas » via
  `useAccount()`), `MemberSkillsPanel` (prestations groupées
  par service, `CheckPill`, compteur, Alert si praticienne sans compétence ou
  seule compétente), `MemberSchedulePanel` (7 lignes `WEEKDAYS` : Toggle
  travaillé / repos + **salon du jour** (`select` Almadies / Sea Plaza) + heures
  + coupure — une personne peut travailler dans un salon un jour et dans
  l'autre le lendemain, ça se règle ici jour par jour, pas via un rattachement
  fixe), `AddMemberFlow` (création : identité +
  compétences + horaires, puis « inviter maintenant ? »), `ui` (`BackButton`,
  `CheckPill`, `Avatar` + réexport des primitives de `../fidelite/ui`),
  `PlanningPanel` (onglet **Planning** de `Equipe` — fusionné depuis l'ancienne
  page `/planning` le 2026-09-14, `absences` / `shiftOverrides` reçus en props
  (levés dans `Equipe`) ; filtre salon, navigation ‹ semaine › locale à l'onglet,
  bandeau trous de couverture, « rétablir les horaires habituels de la
  semaine ») ; sous-dossier `planning/` (inchangé, toujours consommé depuis
  `equipe/PlanningPanel`) : `PlanningGrid`
  (matrice CSS membres × 7 jours — lignes = membres actifs présents au moins un
  jour dans le salon filtré cette semaine (pas un rattachement fixe, cf.
  `weekPresence`), praticiennes puis section repliable ; ligne = bordure gauche
  3px + avatar rond + nom teintés de la couleur d'identité de la praticienne
  (2026-09-21, `@/lib/mock/staff-colors` — même palette que l'Agenda RDV, pour
  repérer une même personne d'un écran à l'autre) ; cellule = `presenceFor` —
  présence teintée de l'accent de la ligne / absence fond `warning-50` / repos
  vide ; salon affiché sur chaque cellule en vue « Tous les salons » (personne
  n'a de salon par défaut), ou seulement si différent du salon filtré (ton
  neutre — elle travaille, mais pas ici) ; pastille
  « N RDV » (teintée pareil) vers `/rendez-vous`, colonne « Fermé » grisée,
  en-tête rouge « Personne » sur les trous ; clic → `AbsenceDialog`), `AbsenceDialog` (Modal :
  motif `SelectField` + plage Du / Au + Alert de conflit si RDV déjà pris sur la
  période + lien),
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
  sous-dossier `stock/` : `StockList` (table triée par couverture : Produit ·
  Stock entreprise / salon (+ sous-texte « dont réserve N » en scope « all ») ·
  Seuil · Conso/sem · badge Couverture `≈ N j` rouge < 7 j / orange < 14 j ·
  `Sparkline` ; filtres Tous / Sous le seuil / À commander + recherche),
  `StockDetail` (fiche produit présentée en **panneau latéral droit** via
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
  `Sparkline` (mini-courbe SVG 8 points, décorative),
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
  heures + coupure, `dayHasError` / `hoursHaveError` avec message inline, partagé
  fiche + création), `SalonForm` (création : Identité + Postes + Heures, id
  généré, state only), `ui` (`BackButton`, `timeFieldClass` + dérivés locaux
  `salonOpenState` / `nextClosure` / `posteSummary` / `posteCount`).
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
- `ui/` — primitives : `alert/`, `avatar/`, `badge/`, `button/`,
  `dropdown/`, `images/`, `modal/`, `table/`, + `segmented/SegmentedControl`
  (choix unique parmi quelques options, sémantique radio),
  + `rating/RatingStars` (note en étoiles, remplissage partiel pour les moyennes —
  représentation unique de la note)
- `form/` — contrôles de formulaire réellement utilisés : `Label`, `Select`,
  `switch/Switch`, `input/{InputField,TextArea,Checkbox,Radio}` (consommés par
  `auth/`, `ReportBuilderPanel`, la vitrine `design-system`)
- `auth/` — formulaires FR / light : `SignInForm` (email + mot de passe +
  « Rester connectée » + « Mot de passe oublié ? », `router.push("/")` au submit),
  `ForgotPasswordForm` (saisie e-mail → écran « Vérifiez votre boîte mail » en
  état local), `ResetPasswordForm` (nouveau mot de passe + confirmation →
  `/signin`). Chaque écran porte le logo B&C.
- `header/` — `UserDropdown` (menu compte : nom + photo lus depuis
  `useAccount()` ; « Mon compte » → `/compte`, « Paramètres des salons » →
  `/salons`, « Se déconnecter » → `/signin`). Plus de cloche de notifications
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
  persisté en `localStorage`, fourni par `(admin)/layout.tsx`
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

### `src/layout/`

- `AppSidebar.tsx` — sidebar : vrais logos Beauty & Co via `next/image` —
  `public/images/logo/beautyandco-wordmark.svg` (wordmark noir) quand la sidebar
  est déployée (`showText`), `public/images/logo/beautyandco-mark.jpg` (mark
  aquarelle) quand elle est réduite. Largeur `w-[256px]` déployée / `w-[80px]`
  réduite (miroir : `lg:ml-[256px]` / `lg:ml-[80px]` dans `(admin)/layout.tsx` ;
  passée par 240px/90px puis 288px/108px le 2026-09-14, resserrée à 256px/96px
  le 2026-09-21 — à 9 items à plat, 288px laissait trop de vide à droite des
  libellés ; items resserrés en même temps, `py-2` + `gap-0.5` au lieu de
  `py-2.5` + `gap-1`, rythme vertical trop aéré pour une nav aussi courte).
  Réduite resserrée une seconde fois à 80px le 2026-09-21 (retour utilisatrice
  sur capture d'écran, mode réduit : 96px de rail pour des icônes `lucide`
  fines de 20px laissait trop de vide, les items flottaient sans forme propre ;
  vérifié par capture Playwright avant/après). Chaque item réduit est
  maintenant une tuile carrée `h-11 w-11` centrée (`mx-auto`) plutôt qu'un
  bouton pleine largeur avec icône centrée dedans — le fond de l'item actif
  (`bg-brand-500`) dessine un carré net au lieu d'un rectangle large.
  Nav FR (tableau `menuItems`,
  liste à plat des 9 modules, sans regroupement par catégorie — les groupes +
  en-têtes de section + `HorizontaLDots` retirés le 2026-09-14 ; Rapports /
  Satisfaction / Journal / Salons retirés à leur tour le 2026-09-21, voir
  « Simplification de la sidebar » plus bas), icônes
  `lucide-react` (une par module — `LayoutDashboard`,
  `CalendarCheck2`, `MessageCircle`, `FileUser`, `UserRoundGroup`,
  `Sparkles`, `Package`, `Gift`, `Settings` — remplacent les SVG
  `@/icons` utilisés jusque-là dans la sidebar ; `@/icons` reste la source pour
  le reste de l'app ; `Clients` et `Équipe` passées de `Users` / `UserCog` à
  `FileUser` / `UserRoundGroup` le 2026-09-21, icônes fournies par
  l'utilisatrice). Plus aucun sous-menu (machinerie `openSubmenu` retirée) ;
  `isActive` en match préfixe (une sous-route surligne son parent). Pas de bloc
  utilisateur / déconnexion ici. Pas de filtre salon ici : chaque écran
  salon-scopé monte son propre `SegmentedControl` câblé sur `useLocation()`.
- `AppHeader.tsx` — barre du haut : bascule sidebar + `UserDropdown`. Plus de
  cloche de notifications (2026-09-14, voir `header/`). Pas de recherche globale
  (chaque écran qui en a besoin porte sa propre barre de recherche, ex.
  `Clients`), pas de bascule de thème, pas de filtre salon.
- `Backdrop.tsx` — overlay mobile

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
  `CLIENT_PROFILES` (genre, adresse, préférences par thème), défauts si absent ;
  `clientDetail` ajoute `preferences` (thèmes `PREFERENCE_GROUPS` : général /
  onglerie / coiffure / boissons), `stats` (`ClientVisitStats` : total +
  répartition honoré / à venir / annulé), rendez-vous à venir + historique) et
  les helpers `frShortDate`, `frLongDate` (« 12 août 2026 »), `genderLabel`,
  `clientNoun` (« cliente » / « client »), `groupThousands`.
  **Configuration des salons** (section dédiée) : `Weekday` / `WEEKDAYS` /
  `WEEKDAY_LABELS` ; `PosteType` (`coiffure` / `esthetique` / `onglerie`) /
  `POSTE_TYPES` / `POSTE_TYPE_LABELS` ; `DayOpening` (fermé, ou ouvert + coupure
  optionnelle) ; `SalonConfig` (identité, `active`, `postes: Partial<Record<
  PosteType, number>>` — capacité par type, `hours: Record<Weekday, DayOpening>`) ;
  `salonConfigs`, `salonConfig(id)`, `posteCapacity(id)` ; `SalonClosure` +
  `salonClosures` (fermetures exceptionnelles, `scope` salon ou `"all"`) +
  `closuresFor(scope, iso)` + `isClosed(id, iso)`. Plus de `stockAlert` /
  `lowStockItems` (bandeau dédié retiré du tableau de bord le 2026-09-14, le
  stock bas est signalé par la notif `stock` de `notifications.ts`, ton
  `warning`, remontée dans le rail « À traiter »).
- `rendezvous.ts` — fixtures des rendez-vous (`RdvDetail` : statut `à venir` /
  `terminé` / `annulé` / `absence` — **pas d'étape de confirmation** : un RDV
  réservé est « à venir » —, cliente, `prestations`
  (`RdvPrestation` : `prestationId` (id catalogue), catégorie, `posteType`
  (dérivé de la catégorie), prix FCFA, durée, `staff: string | null` (null = à
  affecter), `requestedStaff?` (praticienne demandée par la cliente sur le site)),
  `questions`, `advantages` (`RdvAdvantage` — `{ kind: "abonnement"; abonnementId }`
  / `{ kind: "pack"; packPurchaseId }` référencent des instances de
  `@/lib/mock/abonnements`, résolus à l'affichage par `RendezVousDetail` ; la
  variante `carte-cadeau` reste autonome, hors spec), `events` (timeline)).
  **Pas de champ
  `deposit`** : l'acompte est le même pour toutes (réglé dans `paiement.ts`), il
  n'est pas suivi RDV par RDV.
  **Indépendant du barrel** : importer directement `@/lib/mock/rendezvous`.
  Expose `rendezvousList(scope)` / `rendezvousRows(list, scope)` / `rdvToRow`,
  `allRendezvous()` (RdvDetail bruts), `rendezvousDetail(id)`,
  `nextRendezvousId(scope)`, `newRdvId()`, `staffBySalon`, `RDV_STATUS_META`,
  `advantageLabel`, `posteTypeForCategory`, les dérivés `rdvTotal` / `rdvDuration`
  / `rdvEnd` (fin de créneau), `needsAssign` (+ `RdvRow.cancelled`),
  `rdvCountByStaffDay(scope)` (→ `{ date, staffFirstName, count }[]`, consommé
  par l'écran Planning — matching par prénom), `prestationSlots(r)` (2026-09-21 —
  → `{ prestation, start, end }[]`, les prestations d'un RDV s'enchaînent depuis
  `date`, pas en parallèle ; positionne chaque prestation sur la ligne de SA
  praticienne dans `rendezvous/DayTimeline.tsx`), et les helpers de format
  `frLongDate` / `frFullDate` / `frDateTime` / `durationLabel`
  (+ réexport `fcfa` / `groupThousands`, `type PosteType`)
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
- `staff-colors.ts` (2026-09-21) — palette d'accent par praticienne : un
  identifiant visuel (pas la couleur de marque `brand-*`) pour repérer une même
  personne d'un coup d'œil sur `equipe/PlanningPanel` et l'Agenda de
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
  `newOverrideId`
- `messagerie.ts` — fixtures de la boîte de réception (conversations multicanal :
  `call` / `sms` / `whatsapp` / `chat`, événements `ThreadEvent` datés).
  **Indépendant du barrel** : importer directement `@/lib/mock/messagerie`.
  Expose `conversations`, `smsOutboundAvailable` (panne SMS simulée), les
  dérivés `needsReply` / `missedCall` / `failedOutbound` / `previewText` /
  `writableChannels`, et le formatage `formatListStamp` / `formatClock` /
  `formatDaySeparator` / `formatDuration` / `groupEventsByDay`
- `fidelite.ts` — fixtures du programme de fidélité (`LoyaltySettings` : base
  d'accumulation `visit` / `amount`, arrondi, points, invités, expiration, solde
  min. ; `LoyaltyTier` : nom + seuil + `multiplierPct` ; `LoyaltyReward` : nom +
  coût points + type `fixed` / `percent` / `service` / `product` + valeur).
  **Indépendant du barrel** : importer directement `@/lib/mock/fidelite`.
  Expose `defaultSettings` / `defaultTiers` / `defaultRewards`, les listes
  d'options (`ACCRUAL_BASIS_OPTIONS`, `ROUNDING_OPTIONS`, `REWARD_TYPE_OPTIONS`)
  et les helpers `points`, `multiplier`, `rewardValueLabel`, `rewardTypeLabel`
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
- `services.ts` — **catalogue réel** Beauty & Co (repris le 2026-09-04 de
  `point-de-vente/lib/data/menu.ts` — 107 prestations, 7 catégories ; Mini&Co ·
  Hair et Mini&Co · Spa fusionnées en un seul service « Mini & Co », « Brows /
  Lashes » retiré car absent du catalogue réel). `Service` : catégorie, émoji,
  salons, statut ; `Prestation` : `serviceId` nullable, prix FCFA (réel), durée
  min (réelle), statut, `recipe: RecipeItem[]`, **`salonIds: SalonId[]`**
  (`[]` = hérite du service parent — le catalogue réel ne distingue pas les
  prestations par salon), **`reservationMode: ReservationMode`** (`named` /
  `any` / `both`, heuristique sur le prix / la sous-catégorie / la durée) ;
  `RecipeItem` : `productId` + quantité + unité ; `ServiceQuestion` : `serviceId`
  nullable, libellé, type `oui-non` / `choix-multiple` / `texte`, statut (fiche
  d'accueil — sans équivalent côté point-de-vente, restée fictive). **Indépendant
  du barrel** : importer directement `@/lib/mock/services`. Expose `serviceSeeds`
  / `prestationSeeds` (dérivé de `rawPrestations`) / `questionSeeds`, `products`
  (catalogue réel Kérastase + boissons du bar, remplace les consommables
  fictifs — `image?: string` pointe vers `public/images/produits|boissons/` ;
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
  `unbookableCount`), `orphanPrestations` / `orphanQuestions`, et les helpers
  `durationLabel`, `digitsToInt`, `recipeLine`, `productName`, `questionTypeLabel`,
  `newId`. La suppression d'un service détache ses prestations / questions.
- `stock.ts` — fixtures Stock. **Indépendant du barrel** : importer directement
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
- `emails.ts` — fixtures des modèles d'email (`EmailTemplate` : `kind` `system` /
  `custom`, objet, corps, `trigger` lisible ; `EmailAutomation` : `reminder1` /
  `reminder2` / `thankYou`, chacune `ReminderRule` = `enabled` + `value` +
  `unit` `hours` / `days`). **Indépendant du barrel** : importer directement
  `@/lib/mock/emails`. Expose `defaultSiteLink`, `defaultAutomation`,
  `defaultTemplates`, `TEMPLATE_VARIABLES` (jetons `{{cliente}}`, `{{salon}}`…),
  `DELAY_UNIT_OPTIONS`, `CUSTOM_TRIGGER`, et les helpers `delayUnitLabel`,
  `templateKindLabel`.
- `paiement.ts` — fixtures des paramètres de paiement (`PaymentSettings` :
  `liveMode` encaissement réel / mode test, `depositMode` `fixed` / `percent` /
  `none`, `depositFixed` FCFA, `depositPercent` %, `paypalUsd`). **Indépendant du
  barrel** : importer directement `@/lib/mock/paiement`. Expose
  `defaultPaymentSettings`, `DEPOSIT_MODE_OPTIONS`, `DEPOSIT_MIN_FCFA` et le
  helper `depositSummary`.
- `compte.ts` — fixtures du compte de la propriétaire (`OwnerAccount` : nom, rôle,
  email, téléphone, `avatarUrl`, `notify` = canaux email / SMS / WhatsApp).
  **Indépendant du barrel** : importer directement `@/lib/mock/compte`. Expose
  `defaultAccount` (Sokhna Ndour), `NOTIFY_CHANNEL_LABELS`, et les validateurs
  `isValidEmail` / `isValidPhone` / `passwordError(current, next, confirm)`
  (+ `PASSWORD_MIN`, `accountInitials`).
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
  header (`header/UserDropdown`, lien « Paramètres des salons »).
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

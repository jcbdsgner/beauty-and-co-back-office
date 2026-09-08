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
- Graphiques : ApexCharts · Calendrier : FullCalendar (glisser-déposer d'un RDV
  via `eventDrop` natif — `react-dnd` / `jsvectormap` sont des dépendances
  résiduelles non utilisées, à retirer de `package.json`)

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

### Couleurs de marque

Deux couleurs principales, déclinées sur la même teinte rouge (~2-5°) dans
l'échelle `--color-brand-*` de `src/app/globals.css` :

- **`#886666`** = `brand-500` — mauve-brun, couleur d'action / interactive
  (boutons pleins, liens, états sélectionnés, barres de graphe). Contraste
  5.07:1 sur blanc (AA texte + composants) ; le blanc par-dessus passe aussi AA.
- **`#FDCFCB`** = `brand-100` — rose pâle, teinte d'accent pour les fonds
  discrets (puce active, sélection). Le texte posé dessus doit être foncé
  (`brand-700` ou `gray-800`) : `brand-500` sur `brand-100` ne fait que 3.6:1.

Règles de contraste : sur un fond `brand-50` / `brand-100`, le texte de marque
est `brand-700` (jamais `brand-500`) ; les icônes de marque sur fond clair sont
`brand-600` minimum. `brand-500` en texte n'est admis que sur blanc / `gray-50`.
Les hex bruts des graphes ApexCharts utilisent `#886666` (+ `#dcb0aa` pour la
2ᵉ série).

### Langue : français uniquement

La plateforme est **intégralement en français** : libellés, placeholders,
messages, `aria-label`, titres de page/`metadata`, textes de données fictives.
Tout texte anglais rencontré dans un fichier touché doit être traduit dans le
même changement. `<html lang="fr">`.

### Montants

Monnaie FCFA. Les montants sont **toujours affichés en entier**, jamais abrégés
(« 2.450.000 FCFA », pas « 2,45 M » ni « 422 k »), avec le **point comme
séparateur de milliers** (« 45.000 », pas « 45 000 » ni « 45,000 »). Helpers dans
`src/lib/mock/beautyandco.ts` : `fcfa(n)` pour un montant, `groupThousands(n)`
pour un nombre nu (compteurs, graduations d'axe).

### Commandes

- `npm run dev` — serveur de dev (http://localhost:3000)
- `npm run build` — build de production
- `npm run start` — serveur de production
- `npm run lint` — ESLint

## Utilisateurs de la plateforme

Le scope est pour l'instant limité à **un seul utilisateur : la propriétaire**.
Tout écran généré doit être pensé pour elle, pas pour un admin générique.

### La propriétaire

**Sokhna Ndour** — dirigeante-exploitante d'un réseau de salons de beauté /
coiffure à Dakar (marque « Beauty & Co », plusieurs salons — Almadies, Sea
Plaza…). Elle gère elle-même l'exploitation : rendez-vous, clientèle, équipe,
stock, paiements. Monnaie FCFA, interface en français. C'est le nom affiché dans
le menu compte (`UserDropdown`).

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
- `icons/index.tsx` — barrel de **tous** les icônes SVG (importer `@/icons`)

### `src/app/` — routes (App Router)

- `layout.tsx` — root layout : polices, `SidebarProvider`, metadata FR
- `not-found.tsx` — page 404 globale (FR, light, renvoie au tableau de bord)
- `(admin)/` — pages dans le shell dashboard (sidebar + header)
  - `layout.tsx` — shell : `LocationProvider` > `AccountProvider` >
    `NotificationsProvider` + `AppSidebar` + `AppHeader` + `Backdrop`, marge
    dynamique
  - `page.tsx` — tableau de bord (rend `<Dashboard />`, cf. `components/back-office/`)
  - `satisfaction/page.tsx` — satisfaction client (rend `<Satisfaction />`)
  - `rapports/page.tsx` — générateur de rapports paramétrables (rend `<Rapports />`)
  - `messagerie/page.tsx` — boîte de réception multicanal (rend `<Messagerie />`)
  - `rendez-vous/page.tsx` — rendez-vous : deux vues (Liste triable + Agenda
    FullCalendar), fiche latérale avec affectation d'une praticienne par
    prestation, « Nouveau rendez-vous » manuel (rend `<RendezVous />`). Pas
    d'étape de confirmation (un RDV réservé est « à venir »), pas d'affichage de
    l'acompte (le même montant pour toutes, réglé dans `/paiement`) ; les RDV
    annulés restent consultables (filtre « Annulés », bouton « Rétablir ») ;
    `rendez-vous/[id]/page.tsx` — fiche rendez-vous complète (rend
    `<RendezVousDetail />`), `notFound()` si l'id est inconnu
  - `equipe/page.tsx` — Équipe : bascule **Membres** (annuaire + fiche membre à
    3 onglets : **Activité** (satisfaction client + charge de RDV + demandes
    d'avance / de congé avec décision Accepter / Refuser) / **Identité & accès**
    (coordonnées, rôles, salons, membre actif, accès plateforme + récap
    autorisations) / **Compétences & horaires**) / **Autorisations** (matrice
    « autorisation × rôle » réglée par la propriétaire — voir `RolePermissions`)
    (rend `<Equipe />`, dans `<Suspense>` pour la lecture de `?membre=<id>` à
    l'arrivée depuis une notification)
  - `planning/page.tsx` — Planning : matrice de présence de l'équipe × 7 jours,
    trous de couverture, congés / absences (rend `<Planning />`)
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
    `clients/[id]/page.tsx` — fiche cliente : en-tête (avatar, badges, actions
    `<ClientDetailActions />`), informations personnelles (genre, adresse,
    membre depuis…), préférences par thème, statistiques + répartition des
    rendez-vous par statut, **abonnements & packs de la cliente** (jointure sur
    `clientId` avec `@/lib/mock/abonnements` — statut, prochaine échéance,
    prestations de pack restantes ; lien « Gérer » → `/fidelite`), rendez-vous à
    venir, historique. Ancres `#abonnements`, `#rendez-vous` et `#historique`
  - `paiement/page.tsx` — paramètres de paiement : encaissement réel / mode test,
    acompte à la réservation, règlement PayPal (rend `<Paiement />`)
  - `compte/page.tsx` — « Mon compte » : wrapper serveur qui rend `<Compte />`
    (identité, connexion + changement de mot de passe, canaux de notification).
    Atteignable depuis le menu compte du header, pas dans la sidebar.
  - `emails/modeles/page.tsx` — modèles d'email : lien du site, délais des rappels /
    remerciement, bibliothèque de modèles éditables (rend `<EmailTemplates />`)
  - `notifications/page.tsx` — wrapper serveur (metadata) qui rend `<Notifications />`
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

> Note : `AppSidebar` est organisé en 5 groupes — **Pilotage** (`/`, `/rapports`,
> `/satisfaction`), **Journée** (`/rendez-vous`, `/messagerie`, `/clients`),
> **Équipe** (`/equipe`, `/planning`, `/journal`), **Catalogue & stock**
> (`/services`, `/stock`), **Configuration** (`/salons`, `/fidelite` — libellé
> « Fidélité & abonnements » —, `/emails/modeles`, `/paiement`). Toutes ces routes
> sont implémentées. Plus d'entrée « Calendrier »
> (dissoute dans la vue Agenda de `/rendez-vous`) ni « Créneaux horaires »
> (absorbée par `/salons`). Les routes template en anglais (`customers`, `orders`,
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
  indépendant — à la suite de `dashboardKpis`),
  `Compte` (écran `/compte` : une carte, sections Identité / Connexion /
  Notifications ; brouillon local + « Enregistrer » gaté sur `dirty` ; changement
  de mot de passe en bloc séparé avec sa propre action ; validation email /
  téléphone / mot de passe ; consomme `useAccount()` ; pas d'import de photo),
  `Notifications` (shell client de `/notifications` : liste chronologique groupée
  par jour, filtre catégorie `SegmentedControl`, « marquer lu » par ligne +
  « tout marquer lu », non-lus distincts, chaque ligne = `<Link>` vers une page
  existante, 2 états vides ; consomme `useNotifications()`),
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
  **Liste** (défaut) / **Agenda**, bascule couleur « Par poste / Par praticienne »
  en Agenda, chip « N prestation(s) sans praticienne » qui bascule un filtre
  `assignOnly`, « + Nouveau rendez-vous » (modale). État de session
  `useState<RdvDetail[]>(allRendezvous())` — affecter / annuler / rétablir /
  déplacer / supprimer / créer + toasts « cliente prévenue ». Vue Liste :
  colonnes **Cliente d'abord**, puis Date & heure · Prestations · Praticienne(s) ·
  Statut · Total (pas de colonne acompte) ; filtres `À venir` (défaut) /
  `Aujourd'hui` / `Passés` / `Annulés` / `Tous` + filtre praticienne → panneau
  latéral (mène par le nom de la cliente ; pour un RDV clos, plus de `select`
  d'affectation). Vue Agenda : FullCalendar `timeGridDay/Week`, plage =
  `salonConfig().hours`, événements colorés par `posteType`, « à affecter » en
  orange, les RDV annulés en sont retirés, `eventDrop` déplace, bandeau capacité
  par type de poste),
  `RendezVousDetail` (fiche `/rendez-vous/[id]` : statut en état local, titre =
  nom de la cliente, carte « Total des prestations » seule (pas d'acompte /
  reste), Alert « praticienne demandée absente ce jour-là », action primaire
  « Marquer la visite terminée » (RDV à venir), « Rétablir le rendez-vous » (RDV
  annulé), carte Affectation visible seulement si « à venir » — « assigner tout
  le RDV à » + un `select` par prestation via
  `membersForPrestation(prestationId, salon)` filtré `presenceFor` + « Première
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
  filtre `Toutes / Actives / À relancer` + tri par colonne + filtre salon global,
  suppressions locales avec « Annuler » — piloté par `clients(scope)`),
  `ClientsTable` (tableau : en-têtes de colonne cliquables pour trier — les
  « jamais venues » restent en bas —, avatar initiales, actions par ligne),
  `ClientRowActions` (bouton `Détails` + menu `⋯` rendu en portail : « Voir les
  rendez-vous » / « Supprimer »),
  `ClientDetailActions` (client — les deux boutons d'en-tête de la fiche cliente :
  « Historique complet » ancre vers `#historique`, « Supprimer » confirme en
  ligne puis renvoie vers `/clients`, aucune persistance),
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
  question à un service, ou supprimer), `ui` (`BackButton` + réexport des
  primitives de `../fidelite/ui`)
  `EmailTemplates` (shell client de l'écran modèles d'email : lien du site +
  automatisations + bibliothèque de modèles + panneau d'édition, tout en mémoire
  de session — fixtures `@/lib/mock/emails`) ; sous-dossier `emails/` :
  `SettingsCards` (carte « Lien du site » + carte « Rappels & remerciement » :
  brouillon local, bouton « Enregistrer » actif seulement si modifié, délais
  grisés quand la règle est coupée), `TemplateList` (grille de cartes de modèles :
  badge Système / Personnalisé, aperçu objet + corps, clic = édition ; bouton
  « Nouveau modèle »), `TemplateEditorPanel` (panneau latéral : objet + corps,
  chips de variables insérées au curseur, modèles système non renommables /
  non supprimables, suppression confirmée en ligne, Échap / clic sur le fond pour
  fermer), `ui` (primitives locales : `SectionCard`, `Toggle`, `MiniSelect`,
  `fieldClass`, `btnPrimary` / `btnGhost`)
  `Paiement` (écran des paramètres de paiement : une carte, brouillon local +
  bouton « Enregistrer » actif seulement si modifié — fixtures
  `@/lib/mock/paiement`) ; trois sections — encaissement réel / mode test (bandeau
  info ou avertissement selon l'état), acompte à la réservation (montant fixe /
  pourcentage / aucun, champ variable + plancher 100 FCFA), règlement PayPal
  (montant en USD, grisé si aucun acompte). Primitives inline dans le fichier.
  `Equipe` (shell client de l'écran Équipe : bascule `SegmentedControl`
  **Membres** / **Autorisations** ; état `members` + `staffRequests` +
  `autorisations` (`defaultAutorisations`) en mémoire de session, vues liste /
  fiche / ajout, filtre salon global (vue Membres seulement), lecture
  `?membre=<id>` (`useSearchParams`) pour l'ouverture directe depuis une
  notification, décision sur les demandes avec `decidedAt` horodaté réel,
  `setRoleCapability` (via `applyCapability`) / `resetRole` pour la matrice —
  fixtures `@/lib/mock/staff` + `@/lib/mock/rh` + `@/lib/mock/autorisations`) ;
  sous-dossier `equipe/` : `EquipeList` (recherche + filtre rôle `SegmentedControl`
  + `DataTable` : avatar initiales, badges rôles / accès, pastille `Badge`
  « N demande(s) » ton warning sur un membre qui a des demandes en attente),
  `MemberDetail` (fiche : en-tête + « supprimer définitivement » ; 3 onglets —
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
  contrôlés partagés création / édition + `identityValid` / `trimIdentity` /
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
  travaillé / repos + heures + coupure), `AddMemberFlow` (création : identité +
  compétences + horaires, puis « inviter maintenant ? »), `ui` (`BackButton`,
  `CheckPill`, `Avatar` + réexport des primitives de `../fidelite/ui`),
  `Planning` (shell client de l'écran Planning : filtre salon, navigation
  ‹ semaine ›, état `absences` / `shiftOverrides` en mémoire de session, bandeau
  trous de couverture, « rétablir les horaires habituels de la semaine » —
  fixtures `@/lib/mock/planning`) ; sous-dossier `planning/` : `PlanningGrid`
  (matrice CSS membres × 7 jours : praticiennes puis section repliable ; cellule =
  `presenceFor` — plage fond `brand-50` / absence fond gris / repos vide, pastille
  « N RDV » vers `/rendez-vous`, colonne « Fermé » grisée, en-tête rouge
  « Personne » sur les trous ; clic → `AbsenceDialog`), `AbsenceDialog` (Modal :
  motif `SelectField` + plage Du / Au + Alert de conflit si RDV déjà pris sur la
  période + lien),
  `Stock` (shell client de l'écran /stock : filtre salon `useLocation` +
  `SegmentedControl`, vue liste / fiche, état de session `extraMovements`
  (ajustements + transferts) + `thresholds` (`ThresholdOverride` : seuils salon /
  entreprise édités) + `photos` (`Record<productId, dataURL>`), bandeau d'alerte
  **à deux niveaux** — « à commander » (total entreprise sous le seuil, scope
  « all ») ou « à réapprovisionner à <salon> » (salon sous son seuil) —, lit
  `?produit=<id>` (`useSearchParams`) pour ouvrir une fiche produit au montage
  (deep-link depuis une notification stock) — fixtures `@/lib/mock/stock`) ;
  sous-dossier `stock/` : `StockList` (table triée par couverture : Produit ·
  Stock entreprise / salon (+ sous-texte « dont réserve N » en scope « all ») ·
  Seuil · Conso/sem · badge Couverture `≈ N j` rouge < 7 j / orange < 14 j ·
  `Sparkline` ; filtres Tous / Sous le seuil / À commander + recherche),
  `StockDetail` (fiche produit en **page unique déroulante**, `BackButton` ;
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
- `header/` — `NotificationDropdown` (cloche : badge de non-lus + ping, aperçu des
  6 dernières, « tout marquer lu », lien vers `/notifications` ; consomme
  `useNotifications()`), `UserDropdown` (menu compte : nom + photo lus depuis
  `useAccount()` ; « Mon compte » → `/compte`, « Paramètres des salons » →
  `/salons`, « Se déconnecter » → `/signin`).
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
  aquarelle) quand elle est réduite. Largeur `w-[240px]` déployée / `w-[90px]`
  réduite (miroir : `lg:ml-[240px]` / `lg:ml-[90px]` dans `(admin)/layout.tsx`).
  Nav FR (tableau `menuGroups`, 5 groupes : Pilotage / Journée / Équipe /
  Catalogue & stock / Configuration). Plus aucun sous-menu (machinerie
  `openSubmenu` retirée) ; `isActive` en match préfixe (une sous-route surligne
  son parent). Pas de bloc utilisateur / déconnexion ici. Pas de filtre salon
  ici : chaque écran salon-scopé monte son propre `SegmentedControl` câblé sur
  `useLocation()`.
- `AppHeader.tsx` — barre du haut : bascule sidebar + `NotificationDropdown` +
  `UserDropdown`. Pas de recherche globale (chaque écran qui en a besoin porte sa
  propre barre de recherche, ex. `Clients`), pas de bascule de thème, pas de
  filtre salon.
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
  `closuresFor(scope, iso)` + `isClosed(id, iso)`. `stockAlert.href` pointe
  vers `/stock`.
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
  par l'écran Planning — matching par prénom), et les helpers de format
  `frLongDate` / `frFullDate` / `frDateTime` / `durationLabel`
  (+ réexport `fcfa` / `groupThousands`, `type PosteType`)
- `staff.ts` — fixtures Équipe. **Indépendant du barrel** : importer directement
  `@/lib/mock/staff`. `Member` : identité, `roles: StaffRole[]` (`praticienne` /
  `caisse` / `manager`), `category` (`coiffure` / `esthetique` / `staff`),
  `salonIds`, `account` (`active` / `invited` / `none`), `active`, `skills` (ids
  de prestations), `baseHours: Record<Weekday, DayShift>` (horaires habituels,
  trame de référence du Planning). 7 membres (5 praticiennes canon + caisse +
  manager). Expose `members`, `ROLE_LABELS` / `CATEGORY_LABELS` / `ACCOUNT_LABELS`
  (+ `ROLE_OPTIONS` / `CATEGORY_OPTIONS`), et les helpers `fullName`, `initials`,
  `memberById`, `membersInScope(scope)`, `canPerform(memberId, prestationId)`,
  `membersForPrestation(prestationId, scope?)` (actives + praticiennes +
  compétentes + du salon), `newStaffId`
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
  (absence > override > `baseHours`, recoupé avec `isClosed`), `weekPresence(
  scope, mondayIso, data?)` → `{ days, rows }`, `coverageGaps(scope, mondayIso,
  data?)` → `{ iso, salonId }[]`, `weekHasExceptions`, `hasNoBaseHours`, et les
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
  `RECIPE_UNIT_OPTIONS`, `SERVICE_EMOJIS`, `RESERVATION_MODE_OPTIONS`),
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
  `ADJUST_KINDS`, `newMovementId`, `movementReasonLabel` (+ réexport `frShortDate`)
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
  N'importe RIEN de `rh.ts` (la fusion avec les demandes de l'équipe se fait dans
  `NotificationsContext`). Expose `notifications` (5 seeds système),
  `CATEGORY_LABELS`, `TONE_DOT`, `unreadCount(list)`, `groupByDay(list)`
  (« Aujourd'hui » / « Hier » / « 1 sept. »).
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
  partie reste lisible). Monde ancré au `JOURNAL_TODAY` `2026-09-03`. Expose
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
prop `action` (faux bouton décoratif, plus aucun écran ne s'en servait). Le
graphe FullCalendar de `/rendez-vous` utilise `@fullcalendar` directement (pas le
wrapper `calendar/`). `(auth)/` (connexion + mots de passe) refondu FR / light /
marque. `back-office/FormCard` et `back-office/StatusBadge` ne servent plus qu'à
la vitrine `design-system`.
**Restant à traiter** : `design-system/page.tsx` encore anglais + `dark:`
(exempté pour la démo de thème) ;
`npm run lint` = 2 erreurs `react-hooks/set-state-in-effect` (`ThemeContext`,
`LocationContext` — hydratation `localStorage` post-montage, faux positifs) +
2 warnings a11y dans `PeriodFilter` — toutes pré-existantes ;
~14 lignes de CSS mort `.jvectormap-*` dans `globals.css` ; dépendances npm
inutilisées `jsvectormap`, `react-dnd`, `react-dnd-html5-backend`.

## Catalogue réel (2026-09-04)

Le catalogue « Services » et « Produits » (`src/lib/mock/services.ts`), inventé
jusqu'ici, a été remplacé par les vraies données Beauty & Co reprises du projet
frère `point-de-vente` (`lib/data/menu.ts` — hors périmètre de ce dépôt, lu
ponctuellement avec l'autorisation explicite de l'utilisatrice) : 107 prestations
réelles sur 7 catégories, catalogue Kérastase (67 produits) + boissons du bar
(7 produits) avec photos réelles (`public/images/produits/`,
`public/images/boissons/`). Changements dérivés :

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

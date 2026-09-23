# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Utilisatrice unique : **Sokhna Ndour**, propriétaire-exploitante d'un réseau
de salons de beauté / coiffure à Dakar (marque « Beauty & Co », plusieurs
salons — Almadies, Sea Plaza…). Elle gère elle-même l'exploitation :
rendez-vous, clientèle, équipe, stock, paiements.

- Rythme d'usage double : plusieurs coups d'œil courts par jour (RDV du jour,
  encaissements) + une session de gestion approfondie quotidienne.
- Opérationnelle sur planning/RDV, clientèle et argent — gestes faits
  elle-même. Plutôt en pilotage sur équipe, stock et emails.
- Aisance logicielle moyenne : à l'aise avec tableau/formulaire classiques,
  perdue par les patterns inhabituels, actions groupées obscures ou une forêt
  de filtres.
- Contexte matériel (confirmé) : poste fixe, grand écran, au bureau.
- Échelle (confirmé) : réseau de salons stable (2 salons), mais le volume de
  rendez-vous par jour peut dépasser les fixtures actuelles (3-6/jour/salon) —
  ne pas concevoir en supposant un plafond bas de RDV/jour.
- Outils actuels (confirmé) : agenda papier + WhatsApp, aucun logiciel de
  gestion dédié avant ce back-office.
- Registre de langue (confirmé) : vouvoiement, ton sobre et professionnel.

## Product Purpose

Back-office admin **front-end uniquement** pour piloter l'exploitation
quotidienne d'un réseau de salons de beauté : rendez-vous, clientèle, équipe,
stock, catalogue de services, fidélité/abonnements, paiements, messagerie,
rapports. Succès = Sokhna voit en un coup d'œil ce qui se passe aujourd'hui
(qui vient, quand, où) et agit dessus (affecter une praticienne, gérer un
congé, ajuster un stock) sans revenir au papier ni à WhatsApp.

## Positioning

Remplace un suivi papier + WhatsApp par un outil unique centré sur les
rendez-vous du jour en priorité absolue — pas le chiffre d'affaires (priorité
confirmée explicitement par l'utilisatrice après qu'une première version du
tableau de bord ait mis le CA en avant par erreur). Ce n'est pas un SaaS
multi-tenant générique : conçu pour une seule utilisatrice, un seul métier
(salons de beauté), une seule devise (FCFA), une seule langue (français).

## Operating Context

Écrans couverts : Tableau de bord (RDV du jour, KPI, actions à traiter),
Rendez-vous (vue Liste + Agenda par praticienne, réservation manuelle,
affectation), Clients (répertoire, fiche détaillée, préférences,
abonnements/packs), Équipe (annuaire, fiche membre à 3 onglets, planning de
présence, matrice d'autorisations par rôle), Services (catégories,
prestations, questions d'accueil, recettes de consommation), Stock (niveaux
par salon + réserve centrale, seuils, transferts, projection de réappro),
Fidélité & abonnements (programme de points, forfaits, packs prépayés,
souscriptions), Salons (identité, postes, horaires, fermetures
exceptionnelles), Journal d'activité (audit des actions de l'équipe),
Messagerie (boîte de réception multicanal : appel/SMS/WhatsApp/chat),
Rapports (générateur paramétrable), Satisfaction (avis clients), Réglages
(paiement, emails), Compte (identité de la propriétaire).

## Capabilities and Constraints

- Aucun backend, aucune API, aucune persistance : chaque écran est alimenté
  par des fixtures dans `src/lib/mock/`. C'est un squelette d'architecture +
  d'écrans pour designer dessus, pas un produit en production.
- Desktop uniquement pour l'instant (pas de responsive/mobile, pas
  d'adaptation tactile).
- Thème clair exclusivement (pas de dark mode en dehors de la vitrine
  `design-system`).
- Montants en FCFA, toujours affichés en entier, point comme séparateur de
  milliers.
- Stack : Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4,
  basé sur le template TailAdmin (gardé proche du stock).

## Brand Commitments

- Marque « Beauty & Co ». Logos réels dans `public/images/logo/` :
  `beautyandco-wordmark.svg` (wordmark noir) + `beautyandco-mark.jpg` (mark
  aquarelle).
- Police **Poppins** imposée explicitement par l'utilisatrice, maintenue même
  quand une référence Figma suggérait une autre police.
- Vouvoiement, ton sobre et professionnel (confirmé).
- Couleurs de marque et règles de contraste détaillées dans DESIGN.md.

## Evidence on Hand

Catalogue de services et produits réel (107 prestations, produits Kérastase +
boissons du bar), repris du projet frère `point-de-vente` avec autorisation
explicite de l'utilisatrice (voir CLAUDE.md). Photos produit réelles dans
`public/images/produits/` et `public/images/boissons/`. Avis clients, équipe
et rendez-vous restent des données fictives (fixtures) sauf mention contraire.

## Product Principles

1. Les rendez-vous du jour priment sur tout le reste en tête d'écran — pas le
   chiffre d'affaires (déjà corrigé une fois, ne pas régresser).
2. Une seule utilisatrice : concevoir pour Sokhna spécifiquement, pas pour un
   admin générique multi-rôles.
3. Desktop uniquement, thème clair uniquement, français uniquement — pas
   d'exceptions hors vitrine `design-system`.
4. Aisance logicielle moyenne : préférer les patterns familiers (tableau,
   formulaire) aux interactions inhabituelles ou aux forêts de filtres.
5. Aucune donnée réelle persistée : squelette de design sur fixtures, pas un
   produit à durcir en prod pour l'instant.

## Accessibility & Inclusion

Aucune exigence spécifique établie au-delà des bonnes pratiques standard
(contraste AA sur les couleurs de marque, voir DESIGN.md).

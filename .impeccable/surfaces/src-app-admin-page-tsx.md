---
version: 1
slug: "src-app-admin-page-tsx"
primary_target: "src/app/(admin)/page.tsx"
related_targets: ["src/components/back-office/Dashboard.tsx"]
---

# Tableau de bord (accueil)

Scope : route `/` du back-office, mode Operate. Visiteuse : Sokhna Ndour, propriétaire, plusieurs coups d'œil par jour + une session de gestion. Tâche : savoir ce qui reste à faire aujourd'hui et le régler. Contraintes : desktop, clair, FR, FCFA entier ; design system point-de-vente (daisyUI « beautyco ») inchangé. Choix utilisatrice (2026-09-27) : structure « Décider d'abord » ; blocs secondaires (accès rapides, prestations populaires, nouveaux clients, satisfaction) conservés mais restylés.

## Direction contract

Seed key: ab0a8f9b (surface, structure dealt #4 « Décider d'abord »)

THESIS: l'accueil est la liste de ce qui reste à faire aujourd'hui, pas un mur de widgets. Refuse la grille de cartes KPI + colonnes par salon + tuiles de raccourcis où tout pèse pareil.

OWN-WORLD: fond crème base-200, une seule feuille blanche par zone, pas de cartes imbriquées ; texte chaud base-content ; primary #886666 réservé aux actions ; rose accent pour « maintenant » ; Poppins une seule famille ; chiffres tabulaires.

STORY: 1) date + phrase-bilan du jour ; 2) « À régler aujourd'hui » rédigé en phrases (personne = sujet, jamais un tag), un bouton honnête par ligne ; 3) la journée en fil unique tous salons, passé replié, trait « maintenant » ; 4) bas de page calme : chiffres du jour, prestations populaires, liens vers les autres écrans.

FIRST VIEWPORT: date en titre, bilan chiffré en phrase, file de décisions complète, début du fil de la journée à partir de maintenant.

SIGNATURE: le trait « maintenant » dans le fil, qui sépare le terminé (replié, dépliable) du reste de la journée.

RISK: décisions au-dessus des rendez-vous — acceptable car la plupart des décisions portent sur les rendez-vous du jour (prestations à affecter).

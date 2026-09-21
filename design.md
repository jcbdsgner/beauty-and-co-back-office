# design.md

Règles de design produit du back-office Homonyme — à appliquer pour concevoir
ou modifier n'importe quel écran. Pour le périmètre de travail, la stack, les
commandes et l'architecture du code (« Carte du code »), voir [CLAUDE.md](./CLAUDE.md).

## Cible d'affichage

Pour l'instant : **desktop uniquement**. Ne pas concevoir ni implémenter de
version mobile / responsive (pas de breakpoints mobiles, pas d'adaptation
tactile). Travailler la mise en page pour un écran large.

## Thème : light uniquement

L'UI produit est en **mode clair exclusivement**. Ne pas ajouter de variantes
`dark:` dans le code produit (pages `(admin)/`, `layout/`, `components/back-office/`,
`components/header/`, `components/ui/`…). Pas de sélecteur de thème dans l'UI.
Les `dark:` déjà présents dans le template sont à retirer au fil des fichiers
touchés. Seule exception : la vitrine `src/app/design-system/` peut conserver sa
bascule de thème pour la démonstration.

## Couleurs de marque

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

## Langue : français uniquement

La plateforme est **intégralement en français** : libellés, placeholders,
messages, `aria-label`, titres de page/`metadata`, textes de données fictives.
Tout texte anglais rencontré dans un fichier touché doit être traduit dans le
même changement. `<html lang="fr">`.

## Montants

Monnaie FCFA. Les montants sont **toujours affichés en entier**, jamais abrégés
(« 2.450.000 FCFA », pas « 2,45 M » ni « 422 k »), avec le **point comme
séparateur de milliers** (« 45.000 », pas « 45 000 » ni « 45,000 »). Helpers dans
`src/lib/mock/beautyandco.ts` : `fcfa(n)` pour un montant, `groupThousands(n)`
pour un nombre nu (compteurs, graduations d'axe).

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
- **Ce qui l'occupe en premier** : les rendez-vous du jour — qui vient, quand,
  où. Le chiffre d'affaires et les encaissements viennent juste après (corrigé
  le 2026-09-14 : une première passe de redesign du tableau de bord avait mis
  le CA en avant, sur la base de l'ancienne rédaction de cette ligne — la
  propriétaire a précisé que ce sont les rendez-vous qui doivent sauter aux
  yeux en premier).
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

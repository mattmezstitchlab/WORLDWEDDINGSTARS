# ARCHITECTURE DU SOCLE DMC

## Principe fondamental

```
INTERNET / SITES / API / DOCUMENTS / MÉDIAS
        ↓
ABSORPTION        dmc/ingest/absorber.mjs     — reçoit (fichier, JSON, HTML, URL, média)
        ↓
EXTRACTION        dmc/ingest/extractors.mjs   — ne prend que ce qui est réellement trouvé
        ↓
NORMALISATION     dmc/core/normalize.mjs      — typologies communes, vocabulaire original conservé
        ↓
DMC               dmc/core/codes.mjs          — UNE ENTITÉ RÉELLE = UN DMC
        ↓
PROVENANCE        dmc/core/entity.mjs         — chaque donnée reliée à sa source + statut + nature
        ↓
RÉSOLUTION        dmc/core/resolve.mjs        — réutiliser avant de créer ; pas de doublons
        ↓
GRAPHE            dmc/core/graph.mjs          — relations typées, sourcées
        ↓
EDITORIAL ENGINE  dmc/core/editorial.mjs      — matière → blocs éditoriaux stables
        ↓
DESIGN SYSTEM     dmc/core/design-system.mjs  — tokens + contrats de mise en forme
        ↓
RENDERERS         dmc/renderers/*             — Globe, Magazine, Coffret, Mobile… indépendants
```

**LE DMC IDENTIFIE. LE GRAPHE RELIE. L'ABSORBEUR RÉCUPÈRE. LE NORMALIZER
STRUCTURE. L'EDITORIAL ENGINE RACONTE. LE DESIGN SYSTEM UNIFIE. LES
RENDERERS DONNENT VIE À L'EXPÉRIENCE.**

## Philosophie

```
UNE SOURCE DE VÉRITÉ → UN DMC → UN GRAPHE DE RELATIONS
→ PLUSIEURS EXPÉRIENCES → PLUSIEURS RENDUS → AUCUNE DUPLICATION INUTILE
```

Les sites ne fusionnent pas. Le Globe, le Magazine, les Coffrets, la
Broderie et les futurs sites restent des applications indépendantes qui
partagent **le même langage** : le registre DMC. Le DMC est une clé
d'identité et de relation — pas une URL, pas une base centralisée
obligatoire : le registre est un ensemble de fichiers JSON versionnés,
lisibles par n'importe quel renderer (Node ou navigateur).

## Couches

### 1. Registre (`dmc/registry/`)
Source de vérité. Une entité = un fichier JSON validé par schéma
versionné : identité, DMC, territoire, coordonnées si connues,
description, sources, médias, identifiants externes, statuts, dates.
`relations.json` porte le graphe. `territories.json` porte le registre
des préfixes territoriaux (unicité des codes). `index.json` est généré
(`dmc/tools/build-index.mjs`), jamais édité à la main.

### 2. Ingestion (`dmc/ingest/`)
L'absorbeur reçoit URL / page web / API / JSON / document / image /
vidéo / source officielle / source éditoriale / données territoriales.
Les extracteurs ne produisent **que ce qui est trouvé** : titres, textes,
lieux, personnes, organisations, dates, horaires, prix, coordonnées,
catégories, images, vidéos, liens, relations. Toute donnée absente →
`À_CONFIRMER` ou `NON_DISPONIBLE` — jamais une valeur fabriquée. Chaque
valeur extraite porte un pointeur vers sa position dans la source.
Sortie : **propositions** (statut `PROPOSÉ`) écrites dans
`registry/proposals/`, jamais directement dans le registre.

### 3. Normalisation (`dmc/core/normalize.mjs`)
Vocabulaire commun (typologies `TYPOLOGIES` + catégories éditoriales),
transformation « musée / centre culturel / galerie / lieu culturel » →
typologie canonique, **en conservant toujours `originalTerm` et
`originalVocabulary`**. Normalisation d'identité : minuscules, accents
supprimés, articles retirés, alias — pour la résolution, jamais pour
l'affichage.

### 4. Résolution (`dmc/core/resolve.mjs`)
Avant toute création : recherche d'une entité existante par
(1) `externalIds`, (2) nom normalisé + territoire + type, (3) alias.
Si trouvée → réutilisation du DMC (avec score et trace `via`). Sinon →
création + attribution DMC + provenance enregistrée. Objectif absolu :
pas de doublons inutiles.

### 5. Graphe (`dmc/core/graph.mjs`)
Relations typées (`SITUE_DANS`, `ILLUSTRE_PAR`, `DECRIT_PAR`,
`PARAIT_DANS`, `LIE_A`, … — vocabulaire ouvert documenté dans
`docs/RELATIONS.md`), chacune avec `sources`, `status`, `nature`,
`confidence`, dates. Cible : un DMC, ou un DMC + ancre (`#media-0`,
`world-data.js#fes`) pour ne pas dupliquer de données. Le graphe permet
à une même entité d'apparaître dans plusieurs jours, heures, magazines,
coffrets et territoires (architecture 365 × 24) **sans jamais créer de
données artificielles pour remplir la grille**.

### 6. Editorial Engine (`dmc/core/editorial.mjs`)
Reçoit DMC + données + sources + relations + médias + contexte ; produit
un **document éditorial** (JSON validé par `editorial.schema.json`)
composé de blocs au vocabulaire stable : `COVER`, `EDITORIAL`,
`IMMERSIVE`, `MOSAÏQUE`, `CHRONIQUE`, `TIMELINE`, `CARTE`, `DOSSIER`,
`GALERIE`, `MEDIA`, `SOURCE`. Le moteur est déterministe : mêmes entrées
→ même document. Un bloc sans matière réelle est marqué `À_CONFIRMER`
ou omis — jamais inventé. Chaque bloc porte sa `nature` (RÉEL /
RECONSTITUÉ / ÉDITORIAL) et ses sources.

### 7. Design System (`dmc/core/design-system.mjs`)
Indépendant des sources. Tokens extraits du design validé du projet
(encre, ivoire, or, bleu, typographies Inter / Cormorant Garamond /
mono, easing) + contrat de mise en forme par bloc + règle
d'intégration : **on n'affiche pas le site externe** ; on absorbe sa
matière et on la recompose. Quand l'intégration directe est impossible
ou interdite → aperçu propre avec provenance et lien « OUVRIR LA
SOURCE » (implémentation de référence existante : la carte `#pointCard`
du Globe).

### 8. Renderers (`dmc/renderers/`)
Contrat unique (`CONTRACT.md`) : un renderer reçoit une entité DMC +
son contexte de graphe et produit sa propre expérience. Démonstrateur :
`globe-adapter.mjs`, qui reconstruit **exactement** les entités de
`world-data.js` à partir du registre (test aller-retour 17/17). Les
données ne sont pas dupliquées dans les renderers : le contenu
éditorial long reste résolu par référence (`contentRef`).

## Indépendance et préservation

- Le socle est un dossier autonome `dmc/` : aucun import depuis
  `index.html` ; le globe ne connaît pas le socle (aujourd'hui), le
  socle sait parler au globe (adapter).
- `index.html` et `world-data.js` ne sont pas modifiés. La migration
  (`tools/migrate-world-data.mjs`) est à sens unique et rejouable.
- Aucune fusion d'applications : chaque renderer reste un site
  indépendant ; le partage passe par le registre et les schémas.

## Versionnement

Chaque schéma porte `schemaVersion` (semver) et chaque fichier de
registre porte la version du schéma qu'il satisfait. Règle d'évolution :
additif seulement en mineur (nouveau champ optionnel), cassure en
majeur avec migration outillée. Les entités du registre portent
`createdAt` / `updatedAt`. Le socle peut évoluer sans casser les
projets qui l'utilisent.

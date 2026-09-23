# EXEMPLE RÉEL — FÈS (entité existante du projet)

Cet exemple utilise **uniquement** des données réelles déjà présentes
dans le projet (`world-data.js` v2.0.0, entité `fes`, contrôlée par
`tools/verify-points.mjs`). Rien n'est inventé : chaque ligne est
traçable jusqu'à sa source.

## 1. Identification

| Champ | Valeur | Nature | Statut | Source |
|---|---|---|---|---|
| **DMC** | `DMC-MA-FES-000001` | — | — | alloué par le registre (docs/DMC-CODE.md) |
| Type | `PLACE` (subtype d'origine : `ville`) | RÉEL | CONFIRMÉ | `src-project-fes` |
| Nom | Fès | RÉEL | CONFIRMÉ | `src-project-fes` |
| Territoire | Fès-Meknès, Maroc (MA) | RÉEL | CONFIRMÉ | `src-project-fes` |
| Coordonnées | 34.06, −4.98 | RÉEL | CONFIRMÉ | `src-project-fes` (identiques à `PLACES` du Globe, testé) |
| Catégorie | PATRIMOINE | ÉDITORIAL | CONFIRMÉ | `src-project-fes` |
| Id externe | `project:id = fes` · `pexels:photo = 36782884` | RÉEL | CONFIRMÉ | projet + page Pexels |

## 2. Provenance (intégralité)

**src-project-fes** — `PROJECT_FILE` · « world-data.js + index.html
(PLACES) — projet World Wedding Stars » · récupérée le 2026-09-23 ·
statut `CONFIRMÉ` (contrôles 112/112 + 89/89 du projet) · confidence 0.85.

**src-pexels-fes** — `SOURCE_OFFICIELLE` · Pexels ·
<https://www.pexels.com/photo/bustling-street-in-fez-medina-morocco-36782884/> ·
récupérée le 2026-09-23 · externalId `pexels:36782884` · statut
`SOURCE_OFFICIELLE` · confidence 0.9.

## 3. Média relié (`DMC-MA-FES-000001#media-0`)

- Kind `IMAGE` — nature **RÉEL** (existence, auteur et licence sourcés),
  `illustration: true` : **vue du lieu, image d'ambiance — aucun mariage
  réel n'est représenté** (note conservée et affichée).
- Auteur : Miguel Cuenca · Licence : <https://www.pexels.com/license/>
- URL image : `https://images.pexels.com/photos/36782884/pexels-photo-36782884.jpeg?auto=compress&cs=tinysrgb&w=1000`
- Légende : « Ruelle animée de la médina de Fès »

## 4. Relations (graphe)

| Relation | Cible | Type | Nature | Statut |
|---|---|---|---|---|
| `rel-000001` | `DMC-MA-FES-000001#media-0` | `ILLUSTRE_PAR` | RÉEL | SOURCE_OFFICIELLE |
| `rel-000002` | `world-data.js#fes` | `DECRIT_PAR` | ÉDITORIAL | CONFIRMÉ |

Les 6 emplacements `relations` du renderer Globe (worldData, edition,
page, destination, story, wedding) restent **null** : aucune édition du
World Wedding Magazine n'existe encore pour Fès — rien n'est inventé.
Le jour où une édition existera, elle aura son propre DMC (`MAGAZINE` /
`EDITION`) et une relation `PARAIT_DANS` sourcée la reliera à ce DMC-ci.

## 5. Document éditorial généré

`editorial-document.json` (à côté de ce dossier) est produit par
`buildDocument(fes, { registry, contentResolver })` — déterministe,
validé contre `editorial.schema.json` :

```
COVER → EDITORIAL → IMMERSIVE → CARTE → GALERIE → TIMELINE → RELATIONS → SOURCE
```

À noter : le bloc `TIMELINE` est émis **vide et `À_CONFIRMER`** — aucune
donnée du projet ne fournit de jalons datés sourcés pour Fès, et le
moteur ne remplit jamais une timeline sans matière réelle
(anti-fabrication, docs/EDITORIAL-BLOCKS.md règle 1).

Le bloc `EDITORIAL` ne recopie pas le texte dans le registre : il le
**résout** depuis `world-data.js#fes` via `contentRef` (aucune
duplication, décision D3).

## 6. Ce que chaque expérience en fait (mêmes DMC, mêmes données)

- **Globe** : le point lumineux de Fès (34.06, −4.98) s'identifie au
  survol, ouvre la carte `#pointCard` (COVER + IMMERSIVE + SOURCE en
  langage Globe), lien « Découvrir » → page Pexels. L'adapter
  (`renderers/globe-adapter.mjs`) reconstruit exactement l'entité
  `world-data.js` depuis le registre — test aller-retour 17/17.
- **Magazine / Coffrets / futurs sites** : mêmes blocs, mis en forme
  selon leurs supports via `BLOCK_LAYOUT` et `TOKENS` du Design System —
  sans jamais réafficher le site source ni dupliquer les données.
- **365 × 24** : ce DMC pourra paraître dans plusieurs éditions et
  moments via des relations `PARAIT_DANS` / `A_LIEU_PENDANT` — une
  entité, plusieurs apparitions, zéro duplication (test dédié).

## 7. Cas futur illustratif (non créé — volontairement)

Le cas d'usage « LE FRESNOY, TOURCOING » de la mission suivrait
exactement ce cycle : absorption de la source officielle → proposition
`PROPOSÉ` → résolution (aucun doublon) → `DMC-FR-TOU-0000xx` →
relations (VIDÉO, ARTICLE, COFFRET, MAGAZINE, PROFESSIONNELS, SITE
OFFICIEL, CARTE, ARCHIVE) → écran éditorial depuis le Globe avec
« EXPLORER » et « OUVRIR LA SOURCE » pour ce qui n'est pas intégrable.
**Aucune entité Le Fresnoy n'est créée dans ce registre tant qu'aucune
source réelle n'a été absorbée** — le socle ne fabrique rien.

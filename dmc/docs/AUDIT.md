# AUDIT — État du projet avant le socle DMC

Date : 2026-09-23 · Commit de référence : `08cf1db` (point de reprise validé)

## 1. Inventaire

| Fichier | Rôle | État |
|---|---|---|
| `index.html` (2073 l.) | Application « World Wedding Magazine — La Carte » : globe 3D three.js r128 (CDN), 17 points lumineux, 11 niveaux (Monde → Mémoire), arcs, étoiles, édition 24 heures, index, rail, détail, carte éditoriale `#pointCard`, survol `#ptip` | **Validé — intouchable** (contrôles 112/112 + 89/89) |
| `world-data.js` (407 l.) | Couche éditoriale du globe : 17 entités liées aux marqueurs **par id**, média Pexels + provenance complète par entité, `relations` (worldData, edition, page, destination, story, wedding) toutes `null`, `discover` → page Pexels | **Validé — source de contenu du renderer Globe** |
| `tools/verify-points.mjs` | 112 contrôles statiques (couverture, contenu, provenance, diversité, zéro-broderie, globe inchangé, câblage) | Vert |
| `tools/smoke-test.mjs` | 89 vérifications runtime (harnais headless, quaternions réels) | Vert |
| `README.md` | Documentation projet | À jour |

Aucun package.json, aucun framework, aucun build, aucune base de données.
Node 22 disponible. Le sandbox bash n'a pas d'accès réseau (l'ingestion
d'URL en direct sera donc toujours doublée d'un mode fichier local).

## 2. Données existantes (réutilisables — ne pas recréer)

17 entités réelles, toutes de type `ville` (subtype), une par pays :

- Identité : `id` (clef de liaison au globe), `name`, `city`, `country`,
  `territory` (17 territoires distincts), `lat`/`lon` (identiques aux
  `PLACES` du globe, vérifié par les outils).
- Éditorial : `category` (8 catégories, max 23,5 %), `sujet`, `accroche`,
  `contenu` (nature **ÉDITORIAL** — mise en récit produite pour le projet).
- Médias : 1 photo Pexels par entité avec `source`, `imageUrl`, `pageUrl`,
  `author`, `retrievedAt` (2026-09-23), `query`, `subject`, `caption`,
  `note` d'ambiance (nature **RÉEL** pour l'existence du média et sa
  licence ; jamais présentée comme photo de mariage réel).
- Relations : 6 clefs préparées, toutes `null` — **aucune édition, page ou
  mariage n'existe encore** ; rien à migrer, tout à préserver tel quel.
- `discover` : `pexels-source` vers la page Pexels (pas de destination
  inventée).

## 3. Design System existant (à absorber, pas à réinventer)

Tokens CSS déjà validés dans `index.html` :

```
--ink #07080B · --ink-2 #0C0F14 · --ivory #F2EDE3
--gold #C9A96A · --gold-dim rgba(201,169,106,.45) · --blue #5D8CC0
--line rgba(242,237,227,.13) · --line-soft rgba(242,237,227,.07)
--sans Inter · --serif Cormorant Garamond · --mono ui-monospace
--ease cubic-bezier(.16,1,.3,1)
```

Composants éditoriaux existants réutilisables comme référence de rendu :
carte `#pointCard` (NOM / ACCROCHE / CONTENU / CATÉGORIE / image +
provenance / DÉCOUVRIR), pointe `#ptip`, double-page d'édition, index,
rail, détail. **C'est l'implémentation de référence de la règle
« aperçu propre + provenance + lien vers la source ».**

## 4. Doublons identifiés

- Aucun doublon d'entité (17 ids uniques, 17 territoires, 17 pays).
- Duplication acceptable et transitoire (voir `DECISIONS.md` D3) : les
  métadonnées de média existent dans `world-data.js` (cache du renderer
  Globe) et seront portées par le registre DMC (source de vérité cible).
  Un test anti-dérive compare les deux en permanence.

## 5. Ce qui manque (et que le socle apporte)

- Identifiant universel par entité réelle (→ code **DMC**).
- Provenance structurée par **donnée** (aujourd'hui : par média seulement).
- Statuts de confiance (PROPOSÉ → VÉRIFIÉ) et natures (RÉEL /
  RECONSTITUÉ / ÉDITORIAL).
- Normalisation typologique (tout est `ville` ; les sources externes
  diront « musée », « galerie », « lieu culturel »…).
- Résolution d'entités anti-doublons avant création.
- Graphe de relations typées et sourcées (les 6 clefs `null` actuelles
  sont un contrat de renderer, pas un graphe).
- Moteur éditorial à vocabulaire stable (blocs) et Design System
  indépendant des sources.
- Ingestion de sources externes (JSON, HTML, documents, médias, API).

## 6. Contraintes absolues rappelées par l'audit

1. `index.html` et `world-data.js` ne sont **pas modifiés** par le socle
   (le socle les lit ; la migration est à sens unique avec test aller-retour).
2. Aucune donnée inventée : coordonnées, noms, territoires viennent du
   projet ; ce qui manque est marqué `À_CONFIRMER` / `NON_DISPONIBLE`.
3. Les 17 contrôles existants (verify + smoke) doivent rester verts.

# WORLDWEDDINGSTARS — World Wedding Magazine · La Carte

Globe éditorial 3D (three.js r128, un seul fichier `index.html`) :
**17 points d'or** sur les continents, 11 niveaux narratifs
(Monde → Continent → Pays → Région → Ville → Lieu → Histoire → Édition →
Page → Objet → Mémoire), arcs lumineux entre les lieux, édition 24 heures
en double-page, index navigable et rail de niveaux.

## Couche éditoriale des points lumineux

Chaque point d'or est une **porte éditoriale** vers un sujet du monde du
mariage, diversifié et vérifiable :

| Catégorie | Points |
|---|---|
| PATRIMOINE | Fès, Kano, Le Caire, Samarkand |
| CULTURE | Ispahan, Oaxaca, Chichicastenango |
| HONEYMOON | Bruges, Cusco, Auckland (Waiheke) |
| TRADITION | Kyoto, Hanoï |
| ROMANCE | Venise, Paris |
| DESTINATION | Édimbourg |
| GASTRONOMIE | Lucknow |
| INSOLITE | Kutch (Rann blanc) |

Aucune catégorie ne dépasse 30 % des points. Comportement :

- **Survol** → identification volante (nom · catégorie · pays) + retour de
  sélection lumineux natif du marqueur ; pas de double identification quand
  l'étiquette HTML du lieu est déjà visible.
- **Clic simple** (sans glisser, seuil 6 px) → carte éditoriale légère :
  **NOM**, **ACCROCHE**, **CONTENU**, **CATÉGORIE**, image d'ambiance
  Pexels avec **provenance complète** (source, auteur, URL image, URL page,
  date de récupération, sujet, mention d'ambiance) et lien **DÉCOUVRIR**.
- **Fermeture** (✕, « Retour au globe », touche Escape, clic sur l'océan,
  tout changement de niveau) → retour immédiat au globe.
- Les points **derrière le globe ne sont pas cliquables** (test de face
  réelle) ; la couche est désactivée en mode récit (niveaux ≥ 6).

L'index et le détail existants sont masqués (classe `suppress`) pendant la
lecture : le globe reste la star, aucun contenu n'apparaît sans interaction.

## Données — `world-data.js`

Architecture `POINT → ENTITÉ → SUJET → CONTENU → IMAGE → DÉCOUVRIR`.
17 entités liées aux marqueurs **par id** (`fes`, `kano`, `caire`, `venise`,
`bruges`, `paris`, `edimbourg`, `lucknow`, `kutch`, `kyoto`, `samarkand`,
`isfahan`, `hanoi`, `oaxaca`, `cusco`, `chichi`, `auckland`), coordonnées
strictement identiques à `PLACES`.

- Médias : une photo **Pexels** par point, choisie pour son lien avec le
  lieu/sujet (médina, durbar, pyramides, lagune, béguinage, etc.), jamais
  une photo générique de mariage ; toujours présentée comme image
  d'ambiance.
- `relations` (`worldData`, `edition`, `page`, `destination`, `story`,
  `wedding`) : clés présentes et **null** — prêtes pour de futures
  connexions World Wedding Magazine, sans inventer d'éditions ou de
  destinations inexistantes.
- `discover.href` pointe vers la page Pexels du média (ou une page réelle
  vérifiable) — aucune destination inventée.

## Retrait de l'univers « broderie »

Toutes les références à la broderie ont été supprimées du récit (thème du
masthead, niveau 12 « Broderie », champ `broderie` des lieux → `ceremonie`,
24 heures de l'édition réécrites en journée de noces, textes éditoriaux,
légendes, pied de page « Universalbroderie ») **sans aucune modification
visuelle du globe** : les 24 heures, les compositions génératives et la
structure de navigation sont conservées à l'identique.

## Globe inchangé

Shaders (océan, continents, atmosphère, marqueurs, arcs, étoiles),
géométries, lumières, caméra (fov 38), distances, `focusOn`, vitesses
(auto-rotation `dt*0.055`, slerp `0.0022`), interactions (molette, glisser,
pincement, rail, index, étiquettes HTML, détail, double-page) et le CSS
d'origine sont **identiques octet pour octet** à l'import
(`633dc9b`) — vérifié par `tools/verify-points.mjs`. Les seuls ajouts CSS
(pointe de survol `#ptip`, carte `#pointCard`) sont en fin de feuille.

## Contrôles

```bash
node tools/verify-points.mjs        # 112 contrôles statiques (0 échec attendu)
node tools/verify-points.mjs --net  # + disponibilité HTTP des images Pexels
node tools/smoke-test.mjs           # 89 vérifications runtime (0 échec attendu)
```

- `verify-points.mjs` : couverture 17/17 des points, contenu éditorial et
  provenance, diversification, scan « zéro broderie », comparaison octet
  pour octet du globe avec l'import, câblage de l'interactivité.
- `smoke-test.mjs` : exécute le vrai code dans un harnais headless avec
  Vector3/Quaternion réels (formules three.js r128) et horloge factice,
  puis simule survol, clics, fermetures, glisser, occlusion, molette,
  index, rail, étiquettes, détail, édition 24 heures et navigation haute —
  sans aucun `console.warn`.

## Socle DMC — absorption éditoriale (`dmc/`)

Couche **indépendante** (aucune modification du Globe) capable d'absorber
des informations venues de sites, APIs, documents et médias, de les
identifier par un code **DMC** (`DMC-FR-LIL-000042`), de les normaliser,
d'en conserver la provenance (source · date · statut · nature
RÉEL/RECONSTITUÉ/ÉDITORIAL · confiance), de les relier dans un graphe
typé, puis de les recomposer dans notre langage éditorial (blocs stables :
COVER, EDITORIAL, IMMERSIVE, MOSAÏQUE, CHRONIQUE, TIMELINE, CARTE,
DOSSIER, GALERIE, MEDIA, SOURCE, RELATIONS) et notre Design System.

```
UNE SOURCE DE VÉRITÉ → UN DMC → UN GRAPHE DE RELATIONS
→ PLUSIEURS EXPÉRIENCES → PLUSIEURS RENDUS → AUCUNE DUPLICATION INUTILE
```

- **Registre réel** : les 17 lieux du Globe migrés en 17 entités DMC
  (ex. `DMC-MA-FES-000001` pour Fès) + 34 relations sourcées — sans
  recréer ni dupliquer les données (`world-data.js` reste le contenu du
  Globe, résolu par référence ; test aller-retour exact 17/17).
- **Ingestion** : `node dmc/ingest/cli.mjs <fichier|url> --resolve` →
  extraction honnête (jamais de valeur inventée ; absences
  `À CONFIRMER` / `NON DISPONIBLE`), propositions isolées dans
  `registry/proposals/`, résolution anti-doublons avant toute création.
- **Renderers indépendants** : même DMC, même réalité, plusieurs
  expériences (Globe aujourd'hui — démonstrateur livré ; Magazine,
  Coffrets, Mobile ensuite). Compatible 365 éditions × 24 moments sans
  données artificielles.
- Documentation complète : `dmc/README.md` et `dmc/docs/` (audit,
  architecture, spécification du code DMC, statuts/provenance, types,
  relations, blocs éditoriaux, design system, décisions).
- Exemple réel : `dmc/examples/fes/` (dossier + document éditorial généré).

```bash
node --test dmc/tests/*.test.mjs     # 53 tests du socle
node dmc/tools/verify-dmc.mjs        # 28 contrôles (socle + anti-dérive + globe préservé)
node dmc/tools/migrate-world-data.mjs --check   # anti-dérive du registre
```

## Fichiers

```
index.html            application complète (globe + UI + couche éditoriale)
world-data.js         17 entités éditoriales (contenu, médias, provenance)
tools/verify-points.mjs   contrôle statique complet du Globe
tools/smoke-test.mjs      test runtime headless du Globe
dmc/                  socle DMC : docs, schémas v1.0.0, core, ingestion,
                      registre (17 entités réelles), renderers, tests, exemples
package.json          scripts (test, verify, migrate, ingest, serve)
```

Ouvrir `index.html` dans un navigateur (servi en HTTP pour le chargement
de `world-data.js`), p. ex. `python3 -m http.server 8080` ou `npm run serve`.

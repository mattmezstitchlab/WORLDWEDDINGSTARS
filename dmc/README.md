# SOCLE DMC — absorption · identité · relations · éditorial

Couche **indépendante** du projet World Wedding Stars. Elle absorbe la
matière venue d'Internet (sites, APIs, documents, médias), l'identifie
par un code **DMC**, la normalise, conserve sa provenance, la relie,
puis la recompose dans notre langage éditorial et notre Design System.

```
LE DMC IDENTIFIE.          LE GRAPHE RELIE.
L'ABSORBEUR RÉCUPÈRE.      LE NORMALIZER STRUCTURE.
L'EDITORIAL ENGINE RACONTE. LE DESIGN SYSTEM UNIFIE.
LES RENDERERS DONNENT VIE À L'EXPÉRIENCE.
```

```
UNE SOURCE DE VÉRITÉ → UN DMC → UN GRAPHE DE RELATIONS
→ PLUSIEURS EXPÉRIENCES → PLUSIEURS RENDUS → AUCUNE DUPLICATION INUTILE
```

Les sites ne fusionnent pas : Globe, Magazine, Coffrets, Broderie et
futurs sites restent indépendants et partagent le même langage.
**Une entité réelle = un DMC.** `DMC-FR-LIL-000042` = France, Lille,
42ᵉ entité du territoire.

## Arborescence

```
dmc/
  docs/            AUDIT · ARCHITECTURE · DMC-CODE · STATUTS-PROVENANCE
                   TYPES · RELATIONS · EDITORIAL-BLOCKS · DESIGN-SYSTEM · DECISIONS
  schemas/         schémas JSON versionnés v1.0.0
                   (entity · source · relation · media · editorial · dmc-code)
  core/            vocab · validate · codes · normalize · entity
                   resolve · graph · editorial · design-system
  ingest/          absorber · extractors · cli  (absorption de sources)
  registry/        LA source de vérité : entities/ (17 DMC réels),
                   relations.json (34), territories.json, index.json (généré)
                   proposals/  ← propositions d'ingestion (jamais dans entities/)
  renderers/       CONTRACT.md + globe-adapter.mjs (démonstrateur)
  tools/           migrate-world-data.mjs · verify-dmc.mjs
  tests/           suite automatisée (node --test) + fixtures
  examples/fes/    exemple réel : dossier + document éditorial généré
```

## Commandes

```bash
# tout vérifier (socle + anti-dérive + globe préservé)
node dmc/tools/verify-dmc.mjs

# tests du socle
node --test dmc/tests/

# migration world-data.js → registre (déterministe, rejouable)
node dmc/tools/migrate-world-data.mjs          # écrit le registre
node dmc/tools/migrate-world-data.mjs --check  # anti-dérive, n'écrit rien

# absorber une source (fichier ou URL) → PROPOSITION (jamais d'écriture directe)
node dmc/ingest/cli.mjs page.html --type PLACE --territory "Tourcoing" --country FR --resolve
node dmc/ingest/cli.mjs dmc/tests/fixtures/pexels-36782884.json --json
```

## Cycle de vie d'une donnée absorbée

```
source externe → absorb() → extraction honnête (locator par valeur)
  → proposition (PROPOSÉ, confidence 0.4, absences À_CONFIRMER/NON_DISPONIBLE)
  → resolveOrCreate() : externalId ? nom+territoire+type ? alias ?
      → REUSE du DMC existant (pas de doublon)
      → REVIEW si homonyme douteux (jamais de fusion automatique)
      → CREATE : DMC alloué + provenance enregistrée
  → relations typées et sourcées (graphe)
  → buildDocument() : blocs éditoriaux stables (COVER, EDITORIAL, …, SOURCE)
  → Design System : tokens + contrats de mise en forme
  → renderer (Globe/Magazine/Coffret/…) : même DMC, même réalité
```

Règle d'or : **une information provenant d'un site externe n'est jamais
présentée comme vérifiée si elle ne l'est pas** ; une donnée manquante
est `À CONFIRMER` ou `NON DISPONIBLE`, jamais fabriquée.

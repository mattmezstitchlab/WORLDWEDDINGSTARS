# EDITORIAL ENGINE — vocabulaire de blocs, v1.0.0

Le moteur ne génère **pas** librement des interfaces différentes à chaque
fois. Il produit un **document éditorial** : une liste ordonnée de blocs
tirés d'un vocabulaire stable. Le Design System décide ensuite de la mise
en forme ; les renderers décident du support.

## Entrée

```
DMC + données + sources + relations + médias + contexte
(contexte = édition/jour/heure/territoire/expérience cible, facultatif)
```

## Sortie — document éditorial

```json
{
  "schemaVersion": "1.0.0",
  "engine": { "name": "dmc-editorial", "version": "1.0.0" },
  "dmc": "DMC-MA-FES-000001",
  "generatedAt": "AAAA-MM-JJTHH:MM:SSZ",
  "context": { "…": "…" },
  "blocks": [ { "block": "COVER", "nature": "RÉEL", "status": "CONFIRMÉ",
                "sources": ["…"], "data": { "…": "…" } } ]
}
```

Déterminisme : mêmes entrées → exactement même document (pas d'aléa,
horodatage exclu).

## Blocs du vocabulaire

| Bloc | Contenu | Matière requise |
|---|---|---|
| `COVER` | nom, accroche, catégorie/typologie, territoire, média principal | identité + ≥ 1 média |
| `EDITORIAL` | récit long (contenu éditorial résolu par `contentRef`) | contenu ÉDITORIAL existant |
| `IMMERSIVE` | plein écran média + légende + provenance | média |
| `MOSAÏQUE` | grille de médias/entités reliées | ≥ 2 éléments reliés |
| `CHRONIQUE` | texte court daté, ton éditorial | texte sourcé |
| `TIMELINE` | jalons datés | ≥ 2 dates **réelles** |
| `CARTE` | coordonnées, position, territoire | lat/lon connues |
| `DOSSIER` | regroupement de sections thématiques | ≥ 2 blocs fils |
| `GALERIE` | série de médias avec légendes | ≥ 1 média |
| `MEDIA` | un média + provenance complète | média |
| `SOURCE` | liste des provenances (source, date, statut, nature) | toujours produit |
| `RELATIONS` | entités reliées, typées, avec direction | ≥ 1 relation |

## Règles anti-fabrication

1. Un bloc dont la matière manque est **omis** ou émis avec
   `status: "À_CONFIRMER"` et `data` vide — jamais avec des valeurs
   inventées (ex. : pas de `TIMELINE` sans dates réelles ; l'exemple
   Fès le démontre, le contenu du projet ne contenant pas de jalons
   datés sourcés).
2. Chaque bloc porte `nature` (RÉEL / RECONSTITUÉ / ÉDITORIAL) et
   `sources` (références de provenance).
3. Le texte ÉDITORIAL est toujours attribué à sa source de production
   (ici : `world-data.js`, nature ÉDITORIAL) — jamais requalifié en RÉEL.
4. Ajouter un bloc = version mineure du schéma + document + test.

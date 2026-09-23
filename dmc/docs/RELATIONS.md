# GRAPHE DE RELATIONS — v1.0.0

`DMC → ENTITÉ → RELATIONS → EXPÉRIENCES`

## Format d'une relation

```json
{
  "id": "rel-000001",
  "from": "DMC-FR-LIL-000001",
  "to": "DMC-FR-LIL-000002#media-0",   // DMC, ou DMC+fichier + ancre
  "type": "ILLUSTRE_PAR",
  "sources": [ { "…provenance complète…" } ],
  "status": "CONFIRMÉ",
  "nature": "RÉEL",
  "confidence": 0.85,
  "createdAt": "AAAA-MM-JJ",
  "updatedAt": "AAAA-MM-JJ",
  "note": "facultatif"
}
```

Toute relation est typée et, lorsque pertinent, sourcée. Une relation
non sourcée ne peut pas dépasser le statut `PROPOSÉ`.

## Vocabulaire initial (ouvert)

| Type | Sens (from → to) |
|---|---|
| `SITUE_DANS` | lieu → territoire ; entité → commune/pays |
| `COMMUNE_LIEU` | commune → lieu (cas d'usage prioritaire) |
| `ILLUSTRE_PAR` | entité → média (ancre `#media-n`) |
| `DECRIT_PAR` | entité → contenu (ancre fichier, ex. `world-data.js#fes`) |
| `MENTIONNE_DANS` | entité → article / vidéo / magazine |
| `PARAIT_DANS` | entité → édition / coffret / magazine (365 × 24) |
| `A_LIEU_PENDANT` | événement/mariage → moment / saison / édition |
| `PRODUIT_PAR` | média/article → personne/organisation |
| `PROPOSE_PAR` | lieu → professionnel / organisation |
| `LIE_A` | relation générique documentée (note obligatoire) |
| `MEME_ENTITE_QUE` | fusion/équivalence constatée (dédoublonnage) |

## Règles

1. **Pas de duplication de données dans les relations** : une relation
   relie des DMC (ou des ancres), elle ne recopie pas le contenu.
2. Une même entité peut apparaître dans plusieurs jours, heures,
   magazines, coffrets, territoires : ce sont plusieurs relations
   `PARAIT_DANS`/`A_LIEU_PENDANT`, pas plusieurs entités.
3. 365 × 24 : le graphe prépare les emplacements ; **aucune relation
   artificielle** n'est créée pour remplir la grille. Les cases vides
   restent vides (`À_CONFIRMER`).
4. Réciprocité implicite : `to` peut être interrogé (`graph.related(dmc)`
   renvoie les deux sens avec `direction`).
5. Suppression : une relation erronée passe à `status: "RÉSERVÉ"` avec
   note, plutôt que d'être effacée (traçabilité).

## Relations existantes migrées

Depuis `world-data.js` (17 entités) :
- 17 × `ILLUSTRE_PAR` → `#media-0` (photo Pexels, sourcée, `RÉEL`).
- 17 × `DECRIT_PAR` → `world-data.js#<id>` (contenu éditorial Globe,
  sourcée fichier projet, `ÉDITORIAL`).

Les 6 clefs `relations` de `world-data.js` (worldData, edition, page,
destination, story, wedding) restent `null` : ce sont des emplacements
de contrat du renderer Globe, **pas** des relations réelles. Le jour où
une édition existera, elle deviendra une entité `MAGAZINE`/`EDITION`
avec son propre DMC et une relation `PARAIT_DANS` sourcée.

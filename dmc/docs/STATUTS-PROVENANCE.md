# PROVENANCE, STATUTS, NATURES — v1.0.0

## Provenance obligatoire

Chaque donnée importante (identité, territoire, coordonnées, horaire,
prix, média, relation, affirmation éditoriale) est reliée à une source :

```json
{
  "sourceUrl": "https://…",          // ou null si source interne/fichier
  "sourceType": "PAGE_WEB | API | JSON | DOCUMENT | IMAGE | VIDEO | SOURCE_OFFICIELLE | EDITORIALE | TERRITORIALE | PROJECT_FILE",
  "sourceName": "nom lisible de la source",
  "retrievedAt": "AAAA-MM-JJ",       // date de récupération, obligatoire
  "updatedAt": "AAAA-MM-JJ",         // si la source la fournit
  "externalId": "…",                 // identifiant externe si disponible
  "status": "…",                     // voir ci-dessous
  "confidence": 0.0,                 // 0 → 1, renseignée par règles
  "locator": "…"                     // position dans la source (facultatif)
}
```

Une information provenant d'un site externe n'est **jamais** présentée
comme vérifiée si elle ne l'est pas.

## Statuts (`status`)

| Statut | Sens | Règle d'usage |
|---|---|---|
| `PROPOSÉ` | produit par l'absorbeur, non revu | toute sortie d'ingestion |
| `TROUVÉ` | lu dans une source, non recoupé | extraction simple |
| `SOURCE_OFFICIELLE` | lu dans la source officielle du sujet | site de l'établissement, page auteur du média… |
| `CONFIRMÉ` | recoupé par ≥ 2 sources ou contrôle outillé | outils de vérification du projet |
| `VÉRIFIÉ` | revu humainement / vérification forte | **jamais attribué automatiquement** |
| `RÉSERVÉ` | code ou plage réservé, entité non publiée | DMC immuables retirés/fusionnés |
| `À_CONFIRMER` *(machine : `À_CONFIRMER`)* | donnée manquante ou douteuse | jamais de valeur fabriquée à la place |

Sentinelle d'absence : `NON_DISPONIBLE` (la source ne fournit pas la
donnée) — distinct de `À_CONFIRMER` (donnée attendue mais non trouvée
ou douteuse). Les deux s'affichent tels quels, avec espaces.

## Confiance (`confidence`) — règles initiales

| Situation | confidence |
|---|---|
| `SOURCE_OFFICIELLE` | 0.9 |
| Donnée du projet contrôlée par les outils (coordonnées, identité) | 0.85 + `CONFIRMÉ` |
| Extraction unique d'une page tierce | 0.6 + `TROUVÉ` |
| Proposition d'ingestion non revue | 0.4 + `PROPOSÉ` |
| Absence (`À_CONFIRMER` / `NON_DISPONIBLE`) | 0 |

## Natures (`nature`)

| Nature | Définition | Exemple du projet |
|---|---|---|
| `RÉEL` | information directement sourcée | coordonnées de Fès (34.06, −4.98) ; existence, auteur et licence de la photo Pexels 36782884 |
| `RECONSTITUÉ` | obtenu en reliant plusieurs données réelles | « Fès est dans le territoire Fès-Meknès au Maroc » recoupé projet + média |
| `ÉDITORIAL` | mise en récit, proposition, interprétation produite à partir du réel | `sujet`, `accroche`, `contenu` de `world-data.js` ; blocs narratifs du moteur |

Règles :
1. La nature est portée par la **donnée** (champ, média, relation, bloc),
   pas seulement par l'entité.
2. `ÉDITORIAL` ne peut pas devenir `RÉEL` par simple republication.
3. Un média d'illustration n'est jamais présenté comme une photographie
   réelle du sujet s'il ne l'est pas (note d'ambiance conservée et
   affichée — règle déjà appliquée par le Globe).

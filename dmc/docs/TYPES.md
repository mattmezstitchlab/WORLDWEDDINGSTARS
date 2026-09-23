# TYPES D'ENTITÉS — vocabulaire ouvert, v1.0.0

Le modèle n'est **pas** limité aux cas actuels. Tout type nouveau est
ajouté ici + dans `dmc/core/vocab.mjs` (additif, version mineure).

## Types initiaux

| Type | Sens | Exemples |
|---|---|---|
| `PLACE` | lieu réel | Fès, Kyoto, Le Fresnoy (Tourcoing) |
| `PERSON` | personne réelle | un auteur Pexels, une négafa nommée |
| `ORGANIZATION` | organisation | un office de tourisme, un musée |
| `PROFESSIONAL` | professionnel (métier du mariage, prestataire) | photographe, traiteur |
| `EVENT` | événement daté | durbar, festival, cérémonie |
| `ARTICLE` | article (interne ou absorbé) | chronique, dossier |
| `VIDEO` | vidéo | média relié à un DMC |
| `IMAGE` | image | média relié à un DMC |
| `OBJECT` | objet | objet d'édition du Globe (niveau 9) |
| `WEDDING` | mariage (réel documenté ou récit) | relation vers un lieu |
| `COFFRET` | coffret éditorial | expérience Coffrets |
| `MAGAZINE` | numéro de magazine | World Wedding Magazine N° 01 |
| `MOTIF` | motif / composition générative | tracé d'étude du Globe |
| `TERRITORY` | territoire (commune, région, pays) | Fès-Meknès, Métropole de Lille |
| `EDITION` | édition datée (architecture 365 × 24) | Édition du 14 mars, 21 h |
| `MOMENT` | moment (heure, saison, instant éditorial) | 03:00, saison des pluies |

## Règles

1. `type` est obligatoire, majuscule, dans ce vocabulaire.
2. Le vocabulaire d'origine de la source est conservé dans `subtype`
   (ex. `ville`, `musée`, `galerie`) et dans les typologies normalisées
   (`normalize.mjs`) avec `originalTerm`.
3. Un type inconnu à l'ingestion → `PLACE`/`ORGANIZATION`/… **seulement
   si la source le justifie**, sinon entité `PROPOSÉ` avec `type` à
   confirmer — jamais de type deviné sans trace.
4. Ajout d'un type : PR + ligne dans ce document + entrée `vocab.mjs` +
   test. Retrait : interdit (immuabilité des DMC existants).

# DÉCISIONS D'ARCHITECTURE (documentées avant implémentation)

## D1 — Le socle est un dossier autonome, sans dépendance
`dmc/` en ESM pur (Node 22 + navigateur via `type="module"`), zéro
paquet externe. *Pourquoi* : le projet est volontairement sans build ni
framework ; les renderers futurs (sites statiques) doivent pouvoir
charger le registre sans outillage. *Conséquence* : le validateur de
schémas est un sous-ensemble maison de JSON Schema (documenté dans
`core/validate.mjs`), suffisant et testé.

## D2 — Le registre est la source de vérité ; fichiers JSON versionnés
Une entité = un fichier `registry/entities/DMC-….json`. *Pourquoi* :
diffable, auditable, portable, aucune base centralisée obligatoire
(conforme à la mission : le DMC est une clé, pas une URL ni une BDD
imposée). *Conséquence* : `index.json` généré, jamais édité.

## D3 — Migration à sens unique + test aller-retour (strangler)
`world-data.js` reste la source de contenu du Globe ; le registre porte
identité, provenance, médias, relations. L'adapter Globe reconstruit
**exactement** `world-data.js` depuis le registre (test 17/17).
*Pourquoi* : ne rien casser, ne pas dupliquer les textes éditoriaux
longs (résolus par `contentRef`), prouver que le renderer ne possède pas
les données. *Conséquence* : duplication transitoire assumée des
métadonnées de média (registre = cible ; `world-data.js` = cache du
renderer), sous test anti-dérive permanent.

## D4 — Les médias vivent dans l'entité, avec ancre de relation
`entity.media[]` (schéma media) + relations `ILLUSTRE_PAR` vers
`#media-n`. *Pourquoi* : créer 17 entités `IMAGE` séparées dupliquerait
l'identité et alourdirait le graphe sans bénéfice ; l'ancre permet de
référencer un média comme cible de relation. *Conséquence* : un média
partagé entre plusieurs entités deviendra une entité `IMAGE` à part
entière (règle documentée dans `RELATIONS.md`).

## D5 — Ingestion : propositions, jamais d'écriture directe
L'absorbeur écrit dans `registry/proposals/` avec statut `PROPOSÉ` et
confidence ≤ 0.4. La promotion vers le registre passe par la résolution
(réutilisation ou création) et reste outillée (`resolve.mjs`) mais
traçable. *Pourquoi* : « une information provenant d'un site externe ne
doit jamais être présentée comme vérifiée si elle ne l'est pas ».

## D6 — Statuts machine avec accent et underscore
`À_CONFIRMER` (chaîne exacte) côté machine, affichage « À CONFIRMER ».
`VÉRIFIÉ` n'est jamais attribué automatiquement. *Pourquoi* : fidélité
au vocabulaire de la mission + sécurité sémantique.

## D7 — Codes DMC dérivés des données existantes
Pays → ISO 3166-1 alpha-2 (table des 16 pays du projet, source :
données du projet elles-mêmes) ; préfixe territorial → 3 lettres du nom
de la ville (articles/accent retirés). *Pourquoi* : déterministe,
rejouable, aucun choix arbitraire non documenté. *Conséquence* :
`territories.json` fige les préfixes attribués (immuabilité).

## D8 — Le moteur éditorial est déterministe et sans matière → sans bloc
Pas d'aléa, pas de LLM, pas de remplissage : `TIMELINE` sans dates
réelles est omis/`À_CONFIRMER`. *Pourquoi* : règles absolues de la
mission (ne pas inventer ; pas de données artificielles pour 365 × 24).

## D9 — Aucune modification du Globe dans cette mission
`index.html` et `world-data.js` inchangés (vérifié par les 112 + 89
contrôles existants qui doivent rester verts). Le démonstrateur est un
adapter **en données**. Le branchement visuel (clic → écran DMC complet)
est préparé par le contrat de renderer, pas encore câblé dans l'UI :
la mission demande d'abord le socle invisible.

## D10 — Tests automatisés natifs
`node --test dmc/tests/` (node:test, zéro dépendance) + agrégateur
`dmc/tools/verify-dmc.mjs`. *Pourquoi* : reproductible partout, y c.
dans le sandbox sans réseau.

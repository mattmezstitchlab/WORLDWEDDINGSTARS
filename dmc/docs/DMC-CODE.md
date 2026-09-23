# SPÉCIFICATION DU CODE DMC — v1.0.0

## Format

```
DMC-<PAYS>-<TERRITOIRE>-<SÉQUENCE>
 │     │        │           └─ 6 chiffres, unique par territoire, croissant
 │     │        └─ 3 lettres [A-Z] — préfixe territorial enregistré
 │     └─ 2 lettres [A-Z] — ISO 3166-1 alpha-2 du pays (XX si À CONFIRMER)
 └─ littéral « DMC »
```

Exemple canonique : `DMC-FR-LIL-000042` (France, Lille, 42ᵉ entité).
Exemples réels du registre : `DMC-MA-FES-000001` (Fès),
`DMC-FR-PAR-000001` (Paris), `DMC-JP-KYO-000001` (Kyoto).

Expression régulière : `^DMC-[A-Z]{2}-[A-Z]{3}-\d{6}$`

## Règles

1. **Un DMC = une entité réelle.** Le DMC est une clé d'identité et de
   relation : ce n'est ni une URL, ni l'obligation d'une base centralisée.
2. **Immuabilité** : un DMC attribué n'est jamais réattribué, même si
   l'entité est fusionnée ou retirée (statut `RÉSERVÉ` alors).
3. **Préfixe territorial** : 3 lettres dérivées du nom (articles retirés,
   accents supprimés, 3 premières lettres). Le registre
   `territories.json` garantit qu'un préfixe ne désigne qu'un seul
   territoire ; en cas de collision, suffixage déterministe (2 lettres +
   lettre supplémentaire : X, Y, Z…, ex. BRU → BRX). Pays inconnu → `XX` + statut de la donnée `À_CONFIRMER`.
4. **Séquence** : attribuée par le registre, par préfixe, dans l'ordre de
   création. Jamais réutilisée.
5. Le DMC n'encode **aucune** autre information (pas de type, pas de
   catégorie) : le type et les typologies vivent dans l'entité et peuvent
   évoluer sans casser la clé.
6. Plusieurs sites référencent le même DMC ; plusieurs expériences,
   une seule identité.

## Ancres

Une référence peut pointer une partie d'entité sans dupliquer de donnée :

```
DMC-MA-FES-000001#media-0        → premier média de l'entité
DMC-MA-FES-000001#description    → description
world-data.js#fes                → contenu éditorial du renderer Globe
```

Format d'ancre : `<DMC ou fichier>#<segment>[-<index>]`.

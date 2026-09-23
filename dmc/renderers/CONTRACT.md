# CONTRAT DE RENDERER — v1.0.0

```
                    DMC ENGINE (registre + graphe + moteur éditorial)
                                        │
        ┌───────────────┬───────────────┼───────────────┬────────────────┐
   Globe Renderer  Magazine Renderer  Coffret Renderer  Broderie Renderer  Mobile / futurs
```

Un renderer est un site **indépendant**. Il ne possède pas les données :
il les **résout** depuis le registre DMC. Même DMC, même réalité,
plusieurs expériences.

## Ce qu'un renderer DOIT

1. **Résoudre, jamais recopier** : les contenus longs sont accédés via
   `contentRefs` (ex. `world-data.js#fes`) ; les médias via les ancres
   (`DMC-…#media-0`). Un renderer peut mettre en cache (fichier généré),
   mais le cache est régénérable et testé anti-dérive.
2. **Passer par le moteur éditorial** : un écran éditorial = un document
   de blocs (`buildDocument`), mis en forme selon le Design System
   (`BLOCK_LAYOUT`, `TOKENS`). Pas de vocabulaire d'interface concurrent.
3. **Afficher la provenance** : bloc `SOURCE` ou `provenanceLine(media)`
   visible ; statuts `À CONFIRMER` / `NON DISPONIBLE` rendus tels quels.
4. **Respecter les règles d'intégration** : on n'affiche pas le site
   externe ; intégration impossible/interdite → aperçu propre +
   « OUVRIR LA SOURCE ».
5. **Signaler ses besoins non couverts** au socle (nouveau bloc, nouveau
   type, nouvelle relation) plutôt que de bricoler dans son coin.

## Ce qu'un renderer PEUT

- Avoir son propre store de présentation (positions 3D, graines
  génératives, ordres d'arcs…) : ce qui n'appartient pas à la réalité
  de l'entité reste chez le renderer (ex. `seed`, `stand` du Globe).
- Utiliser `rendererContracts.<nom>` dans l'entité DMC pour les clés de
  contrat qui le concernent (ex. `globe.pointId`, `globe.city`).

## Cas d'usage prioritaire : le Globe

Un point lumineux = un DMC (`externalIds["project:id"]` ↔ `PLACES.id`,
`rendererContracts.globe.pointId`).

```
clic sur le point
  → identification du DMC
  → récupération de l'entité          registry.get(dmc)
  → récupération des relations        registry.related(dmc)
  → récupération des ressources       media[] + contentRefs résolus
  → ouverture d'un écran éditorial    buildDocument(entity, …)
  → [EXPLORER]                        navigation dans le graphe
```

L'utilisateur ne quitte pas nécessairement le Globe : l'écran éditorial
est un overlay du renderer (implémentation validée existante :
`#pointCard`). Une source externe non intégrable s'affiche en aperçu
propre avec bouton « OUVRIR LA SOURCE » (`discover.href`).

## Démonstrateur livré

`globe-adapter.mjs` : reconstruit **exactement** les entités de
`world-data.js` depuis le registre DMC (identité + provenance + médias
du registre ; textes longs résolus par `contentRef`). Test aller-retour
17/17 dans `tests/globe-adapter.test.mjs`. Preuve : le renderer ne
possède pas les données, le socle peut régénérer n'importe quel
renderer, et deux renderers futurs partageront les mêmes DMC sans
duplication.

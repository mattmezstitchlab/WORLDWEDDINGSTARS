# DESIGN SYSTEM UNIFIÉ — v1.0.0

Couche indépendante des sources. Les sites externes peuvent avoir des
designs complètement différents : le socle absorbe leur **matière** et la
reconstruit dans notre propre identité.

```
SITE EXTERNE A · SITE EXTERNE B · SITE EXTERNE C · API · ARTICLE · PDF
                    ↓ (absorption + moteur éditorial)
COUVERTURE → ARTICLE → IMAGE → VIDÉO → CARTE → TIMELINE → SOURCES → RELATIONS
                    ↓ (mêmes tokens, mêmes blocs)
              la même expérience, quel que soit l'origine
```

**On n'affiche pas simplement le site externe.** Lorsque l'intégration
directe est impossible ou interdite (iframe refusée, licence, robots),
on affiche un **aperçu propre** avec provenance et lien
« OUVRIR LA SOURCE ». Implémentation de référence déjà validée dans le
projet : la carte `#pointCard` du Globe (image Pexels + légende +
provenance complète + lien DÉCOUVRIR).

## Tokens (extraits du design validé du Globe — ne pas réinventer)

| Token | Valeur | Usage |
|---|---|---|
| `ink` | `#07080B` | fond profond |
| `ink2` | `#0C0F14` | surfaces |
| `ivory` | `#F2EDE3` | texte |
| `gold` | `#C9A96A` | accent éditorial, points |
| `goldDim` | `rgba(201,169,106,.45)` | accent atténué |
| `blue` | `#5D8CC0` | accent froid / liens |
| `line` | `rgba(242,237,227,.13)` | filets |
| `lineSoft` | `rgba(242,237,227,.07)` | filets discrets |
| `sans` | Inter, système | interface |
| `serif` | Cormorant Garamond, Georgia | titres éditoriaux |
| `mono` | ui-monospace, SF Mono | codes, DMC, métadonnées |
| `ease` | `cubic-bezier(.16,1,.3,1)` | transitions |

Échelle typographique de référence : 8.5px mono (lettres capitales
espacées .3–.42em) pour les surtitres/codes ; serif 300 pour les titres ;
sans 200–500 pour les corps.

## Contrat bloc → mise en forme

| Bloc | Mise en forme canonique |
|---|---|
| `COVER` | plein cadre, serif, media en fond voilé, DMC en mono 8.5px |
| `EDITORIAL` | colonne serif, chapeau sans, filet `line` |
| `IMMERSIVE` | media plein écran + légende/provenance en overlay mono |
| `MOSAÏQUE` | grille régulière, gouttière `lineSoft` |
| `CHRONIQUE` | colonne étroite, date en mono, texte sans |
| `TIMELINE` | axe vertical, jalons datés mono, points `gold` |
| `CARTE` | conteneur carte du renderer (ex. globe) + marqueur `gold` |
| `DOSSIER` | sections numérotées mono, titres serif |
| `GALERIE` | media + légende + provenance systématique |
| `MEDIA` | image/vidéo + crédit + lien source |
| `SOURCE` | tableau mono : source · date · statut · nature |
| `RELATIONS` | liste typée, DMC cibles en mono, liens internes |

## Règles

1. Le code DMC est toujours rendu en `mono`, jamais stylisé comme un titre.
2. La provenance est **visible** (bloc `SOURCE` ou pied de média) — jamais
   cachée dans un attribut technique seul.
3. Un média d'illustration affiche sa note d'ambiance (règle du Globe :
   « jamais présenté comme une photo réelle du sujet »).
4. Les statuts se rendent lisiblement : `À CONFIRMER` et
   `NON DISPONIBLE` sont des états d'affichage normaux, pas des erreurs.
5. Chaque renderer applique les tokens à son support ; il n'invente pas
   de palette concurrente.

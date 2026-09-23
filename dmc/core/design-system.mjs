/* ============================================================
   DMC — DESIGN SYSTEM UNIFIÉ (docs/DESIGN-SYSTEM.md v1.0.0)
   Indépendant des sources : les sites externes ont leurs designs,
   le socle absorbe leur matière et la reconstruit dans NOTRE
   identité. Tokens extraits du design validé du Globe (audit) —
   ne pas réinventer de palette concurrente.
============================================================ */
import { STATUS_LABELS, NON_DISPONIBLE_LABEL } from "./vocab.mjs";

export const VERSION = "1.0.0";

export const TOKENS = {
  color: {
    ink:      "#07080B",
    ink2:     "#0C0F14",
    ivory:    "#F2EDE3",
    gold:     "#C9A96A",
    goldDim:  "rgba(201,169,106,.45)",
    blue:     "#5D8CC0",
    line:     "rgba(242,237,227,.13)",
    lineSoft: "rgba(242,237,227,.07)"
  },
  font: {
    sans:  "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",
    serif: "'Cormorant Garamond',Georgia,'Times New Roman',serif",
    mono:  "ui-monospace,'SF Mono',Menlo,Consolas,monospace"
  },
  motion: { ease: "cubic-bezier(.16,1,.3,1)" },
  meta:   { kickerSize: "8.5px", kickerTracking: ".3em", dmcFont: "mono" }
};

/* Surtitre/codes : mono capitales espacées ; titres : serif 300 ;
   corps : sans 200–500 (échelle déjà en usage dans le projet). */
export const TYPOGRAPHY = {
  dmc:       { font: TOKENS.font.mono,  size: TOKENS.meta.kickerSize, transform: "uppercase", letterSpacing: TOKENS.meta.kickerTracking },
  kicker:    { font: TOKENS.font.mono,  size: TOKENS.meta.kickerSize, transform: "uppercase", letterSpacing: ".42em" },
  title:     { font: TOKENS.font.serif, weight: 300 },
  hook:      { font: TOKENS.font.serif, weight: 300, style: "italic" },
  body:      { font: TOKENS.font.sans,  weight: 300 },
  provenance:{ font: TOKENS.font.mono,  size: "9px", opacity: 0.65 }
};

/* Contrat bloc → mise en forme canonique (stable, jamais improvisé) */
export const BLOCK_LAYOUT = {
  COVER:     { mode: "fullbleed",  title: "serif", media: "background-voilé", dmc: "mono-corner" },
  EDITORIAL: { mode: "column",     title: "serif", body: "sans", rule: "line" },
  IMMERSIVE: { mode: "fullscreen", media: "contain", overlay: "caption+provenance mono" },
  "MOSAÏQUE":{ mode: "grid",       gutter: "lineSoft", min: 2 },
  CHRONIQUE: { mode: "narrow",     date: "mono", body: "sans" },
  TIMELINE:  { mode: "axis",       axis: "vertical", dots: "gold", dates: "mono" },
  CARTE:     { mode: "map-host",   marker: "gold", host: "renderer" },
  DOSSIER:   { mode: "sections",   numbering: "mono", titles: "serif" },
  GALERIE:   { mode: "series",     caption: "mono", provenance: "obligatoire" },
  MEDIA:     { mode: "figure",     credit: "mono", link: "OUVRIR LA SOURCE" },
  SOURCE:    { mode: "table",      columns: ["source", "date", "statut", "nature"], font: "mono" },
  RELATIONS: { mode: "list",       typed: true, dmcTarget: "mono" }
};

/* Règles d'intégration des sources externes */
export const INTEGRATION_RULES = [
  "ON N'AFFICHE PAS SIMPLEMENT LE SITE EXTERNE : on absorbe sa matière utile et on la recompose dans notre système éditorial.",
  "Intégration directe impossible ou interdite → aperçu propre avec provenance et lien « OUVRIR LA SOURCE ».",
  "La provenance est visible (bloc SOURCE ou pied de média), jamais uniquement technique.",
  "Un média d'illustration affiche sa note d'ambiance — jamais présenté comme une photographie réelle du sujet s'il ne l'est pas.",
  "À CONFIRMER et NON DISPONIBLE sont des états d'affichage normaux, rendus en mono, jamais maquillés en données.",
  "Le code DMC se rend toujours en mono, jamais comme un titre.",
  "Chaque renderer applique ces tokens à son support ; aucune palette concurrente."
];

export function cssVariables(prefix = "") {
  const p = prefix ? prefix + "-" : "";
  return ":root{\n" +
    `  --${p}ink:${TOKENS.color.ink};\n` +
    `  --${p}ink-2:${TOKENS.color.ink2};\n` +
    `  --${p}ivory:${TOKENS.color.ivory};\n` +
    `  --${p}gold:${TOKENS.color.gold};\n` +
    `  --${p}gold-dim:${TOKENS.color.goldDim};\n` +
    `  --${p}blue:${TOKENS.color.blue};\n` +
    `  --${p}line:${TOKENS.color.line};\n` +
    `  --${p}line-soft:${TOKENS.color.lineSoft};\n` +
    `  --${p}sans:${TOKENS.font.sans};\n` +
    `  --${p}serif:${TOKENS.font.serif};\n` +
    `  --${p}mono:${TOKENS.font.mono};\n` +
    `  --${p}ease:${TOKENS.motion.ease};\n}`;
}

/* Rendus textuels canoniques (utilisés par les renderers) */
export function statusLabel(status) { return STATUS_LABELS[status] || status; }
export function absenceLabel(kind) { return kind === "NON_DISPONIBLE" ? NON_DISPONIBLE_LABEL : STATUS_LABELS["À_CONFIRMER"]; }

/* Ligne de provenance média — alignée sur l'implémentation de
   référence validée (carte #pointCard du Globe) */
export function provenanceLine(media) {
  const s = media.source || {};
  return [
    media.caption || "Média",
    (s.sourceName || "") + (media.author ? " — " + media.author : ""),
    s.retrievedAt ? "récupérée le " + s.retrievedAt : "date À CONFIRMER",
    s.sourceUrl || media.pageUrl ? "page " + (s.sourceName || "source") : null,
    media.note || null
  ].filter(Boolean).join(" · ");
}

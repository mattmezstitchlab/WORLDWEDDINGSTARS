/* ============================================================
   DMC — VOCABULAIRES CENTRAUX (source unique de vérité)
   Les schémas JSON et le code doivent rester alignés sur ce
   module (vérifié par tests/vocab.test.mjs).
   Version 1.0.0 — extension additive seulement.
============================================================ */

export const SCHEMA_VERSION = "1.0.0";

/* Types d'entités — vocabulaire ouvert (docs/TYPES.md) */
export const TYPES = [
  "PLACE", "PERSON", "ORGANIZATION", "PROFESSIONAL", "EVENT", "ARTICLE",
  "VIDEO", "IMAGE", "OBJECT", "WEDDING", "COFFRET", "MAGAZINE", "MOTIF",
  "TERRITORY", "EDITION", "MOMENT"
];

/* Statuts de provenance / confiance (docs/STATUTS-PROVENANCE.md) */
export const STATUSES = [
  "PROPOSÉ", "TROUVÉ", "SOURCE_OFFICIELLE", "CONFIRMÉ", "VÉRIFIÉ", "RÉSERVÉ", "À_CONFIRMER"
];

/* Affichages lisibles (le machine garde les constantes ci-dessus) */
export const STATUS_LABELS = {
  "PROPOSÉ": "Proposé",
  "TROUVÉ": "Trouvé",
  "SOURCE_OFFICIELLE": "Source officielle",
  "CONFIRMÉ": "Confirmé",
  "VÉRIFIÉ": "Vérifié",
  "RÉSERVÉ": "Réservé",
  "À_CONFIRMER": "À CONFIRMER"
};

/* Sentinelle d'absence : la source ne fournit pas la donnée.
   Distinct de À_CONFIRMER (donnée attendue mais non trouvée/douteuse). */
export const NON_DISPONIBLE = "NON_DISPONIBLE";
export const NON_DISPONIBLE_LABEL = "NON DISPONIBLE";
export const À_CONFIRMER = "À_CONFIRMER";

/* Natures */
export const NATURES = ["RÉEL", "RECONSTITUÉ", "ÉDITORIAL"];

/* Types de sources */
export const SOURCE_TYPES = [
  "PAGE_WEB", "API", "JSON", "DOCUMENT", "IMAGE", "VIDEO",
  "SOURCE_OFFICIELLE", "EDITORIALE", "TERRITORIALE", "PROJECT_FILE"
];

/* Types de relations (docs/RELATIONS.md) */
export const RELATION_TYPES = [
  "SITUE_DANS", "COMMUNE_LIEU", "ILLUSTRE_PAR", "DECRIT_PAR", "MENTIONNE_DANS",
  "PARAIT_DANS", "A_LIEU_PENDANT", "PRODUIT_PAR", "PROPOSE_PAR", "LIE_A",
  "MEME_ENTITE_QUE"
];

/* Blocs éditoriaux (docs/EDITORIAL-BLOCKS.md) */
export const EDITORIAL_BLOCKS = [
  "COVER", "EDITORIAL", "IMMERSIVE", "MOSAÏQUE", "CHRONIQUE",
  "TIMELINE", "CARTE", "DOSSIER", "GALERIE", "MEDIA", "SOURCE", "RELATIONS"
];

/* Kind de médias */
export const MEDIA_KINDS = ["IMAGE", "VIDEO", "AUDIO", "GALERIE", "DOCUMENT"];

/* Kind de références de contenu */
export const CONTENT_REF_KINDS = ["ACCROCHE", "CONTENU", "SUJET", "ARTICLE", "FICHE", "AUTRE"];

/* Confiance — règles initiales (docs/STATUTS-PROVENANCE.md) */
export const CONFIDENCE = {
  SOURCE_OFFICIELLE: 0.9,
  PROJET_CONTRÔLÉ: 0.85,   /* donnée du projet vérifiée par les outils */
  EXTRACTION_SIMPLE: 0.6,  /* extraction unique d'une page tierce */
  PROPOSITION: 0.4,        /* sortie d'ingestion non revue */
  ABSENT: 0                /* À_CONFIRMER / NON_DISPONIBLE */
};

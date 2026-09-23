/* ============================================================
   DMC — MODÈLE D'ENTITÉ + PROVENANCE PAR DONNÉE
   Chaque donnée importante porte nature + statut + sourceRefs.
   Une donnée absente n'est JAMAIS fabriquée : elle vaut null
   avec le statut À_CONFIRMER (attendue, non trouvée) ou la
   mention NON_DISPONIBLE (la source ne la fournit pas).
============================================================ */
import { SCHEMA_VERSION, STATUSES, NATURES, SOURCE_TYPES, CONFIDENCE, À_CONFIRMER, NON_DISPONIBLE } from "./vocab.mjs";

let srcCounter = 0;

export function makeSourceId(base = "src") {
  srcCounter += 1;
  return base + "-" + String(srcCounter).padStart(3, "0") + "-" + Math.random().toString(36).slice(2, 7);
}

/* Construit une provenance complète (docs/STATUTS-PROVENANCE.md).
   Aucun champ inventé : ce qui n'est pas fourni reste null. */
export function makeSource({ id, sourceUrl = null, sourceType, sourceName, retrievedAt,
                             updatedAt = null, externalId = null, status, confidence, locator = null }) {
  if (!SOURCE_TYPES.includes(sourceType)) throw new Error("sourceType hors vocabulaire : " + sourceType);
  if (!STATUSES.includes(status)) throw new Error("status hors vocabulaire : " + status);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(retrievedAt || "")) throw new Error("retrievedAt obligatoire (AAAA-MM-JJ)");
  if (status === "VÉRIFIÉ") throw new Error("VÉRIFIÉ ne peut pas être attribué automatiquement");
  if (typeof confidence !== "number" || confidence < 0 || confidence > 1) throw new Error("confidence ∈ [0,1]");
  return { id: id || makeSourceId(), sourceUrl, sourceType, sourceName, retrievedAt,
           updatedAt, externalId, status, confidence, locator };
}

/* Enveloppe « donnée sourcée » : valeur + nature + statut + refs */
export function sourced(value, { nature, status, sourceRefs = [] }) {
  if (!NATURES.includes(nature)) throw new Error("nature hors vocabulaire : " + nature);
  if (!STATUSES.includes(status)) throw new Error("status hors vocabulaire : " + status);
  if (value === undefined) value = null;
  return { ...(typeof value === "object" && value !== null && !Array.isArray(value) ? value : { value }),
           nature, status, sourceRefs };
}

/* Données absentes : sentinelle honnête, jamais de valeur fabriquée */
export function absent(kind = À_CONFIRMER, note = null) {
  if (kind !== À_CONFIRMER && kind !== NON_DISPONIBLE) throw new Error("absent() : À_CONFIRMER ou NON_DISPONIBLE");
  return { value: null, nature: "RÉEL", status: À_CONFIRMER, absence: kind, note, sourceRefs: [] };
}

export function createEntity({ dmc, type, name, subtype = null, aliases = [], description = null,
                               territory = null, coordinates = null, typologies = [], category = null,
                               externalIds = {}, sources = [], media = [], contentRefs = [],
                               rendererContracts = null, status = "PROPOSÉ", createdAt, notes = null }) {
  if (!dmc) throw new Error("createEntity : dmc obligatoire (alloué par CodeAllocator)");
  if (!type) throw new Error("createEntity : type obligatoire");
  if (!name) throw new Error("createEntity : name obligatoire");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(createdAt || "")) throw new Error("createEntity : createdAt obligatoire (AAAA-MM-JJ)");
  if (!sources.length) throw new Error("createEntity : au moins une source (provenance obligatoire)");
  const ids = new Set(sources.map(s => s.id));
  if (ids.size !== sources.length) throw new Error("createEntity : ids de sources dupliqués");
  return {
    schemaVersion: SCHEMA_VERSION,
    dmc, type, subtype, name, aliases: [...aliases],
    description, territory, coordinates,
    typologies: [...typologies], category,
    externalIds: { ...externalIds },
    sources: sources.map(s => ({ ...s })),
    media: media.map(m => ({ ...m })),
    contentRefs: contentRefs.map(c => ({ ...c })),
    rendererContracts,
    status, createdAt, updatedAt: createdAt, notes
  };
}

export function addSource(entity, source) {
  if (entity.sources.some(s => s.id === source.id)) return source.id; /* idempotent */
  entity.sources.push(source);
  entity.updatedAt = source.retrievedAt > entity.updatedAt ? source.retrievedAt : entity.updatedAt;
  return source.id;
}

export function sourceById(entity, ref) {
  return entity.sources.find(s => s.id === ref) || null;
}

/* Confiance dérivée selon les règles initiales (vocab.CONFIDENCE) */
export function confidenceFor(status, { projectControlled = false, official = false } = {}) {
  if (status === "À_CONFIRMER") return CONFIDENCE.ABSENT;
  if (status === "VÉRIFIÉ" || status === "CONFIRMÉ") return projectControlled ? CONFIDENCE.PROJET_CONTRÔLÉ : 0.8;
  if (status === "SOURCE_OFFICIELLE" || official) return CONFIDENCE.SOURCE_OFFICIELLE;
  if (status === "TROUVÉ") return CONFIDENCE.EXTRACTION_SIMPLE;
  return CONFIDENCE.PROPOSITION;
}

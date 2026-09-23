/* ============================================================
   DMC — RENDERER GLOBE (démonstrateur, renderers/CONTRACT.md)
   ------------------------------------------------------------
   Reconstruit les entités de world-data.js depuis le registre
   DMC : identité + provenance + médias viennent du registre ;
   les textes éditoriaux longs sont RÉSOLUS PAR RÉFÉRENCE
   (contentRefs → world-data.js), jamais recopiés.
   Le test aller-retour (tests/globe-adapter.test.mjs) vérifie
   l'égalité exacte avec world-data.js pour les 17 entités :
   aucune duplication, aucune dérive.
============================================================ */
import fs from "node:fs";
import vm from "node:vm";
import { buildDocument } from "../core/editorial.mjs";

/* Charge world-data.js (fichier du renderer Globe, non modifié) */
export function loadWorldData(file) {
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(file, "utf8") + ";globalThis.W=WORLD_DATA;", ctx);
  return ctx.W;
}

/* Resolver de contentRefs : "world-data.js#fes" → entité world-data */
export function makeContentResolver(worldData) {
  const byId = new Map(worldData.entities.map(e => [e.id, e]));
  return function resolve(ref) {
    const m = String(ref).match(/^world-data\.js#([a-z0-9-]+)$/i);
    if (!m) return null;
    return byId.get(m[1]) || null;
  };
}

/* Entité DMC → entité world-data.js (format exact du renderer Globe) */
export function toGlobeEntity(entity, { resolver }) {
  const g = (entity.rendererContracts && entity.rendererContracts.globe) || {};
  if (!g.pointId) throw new Error("Contrat renderer Globe absent pour " + entity.dmc);
  const resolveField = (kind, field) => {
    const ref = (entity.contentRefs || []).find(c => c.kind === kind);
    if (!ref) return null;
    const src = resolver(ref.ref, ref);
    return src ? src[field] : null;
  };
  const media0 = (entity.media || [])[0] || null;
  const relKeys = g.relationsKeys || [];
  const relVals = g.relationsValues || [];
  const relations = {};
  relKeys.forEach((k, i) => { relations[k] = relVals[i] !== undefined ? relVals[i] : null; });

  return {
    id: g.pointId,
    type: entity.subtype,
    name: entity.name,
    city: g.city,
    country: entity.territory ? entity.territory.country : null,
    territory: entity.territory ? entity.territory.name : null,
    lat: entity.coordinates ? entity.coordinates.lat : null,
    lon: entity.coordinates ? entity.coordinates.lon : null,
    category: entity.category ? entity.category.value : null,
    sujet: entity.description ? entity.description.text : resolveField("SUJET", "sujet"),
    accroche: resolveField("ACCROCHE", "accroche"),
    contenu: resolveField("CONTENU", "contenu"),
    media: media0 ? {
      source: media0.source ? media0.source.sourceName : null,
      imageUrl: media0.url,
      pageUrl: media0.pageUrl,
      author: media0.author,
      retrievedAt: media0.source ? media0.source.retrievedAt : null,
      query: media0.query,
      subject: media0.subject,
      caption: media0.caption,
      note: media0.note
    } : null,
    relations,
    discover: g.discover ? { ...g.discover } : null
  };
}

/* Point lumineux du globe pour un DMC (porte d'entrée visuelle) :
   ce dont le renderer a besoin pour identifier/ouvrir un point. */
export function toGlobePoint(entity) {
  const g = (entity.rendererContracts && entity.rendererContracts.globe) || {};
  return {
    dmc: entity.dmc,
    id: g.pointId || null,
    name: entity.name,
    lat: entity.coordinates ? entity.coordinates.lat : null,
    lon: entity.coordinates ? entity.coordinates.lon : null,
    category: entity.category ? entity.category.value : null,
    typologies: (entity.typologies || []).map(t => t.canonical)
  };
}

/* Écran éditorial complet (clic sur le point → document de blocs) :
   entité + graphe + contenus résolus, prêt pour le Design System. */
export function editorialScreen(entity, { registry, resolver, context = null }) {
  return buildDocument(entity, { registry, contentResolver: resolver, context });
}

#!/usr/bin/env node
/* ============================================================
   DMC — MIGRATION world-data.js → REGISTRE (décision D3)
   À sens unique, rejouable, déterministe.
   • Ne modifie NI index.html NI world-data.js.
   • N'invente rien : identité, territoire, coordonnées viennent
     du projet (contrôlés par tools/verify-points.mjs, d'où
     statut CONFIRMÉ / confidence 0.85) ; le média vient de sa
     page Pexels (SOURCE_OFFICIELLE / 0.9) ; les textes longs
     restent dans world-data.js via contentRefs (pas de copie).
   • Relations réelles migrées : ILLUSTRE_PAR (#media-0) et
     DECRIT_PAR (world-data.js#id). Les 6 clefs relations du
     Globe restent null (contrat renderer, pas une relation).
   Usage : node dmc/tools/migrate-world-data.mjs [--check]
     --check : compare le registre existant au résultat attendu
               (mode anti-dérive, n'écrit rien)
============================================================ */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { Registry } from "../core/graph.mjs";
import { CodeAllocator } from "../core/codes.mjs";
import { makeSource, createEntity } from "../core/entity.mjs";
import { loadSchemas, validate } from "../core/validate.mjs";

const root = path.resolve(import.meta.dirname, "..", "..");
const REG_DIR = path.join(root, "dmc", "registry");
const CHECK = process.argv.includes("--check");
const TODAY = "2026-09-23"; /* date de récupération des données projet (audit) */

/* ISO 3166-1 alpha-2 — dérivé des pays présents dans le projet.
   Pays non reconnu → XX + À CONFIRMER (règle codes.mjs). */
const COUNTRY_ISO = {
  "Maroc": "MA", "Nigeria": "NG", "Égypte": "EG", "Italie": "IT", "Belgique": "BE",
  "France": "FR", "Royaume-Uni": "GB", "Inde": "IN", "Japon": "JP", "Ouzbékistan": "UZ",
  "Iran": "IR", "Vietnam": "VN", "Mexique": "MX", "Pérou": "PE", "Guatemala": "GT",
  "Aotearoa / Nouvelle-Zélande": "NZ"
};

/* --- lecture des sources existantes (jamais modifiées) --- */
function loadWorldData() {
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, "world-data.js"), "utf8") + ";globalThis.W=WORLD_DATA;", ctx);
  return ctx.W;
}
function loadPlaces() {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  return vm.runInNewContext("(" + html.match(/var PLACES = (\[[\s\S]*?\n\]);/)[1] + ")");
}

const WD = loadWorldData();
const PLACES = loadPlaces();
const placeById = new Map(PLACES.map(p => [p.id, p]));

const registry = new Registry();
const allocator = new CodeAllocator(registry.territories);
const schemas = loadSchemas(path.join(root, "dmc", "schemas"));
const entitySchema = schemas.get("dmc:schema:entity");
const relationSchema = schemas.get("dmc:schema:relation");

let relSeq = 0;
const nextRelId = () => "rel-" + String(++relSeq).padStart(6, "0");

for (const e of WD.entities) {
  const p = placeById.get(e.id);
  if (!p) throw new Error("Entité sans point lumineux correspondant : " + e.id);
  if (p.lat !== e.lat || p.lon !== e.lon) throw new Error("Coordonnées divergentes : " + e.id);

  const cc = COUNTRY_ISO[e.country];
  if (!cc) throw new Error("Pays sans code ISO dans la table (à documenter) : " + e.country);

  const dmc = allocator.allocate(cc, e.name);

  /* provenances */
  const srcProject = makeSource({
    id: "src-project-" + e.id,
    sourceUrl: null,
    sourceType: "PROJECT_FILE",
    sourceName: "world-data.js + index.html (PLACES) — projet World Wedding Stars",
    retrievedAt: TODAY,
    externalId: e.id,
    status: "CONFIRMÉ",           /* contrôlé par tools/verify-points.mjs (112) + smoke (89) */
    confidence: 0.85,
    locator: "entities[" + WD.entities.indexOf(e) + "]"
  });
  const photoId = (e.media.imageUrl.match(/photos\/(\d+)\//) || [])[1] || null;
  const srcPexels = makeSource({
    id: "src-pexels-" + e.id,
    sourceUrl: e.media.pageUrl,
    sourceType: "SOURCE_OFFICIELLE",   /* page officielle du média (auteur/licence) */
    sourceName: e.media.source,
    retrievedAt: e.media.retrievedAt,
    externalId: photoId ? "pexels:" + photoId : null,
    status: "SOURCE_OFFICIELLE",
    confidence: 0.9,
    locator: "media"
  });

  const entity = createEntity({
    dmc,
    type: "PLACE",
    subtype: e.type,                       /* vocabulaire d'origine conservé : « ville » */
    name: e.name,
    aliases: e.city !== e.name ? [e.city] : [],
    description: { text: e.sujet, nature: "ÉDITORIAL", status: "CONFIRMÉ", sourceRefs: [srcProject.id] },
    territory: { name: e.territory, country: e.country, countryCode: cc, region: null },
    coordinates: { lat: e.lat, lon: e.lon, nature: "RÉEL", status: "CONFIRMÉ", sourceRefs: [srcProject.id] },
    typologies: [{ canonical: "VILLE", originalTerm: e.type, originalVocabulary: "world-data.js", sourceRefs: [srcProject.id] }],
    category: { value: e.category, nature: "ÉDITORIAL", status: "CONFIRMÉ", sourceRefs: [srcProject.id] },
    externalIds: {
      "project:id": e.id,
      ...(photoId ? { "pexels:photo": photoId } : {})
    },
    sources: [srcProject, srcPexels],
    media: [{
      kind: "IMAGE",
      url: e.media.imageUrl,
      pageUrl: e.media.pageUrl,
      author: e.media.author,
      license: WD.mediaProvider.license,
      subject: e.media.subject,
      caption: e.media.caption,
      note: e.media.note,                  /* note d'ambiance : jamais photo de mariage réel */
      query: e.media.query,
      externalId: photoId ? "pexels:" + photoId : null,
      nature: "RÉEL",                      /* existence/licence du média : réel et sourcé */
      illustration: true,                  /* image d'ambiance, pas une photo du mariage */
      source: { ...srcPexels }
    }],
    contentRefs: [
      { ref: "world-data.js#" + e.id, kind: "SUJET",    nature: "ÉDITORIAL", sourceRefs: [srcProject.id] },
      { ref: "world-data.js#" + e.id, kind: "ACCROCHE", nature: "ÉDITORIAL", sourceRefs: [srcProject.id] },
      { ref: "world-data.js#" + e.id, kind: "CONTENU",  nature: "ÉDITORIAL", sourceRefs: [srcProject.id] }
    ],
    rendererContracts: {
      globe: {
        pointId: e.id,
        city: e.city,                      /* world-data distingue name/city : contrat renderer */
        relationsKeys: Object.keys(e.relations),   /* 6 emplacements null — pas des relations réelles */
        relationsValues: Object.values(e.relations),
        discover: { ...e.discover }
      }
    },
    status: "CONFIRMÉ",
    createdAt: TODAY,
    notes: "Migré depuis world-data.js v" + WD.version + " (migration déterministe, test aller-retour par globe-adapter)."
  });

  const v = validate(entity, entitySchema, schemas);
  if (!v.valid) throw new Error("Entité invalide " + dmc + " : " + v.errors.join(" ; "));
  registry.add(entity);

  /* relations réelles, typées, sourcées */
  const r1 = {
    schemaVersion: "1.0.0", id: nextRelId(),
    from: dmc, to: dmc + "#media-0", type: "ILLUSTRE_PAR",
    sources: [{ ...srcPexels }], status: "SOURCE_OFFICIELLE", nature: "RÉEL",
    confidence: 0.9, createdAt: TODAY, updatedAt: null,
    note: "Photo Pexels " + (photoId || "") + " — image d'ambiance, jamais une photographie de mariage réel."
  };
  const r2 = {
    schemaVersion: "1.0.0", id: nextRelId(),
    from: dmc, to: "world-data.js#" + e.id, type: "DECRIT_PAR",
    sources: [{ ...srcProject }], status: "CONFIRMÉ", nature: "ÉDITORIAL",
    confidence: 0.85, createdAt: TODAY, updatedAt: null,
    note: "Contenu éditorial du renderer Globe (sujet/accroche/contenu), résolu par référence — aucune duplication."
  };
  for (const r of [r1, r2]) {
    const rv = validate(r, relationSchema, schemas);
    if (!rv.valid) throw new Error("Relation invalide " + r.id + " : " + rv.errors.join(" ; "));
    registry.addRelation(r);
  }
}

/* --- sortie --- */
if (CHECK) {
  const before = fs.existsSync(path.join(REG_DIR, "index.json"))
    ? JSON.parse(fs.readFileSync(path.join(REG_DIR, "index.json"), "utf8")) : null;
  const after = registry.buildIndex(null);
  const sameCount = before && before.count === after.count && before.relationCount === after.relationCount;
  const sameEntities = before && JSON.stringify(before.entities) === JSON.stringify(after.entities);
  console.log((sameCount && sameEntities ? "✔" : "✗") + " anti-dérive : registre == migration (" +
    after.count + " entités, " + after.relationCount + " relations)");
  process.exit(sameCount && sameEntities ? 0 : 1);
} else {
  registry.save(REG_DIR);
  console.log("Migration terminée : " + registry.entities.size + " entités DMC, " +
    registry.relations.length + " relations.");
  console.log("Préfixes territoriaux : " + Object.keys(registry.territories.prefixes).length);
  for (const e of registry.all()) {
    console.log("  " + e.dmc + "  " + e.name.padEnd(18) + e.type + "  " +
      (e.territory ? e.territory.countryCode + " · " + e.territory.name : ""));
  }
  console.log("Registre écrit dans dmc/registry/ (index.json généré).");
}

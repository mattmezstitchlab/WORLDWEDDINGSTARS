/* ============================================================
   DMC — REGISTRE + GRAPHE DE RELATIONS
   Persistance : fichiers JSON (décision D2).
     registry/entities/DMC-XX-YYY-000000.json
     registry/relations.json
     registry/territories.json
     registry/index.json        (généré, jamais édité)
   Aucune duplication : les relations pointent des DMC ou des
   ancres (DMC#media-0, world-data.js#fes).
============================================================ */
import fs from "node:fs";
import path from "node:path";
import { isValidDmc } from "./codes.mjs";
import { RELATION_TYPES, STATUSES, NATURES, SCHEMA_VERSION } from "./vocab.mjs";
import { normalizeName } from "./normalize.mjs";

export class Registry {
  constructor() {
    this.entities = new Map();      /* dmc → entity */
    this.relations = [];            /* relations validées */
    this.territories = { prefixes: {} };
  }

  static load(dir) {
    const r = new Registry();
    const tFile = path.join(dir, "territories.json");
    if (fs.existsSync(tFile)) r.territories = JSON.parse(fs.readFileSync(tFile, "utf8"));
    const eDir = path.join(dir, "entities");
    if (fs.existsSync(eDir)) {
      for (const f of fs.readdirSync(eDir).filter(f => f.endsWith(".json")).sort()) {
        const e = JSON.parse(fs.readFileSync(path.join(eDir, f), "utf8"));
        if (e.dmc !== f.replace(/\.json$/, "")) throw new Error("Nom de fichier ≠ DMC : " + f);
        r.entities.set(e.dmc, e);
      }
    }
    const rFile = path.join(dir, "relations.json");
    if (fs.existsSync(rFile)) r.relations = JSON.parse(fs.readFileSync(rFile, "utf8")).relations || [];
    return r;
  }

  save(dir) {
    fs.mkdirSync(path.join(dir, "entities"), { recursive: true });
    for (const [dmc, e] of this.entities) {
      fs.writeFileSync(path.join(dir, "entities", dmc + ".json"), JSON.stringify(e, null, 2) + "\n");
    }
    fs.writeFileSync(path.join(dir, "territories.json"), JSON.stringify(this.territories, null, 2) + "\n");
    fs.writeFileSync(path.join(dir, "relations.json"),
      JSON.stringify({ schemaVersion: SCHEMA_VERSION, relations: this.relations }, null, 2) + "\n");
    this.buildIndex(dir);
  }

  buildIndex(dir) {
    const index = {
      schemaVersion: SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      count: this.entities.size,
      entities: [...this.entities.values()].map(e => ({
        dmc: e.dmc, type: e.type, name: e.name,
        territory: e.territory ? e.territory.name : null,
        countryCode: e.territory ? e.territory.countryCode : null,
        status: e.status,
        file: "entities/" + e.dmc + ".json"
      })),
      relationCount: this.relations.length
    };
    if (dir) fs.writeFileSync(path.join(dir, "index.json"), JSON.stringify(index, null, 2) + "\n");
    return index;
  }

  add(entity) {
    if (!isValidDmc(entity.dmc)) throw new Error("DMC invalide : " + entity.dmc);
    if (this.entities.has(entity.dmc)) throw new Error("DMC déjà présent (pas de doublon) : " + entity.dmc);
    this.entities.set(entity.dmc, entity);
    return entity;
  }

  get(dmc) { return this.entities.get(dmc) || null; }
  all() { return [...this.entities.values()]; }

  byExternalId(key, value) {
    return this.all().filter(e => e.externalIds && String(e.externalIds[key] ?? "") === String(value));
  }

  byName(name, { type = null } = {}) {
    const n = normalizeName(name);
    return this.all().filter(e =>
      (normalizeName(e.name) === n || (e.aliases || []).some(a => normalizeName(a) === n)) &&
      (!type || e.type === type));
  }

  /* --- graphe --- */
  addRelation(rel) {
    if (!RELATION_TYPES.includes(rel.type)) throw new Error("Type de relation hors vocabulaire : " + rel.type);
    if (!STATUSES.includes(rel.status)) throw new Error("Statut de relation invalide : " + rel.status);
    if (!NATURES.includes(rel.nature)) throw new Error("Nature de relation invalide : " + rel.nature);
    if (!rel.sources || !rel.sources.length) throw new Error("Relation sans source : " + rel.id);
    if (rel.status !== "PROPOSÉ" && rel.status !== "À_CONFIRMER" && !rel.sources.length) {
      throw new Error("Relation non sourcée ne peut pas dépasser PROPOSÉ");
    }
    if (this.relations.some(r => r.id === rel.id)) throw new Error("id de relation dupliqué : " + rel.id);
    this.relations.push(rel);
    return rel;
  }

  relationsOf(dmc, { type = null, direction = "both" } = {}) {
    const base = (rel) => (!type || rel.type === type);
    if (direction === "from") return this.relations.filter(r => r.from === dmc && base(r));
    if (direction === "to") return this.relations.filter(r => r.to === dmc && base(r));
    return this.relations.filter(r => (r.from === dmc || r.to === dmc ||
      r.from.startsWith(dmc + "#") || r.to.startsWith(dmc + "#")) && base(r));
  }

  related(dmc) {
    return this.relationsOf(dmc).map(r => ({
      relation: r,
      direction: r.from === dmc || r.from.startsWith(dmc + "#") ? "from" : "to",
      other: r.from === dmc || r.from.startsWith(dmc + "#") ? r.to : r.from,
      otherEntity: this.get((r.from === dmc || r.from.startsWith(dmc + "#") ? r.to : r.from).split("#")[0])
    }));
  }

  nextRelationId() {
    let max = 0;
    for (const r of this.relations) {
      const m = String(r.id).match(/^rel-(\d+)$/);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    return "rel-" + String(max + 1).padStart(6, "0");
  }

  /* Une même entité réelle dans plusieurs éditions/moments/territoires :
     plusieurs relations, JAMAIS plusieurs entités (365 × 24). */
  appearancesOf(dmc) {
    return this.relationsOf(dmc, { type: "PARAIT_DANS" }).concat(this.relationsOf(dmc, { type: "A_LIEU_PENDANT" }));
  }
}

/* Entité + provenance, résolution anti-doublons, graphe de relations */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { makeSource, createEntity, sourced, absent, addSource, confidenceFor } from "../core/entity.mjs";
import { findExisting, resolveOrCreate } from "../core/resolve.mjs";
import { Registry } from "../core/graph.mjs";
import { CodeAllocator } from "../core/codes.mjs";
import { À_CONFIRMER, NON_DISPONIBLE } from "../core/vocab.mjs";

function tmpDir() { return fs.mkdtempSync(path.join(os.tmpdir(), "dmc-test-")); }

const baseSrc = () => makeSource({
  sourceUrl: "https://example.invalid/x", sourceType: "PAGE_WEB", sourceName: "Test",
  retrievedAt: "2026-09-23", status: "TROUVÉ", confidence: 0.6
});

function ent(dmc, { name = "Entité", type = "PLACE", cc = "FR", terr = "Test", ext = {} } = {}) {
  return createEntity({
    dmc, type, name, territory: { name: terr, country: "France", countryCode: cc },
    sources: [baseSrc()], status: "PROPOSÉ", createdAt: "2026-09-23", externalIds: ext
  });
}

test("makeSource : provenance complète obligatoire, VÉRIFIÉ jamais automatique", () => {
  const s = baseSrc();
  assert.ok(/^src-/.test(s.id));
  assert.equal(s.status, "TROUVÉ");
  assert.equal(s.updatedAt, null);
  assert.throws(() => makeSource({ sourceType: "INCONNU", sourceName: "x", retrievedAt: "2026-09-23", status: "TROUVÉ", confidence: 0.5 }));
  assert.throws(() => makeSource({ sourceType: "PAGE_WEB", sourceName: "x", retrievedAt: "hier", status: "TROUVÉ", confidence: 0.5 }));
  assert.throws(() => makeSource({ sourceType: "PAGE_WEB", sourceName: "x", retrievedAt: "2026-09-23", status: "VÉRIFIÉ", confidence: 1 }),
    /ne peut pas être attribué automatiquement/);
});

test("createEntity : provenance obligatoire, champs absents honnêtes", () => {
  assert.throws(() => createEntity({ dmc: "DMC-FR-PAR-000001", type: "PLACE", name: "x", sources: [], createdAt: "2026-09-23" }),
    /au moins une source/);
  const e = ent("DMC-FR-PAR-000001");
  assert.equal(e.schemaVersion, "1.0.0");
  assert.equal(e.updatedAt, e.createdAt);
  const a = absent(NON_DISPONIBLE, "la source ne fournit pas la donnée");
  assert.equal(a.value, null);
  assert.equal(a.status, À_CONFIRMER);
  assert.equal(a.absence, NON_DISPONIBLE);
  const co = sourced({ lat: 48.86, lon: 2.35 }, { nature: "RÉEL", status: "CONFIRMÉ", sourceRefs: ["src-x"] });
  assert.equal(co.lat, 48.86);
  assert.equal(co.nature, "RÉEL");
  assert.equal(confidenceFor("À_CONFIRMER"), 0);
  assert.equal(confidenceFor("CONFIRMÉ", { projectControlled: true }), 0.85);
  assert.equal(confidenceFor("SOURCE_OFFICIELLE"), 0.9);
  assert.equal(confidenceFor("PROPOSÉ"), 0.4);
  assert.equal(addSource(e, e.sources[0]), e.sources[0].id); /* idempotent */
});

test("résolution : externalId → réutilisation du DMC existant", () => {
  const r = new Registry();
  const e = ent("DMC-FR-LIL-000001", { name: "Le Fresnoy", ext: { "wikidata": "Q123" } });
  r.add(e);
  const found = findExisting(r, { type: "PLACE", name: "Autre nom", externalIds: { wikidata: "Q123" } });
  assert.equal(found.action, "reuse");
  assert.equal(found.entity.dmc, "DMC-FR-LIL-000001");
  assert.equal(found.via, "externalId:wikidata");
});

test("résolution : nom normalisé + territoire + type → réutilisation (accents/articles ignorés)", () => {
  const r = new Registry();
  r.add(ent("DMC-EG-CAI-000001", { name: "Le Caire", terr: "Grand Caire", cc: "EG" }));
  const found = findExisting(r, { type: "PLACE", name: "le caire", territory: { name: "grand caïre", countryCode: "EG" }, externalIds: {} });
  assert.equal(found.action, "reuse");
  assert.equal(found.score, 0.95);
  const found2 = findExisting(r, { type: "PLACE", name: "Caire", aliases: [], territory: { name: "Grand Caire", countryCode: "EG" } });
  assert.equal(found2.action, "reuse");
});

test("résolution : homonyme de territoire différent → REVIEW, jamais de fusion automatique", () => {
  const r = new Registry();
  r.add(ent("DMC-FR-LIL-000001", { name: "Sainte-Marie", terr: "Nord", cc: "FR" }));
  const found = findExisting(r, { type: "PLACE", name: "Sainte-Marie", territory: { name: "Réunion", countryCode: "FR" } });
  assert.equal(found.action, "review");
  const res = resolveOrCreate(r, { type: "PLACE", name: "Sainte-Marie", territory: { name: "Réunion", countryCode: "FR" } },
    { allocator: new CodeAllocator({ prefixes: {} }), create: () => { throw new Error("ne doit pas créer"); } });
  assert.equal(res.action, "review");
  assert.equal(res.created, false);
  assert.equal(r.all().length, 1);
});

test("résolution : création si aucune correspondance — PAS DE DOUBLON sinon", () => {
  const r = new Registry();
  const alloc = new CodeAllocator(r.territories);
  const create = (cand, dmc) => ent(dmc, { name: cand.name, terr: cand.territory.name, cc: cand.territory.countryCode });
  const first = resolveOrCreate(r, { type: "PLACE", name: "Le Fresnoy", territory: { name: "Tourcoing", countryCode: "FR" } },
    { allocator: alloc, create });
  assert.equal(first.action, "create");
  assert.equal(first.dmc, "DMC-FR-TOU-000001");
  const second = resolveOrCreate(r, { type: "PLACE", name: "Fresnoy", territory: { name: "Tourcoing", countryCode: "FR" }, externalIds: {} },
    { allocator: alloc, create: () => { throw new Error("ne doit pas recréer"); } });
  assert.equal(second.action, "reuse");
  assert.equal(second.dmc, "DMC-FR-TOU-000001");
  assert.equal(r.all().length, 1);
});

test("graphe : relations typées et sourcées, refus des relations non conformes", () => {
  const r = new Registry();
  const src = { ...baseSrc(), id: "src-rel-1" };
  r.addRelation({
    schemaVersion: "1.0.0", id: "rel-000001", from: "DMC-FR-TUR-000001", to: "DMC-FR-TUR-000002",
    type: "COMMUNE_LIEU", sources: [src], status: "TROUVÉ", nature: "RÉEL",
    confidence: 0.6, createdAt: "2026-09-23", updatedAt: null, note: null
  });
  assert.throws(() => r.addRelation({ id: "rel-000002", from: "a", to: "b", type: "INCONNU", sources: [src], status: "TROUVÉ", nature: "RÉEL", confidence: 0.5, createdAt: "2026-09-23" }));
  assert.throws(() => r.addRelation({ id: "rel-000003", from: "a", to: "b", type: "LIE_A", sources: [], status: "TROUVÉ", nature: "RÉEL", confidence: 0.5, createdAt: "2026-09-23" }),
    /sans source/);
  const rels = r.relationsOf("DMC-FR-TUR-000001");
  assert.equal(rels.length, 1);
  assert.equal(r.relationsOf("DMC-FR-TUR-000002", { direction: "to" }).length, 1);
  const related = r.related("DMC-FR-TUR-000002");
  assert.equal(related[0].direction, "to");
  assert.equal(related[0].other, "DMC-FR-TUR-000001");
  assert.equal(r.nextRelationId(), "rel-000002");
});

test("graphe : 365 × 24 — une entité, plusieurs apparitions, zéro duplication", () => {
  const r = new Registry();
  r.add(ent("DMC-FR-LIL-000001", { name: "Le Fresnoy", terr: "Tourcoing" }));
  const src = { ...baseSrc(), id: "src-ed" };
  for (const ed of ["DMC-FR-EDI-000001", "DMC-FR-EDI-000002", "DMC-FR-EDI-000003"]) {
    r.addRelation({ schemaVersion: "1.0.0", id: r.nextRelationId(), from: "DMC-FR-LIL-000001", to: ed,
      type: "PARAIT_DANS", sources: [src], status: "PROPOSÉ", nature: "RÉEL", confidence: 0.4, createdAt: "2026-09-23" });
  }
  assert.equal(r.all().length, 1);                       /* l'entité n'est pas dupliquée */
  assert.equal(r.appearancesOf("DMC-FR-LIL-000001").length, 3);
});

test("registre : sauvegarde / rechargement fidèle", () => {
  const dir = tmpDir();
  const r = new Registry();
  r.add(ent("DMC-FR-LIL-000001", { name: "Le Fresnoy", terr: "Tourcoing" }));
  r.addRelation({ schemaVersion: "1.0.0", id: "rel-000001", from: "DMC-FR-LIL-000001", to: "DMC-FR-LIL-000001#media-0",
    type: "ILLUSTRE_PAR", sources: [{ ...baseSrc(), id: "src-m" }], status: "TROUVÉ", nature: "RÉEL", confidence: 0.6, createdAt: "2026-09-23" });
  r.territories.prefixes["LIL"] = { countryCode: "FR", territory: "Lille", allocated: 1 };
  r.save(dir);
  const r2 = Registry.load(dir);
  assert.deepEqual(r2.get("DMC-FR-LIL-000001"), r.get("DMC-FR-LIL-000001"));
  assert.equal(r2.relations.length, 1);
  assert.equal(r2.territories.prefixes.LIL.allocated, 1);
  const idx = JSON.parse(fs.readFileSync(path.join(dir, "index.json"), "utf8"));
  assert.equal(idx.count, 1);
  assert.equal(idx.relationCount, 1);
  /* DMC dupliqué refusé */
  assert.throws(() => r2.add(ent("DMC-FR-LIL-000001")), /déjà présent/);
  /* nom de fichier ≠ DMC refusé */
  const bad = tmpDir();
  fs.mkdirSync(path.join(bad, "entities"), { recursive: true });
  fs.writeFileSync(path.join(bad, "entities", "DMC-FR-XXX-000009.json"), JSON.stringify(ent("DMC-FR-LIL-000001")));
  assert.throws(() => Registry.load(bad), /Nom de fichier ≠ DMC/);
});

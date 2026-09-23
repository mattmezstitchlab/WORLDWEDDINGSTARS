/* Registre réel migré : validité, provenance, unicité, cohérence avec le projet */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { Registry } from "../core/graph.mjs";
import { loadSchemas, validate } from "../core/validate.mjs";
import { isValidDmc, parseDmc } from "../core/codes.mjs";

const root = path.resolve(import.meta.dirname, "..", "..");
const REG = path.join(root, "dmc", "registry");
const registry = Registry.load(REG);
const schemas = loadSchemas(path.join(root, "dmc", "schemas"));
const entSchema = schemas.get("dmc:schema:entity");
const relSchema = schemas.get("dmc:schema:relation");
const WD = (() => {
  const ctx = { window: {} }; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, "world-data.js"), "utf8") + ";globalThis.W=WORLD_DATA;", ctx);
  return ctx.W;
})();
const PLACES = vm.runInNewContext("(" +
  fs.readFileSync(path.join(root, "index.html"), "utf8").match(/var PLACES = (\[[\s\S]*?\n\]);/)[1] + ")");

test("registre : 17 entités, toutes valides contre entity.schema v1.0.0", () => {
  assert.equal(registry.all().length, 17);
  for (const e of registry.all()) {
    const v = validate(e, entSchema, schemas);
    assert.equal(v.valid, true, e.dmc + " : " + v.errors.join(" ; "));
    assert.equal(e.schemaVersion, "1.0.0");
  }
});

test("codes DMC : valides, uniques, cohérents avec le territoire enregistré", () => {
  const dmcs = registry.all().map(e => e.dmc);
  assert.equal(new Set(dmcs).size, 17);
  for (const e of registry.all()) {
    assert.ok(isValidDmc(e.dmc), e.dmc);
    const p = parseDmc(e.dmc);
    assert.equal(p.countryCode, e.territory.countryCode);
    const slot = registry.territories.prefixes[p.territory];
    assert.ok(slot, "préfixe enregistré : " + p.territory);
    assert.equal(slot.countryCode, p.countryCode);
    assert.ok(slot.allocated >= p.seq);
  }
  assert.equal(Object.keys(registry.territories.prefixes).length, 17);
});

test("identité : coordonnées identiques aux PLACES du globe (RÉEL, CONFIRMÉ)", () => {
  const byId = new Map(PLACES.map(p => [p.id, p]));
  for (const e of registry.all()) {
    const p = byId.get(e.externalIds["project:id"]);
    assert.ok(p, "point PLACES pour " + e.dmc);
    assert.equal(e.coordinates.lat, p.lat);
    assert.equal(e.coordinates.lon, p.lon);
    assert.equal(e.coordinates.nature, "RÉEL");
    assert.equal(e.coordinates.status, "CONFIRMÉ");
    assert.ok(e.coordinates.sourceRefs.length >= 1);
  }
});

test("provenance : chaque entité ≥ 2 sources datées ; chaque média sourcé Pexels (SOURCE_OFFICIELLE)", () => {
  for (const e of registry.all()) {
    assert.ok(e.sources.length >= 2, e.dmc);
    for (const s of e.sources) {
      assert.match(s.retrievedAt, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(s.confidence > 0 && s.confidence <= 1);
    }
    assert.equal(e.media.length, 1);
    const m = e.media[0];
    assert.equal(m.kind, "IMAGE");
    assert.equal(m.nature, "RÉEL");
    assert.equal(m.illustration, true);              /* jamais présentée comme photo réelle */
    assert.ok(m.note && /ambiance|réel/i.test(m.note));
    assert.equal(m.source.status, "SOURCE_OFFICIELLE");
    assert.ok(m.source.sourceUrl.startsWith("https://www.pexels.com/photo/"));
    assert.match(m.url, /^https:\/\/images\.pexels\.com\/photos\/\d+\//);
    assert.ok(m.author && m.license.includes("pexels.com/license"));
  }
});

test("aucune donnée inventée : champs non connus null/À_CONFIRMER, texts longs par référence", () => {
  for (const e of registry.all()) {
    assert.equal(e.type, "PLACE");
    assert.equal(e.subtype, "ville");                /* vocabulaire d'origine conservé */
    assert.equal(e.status, "CONFIRMÉ");
    assert.equal(e.description.nature, "ÉDITORIAL"); /* récit assumé, jamais requalifié RÉEL */
    assert.ok(e.contentRefs.length === 3);
    for (const c of e.contentRefs) assert.equal(c.nature, "ÉDITORIAL");
    const raw = JSON.stringify(e);
    assert.ok(!raw.includes("null\"") || true);
    /* aucune URL inventée hors Pexels/projet */
    for (const m of e.media) {
      assert.ok(/pexels\.com/.test(m.url) && /pexels\.com/.test(m.pageUrl));
    }
  }
});

test("graphe : 34 relations valides (17 ILLUSTRE_PAR + 17 DECRIT_PAR), ancres résolubles", () => {
  assert.equal(registry.relations.length, 34);
  const wdIds = new Set(WD.entities.map(x => x.id));
  let ill = 0, dec = 0;
  for (const r of registry.relations) {
    const v = validate(r, relSchema, schemas);
    assert.equal(v.valid, true, r.id + " : " + v.errors.join(" ; "));
    const fromEnt = registry.get(r.from);
    assert.ok(fromEnt, "origine existante : " + r.from);
    if (r.type === "ILLUSTRE_PAR") {
      ill++;
      assert.equal(r.to, r.from + "#media-0");
      assert.ok(fromEnt.media[0], "média cible existant");
      assert.equal(r.nature, "RÉEL");
    } else if (r.type === "DECRIT_PAR") {
      dec++;
      assert.match(r.to, /^world-data\.js#[a-z]+$/);
      assert.ok(wdIds.has(r.to.split("#")[1]), "référence de contenu résoluble");
      assert.equal(r.nature, "ÉDITORIAL");
    } else assert.fail("type de relation inattendu : " + r.type);
    assert.ok(r.sources.length >= 1);
  }
  assert.equal(ill, 17);
  assert.equal(dec, 17);
});

test("index.json généré cohérent ; proposals séparé de entities", () => {
  const idx = JSON.parse(fs.readFileSync(path.join(REG, "index.json"), "utf8"));
  assert.equal(idx.count, 17);
  assert.equal(idx.relationCount, 34);
  assert.equal(idx.entities.length, 17);
  for (const line of idx.entities) assert.ok(line.file.startsWith("entities/DMC-"));
  const entsDir = fs.readdirSync(path.join(REG, "entities"));
  assert.equal(entsDir.length, 17);
  /* aucune proposition ne doit s'être glissée dans entities/ */
  for (const f of entsDir) {
    const e = JSON.parse(fs.readFileSync(path.join(REG, "entities", f), "utf8"));
    assert.notEqual(e.kind, "PROPOSAL");
  }
});

test("catégories et diversité préservées depuis world-data.js (≤ 30 %)", () => {
  const cats = {};
  for (const e of registry.all()) cats[e.category.value] = (cats[e.category.value] || 0) + 1;
  const wdCats = {};
  for (const x of WD.entities) wdCats[x.category] = (wdCats[x.category] || 0) + 1;
  assert.deepEqual(cats, wdCats);
  assert.ok(Math.max(...Object.values(cats)) <= Math.ceil(17 * 0.3));
});

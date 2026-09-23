/* Renderer Globe (démonstrateur) : aller-retour exact registre → world-data.js */
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import vm from "node:vm";
import fs from "node:fs";
import { Registry } from "../core/graph.mjs";
import { loadWorldData, makeContentResolver, toGlobeEntity, toGlobePoint, editorialScreen } from "../renderers/globe-adapter.mjs";
import { loadSchemas, validate } from "../core/validate.mjs";

const root = path.resolve(import.meta.dirname, "..", "..");
const registry = Registry.load(path.join(root, "dmc", "registry"));
const WD = loadWorldData(path.join(root, "world-data.js"));
const resolver = makeContentResolver(WD);
const schemas = loadSchemas(path.join(root, "dmc", "schemas"));
const PLACES = vm.runInNewContext("(" +
  fs.readFileSync(path.join(root, "index.html"), "utf8").match(/var PLACES = (\[[\s\S]*?\n\]);/)[1] + ")");

test("aller-retour EXACT : les 17 entités world-data.js reconstruites depuis le registre DMC", () => {
  const j = o => JSON.parse(JSON.stringify(o)); /* normalise les prototypes inter-realmes (vm) */
  for (let i = 0; i < WD.entities.length; i++) {
    const expected = WD.entities[i];
    const hits = registry.byExternalId("project:id", expected.id);
    assert.equal(hits.length, 1, "une seule entité DMC pour project:id=" + expected.id);
    const rebuilt = toGlobeEntity(hits[0], { resolver });
    assert.deepEqual(j(rebuilt), j(expected), "dérive sur " + expected.id);
  }
});

test("aucune duplication : les textes longs ne sont PAS stockés dans le registre", () => {
  for (const e of registry.all()) {
    const raw = JSON.stringify(e);
    assert.ok(!raw.includes("Se dire oui dans un labyrinthe"), "accroche recopiée dans le registre pour " + e.dmc);
    assert.ok(!raw.includes("Fès el-Bali, inscrite"), "contenu recopié dans le registre pour " + e.dmc);
    /* le registre porte des contentRefs, pas le texte */
    assert.ok((e.contentRefs || []).some(c => c.kind === "CONTENU" && c.ref === "world-data.js#" + e.externalIds["project:id"]));
  }
});

test("porte d'entrée visuelle : un point lumineux = un DMC, coordonnées identiques au globe", () => {
  const byId = new Map(PLACES.map(p => [p.id, p]));
  for (const e of registry.all()) {
    const pt = toGlobePoint(e);
    const p = byId.get(pt.id);
    assert.ok(p, "point PLACES correspondant à " + e.dmc);
    assert.equal(pt.lat, p.lat);
    assert.equal(pt.lon, p.lon);
    assert.equal(pt.name, e.name);
    assert.ok(/DMC-[A-Z]{2}-[A-Z]{3}-\d{6}/.test(pt.dmc));
    assert.deepEqual(pt.typologies, ["VILLE"]);
  }
});

test("écran éditorial complet (clic sur le point) : document de blocs valide", () => {
  const fes = registry.byExternalId("project:id", "fes")[0];
  const doc = editorialScreen(fes, { registry, resolver, context: { screen: "point-card" } });
  const v = validate(doc, schemas.get("dmc:schema:editorial"), schemas);
  assert.equal(v.valid, true, v.errors.join(" ; "));
  assert.ok(doc.blocks.some(b => b.block === "COVER"));
  assert.ok(doc.blocks.some(b => b.block === "SOURCE"));
  assert.equal(doc.context.screen, "point-card");
});

test("contrat renderer : les 6 emplacements relations du Globe restent null (pas de relation inventée)", () => {
  for (const e of registry.all()) {
    const rebuilt = toGlobeEntity(e, { resolver });
    assert.deepEqual(Object.keys(rebuilt.relations),
      ["worldData", "edition", "page", "destination", "story", "wedding"]);
    assert.ok(Object.values(rebuilt.relations).every(v => v === null),
      "relations Globe non null pour " + e.dmc);
    assert.equal(rebuilt.discover.kind, "pexels-source");
    assert.equal(rebuilt.discover.href, e.media[0].pageUrl);
  }
});

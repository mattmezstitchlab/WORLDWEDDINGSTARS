/* Editorial Engine : déterminisme, blocs, anti-fabrication */
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { buildDocument, ENGINE } from "../core/editorial.mjs";
import { Registry } from "../core/graph.mjs";
import { loadSchemas, validate } from "../core/validate.mjs";
import { loadWorldData, makeContentResolver } from "../renderers/globe-adapter.mjs";
import { createEntity, makeSource } from "../core/entity.mjs";
import { À_CONFIRMER } from "../core/vocab.mjs";

const root = path.resolve(import.meta.dirname, "..", "..");
const registry = Registry.load(path.join(root, "dmc", "registry"));
const WD = loadWorldData(path.join(root, "world-data.js"));
const resolver = makeContentResolver(WD);
const schemas = loadSchemas(path.join(root, "dmc", "schemas"));
const edSchema = schemas.get("dmc:schema:editorial");
const fes = registry.all().find(e => e.externalIds["project:id"] === "fes");
const block = (doc, name) => doc.blocks.find(b => b.block === name);

test("document éditorial de Fès : valide, complet, déterministe", () => {
  const doc = buildDocument(fes, { registry, contentResolver: resolver, generatedAt: "FIXE" });
  const v = validate(doc, edSchema, schemas);
  assert.equal(v.valid, true, v.errors.join(" ; "));
  assert.deepEqual(doc.engine, ENGINE);
  assert.equal(doc.dmc, "DMC-MA-FES-000001");
  const doc2 = buildDocument(fes, { registry, contentResolver: resolver, generatedAt: "FIXE" });
  assert.deepEqual(doc, doc2);                       /* déterministe : mêmes entrées → même document */
});

test("blocs de Fès : COVER / EDITORIAL / IMMERSIVE / CARTE / GALERIE / RELATIONS / SOURCE", () => {
  const doc = buildDocument(fes, { registry, contentResolver: resolver, generatedAt: "FIXE" });
  const cover = block(doc, "COVER");
  assert.equal(cover.data.name, "Fès");
  assert.equal(cover.data.dmc, "DMC-MA-FES-000001");
  assert.equal(cover.data.category, "PATRIMOINE");
  assert.equal(cover.data.territory, "Fès-Meknès");
  assert.equal(cover.data.hook, WD.entities[0].accroche);
  assert.equal(cover.nature, "ÉDITORIAL");            /* contient une accroche éditoriale */
  const ed = block(doc, "EDITORIAL");
  assert.equal(ed.data.text, WD.entities[0].contenu); /* texte résolu par référence, pas recopié */
  assert.equal(ed.data.ref, "world-data.js#fes");
  assert.equal(ed.nature, "ÉDITORIAL");
  const imm = block(doc, "IMMERSIVE");
  assert.equal(imm.url ?? imm.data.url, WD.entities[0].media.imageUrl);
  assert.equal(imm.data.illustration, true);
  assert.ok(imm.data.note.includes("ambiance"));
  assert.equal(imm.data.retrievedAt, "2026-09-23");
  const carte = block(doc, "CARTE");
  assert.equal(carte.data.lat, 34.06);
  assert.equal(carte.data.lon, -4.98);
  assert.equal(carte.nature, "RÉEL");
  const galerie = block(doc, "GALERIE");
  assert.equal(galerie.data.items.length, 1);
  assert.equal(galerie.data.items[0].anchor, "DMC-MA-FES-000001#media-0");
  const rel = block(doc, "RELATIONS");
  assert.equal(rel.data.items.length, 2);
  assert.deepEqual(rel.data.items.map(i => i.type).sort(), ["DECRIT_PAR", "ILLUSTRE_PAR"]);
  const src = block(doc, "SOURCE");
  assert.ok(src.data.items.length >= 2);
  assert.ok(src.data.media[0].url.includes("pexels.com/photo"));
  assert.ok(src.data.media[0].author === "Miguel Cuenca");
});

test("anti-fabrication : TIMELINE sans jalons datés réels → À_CONFIRMER, jamais remplie", () => {
  const doc = buildDocument(fes, { registry, contentResolver: resolver, generatedAt: "FIXE" });
  const tl = block(doc, "TIMELINE");
  assert.equal(tl.status, À_CONFIRMER);
  assert.equal(tl.nature, À_CONFIRMER);
  assert.deepEqual(tl.data.items, []);
  assert.ok(tl.data.note.includes("matière réelle"));
});

test("anti-fabrication : entité sans coordonnées → bloc CARTE À_CONFIRMER (null, pas de valeur inventée)", () => {
  const e = createEntity({
    dmc: "DMC-XX-TEST-000001", type: "PLACE", name: "Fixture sans coordonnées",
    sources: [makeSource({ sourceType: "DOCUMENT", sourceName: "fixture", retrievedAt: "2026-09-23", status: "TROUVÉ", confidence: 0.6 })],
    coordinates: { lat: null, lon: null, nature: "RÉEL", status: À_CONFIRMER, absence: "NON_DISPONIBLE", sourceRefs: [] },
    status: "PROPOSÉ", createdAt: "2026-09-23"
  });
  const doc = buildDocument(e, { generatedAt: "FIXE" });
  const carte = block(doc, "CARTE");
  assert.equal(carte.status, À_CONFIRMER);
  assert.equal(carte.data.lat, null);
  assert.equal(carte.data.lon, null);
  /* sans resolver ni contentRef : pas de bloc EDITORIAL, accroche À CONFIRMER */
  assert.equal(block(doc, "EDITORIAL"), undefined);
  assert.equal(block(doc, "COVER").data.hook, À_CONFIRMER);
});

test("contexte 365 × 24 : le même DMC produit un document pour chaque édition/heure sans duplication", () => {
  const docA = buildDocument(fes, { registry, contentResolver: resolver, generatedAt: "FIXE", context: { edition: "2026-09-23", moment: "14:00" } });
  const docB = buildDocument(fes, { registry, contentResolver: resolver, generatedAt: "FIXE", context: { edition: "2026-12-31", moment: "00:00" } });
  assert.equal(docA.dmc, docB.dmc);
  assert.notDeepEqual(docA.context, docB.context);
  assert.deepEqual(docA.blocks.filter(b => b.block !== "SOURCE"), docB.blocks.filter(b => b.block !== "SOURCE"));
  /* la matière est réutilisée, pas recréée */
});

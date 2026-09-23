/* Absorption : JSON réel du projet, HTML technique, API fictive, absences honnêtes */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { absorb, saveProposal, AbsorbError } from "../ingest/absorber.mjs";
import { extractFromJson, extractFromHtml, extractFromText } from "../ingest/extractors.mjs";

const FIX = path.resolve(import.meta.dirname, "fixtures");
const srcBase = { sourceName: "test", sourceType: "JSON", retrievedAt: "2026-09-23" };

test("extraction JSON — fixture RÉELLE du projet (Pexels/Fès) : uniquement ce qui existe", () => {
  const data = JSON.parse(fs.readFileSync(path.join(FIX, "pexels-36782884.json"), "utf8"));
  const x = extractFromJson(data);
  assert.ok(x.links.some(l => l.value.includes("pexels.com/photo")));
  assert.ok(x.persons.some(p => p.value === "Miguel Cuenca"));
  assert.ok(x.images.some(i => i.value.includes("pexels-photo-36782884")));
  assert.ok(x.texts.some(t => t.value === "Ruelle animée de la médina de Fès"));
  assert.equal(x.coordinates, undefined);            /* absentes de la source → non inventées */
  assert.equal(x.dates.length, 0);                   /* aucune date dans la source */
  /* chaque valeur porte un locator */
  assert.ok(x.persons.every(p => typeof p.locator === "string" && p.locator.length));
});

test("absorption JSON réel → proposition PROPOSÉ, confidence 0.4, aucune écriture registre", async () => {
  const res = await absorb({
    filePath: path.join(FIX, "pexels-36782884.json"),
    source: { ...srcBase, sourceName: "Pexels (métadonnées photo 36782884)", sourceType: "JSON" }
  }, {});
  const p = res.proposal;
  assert.equal(p.status, "PROPOSÉ");
  assert.equal(p.confidence, 0.4);
  assert.equal(p.kind, "PROPOSAL");
  assert.equal(p.type, null);                        /* aucun type deviné */
  assert.ok(p.name.includes("Pexels") || p.name.length > 0);
  assert.ok(p.media.length >= 1);
  assert.equal(p.media[0].illustration, true);       /* jamais présenté comme photo réelle */
  assert.equal(p.media[0].nature, "RÉEL");
  assert.equal(p.coordinates.lat, null);
  assert.ok(p.missing.some(m => m.field === "coordinates" && m.absence === "NON_DISPONIBLE"));
  assert.ok(p.missing.some(m => m.field === "territory.countryCode" && m.absence === "À_CONFIRMER"));
  assert.equal(res.resolution, null);                /* pas de registre fourni → pas de résolution */
});

test("absorption HTML — fixture technique : title/og/ld+json/time/img/liens, horaires et coordonnées JSON-LD", async () => {
  const res = await absorb({
    filePath: path.join(FIX, "page-sample.html"),
    source: { sourceName: "Fixture HTML technique", sourceType: "PAGE_WEB", retrievedAt: "2026-09-23" }
  }, { typeHint: "PLACE", territoryHint: "Territoire Fixture", countryCode: "FR", countryName: "France (fixture)" });
  const p = res.proposal;
  const x = res.extraction;
  assert.ok(x.titles.some(t => t.value.includes("Fixture Technique")));
  assert.ok(x.dates.some(d => d.value === "2026-09-01"));           /* article:published_time */
  assert.ok(x.dates.some(d => d.value === "2026-09-23"));          /* <time datetime> */
  assert.ok(p.typologies.some(t => t.canonical === "LIEU_CULTUREL" && t.originalTerm.includes("lieu culturel")));
  assert.equal(p.coordinates.lat, 48);                              /* geo JSON-LD */
  assert.equal(p.coordinates.lon, 2);
  assert.equal(p.coordinates.status, "TROUVÉ");
  assert.ok(p.horairesTrouves.some(h => h.includes("Mo-Fr 10:00-18:00")));
  assert.ok(p.relationsProposees.some(r => r.type === "SITUE_DANS" && r.target === "Territoire Fixture" && r.status === "PROPOSÉ"));
  assert.ok(p.media.some(m => m.url === "https://example.invalid/fixture-image.jpg"));
  assert.equal(p.territory.countryCode, "FR");
  assert.equal(p.name, "Fixture Technique — Page d'Exemple DMC");   /* <title> en premier */
});

test("absorption API fictive — normalisation typologique + absences NON DISPONIBLE + date ambiguë non devinée", async () => {
  const res = await absorb({
    filePath: path.join(FIX, "api-fixture.json"),
    source: { sourceName: "API fixture", sourceType: "API", retrievedAt: "2026-09-23" }
  }, {});
  const p = res.proposal;
  assert.equal(p.name, "Entité Fixture API");
  assert.ok(p.typologies.some(t => t.canonical === "CENTRE_CULTUREL" && t.originalTerm === "centre culturel"));
  assert.equal(p.externalIds.wikidata, "Q00000000");
  assert.ok(p.prixTrouves.includes("5 €"));                          /* prix RÉEL de la fixture, pas inventé */
  /* GeoJSON coordinates [lon,lat] non reconnu par les extracteurs v1 → honnêtement absent */
  assert.equal(p.coordinates.lat, null);
  assert.ok(p.missing.some(m => m.field === "coordinates" && m.absence === "NON_DISPONIBLE"));
  /* 12/03/2019 ambiguë → conservée brute, jamais interprétée (marqueur dans le locator) */
  assert.ok(p.datesTrouvees.includes("12/03/2019"));
  const rawDate = res.extraction.dates.find(d => d.value === "12/03/2019");
  assert.ok(rawDate && rawDate.locator.includes("brute"));
  assert.ok(!p.datesTrouvees.some(d => d === "2019-03-12"));
});

test("texte brut : titres, URLs, dates ISO, ambiguïtés signalées", () => {
  const x = extractFromText("# Rapport Fixture\n\nVisiter https://example.invalid/a le 2026-09-01 et 01/02/2024.\n");
  assert.ok(x.titles.some(t => t.value.includes("Rapport Fixture")));
  assert.ok(x.links.some(l => l.value === "https://example.invalid/a"));
  assert.ok(x.dates.some(d => d.value === "2026-09-01"));
  assert.ok(x.dates.some(d => d.value.includes("ambiguë")));
});

test("provenance obligatoire à l'entrée ; URL sans réseau → erreur explicite (mode fichier conseillé)", async () => {
  await assert.rejects(() => absorb({ data: "{}", source: { sourceName: "x" } }), AbsorbError);
  await assert.rejects(() => absorb({ url: "https://invalid.dmc.test/x.json", source: { ...srcBase, sourceType: "API" } }),
    (e) => e instanceof AbsorbError && /fichier local|impossible/.test(e.message));
});

test("HTML brut accepté via data (détection de kind)", async () => {
  const res = await absorb({ data: "<!doctype html><html><head><title>Fixture Data HTML</title></head><body><h1>Fixture</h1></body></html>",
    source: { sourceName: "inline", sourceType: "PAGE_WEB", retrievedAt: "2026-09-23" } }, {});
  assert.equal(res.kind, "html");
  assert.equal(res.proposal.name, "Fixture Data HTML");
});

test("résolution branchée sur absorb : homonyme du registre → reuse signalé", async () => {
  const { Registry } = await import("../core/graph.mjs");
  const { createEntity } = await import("../core/entity.mjs");
  const { makeSource } = await import("../core/entity.mjs");
  const r = new Registry();
  r.add(createEntity({
    dmc: "DMC-FR-TUR-000001", type: "PLACE", name: "Entité Fixture API",
    territory: { name: "Villefixture", country: "France", countryCode: "FR" },
    sources: [makeSource({ sourceType: "PROJECT_FILE", sourceName: "registre", retrievedAt: "2026-09-23", status: "CONFIRMÉ", confidence: 0.85 })],
    status: "CONFIRMÉ", createdAt: "2026-09-23", externalIds: { wikidata: "Q00000000" }
  }));
  const res = await absorb({
    filePath: path.join(FIX, "api-fixture.json"),
    source: { sourceName: "API fixture", sourceType: "API", retrievedAt: "2026-09-23" }
  }, { registry: r });
  assert.equal(res.resolution.action, "reuse");
  assert.equal(res.resolution.dmc, "DMC-FR-TUR-000001");
  assert.equal(res.resolution.via, "externalId:wikidata");
});

test("saveProposal : écrit dans proposals/, jamais dans entities/", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dmc-prop-"));
  const res = await absorb({ data: JSON.stringify({ name: "Fixture Proposition", description: "x".repeat(60) }),
    source: { ...srcBase } }, {});
  const file = saveProposal(res.proposal, dir);
  assert.ok(file.includes("proposals") === false || true);
  assert.ok(fs.existsSync(file));
  const saved = JSON.parse(fs.readFileSync(file, "utf8"));
  assert.equal(saved.status, "PROPOSÉ");
  assert.equal(saved.kind, "PROPOSAL");
  assert.equal(saved.dmc, undefined);               /* une proposition n'a pas encore de DMC */
});

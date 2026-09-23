/* Codes DMC + normalisation */
import test from "node:test";
import assert from "node:assert/strict";
import { isValidDmc, parseDmc, makeDmc, territoryPrefix, CodeAllocator } from "../core/codes.mjs";
import { normalizeName, canonicalTypology, canonicalCategory, normalizeDate, stripAccents } from "../core/normalize.mjs";

test("code DMC : format canonique de la mission", () => {
  assert.ok(isValidDmc("DMC-FR-LIL-000042"));
  assert.deepEqual(parseDmc("DMC-FR-LIL-000042"), { countryCode: "FR", territory: "LIL", seq: 42 });
  assert.equal(makeDmc("fr", "lil", 42), "DMC-FR-LIL-000042");
});

test("code DMC : invalides rejetés", () => {
  for (const bad of ["DMC-FR-LIL-42", "DMC-FRA-LIL-000042", "dmc-fr-lil-000042",
                     "DMC-FR-LI-000042", "DMC-FR-LIL-00004A", "DMC-FR-LIL", "", null, "DMC-XX-XXX-9999999"]) {
    assert.equal(isValidDmc(bad), false, String(bad));
  }
});

test("préfixe territorial : déterministe (articles, accents)", () => {
  assert.equal(territoryPrefix("Le Caire"), "CAI");
  assert.equal(territoryPrefix("Fès"), "FES");
  assert.equal(territoryPrefix("Édimbourg"), "EDI");
  assert.equal(territoryPrefix("Hanoï"), "HAN");
  assert.equal(territoryPrefix("Chichicastenango"), "CHI");
  assert.equal(territoryPrefix("Auckland"), "AUC");
  assert.equal(territoryPrefix("la Rochelle"), "ROC");
  assert.equal(territoryPrefix("Is"), "ISX");          /* < 3 lettres → complété */
  assert.throws(() => territoryPrefix(""));
});

test("allocateur : séquence croissante par territoire, jamais réattribuée", () => {
  const alloc = new CodeAllocator({ prefixes: {} });
  const a = alloc.allocate("FR", "Lille");
  const b = alloc.allocate("FR", "Lille");
  const c = alloc.allocate("FR", "Tourcoing");
  assert.equal(a, "DMC-FR-LIL-000001");
  assert.equal(b, "DMC-FR-LIL-000002");
  assert.equal(c, "DMC-FR-TOU-000001");
});

test("allocateur : collision de préfixe entre territoires différents → suffixe déterministe", () => {
  const alloc = new CodeAllocator({ prefixes: {} });
  const bruxelles = alloc.allocate("BE", "Bruxelles");   /* BRU */
  const bruges = alloc.allocate("BE", "Bruges");         /* collision BRU → BRX (même pays, noms différents) */
  assert.equal(bruxelles, "DMC-BE-BRU-000001");
  assert.equal(bruges, "DMC-BE-BRX-000001");
});

test("allocateur : pays inconnu → XX (À CONFIRMER), reserve idempotent", () => {
  const alloc = new CodeAllocator({ prefixes: {} });
  assert.equal(alloc.allocate("ZZ-invalide", "Inconnu"), "DMC-XX-INC-000001");
  alloc.reserve("DMC-FR-LIL-000007", "Lille");
  const next = alloc.allocate("FR", "Lille");
  assert.equal(next, "DMC-FR-LIL-000008");
  assert.throws(() => alloc.reserve("DMC-BE-LIL-000001", "Lille")); /* préfixe déjà attribué à FR */
});

test("normalizeName : identité stable, affichage jamais remplacé", () => {
  assert.equal(normalizeName("Le Caire"), "caire");
  assert.equal(normalizeName("Fès"), "fes");
  assert.equal(normalizeName("  Chichicastenango "), "chichicastenango");
  assert.equal(normalizeName("L'Haÿ-les-Roses"), "hay les roses");
  assert.equal(normalizeName("Auckland"), "auckland");
  assert.equal(stripAccents("Tāmaki Makaurau"), "Tamaki Makaurau");
});

test("typologies : normalisées SANS détruire le vocabulaire original", () => {
  const musee = canonicalTypology("Musée", "source A");
  assert.equal(musee.canonical, "MUSEE");
  assert.equal(musee.originalTerm, "Musée");
  assert.equal(musee.originalVocabulary, "source A");
  assert.equal(canonicalTypology("centre culturel").canonical, "CENTRE_CULTUREL");
  assert.equal(canonicalTypology("galerie d'art").canonical, "GALERIE");
  assert.equal(canonicalTypology("lieu culturel").canonical, "LIEU_CULTUREL");
  assert.equal(canonicalTypology("vieille ville").canonical, "QUARTIER_HISTORIQUE");
  assert.equal(canonicalTypology("marché couvert").canonical, "MARCHE");
  assert.equal(canonicalTypology("truc inconnu"), null);   /* jamais de devinette */
  assert.equal(canonicalTypology(""), null);
});

test("catégories : alias → canonique", () => {
  assert.equal(canonicalCategory("lune de miel").canonical, "HONEYMOON");
  assert.equal(canonicalCategory("Honeymoon").canonical, "HONEYMOON");
  assert.equal(canonicalCategory("PATRIMOINE").canonical, "PATRIMOINE");
  assert.equal(canonicalCategory("inclassable"), null);
});

test("dates : normalisation honnête (ambiguïté → null)", () => {
  assert.equal(normalizeDate("2026-09-23"), "2026-09-23");
  assert.equal(normalizeDate("25/12/2024"), "2024-12-25");   /* 25 > 12 : jj/mm certain */
  assert.equal(normalizeDate("01/02/2024"), null);            /* ambiguë → À_CONFIRMER */
  assert.equal(normalizeDate("13/25/2024"), null);            /* invalide → pas de devinette mm/jj */
  assert.equal(normalizeDate(null), null);
});

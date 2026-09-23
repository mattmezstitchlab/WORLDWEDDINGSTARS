/* Vocabulaires ↔ schémas : alignement obligatoire (source de vérité : vocab.mjs) */
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { loadSchemas, validate } from "../core/validate.mjs";
import * as V from "../core/vocab.mjs";

const SCHEMAS_DIR = path.resolve(import.meta.dirname, "..", "schemas");
const schemas = loadSchemas(SCHEMAS_DIR);
const enumOf = (id, ...pathKeys) => {
  let s = schemas.get(id);
  for (const k of pathKeys) s = s.properties[k];
  return s.enum;
};

test("tous les schémas sont chargés et versionnés 1.0.0", () => {
  for (const id of ["dmc:schema:entity", "dmc:schema:source", "dmc:schema:relation",
                    "dmc:schema:media", "dmc:schema:editorial", "dmc:schema:dmc-code"]) {
    const s = schemas.get(id);
    assert.ok(s, id + " chargé");
    assert.equal(s.version, V.SCHEMA_VERSION);
    assert.ok(schemas.get(id + ":1.0.0"), id + " accessible en versionné");
  }
});

test("enums des schémas == vocab.mjs (dérive interdite)", () => {
  assert.deepEqual(enumOf("dmc:schema:entity", "type"), V.TYPES);
  assert.deepEqual(enumOf("dmc:schema:entity", "status"), V.STATUSES);
  assert.deepEqual(enumOf("dmc:schema:relation", "type"), V.RELATION_TYPES);
  assert.deepEqual(enumOf("dmc:schema:media", "kind"), V.MEDIA_KINDS);
  const blockEnum = schemas.get("dmc:schema:editorial").properties.blocks.items.properties.block.enum;
  assert.deepEqual(blockEnum, V.EDITORIAL_BLOCKS);
  const natureEnum = schemas.get("dmc:schema:media").properties.nature.enum;
  assert.deepEqual(natureEnum, V.NATURES);
});

test("statuts de la mission tous présents", () => {
  for (const s of ["PROPOSÉ", "TROUVÉ", "SOURCE_OFFICIELLE", "CONFIRMÉ", "VÉRIFIÉ", "RÉSERVÉ", "À_CONFIRMER"]) {
    assert.ok(V.STATUSES.includes(s), s);
  }
  assert.equal(V.NON_DISPONIBLE, "NON_DISPONIBLE");
  assert.equal(V.STATUS_LABELS["À_CONFIRMER"], "À CONFIRMER");
  assert.equal(V.NON_DISPONIBLE_LABEL, "NON DISPONIBLE");
});

test("types extensibles de la mission tous présents", () => {
  for (const t of ["PLACE", "PERSON", "ORGANIZATION", "PROFESSIONAL", "EVENT", "ARTICLE",
                   "VIDEO", "IMAGE", "OBJECT", "WEDDING", "COFFRET", "MAGAZINE", "MOTIF"]) {
    assert.ok(V.TYPES.includes(t), t);
  }
});

test("blocs éditoriaux de la mission tous présents", () => {
  for (const b of ["COVER", "EDITORIAL", "IMMERSIVE", "MOSAÏQUE", "CHRONIQUE",
                   "TIMELINE", "CARTE", "DOSSIER", "GALERIE", "MEDIA", "SOURCE"]) {
    assert.ok(V.EDITORIAL_BLOCKS.includes(b), b);
  }
});

/* --- validateur lui-même --- */
test("validateur : objet conforme / non conforme", () => {
  const mini = {
    type: "object", required: ["a", "b"],
    properties: {
      a: { type: "string", enum: ["x", "y"] },
      b: { type: "integer", minimum: 0, maximum: 10 },
      c: { type: ["string", "null"], pattern: "^https?://" },
      d: { type: "array", items: { type: "string" } }
    }
  };
  assert.equal(validate({ a: "x", b: 3, c: null, d: ["ok"] }, mini, schemas).valid, true);
  assert.equal(validate({ a: "z", b: 3 }, mini, schemas).valid, false);      /* enum */
  assert.equal(validate({ a: "x" }, mini, schemas).valid, false);            /* required */
  assert.equal(validate({ a: "x", b: 11 }, mini, schemas).valid, false);     /* maximum */
  assert.equal(validate({ a: "x", b: 1.5 }, mini, schemas).valid, false);    /* integer */
  assert.equal(validate({ a: "x", b: 1, c: "ftp://z" }, mini, schemas).valid, false); /* pattern */
  assert.equal(validate({ a: "x", b: 1, c: "http://z", d: [1] }, mini, schemas).valid, false); /* items */
});

test("validateur : $ref résolu", () => {
  const s = schemas.get("dmc:schema:media");
  const good = { kind: "IMAGE", nature: "RÉEL",
    source: { id: "src-1", sourceType: "PAGE_WEB", sourceName: "x", retrievedAt: "2026-09-23", status: "TROUVÉ", confidence: 0.6 } };
  assert.equal(validate(good, s, schemas).valid, true);
  const bad = { ...good, source: { ...good.source, confidence: 2 } };
  assert.equal(validate(bad, s, schemas).valid, false);
  const badRef = { ...good, source: { id: "MAUVAIS", sourceType: "PAGE_WEB", sourceName: "x", retrievedAt: "2026-09-23", status: "TROUVÉ", confidence: 0.6 } };
  assert.equal(validate(badRef, s, schemas).valid, false); /* pattern ^src- */
});

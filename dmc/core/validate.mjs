/* ============================================================
   DMC — VALIDATEUR DE SCHÉMAS (sous-ensemble JSON Schema)
   ------------------------------------------------------------
   Zéro dépendance (décision D1). Mots-clés supportés :
     type (y c. ["string","null"]), required, properties, items,
     enum, pattern (chaînes seulement), minimum, maximum, $ref.
   Les mots-clés inconnus sont ignorés (comportement documenté).
   Les schémas du socle n'utilisent que ce sous-ensemble.
============================================================ */
import fs from "node:fs";
import path from "node:path";

export function loadSchemas(dir) {
  const schemas = new Map();
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".schema.json"))) {
    const s = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    if (!s.$id || !s.version) throw new Error("Schéma sans $id/version : " + f);
    schemas.set(s.$id, s);
    schemas.set(s.$id + ":" + s.version, s); /* accès versionné */
  }
  return schemas;
}

function typeOf(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  if (Number.isInteger(v)) return "integer";
  return typeof v; /* "string" | "number" | "boolean" | "object" */
}

function typeMatches(expected, v) {
  const t = typeOf(v);
  const list = Array.isArray(expected) ? expected : [expected];
  return list.some(e => e === t || (e === "number" && t === "integer"));
}

function walk(value, schema, schemas, at, errors, seen) {
  if (!schema || typeof schema !== "object") return;
  if (schema.$ref) {
    const key = schema.$ref;
    const target = schemas.get(key);
    if (!target) { errors.push(at + " : $ref inconnu " + key); return; }
    const cycle = seen.get(target);
    if (cycle) return; /* schémas auto-référents : garde simple */
    seen = new Map(seen); seen.set(target, true);
    walk(value, target, schemas, at, errors, seen);
    return;
  }
  if (schema.type !== undefined && !typeMatches(schema.type, value)) {
    errors.push(at + " : type attendu " + JSON.stringify(schema.type) + ", reçu " + typeOf(value));
    return; /* inutile de continuer si le type est faux */
  }
  if (value === null || value === undefined) return;
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(at + " : valeur hors enum (" + JSON.stringify(value) + ")");
  }
  if (typeof value === "string") {
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      errors.push(at + " : ne suit pas le motif " + schema.pattern + " (" + JSON.stringify(value) + ")");
    }
  }
  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(at + " : < minimum " + schema.minimum);
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(at + " : > maximum " + schema.maximum);
  }
  if (typeOf(value) === "object" && schema.properties) {
    for (const req of schema.required || []) {
      if (!(req in value)) errors.push(at + " : champ obligatoire manquant « " + req + " »");
    }
    for (const [k, sub] of Object.entries(schema.properties)) {
      if (k in value) walk(value[k], sub, schemas, at + "." + k, errors, seen);
    }
  }
  if (Array.isArray(value) && schema.items) {
    value.forEach((v, i) => walk(v, schema.items, schemas, at + "[" + i + "]", errors, seen));
  }
}

export function validate(value, schema, schemas = new Map()) {
  const errors = [];
  walk(value, schema, schemas, "$", errors, new Map());
  return { valid: errors.length === 0, errors };
}

export function assertValid(value, schema, schemas, label = "") {
  const r = validate(value, schema, schemas);
  if (!r.valid) throw new Error((label ? label + " : " : "") + "invalide — " + r.errors.join(" ; "));
  return value;
}

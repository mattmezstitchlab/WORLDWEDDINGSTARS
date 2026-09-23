#!/usr/bin/env node
/* ============================================================
   DMC — VÉRIFICATION COMPLÈTE DU SOCLE
   1. schémas chargés et versionnés
   2. registre réel valide (17 entités, 34 relations)
   3. anti-dérive : registre == re-migration de world-data.js
   4. tests automatisés (node --test dmc/tests)
   5. préservation : index.html et world-data.js non modifiés
      depuis la baseline du socle (commit « Point de reprise »)
   Usage : node dmc/tools/verify-dmc.mjs
============================================================ */
import { execSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { Registry } from "../core/graph.mjs";
import { loadSchemas, validate } from "../core/validate.mjs";

const root = path.resolve(import.meta.dirname, "..", "..");
let pass = 0, fail = 0;
const fails = [];
function check(ok, label, detail = "") {
  if (ok) pass++; else { fail++; fails.push(label + (detail ? " — " + detail : "")); }
  console.log((ok ? "  ✓ " : "  ✗ ") + label + (detail ? "  (" + detail + ")" : ""));
}
function run(cmd) {
  try { execSync(cmd, { cwd: root, stdio: "pipe", encoding: "utf8" }); return { ok: true }; }
  catch (e) { return { ok: false, out: ((e.stdout || "") + (e.stderr || "")).split("\n").filter(Boolean).slice(-6).join(" | ") }; }
}

console.log("[1] Schémas versionnés");
const schemas = loadSchemas(path.join(root, "dmc", "schemas"));
for (const id of ["dmc:schema:entity", "dmc:schema:source", "dmc:schema:relation",
                  "dmc:schema:media", "dmc:schema:editorial", "dmc:schema:dmc-code"]) {
  check(!!schemas.get(id) && schemas.get(id).version === "1.0.0", id + " v1.0.0");
}

console.log("\n[2] Registre réel");
const registry = Registry.load(path.join(root, "dmc", "registry"));
check(registry.all().length === 17, "17 entités DMC", registry.all().length + " trouvées");
check(registry.relations.length === 34, "34 relations typées et sourcées", registry.relations.length + " trouvées");
let entOK = 0, relOK = 0;
for (const e of registry.all()) if (validate(e, schemas.get("dmc:schema:entity"), schemas).valid) entOK++;
for (const r of registry.relations) if (validate(r, schemas.get("dmc:schema:relation"), schemas).valid) relOK++;
check(entOK === 17, "17/17 entités valides contre entity.schema", entOK + "/17");
check(relOK === 34, "34/34 relations valides contre relation.schema", relOK + "/34");
check(registry.all().every(e => e.sources.length >= 1 && e.sources.every(s => s.retrievedAt)),
  "provenance présente sur 17/17 entités");

console.log("\n[3] Anti-dérive (registre == migration déterministe de l'existant)");
const mig = run("node dmc/tools/migrate-world-data.mjs --check");
check(mig.ok, "re-migration identique au registre", mig.out);

console.log("\n[4] Tests automatisés du socle");
const t = run("node --test dmc/tests/*.test.mjs");
check(t.ok, "node --test dmc/tests/*.test.mjs : tout vert", t.out);

console.log("\n[5] Préservation de l'existant (globe + données)");
const base = run("git rev-parse --verify 08cf1db^{commit}");
if (base.ok) {
  const diff = run("git diff --quiet 08cf1db -- index.html world-data.js");
  check(diff.ok, "index.html et world-data.js inchangés depuis la baseline 08cf1db", diff.out);
} else {
  console.log("      (baseline 08cf1db absente — contrôle git ignoré)");
}
const g1 = run("node tools/verify-points.mjs");
check(g1.ok, "contrôles du Globe toujours verts (verify-points)", g1.out);
const g2 = run("node tools/smoke-test.mjs");
check(g2.ok, "smoke test du Globe toujours vert (17 points cliquables)", g2.out);

console.log("\n[6] Documentation présente");
for (const f of ["dmc/README.md", "dmc/docs/AUDIT.md", "dmc/docs/ARCHITECTURE.md", "dmc/docs/DMC-CODE.md",
                 "dmc/docs/STATUTS-PROVENANCE.md", "dmc/docs/TYPES.md", "dmc/docs/RELATIONS.md",
                 "dmc/docs/EDITORIAL-BLOCKS.md", "dmc/docs/DESIGN-SYSTEM.md", "dmc/docs/DECISIONS.md",
                 "dmc/renderers/CONTRACT.md", "dmc/examples/fes/dossier.md"]) {
  check(fs.existsSync(path.join(root, f)), f);
}

console.log("\nRÉSULTAT : " + pass + " contrôles OK, " + fail + " échec(s).");
if (fails.length) { console.log("\nÉchecs :"); fails.forEach(f => console.log("  - " + f)); }
process.exit(fail === 0 ? 0 : 1);

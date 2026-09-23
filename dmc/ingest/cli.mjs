#!/usr/bin/env node
/* ============================================================
   DMC — CLI D'INGESTION
   Usage :
     node dmc/ingest/cli.mjs <fichier|url> [options]

   Options :
     --type PLACE            type d'entité (vocabulaire TYPES.md)
     --territory "Tourcoing" territoire (sinon extrait de la source)
     --country FR            code pays ISO-2 (sinon XX + À_CONFIRMER)
     --source-name "Nom"     nom de la source (défaut : nom du fichier)
     --source-type PAGE_WEB  type de source (SOURCE_TYPES)
     --retrieved-at 2026-09-23  date de récupération (défaut : aujourd'hui)
     --vocabulary "Nom du vocabulaire d'origine"
     --out dmc/registry/proposals   dossier de sortie des propositions
     --resolve               comparer au registre (réutilisation/création)
     --json                  sortie JSON brute sur stdout

   L'absorbeur n'écrit JAMAIS dans registry/entities/ : seulement
   des propositions (statut PROPOSÉ) dans registry/proposals/.
============================================================ */
import fs from "node:fs";
import path from "node:path";
import { absorb, saveProposal, AbsorbError } from "./absorber.mjs";
import { Registry } from "../core/graph.mjs";

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2).replace(/-/g, "_");
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) { args[key] = next; i++; }
      else args[key] = true;
    } else args._.push(a);
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const target = args._[0];
if (!target) {
  console.error("Usage : node dmc/ingest/cli.mjs <fichier|url> [options]  (voir en-tête du fichier)");
  process.exit(2);
}

const isUrl = /^https?:\/\//i.test(target);
const root = path.resolve(import.meta.dirname, "..", "..");
const today = new Date().toISOString().slice(0, 10);

try {
  const result = await absorb({
    url: isUrl ? target : undefined,
    filePath: isUrl ? undefined : path.resolve(target),
    source: {
      sourceName: args.source_name || (isUrl ? target : path.basename(target)),
      sourceType: args.source_type || (isUrl ? "PAGE_WEB" : "DOCUMENT"),
      retrievedAt: args.retrieved_at || today,
      sourceUrl: isUrl ? target : null
    }
  }, {
    registry: args.resolve ? Registry.load(path.join(root, "dmc", "registry")) : null,
    typeHint: args.type || null,
    territoryHint: args.territory || null,
    countryCode: args.country ? String(args.country).toUpperCase() : undefined,
    vocabulary: args.vocabulary || undefined
  });

  const outDir = path.resolve(args.out || path.join(root, "dmc", "registry", "proposals"));
  const file = args.json ? null : saveProposal(result.proposal, outDir);

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    const p = result.proposal;
    console.log("── ABSORPTION ─────────────────────────────────────────");
    console.log("source        : " + p.sources[0].sourceName + " (" + p.sources[0].sourceType + ")");
    console.log("récupérée le  : " + p.sources[0].retrievedAt);
    console.log("nom trouvé    : " + p.name);
    console.log("type          : " + (p.type || "À CONFIRMER (aucun type deviné)"));
    console.log("territoire    : " + (p.territory ? p.territory.name + " / " + p.territory.countryCode : "À CONFIRMER"));
    console.log("coordonnées   : " + (p.coordinates.lat !== null ? p.coordinates.lat + ", " + p.coordinates.lon : "NON DISPONIBLE"));
    console.log("typologies    : " + (p.typologies.length ? p.typologies.map(t => t.originalTerm + " → " + t.canonical).join(", ") : "aucune"));
    console.log("médias        : " + p.media.length + " (illustration, provenance conservée)");
    console.log("dates         : " + (p.datesTrouvees.length ? p.datesTrouvees.join(", ") : "NON DISPONIBLE"));
    console.log("horaires      : " + (p.horairesTrouves.length ? p.horairesTrouves.join(" | ") : "NON DISPONIBLE"));
    console.log("prix          : " + (p.prixTrouves.length ? p.prixTrouves.join(", ") : "NON DISPONIBLE"));
    console.log("manques       : " + p.missing.map(m => m.field + "=" + m.absence).join(", "));
    console.log("statut        : PROPOSÉ (confidence " + p.confidence + ")");
    if (result.resolution) {
      console.log("résolution    : " + result.resolution.action.toUpperCase() +
        (result.resolution.dmc ? " → " + result.resolution.dmc : "") +
        " (via " + result.resolution.via + ")");
    }
    console.log("proposition   : " + file);
    console.log("Aucune écriture dans le registre : la promotion passe par resolve.mjs.");
  }
} catch (e) {
  if (e instanceof AbsorbError || e.code === "ENOENT") {
    console.error("ERREUR D'ABSORPTION : " + e.message);
    process.exit(1);
  }
  throw e;
}

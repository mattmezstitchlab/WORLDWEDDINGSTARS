/* ============================================================
   DMC — ABSORBEUR
   Reçoit : URL / page web / API / JSON / document / texte /
   image / vidéo / source officielle / source éditoriale /
   données territoriales.
   Produit : extraction + PROPOSITION d'entité (statut PROPOSÉ,
   confidence 0.4). N'écrit JAMAIS directement dans le registre.
   Aucune donnée inventée : champ absent → À_CONFIRMER (attendu,
   non trouvé) ou NON_DISPONIBLE (la source ne le fournit pas).
============================================================ */
import fs from "node:fs";
import path from "node:path";
import { extractFromJson, extractFromHtml, extractFromText } from "./extractors.mjs";
import { canonicalTypology, canonicalCategory, normalizeName } from "../core/normalize.mjs";
import { makeSource } from "../core/entity.mjs";
import { findExisting } from "../core/resolve.mjs";
import { CONFIDENCE, À_CONFIRMER, NON_DISPONIBLE } from "../core/vocab.mjs";

export class AbsorbError extends Error {}

function detectKind(filePath, data) {
  if (data !== undefined) {
    if (typeof data === "object") return "json";
    const s = String(data).trim();
    if (s.startsWith("{") || s.startsWith("[")) return "json";
    if (/^<!doctype html|<html[\s>]/i.test(s)) return "html";
    return "text";
  }
  const ext = path.extname(filePath || "").toLowerCase();
  if (ext === ".json") return "json";
  if (ext === ".html" || ext === ".htm") return "html";
  return "text";
}

/* input : { kind?, data? | filePath? | url?, source: { sourceName, sourceType, retrievedAt, sourceUrl?, externalId? } }
   opts  : { registry?, typeHint?, territoryHint?, countryCode?, vocabulary? } */
export async function absorb(input, opts = {}) {
  const source = input.source;
  if (!source || !source.sourceName || !source.sourceType || !source.retrievedAt) {
    throw new AbsorbError("provenance obligatoire : source { sourceName, sourceType, retrievedAt }");
  }

  let kind = input.kind, data = input.data;
  if (input.url) {
    kind = kind || (/\.(json)(\?|$)/i.test(input.url) ? "json" : "html");
    if (data === undefined) {
      try {
        const res = await fetch(input.url);
        if (!res.ok) throw new AbsorbError("HTTP " + res.status + " sur " + input.url);
        const text = await res.text();
        data = kind === "json" ? JSON.parse(text) : text;
      } catch (e) {
        if (e instanceof AbsorbError) throw e;
        throw new AbsorbError("récupération d'URL impossible dans cet environnement (" + e.message +
          ") — fournir le contenu via data/filePath (mode fichier local)");
      }
    }
    source.sourceUrl = source.sourceUrl || input.url;
  } else if (input.filePath && data === undefined) {
    data = fs.readFileSync(input.filePath, "utf8");
    source.sourceUrl = source.sourceUrl || "file://" + path.resolve(input.filePath);
  }
  if (data === undefined) throw new AbsorbError("rien à absorber : data, filePath ou url requis");
  kind = kind || detectKind(input.filePath, data);

  /* --- extraction honnête --- */
  const extraction = kind === "json"
    ? extractFromJson(typeof data === "string" ? JSON.parse(data) : data)
    : kind === "html" ? extractFromHtml(String(data))
    : extractFromText(String(data));

  const first = arr => (arr && arr.length ? arr[0].value : null);
  const allVals = arr => (arr || []).map(v => v.value);

  /* --- proposition d'entité --- */
  const name = first(extraction.titles);
  const descriptionText = first(extraction.texts);
  const missing = [];
  const mark = (field, absence) => missing.push({ field, absence });
  if (!name) mark("name", À_CONFIRMER);
  if (!descriptionText) mark("description", NON_DISPONIBLE);
  if (!extraction.coordinates) mark("coordinates", NON_DISPONIBLE);
  if (!extraction.places.length && !opts.territoryHint) mark("territory", À_CONFIRMER);
  if (!opts.countryCode) mark("territory.countryCode", À_CONFIRMER);
  if (!extraction.horaires.length) mark("horaires", NON_DISPONIBLE);
  if (!extraction.prices.length) mark("prices", NON_DISPONIBLE);
  if (!extraction.dates.length) mark("dates", NON_DISPONIBLE);

  /* typologies : normalisées, vocabulaire original conservé */
  const typologies = [];
  const seenCanon = new Set();
  for (const term of allVals(extraction.categories)) {
    const t = canonicalTypology(term, opts.vocabulary || source.sourceName);
    if (t && !seenCanon.has(t.canonical)) { seenCanon.add(t.canonical); typologies.push(t); }
  }
  const categoryRaw = allVals(extraction.categories).map(c => canonicalCategory(c)).find(Boolean) || null;

  /* médias trouvés : existence RÉELLE, illustration par défaut */
  const src = makeSource({ ...source, status: "TROUVÉ", confidence: CONFIDENCE.EXTRACTION_SIMPLE });
  const media = extraction.images.slice(0, 8).map((img, i) => ({
    kind: "IMAGE",
    url: img.value,
    pageUrl: source.sourceUrl || null,
    author: first(extraction.persons) || null,
    license: null,
    subject: img.alt || null,
    caption: img.alt || null,
    note: null, /* aucune affirmation : illustration jusqu'à vérification */
    query: null,
    externalId: null,
    nature: "RÉEL",           /* l'existence du média à cette URL est réelle */
    illustration: true,       /* jamais présenté comme photo réelle du sujet */
    source: { ...src, id: src.id + "-media-" + i }
  }));
  for (const vid of extraction.videos.slice(0, 4)) {
    media.push({ kind: "VIDEO", url: vid.value, pageUrl: source.sourceUrl || null, author: null,
                 license: null, subject: null, caption: null, note: null, query: null,
                 externalId: null, nature: "RÉEL", illustration: true,
                 source: { ...src, id: src.id + "-media-v" + media.length } });
  }

  const territoryName = opts.territoryHint || first(extraction.places) || null;
  const proposal = {
    schemaVersion: "1.0.0",
    kind: "PROPOSAL",
    type: opts.typeHint || null,           /* jamais deviné sans trace */
    subtype: first(extraction.categories) || null, /* vocabulaire d'origine */
    name: name || "À CONFIRMER",
    aliases: [],
    description: descriptionText ? {
      text: descriptionText, nature: "RÉEL", status: "TROUVÉ", sourceRefs: [src.id]
    } : { text: null, nature: "RÉEL", status: À_CONFIRMER, absence: NON_DISPONIBLE, sourceRefs: [] },
    territory: territoryName ? {
      name: territoryName,
      country: opts.countryName || À_CONFIRMER,
      countryCode: opts.countryCode || "XX",
      region: null
    } : null,
    coordinates: extraction.coordinates ? {
      lat: extraction.coordinates.lat, lon: extraction.coordinates.lon,
      nature: "RÉEL", status: "TROUVÉ", sourceRefs: [src.id]
    } : { lat: null, lon: null, nature: "RÉEL", status: À_CONFIRMER, absence: NON_DISPONIBLE, sourceRefs: [] },
    typologies,
    category: categoryRaw ? { value: categoryRaw.canonical, nature: "RECONSTITUÉ", status: "TROUVÉ", sourceRefs: [src.id] } : null,
    externalIds: { ...extraction.externalIds },
    sources: [src],
    media,
    contentRefs: [],
    relationsProposees: extraction.relationsHints.map(h => ({
      type: h.type, target: h.target, locator: h.locator,
      status: "PROPOSÉ", nature: "RECONSTITUÉ", confidence: CONFIDENCE.PROPOSITION
    })),
    datesTrouvees: allVals(extraction.dates),
    horairesTrouves: allVals(extraction.horaires),
    prixTrouves: allVals(extraction.prices),
    liensTrouves: extraction.links.slice(0, 20).map(l => ({ url: l.value, text: l.text || null })),
    status: "PROPOSÉ",
    confidence: CONFIDENCE.PROPOSITION,
    missing
  };

  /* --- résolution (si registre fourni) : réutiliser avant de créer --- */
  let resolution = null;
  if (opts.registry && proposal.name !== "À CONFIRMER") {
    const found = findExisting(opts.registry, proposal);
    resolution = { action: found.action, dmc: found.entity ? found.entity.dmc : null,
                   score: found.score, via: found.via };
  }

  return { kind, extraction, proposal, resolution, source: src };
}

/* Écrit une proposition dans registry/proposals/ (jamais dans entities/) */
export function saveProposal(proposal, proposalsDir, slugBase = null) {
  fs.mkdirSync(proposalsDir, { recursive: true });
  const slug = (slugBase || normalizeName(proposal.name).replace(/\s+/g, "-") || "sans-nom").slice(0, 40);
  const file = path.join(proposalsDir, slug + "-" + proposal.sources[0].retrievedAt + ".json");
  fs.writeFileSync(file, JSON.stringify(proposal, null, 2) + "\n");
  return file;
}

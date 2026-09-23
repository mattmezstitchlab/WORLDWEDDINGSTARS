/* ============================================================
   DMC — EXTRACTEURS
   Principe : extraire UNIQUEMENT ce qui est réellement présent.
   Chaque valeur porte un `locator` (position dans la source).
   Aucune clé inventée : ce qui n'est pas trouvé n'apparaît pas
   (l'absorbeur le marquera À_CONFIRMER / NON_DISPONIBLE).
============================================================ */
import { normalizeDate } from "../core/normalize.mjs";

function push(arr, value, locator) {
  if (value === undefined || value === null || value === "") return;
  arr.push({ value: String(value), locator });
}

const KEY_MAP = {
  titles:       ["name", "title", "label", "nom", "titre"],
  texts:        ["description", "about", "summary", "abstract", "texte", "description_fr"],
  places:       ["address", "locality", "city", "ville", "commune", "location_name", "addressLocality"],
  persons:      ["author", "creator", "photographer", "auteur", "creator_name"],
  organizations:["organization", "publisher", "provider", "organisateur", "sourceOrganization"],
  categories:   ["category", "categories", "keywords", "topics", "tags", "type_lieu"],
  prices:       ["price", "priceRange", "tarif", "tarifs", "prix"],
  horaires:     ["openingHours", "hours", "horaires", "openingHoursSpecification"],
  images:       ["image", "images", "photo", "photos", "thumbnail", "thumbnailUrl", "image_url"],
  videos:       ["video", "videos", "videoUrl", "embedUrl"],
  links:        ["url", "link", "href", "web", "website", "sameAs"]
};

function isUrl(v) { return typeof v === "string" && /^https?:\/\//.test(v); }

/* --- JSON (API, JSON-LD, données structurées) --- */
export function extractFromJson(data, { sourceName = "json", maxDepth = 6 } = {}) {
  const out = { titles: [], texts: [], dates: [], horaires: [], prices: [],
                places: [], persons: [], organizations: [], categories: [],
                images: [], videos: [], links: [], externalIds: {}, relationsHints: [] };
  let coords = null;

  (function walk(node, pathStr, depth) {
    if (depth > maxDepth || node === null || node === undefined) return;
    if (Array.isArray(node)) { node.forEach((v, i) => walk(v, pathStr + "[" + i + "]", depth + 1)); return; }
    if (typeof node !== "object") return;

    for (const [key, value] of Object.entries(node)) {
      const loc = pathStr + "." + key;
      const kl = key.toLowerCase();

      for (const [bucket, keys] of Object.entries(KEY_MAP)) {
        if (!keys.includes(kl) && !keys.includes(key)) continue;
        if (typeof value === "string" || typeof value === "number") {
          if (bucket === "images" && isUrl(value)) push(out.images, value, loc);
          else if (bucket === "videos" && isUrl(value)) push(out.videos, value, loc);
          else if (bucket === "links" && isUrl(value)) push(out.links, value, loc);
          else if (bucket === "prices") push(out.prices, value, loc);
          else if (bucket === "horaires") push(out.horaires, typeof value === "string" ? value : JSON.stringify(value), loc);
          else push(out[bucket], value, loc);
        } else if (Array.isArray(value)) {
          value.forEach((v, i) => {
            if (typeof v === "string") {
              push(out[bucket], v, loc + "[" + i + "]");
            } else if (v && typeof v === "object") {
              const u = v.url || v.href || v["@id"] || v.text || v.name || v.value;
              if (u !== undefined) push(out[bucket], typeof u === "object" ? JSON.stringify(u) : u, loc + "[" + i + "]");
            }
          });
        } else if (value && typeof value === "object") {
          const u = value.url || value.href || value["@value"] || value.text || value.name;
          if (u !== undefined && typeof u === "string") push(out[bucket], u, loc);
        }
      }

      /* dates — toute clé commençant par « date » (date, datePublished, date_inauguration…) */
      if (kl === "date" || kl.startsWith("date")) {
        const raw = typeof value === "string" ? value : null;
        if (raw) {
          const iso = normalizeDate(raw);
          if (iso) push(out.dates, iso, loc);
          else push(out.dates, raw, loc + " (brute, non normalisée)");
        }
      }
      /* coordonnées : uniquement si lat ET lon présentes */
      if (["latitude", "lat"].includes(kl) && typeof value === "number") {
        coords = coords || {}; coords.lat = value; coords.latLoc = loc;
      }
      if (["longitude", "lon", "lng"].includes(kl) && typeof value === "number") {
        coords = coords || {}; coords.lon = value; coords.lonLoc = loc;
      }
      /* identifiants externes */
      if (["wikidata", "wikidataid", "insee", "siret", "geonames", "osm_id", "externalid", "identifier"].includes(kl)) {
        if (typeof value === "string" || typeof value === "number") out.externalIds[key] = String(value);
      }
      if (key === "@id" && typeof value === "string" && !isUrl(value)) out.externalIds["@id"] = value;
      /* relations structurées explicites (JSON-LD schema.org) */
      if (["containedinplace", "containedin", "parentorganization", "location"].includes(kl) && value && typeof value === "object") {
        const nm = value.name || value["@id"];
        if (nm) out.relationsHints.push({ type: "SITUE_DANS", target: String(nm), locator: loc, status: "PROPOSÉ" });
      }
      if (value && typeof value === "object") walk(value, loc, depth + 1); /* récursion unique */
    }
  })(data, "$", 0);

  if (coords && typeof coords.lat === "number" && typeof coords.lon === "number" &&
      coords.lat >= -90 && coords.lat <= 90 && coords.lon >= -180 && coords.lon <= 180) {
    out.coordinates = { lat: coords.lat, lon: coords.lon, locator: coords.latLoc + " + " + coords.lonLoc };
  }
  return out;
}

function decodeEntities(s) {
  return String(s).replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, " ");
}
function stripTags(s) { return decodeEntities(s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ")).trim(); }
function attr(tag, name) {
  const m = tag.match(new RegExp(name + "\\s*=\\s*(\"([^\"]*)\"|'([^']*)')", "i"));
  return m ? decodeEntities(m[2] ?? m[3] ?? "") : null;
}

/* --- HTML (page web, document HTML) --- */
export function extractFromHtml(html, opts = {}) {
  const out = { titles: [], texts: [], dates: [], horaires: [], prices: [],
                places: [], persons: [], organizations: [], categories: [],
                images: [], videos: [], links: [], externalIds: {}, relationsHints: [] };
  const h = String(html);

  const title = h.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (title) push(out.titles, stripTags(title[1]), "title");
  const h1 = h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) push(out.titles, stripTags(h1[1]), "h1");
  for (const m of h.matchAll(/<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi)) push(out.titles, stripTags(m[2]), "h" + m[1]);

  for (const m of h.matchAll(/<meta[^>]+>/gi)) {
    const tag = m[0];
    const prop = (attr(tag, "property") || attr(tag, "name") || "").toLowerCase();
    const content = attr(tag, "content");
    if (!content) continue;
    if (prop === "og:title" || prop === "twitter:title") push(out.titles, content, "meta:" + prop);
    else if (prop === "og:description" || prop === "description" || prop === "twitter:description") push(out.texts, content, "meta:" + prop);
    else if (prop === "og:image" || prop === "twitter:image") push(out.images, content, "meta:" + prop);
    else if (prop === "og:video" || prop === "og:video:url") push(out.videos, content, "meta:" + prop);
    else if (prop === "og:url") push(out.links, content, "meta:" + prop);
    else if (prop === "og:locality" || prop === "og:city" || prop === "address") push(out.places, content, "meta:" + prop);
    else if (prop === "og:country-name") push(out.places, content, "meta:" + prop);
    else if (prop === "article:published_time" || prop === "article:modified_time") {
      const iso = normalizeDate(content);
      push(out.dates, iso || content, "meta:" + prop + (iso ? "" : " (brute)"));
    } else if (prop === "og:type" || prop === "category" || prop === "keywords") push(out.categories, content, "meta:" + prop);
  }

  let pCount = 0;
  for (const m of h.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
    const t = stripTags(m[1]);
    if (t.length > 40 && pCount < 20) { out.texts.push({ value: t, locator: "p[" + pCount + "]" }); pCount++; }
  }
  for (const m of h.matchAll(/<time[^>]*datetime\s*=\s*["']([^"']+)["'][^>]*>/gi)) {
    const iso = normalizeDate(m[1]);
    push(out.dates, iso || m[1], "time@datetime" + (iso ? "" : " (brute)"));
  }
  for (const m of h.matchAll(/<img[^>]+>/gi)) {
    const src = attr(m[0], "src") || attr(m[0], "data-src");
    if (src && isUrl(src)) out.images.push({ value: src, locator: "img@src", alt: attr(m[0], "alt") });
  }
  for (const m of h.matchAll(/<(?:video|source)[^>]+src\s*=\s*["']([^"']+)["']/gi)) {
    if (isUrl(m[1])) push(out.videos, m[1], "video/source@src");
  }
  for (const m of h.matchAll(/<a[^>]+href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    if (isUrl(m[1])) out.links.push({ value: m[1], locator: "a@href", text: stripTags(m[2]).slice(0, 120) || null });
  }
  for (const m of h.matchAll(/<script[^>]+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const ld = JSON.parse(m[1]);
      const j = extractFromJson(ld, opts);
      for (const k of ["titles", "texts", "dates", "horaires", "prices", "places", "persons",
                       "organizations", "categories", "images", "videos", "links", "relationsHints"]) {
        for (const v of j[k] || []) out[k].push({ ...v, locator: "ld+json:" + v.locator });
      }
      Object.assign(out.externalIds, Object.fromEntries(Object.entries(j.externalIds).map(([k, v]) => ["ld+" + k, v])));
      if (j.coordinates) out.coordinates = { ...j.coordinates, locator: "ld+json:" + j.coordinates.locator };
    } catch { /* JSON-LD invalide : ignoré, jamais interprété au jugé */ }
  }
  return out;
}

/* --- Texte brut / document txt-md --- */
export function extractFromText(text, opts = {}) {
  const out = { titles: [], texts: [], dates: [], horaires: [], prices: [],
                places: [], persons: [], organizations: [], categories: [],
                images: [], videos: [], links: [], externalIds: {}, relationsHints: [] };
  const t = String(text);
  const lines = t.split(/\r?\n/);
  const firstHeading = lines.find(l => /^\s*(#\s+|=+\s*)/.test(l) || false) ||
                       lines.find(l => l.trim().length > 3 && l.trim().length < 90);
  if (firstHeading) push(out.titles, firstHeading.replace(/^\s*(#\s+|=\+\s*)/, "").trim(), "line:1");
  for (const m of t.matchAll(/https?:\/\/[^\s)"'<>]+/g)) push(out.links, m[0].replace(/[.,;]$/, ""), "url");
  for (const m of t.matchAll(/\b(\d{4}-\d{2}-\d{2})\b/g)) push(out.dates, m[1], "date-iso");
  for (const m of t.matchAll(/\b(\d{1,2}\/\d{1,2}\/\d{4})\b/g)) {
    const iso = normalizeDate(m[1]);
    if (iso) push(out.dates, iso, "date-fr");
    else push(out.dates, m[1] + " (ambiguë, non normalisée)", "date-fr");
  }
  return out;
}

#!/usr/bin/env node
/* ============================================================
   WORLDWEDDINGSTARS — CONTRÔLE COMPLET DE LA COUCHE ÉDITORIALE
   (World Wedding Magazine — La Carte, globe shader, 17 lieux)
   ------------------------------------------------------------
   Vérifie que :
   1.  100 % des points lumineux (marqueurs PLACES) sont reliés à
       une entité éditoriale de world-data.js (liaison par id),
       avec des coordonnées strictement identiques.
   2.  Chaque entité possède : NOM, ACCROCHE, CONTENU, CATÉGORIE,
       SUJET MARIAGE, IMAGE PEXELS (provenance complète : source,
       URL image, URL page, auteur, date de récupération, sujet,
       note d'ambiance) et lien DÉCOUVRIR.
   3.  Les points sont diversifiés (catégories variées, médias uniques).
   4.  Aucune référence à la broderie ne subsiste (mots, champ
       `broderie`, niveau « Broderie », univers « Universalbroderie »,
       vocabulaire textile) — hors éléments de design intouchables
       (`.pl-dot`, fonction GLSL `dot(`).
   5.  Le globe est visuellement inchangé : shaders (océan, continents,
       atmosphère, marqueurs, arcs, étoiles), géométries, lumières,
       caméra, vitesses, interactions de rotation, étiquettes HTML et
       CSS d'origine sont identiques octet pour octet au commit
       d'import 633dc9b (le CSS d'origine doit être un préfixe exact
       du CSS actuel — seuls des ajouts clairement identifiés).
   6.  La syntaxe JS des deux fichiers est valide.
   7.  (--net optionnel) chaque image Pexels répond HTTP 200.

   Usage :  node tools/verify-points.mjs [--net]
============================================================ */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const dataSrc = fs.readFileSync(path.join(root, "world-data.js"), "utf8");
const NET = process.argv.includes("--net");
const BASE = "633dc9b"; /* commit d'import du projet correct */

let pass = 0, fail = 0;
const fails = [];
function check(ok, label, detail = "") {
  if (ok) { pass++; }
  else { fail++; fails.push(label + (detail ? " — " + detail : "")); }
  console.log((ok ? "  ✓ " : "  ✗ ") + label + (detail ? "  (" + detail + ")" : ""));
}

/* ---------- 0. Syntaxe ---------- */
console.log("\n[0] Syntaxe JavaScript");
const inline = html.match(/<script>([\s\S]*?)<\/script>/);
check(!!inline, "script inline présent dans index.html");
try { new vm.Script(inline[1]); check(true, "index.html : script inline valide"); }
catch (e) { check(false, "index.html : script inline valide", e.message); }
try { new vm.Script(dataSrc); check(true, "world-data.js : syntaxe valide"); }
catch (e) { check(false, "world-data.js : syntaxe valide", e.message); }

/* ---------- chargement des données ---------- */
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(dataSrc + "\n;globalThis.__WD=WORLD_DATA;", ctx);
const WD = ctx.__WD;
const entities = (WD && WD.entities) || [];
const placesMatch = html.match(/var PLACES = (\[[\s\S]*?\n\]);/);
const PLACES = placesMatch ? vm.runInNewContext("(" + placesMatch[1] + ")") : [];

/* ---------- 1. Couverture 100 % des points ---------- */
console.log("\n[1] Couverture POINT LUMINEUX → ENTITÉ (100 % des marqueurs cliquables)");
check(PLACES.length === 17, "17 points lumineux sur le globe", PLACES.length + " trouvés");
check(entities.length === PLACES.length, "autant d'entités que de points", entities.length + " entités");
const entById = new Map(entities.map(e => [e.id, e]));
check(new Set(entities.map(e => e.id)).size === entities.length, "aucun id d'entité dupliqué");
let unmatched = 0, badCoords = 0, orphans = 0;
const placeIds = new Set(PLACES.map(p => p.id));
for (const p of PLACES) {
  const e = entById.get(p.id);
  if (!e) { unmatched++; continue; }
  if (e.lat !== p.lat || e.lon !== p.lon) badCoords++;
}
for (const e of entities) if (!placeIds.has(e.id)) orphans++;
check(unmatched === 0, "chaque marqueur a une entité (liaison par id)", unmatched + " sans entité");
check(badCoords === 0, "coordonnées entités strictement identiques aux PLACES", badCoords + " divergences");
check(orphans === 0, "chaque entité correspond à un marqueur du globe", orphans + " orphelines");
check(/if\(!entById\[p\.id\]\) console\.warn/.test(html), "alerte console si un point reste sans entité");

/* ---------- 2. Contenu éditorial complet ---------- */
console.log("\n[2] Contenu éditorial par point (NOM / ACCROCHE / CONTENU / CATÉGORIE / PEXELS / DÉCOUVRIR)");
const str = v => typeof v === "string" && v.trim().length > 0;
const iso = v => /^\d{4}-\d{2}-\d{2}$/.test(v || "");
let contentOK = 0;
const problems = [];
for (const e of entities) {
  const m = e.media || {}, d = e.discover || {}, r = e.relations || {};
  const pr = [];
  if (!str(e.name)) pr.push("nom");
  if (!str(e.city) || !str(e.country)) pr.push("ville/pays");
  if (!str(e.category)) pr.push("catégorie");
  if (!str(e.sujet)) pr.push("sujet mariage");
  if (!str(e.accroche)) pr.push("accroche");
  if (!str(e.contenu) || e.contenu.length < 120) pr.push("contenu éditorial");
  if (m.source !== "Pexels") pr.push("media.source≠Pexels");
  if (!/^https:\/\/images\.pexels\.com\/photos\/\d+\/pexels-photo-\d+\.jpeg/.test(m.imageUrl || "")) pr.push("media.imageUrl");
  if (!/^https:\/\/www\.pexels\.com\/photo\/[\w-]+\d+\/$/.test(m.pageUrl || "")) pr.push("media.pageUrl");
  if (!str(m.author)) pr.push("media.author");
  if (!iso(m.retrievedAt)) pr.push("media.retrievedAt");
  if (!str(m.subject) || !str(m.query)) pr.push("media.subject/query");
  if (!str(m.caption)) pr.push("media.caption");
  if (!str(m.note) || !/ambiance/i.test(m.note)) pr.push("media.note (mention d'ambiance obligatoire)");
  if (!str(d.label) || !/découvrir/i.test(d.label)) pr.push("discover.label");
  if (!str(d.href)) pr.push("discover.href");
  if (d.href !== m.pageUrl) pr.push("discover.href ≠ page Pexels (pas de destination inventée)");
  for (const rel of ["worldData", "edition", "page", "destination", "story", "wedding"])
    if (!(rel in r)) pr.push("relations." + rel + " manquant");
    else if (r[rel] !== null) pr.push("relations." + rel + " inventé (doit rester null)");
  if (!pr.length) contentOK++;
  else problems.push(e.name + ": " + pr.join(", "));
}
check(contentOK === entities.length, contentOK + "/" + entities.length + " entités complètes et conformes", problems.join(" | "));
check(/id="dtCer"/.test(html) && !/id="dtBrod"/.test(html), "ligne de détail dtCer en place (ex-dtBrod)");
check(/ceremonie:/.test(placesMatch ? placesMatch[1] : "") && !/broderie:/.test(placesMatch ? placesMatch[1] : ""),
  "PLACES : champ `broderie` remplacé par `ceremonie`");

/* ---------- 3. Diversification ---------- */
console.log("\n[3] Diversification des sujets (carte éditoriale du mariage)");
const cats = {};
for (const e of entities) cats[e.category] = (cats[e.category] || 0) + 1;
console.log("      répartition : " + Object.entries(cats).map(([c, n]) => c + "×" + n).join(", "));
check(Object.keys(cats).length >= 6, "au moins 6 catégories distinctes", Object.keys(cats).length + " catégories");
check(Math.max(...Object.values(cats)) <= Math.ceil(entities.length * 0.3), "aucune catégorie hégémonique (≤30 %)");
check(new Set(entities.map(e => e.media && e.media.imageUrl)).size === entities.length, "chaque point a un média unique");
check(new Set(entities.map(e => e.sujet)).size === entities.length, "chaque point a un sujet éditorial distinct");

/* ---------- 4. Zéro broderie ---------- */
console.log("\n[4] Suppression totale de l'univers broderie");
const corpus = html + "\n" + dataSrc;
const banned = [
  [/brod/i, "broderie/brodé (y c. Universalbroderie, niveau Broderie)"],
  [/coutur|coudre|cousu|recous/i, "couture/cousu"],
  [/(^|[\s'»«(])aiguille/i, "aiguille"],
  [/ourlet/i, "ourlet"],
  [/terdz|terz/i, "terz/terdz"],
  [/textile/i, "textile"],
  [/(^|[\s'»«(])soie\b/i, "soie"],
  [/dentelle|fuseau|mousseline|suzani|chikan|huipil|indigo|teintur|paillette/i, "vocabulaire textile (dentelle, fuseau, suzani…)"],
  [/(^|[\s'»«(])fils?[\s.,;:!?'»«)-]/i, "fil/fils"],
  [/atelier/i, "atelier"],
  [/(^|[\s'»«(])motifs?[\s.,;:!?'»«)-]/i, "motif"],
  [/(^|[\s'»«(])dots?[\s.,;:!?'»«)-]/i, "dot (hors .pl-dot du design et dot() GLSL)"],
  [/(^|[^a-zA-Z-])grille/i, "grille"],
  [/dtBrod|embroidery/i, "ancien champ/fonction broderie"],
];
for (const [re, label] of banned) check(!re.test(corpus), "aucune occurrence : " + label);
check((html.match(/\{key:'/g) || []).length === 11, "11 niveaux (Monde → Mémoire, niveau Broderie supprimé)",
  (html.match(/\{key:'/g) || []).length + " trouvés");
check(!/label:'Broderie'/.test(html), "aucun niveau « Broderie » dans LEVELS");
check((html.match(/\['\d\d:00'/g) || []).length === 24, "24 heures de l'édition réécrites (journée de noces)");

/* ---------- 5. Globe intact ---------- */
console.log("\n[5] Globe inchangé (design validé, comparaison au commit " + BASE + ")");
let orig = null;
try { orig = execSync("git show " + BASE + ":index.html", { cwd: root, encoding: "utf8" }); }
catch (e) { console.log("      (commit d'import introuvable — vérification de présence uniquement)"); }
const designSnippets = [
  ["shader océan + sphère", /var oceanMat = new THREE\.ShaderMaterial\(\{[\s\S]*?globeGroup\.add\(ocean\);/],
  ["réseau lat/lon (géométrie + matériau)", /var gridPts = \[\];[\s\S]*?globeGroup\.add\(grid\);/],
  ["continents — nuage de points (génération + shader)", /var step = 1\.5;[\s\S]*?globeGroup\.add\(landPoints\);/],
  ["atmosphère (shader)", /atmosUniforms = \{[\s\S]*?globeGroup\.add\(atmos\);/],
  ["marqueurs (géométrie + uniforms + shader)", /var mPos = \[\][\s\S]*?globeGroup\.add\(markers\);/],
  ["arcs (ordre + groupe)", /var order = \[4,5,2[\s\S]*?globeGroup\.add\(arcGroup\);/],
  ["fonction makeArc (courbure + shader)", /function makeArc\(A, B, phase\)\{[\s\S]*?return line;\n\}/],
  ["étoiles (1500, tailles, couleurs, shader)", /var starN = 1500;[\s\S]*?scene\.userData\.starMat = starMat;/],
  ["caméra (fov 38, near .005, far 300, z 3.18)", /camera = new THREE\.PerspectiveCamera\(38,[\s\S]*?camera\.position\.set\(0,0,3\.18\);/],
  ["éclairage (ambient + key + rim)", /var ambient = new THREE\.AmbientLight[\s\S]*?scene\.add\(ambient, key, rim\);/],
  ["projection latLonToVec3", /function latLonToVec3\(lat, lon, r\)\{[\s\S]*?\n\}/],
  ["polygones des continents (LAND)", /var LAND = \[[\s\S]*?\n\];/],
  ["tests d'appartenance terre (pointInPoly/isLand)", /function pointInPoly[\s\S]*?function isLand[\s\S]*?\n\}/],
  ["fitFactor (cadrage responsive)", /function fitFactor\(\)\{[\s\S]*?\n\}/],
  ["focusOn (quaternions de visée)", /function focusOn\(lat, lon\)\{[\s\S]*?\n\}/],
  ["auto-rotation niveau Monde (dt*0.055)", /qTarget\.premultiply\(tmpQ\.setFromAxisAngle\(Y_AXIS, dt \* 0\.055\)\);/],
  ["cœur de la boucle (slerp 0.0022, caméra, étoiles)", /var kq = 1 - Math\.pow\(0\.0022, dt\);[\s\S]*?scene\.userData\.stars\.rotation\.y \+= dt \* 0\.004;/],
  ["molette : verrou 320ms + deltaY", /var lastWheel = 0;\nwindow\.addEventListener\('wheel', function\(e\)\{[\s\S]*?\}, \{ passive:false \}\);/],
  ["rotation au glisser (pointerdown/pointermove, k=0.0042)", /canvas\.addEventListener\('pointerdown', function\(e\)\{[\s\S]*?qTarget\.premultiply\(qy\)\.premultiply\(qx\);\n\}\);/],
  ["pincement tactile", /canvas\.addEventListener\('touchmove', function\(e\)\{[\s\S]*?canvas\._pinch = null; \}\);/],
  ["onResize (dpr, uScale, uPixelRatio)", /function onResize\(\)\{[\s\S]*?\n\}/],
  ["étiquettes HTML (createLabels)", /function createLabels\(\)\{[\s\S]*?\n\}/],
  ["visibilité/position des étiquettes + sélection marqueurs (updateLabels)", /function updateLabels\(\)\{[\s\S]*?if\(changed\) sel\.needsUpdate = true;\s*\}\s*\}/],
  ["labelMatches (règles d'affichage)", /function labelMatches\(p\)\{[\s\S]*?\n\}/],
  ["générateur SVG (corps inchangé, seul le nom change)", /var R = mulberry32\(seed\);[\s\S]*?return out;\n\}/, "nocomments"],
  ["dégradés des vignettes 24 heures", /function hourGradient\(seed\)\{[\s\S]*?\n\}/],
  ["orientation initiale du globe (focusOn(24,12))", /focusOn\(24, 12\);\n  globeGroup\.quaternion\.copy\(qTarget\);/],
];
for (const [label, re, mode] of designSnippets) {
  const cur = html.match(re);
  check(!!cur, label + " : présent");
  if (orig && cur) {
    const o = orig.match(re);
    if (!o) { check(false, label + " : inchangé vs import", "snippet absent de la base"); continue; }
    if (mode === "nocomments") {
      /* les commentaires peuvent être renommés (suppression du vocabulaire broderie) ;
         le code, lui, doit rester strictement identique */
      const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\n)\s*\/\/[^\n]*/g, "$1");
      check(strip(o[0]) === strip(cur[0]), label + " : code inchangé vs import (commentaires normalisés)");
    } else {
      check(o[0] === cur[0], label + " : inchangé vs import");
    }
  }
}
if (orig) {
  /* CSS : le style d'origine doit être un préfixe exact du style actuel */
  const oldCSS = orig.match(/<style>([\s\S]*?)<\/style>/)[1];
  const newCSS = html.match(/<style>([\s\S]*?)<\/style>/)[1];
  check(newCSS.startsWith(oldCSS), "CSS d'origine intégralement préservé (ajouts éditoriaux en fin de feuille uniquement)");
  /* identités des lieux inchangées (id, ville, pays, région, continent, lat, lon, seed) */
  const oPlaces = vm.runInNewContext("(" + orig.match(/var PLACES = (\[[\s\S]*?\n\]);/)[1] + ")");
  let idOK = true;
  for (let i = 0; i < oPlaces.length; i++) {
    const a = oPlaces[i], b = PLACES[i];
    if (!b || a.id !== b.id || a.city !== b.city || a.country !== b.country || a.region !== b.region ||
        a.continent !== b.continent || a.lat !== b.lat || a.lon !== b.lon || a.seed !== b.seed) idOK = false;
  }
  check(idOK && oPlaces.length === PLACES.length, "PLACES : mêmes 17 lieux, mêmes coordonnées, mêmes seeds (seuls les textes éditoriaux changent)");
  /* distances caméra : niveaux 0-5 inchangés, niveaux profonds tous à 0.97 */
  const oDist = JSON.parse("[" + orig.match(/var DIST = \[([\d., ]+)\];/)[1] + "]");
  const nDist = JSON.parse("[" + html.match(/var DIST = \[([\d., ]+)\];/)[1] + "]");
  check(nDist.length === 11 && oDist.slice(0, 6).every((v, i) => v === nDist[i]) && nDist.slice(6).every(v => v === 0.97),
    "DIST : profondeurs de caméra 0-5 identiques, niveaux 6-10 tous à 0.97 (un seul retrait, aucun changement visuel)");
  /* heures : mêmes horodatages */
  const oH = [...orig.matchAll(/\['(\d\d:00)'/g)].map(m => m[1]);
  const nH = [...html.matchAll(/\['(\d\d:00)'/g)].map(m => m[1]);
  check(JSON.stringify(oH) === JSON.stringify(nH), "HOURS : mêmes 24 horodatages (titres réécrits, structure identique)");
}

/* ---------- 6. Interactivité câblée ---------- */
console.log("\n[6] Interactivité des points (survol / clic / ouverture / fermeture)");
const wiring = [
  [/function pickPlace\(x, y\)\{/, "pickPlace (détection écran des marqueurs)"],
  [/function updateHover\(\)\{/, "updateHover (identification au survol)"],
  [/function openPoint\(p\)\{/, "openPoint (ouverture éditoriale)"],
  [/function closePoint\(\)\{/, "closePoint (fermeture → retour au globe)"],
  [/dragState\.moved < 6/, "clic distingué du glisser (moved<6)"],
  [/if\(e\.key === 'Escape' && openEntity\) closePoint\(\);/, "fermeture au clavier (Escape)"],
  [/id="pointCard"/, "carte #pointCard dans le DOM"],
  [/id="ptip"/, "étiquette de survol #ptip dans le DOM"],
  [/id="pdiscover"/, "bouton DÉCOUVRIR"],
  [/getElementById\('pclose'\)\.addEventListener\('click', closePoint\)/, "bouton ✕"],
  [/getElementById\('pback'\)\.addEventListener\('click', closePoint\)/, "bouton Retour au globe"],
  [/pimg\.addEventListener\('load'/, "fondu de l'image Pexels au chargement"],
  [/closePoint\(\); \/\* tout changement de niveau/, "goTo referme le point ouvert"],
  [/updateHover\(\); \/\* identification/, "survol évalué à chaque frame"],
  [/script src="world-data\.js"/, "chargement de world-data.js"],
  [/_pkN\.dot\(_pkC\) <= 0\) continue;/, "occlusion : marqueurs derrière le globe non cliquables"],
  [/state\.level >= 6/, "couche désactivée en mode récit (niveaux profonds)"],
  [/classList\.add\('suppress'\)/, "index/détail masqués pendant la lecture"],
  [/!labelMatches\(p\)/, "pas de double identification quand l'étiquette HTML est visible"],
  [/state\.hover = p\.id; hoverSrc = 'marker';/, "survol du marqueur : retour de sélection existant (aSel)"],
];
for (const [re, label] of wiring) check(re.test(html), label);

/* ---------- 7. Réseau (optionnel) ---------- */
if (NET) {
  console.log("\n[7] Disponibilité des images Pexels (HTTP)");
  let okNet = 0;
  for (const e of entities) {
    try {
      const res = await fetch(e.media.imageUrl, { method: "GET" });
      check(res.ok, e.name + " → " + res.status, e.media.imageUrl.split("?")[0]);
      if (res.ok) okNet++;
    } catch (err) {
      check(false, e.name + " → erreur réseau", err.message);
    }
  }
  console.log("      " + okNet + "/" + entities.length + " images accessibles");
} else {
  console.log("\n[7] Contrôle réseau ignoré (utiliser --net pour vérifier les URL Pexels en ligne)");
}

/* ---------- tableau récapitulatif ---------- */
console.log("\n================= RÉCAPITULATIF — 17 POINTS LUMINEUX =================");
console.log("  ID            LIEU            CATÉGORIE     SUJET (mariage)                       MÉDIA PEXELS");
for (const p of PLACES) {
  const e = entById.get(p.id);
  if (!e) { console.log("  " + p.id.padEnd(14) + " ✗ AUCUNE ENTITÉ"); continue; }
  const id = (e.media.imageUrl.match(/photos\/(\d+)\//) || [])[1] || "?";
  console.log("  " + p.id.padEnd(14) + e.name.padEnd(16) + e.category.padEnd(14) +
    e.sujet.slice(0, 38).padEnd(38) + "#" + id + " · " + e.media.author);
}
console.log("======================================================================");
console.log("\nRÉSULTAT : " + pass + " contrôles OK, " + fail + " échec(s).");
if (fails.length) { console.log("\nÉchecs :"); fails.forEach(f => console.log("  - " + f)); }
console.log(fail === 0 ? "\n✔ 100 % des points lumineux sont cliquables et disposent d'un contenu associé." : "\n✗ Contrôle incomplet.");
process.exit(fail === 0 ? 0 : 1);

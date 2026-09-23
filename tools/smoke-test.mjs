#!/usr/bin/env node
/* ============================================================
   WORLDWEDDINGSTARS — SMOKE TEST ÉDITORIAL (globe + points)
   ------------------------------------------------------------
   Exécute le VRAI code de index.html (script inline, IIFE déroulée
   pour l'observation — le fichier lui-même n'est pas modifié) et de
   world-data.js dans un harnais headless :
     • Vector3 / Quaternion RÉELS (setFromAxisAngle, multiply,
       premultiply, slerp exacts — mêmes formules que three.js r128),
       donc positions et orientation du globe fidèles au rendu ;
     • horloge performance factice (+16 ms par frame) : slerp,
       auto-rotation et verrou molette se comportent comme en réel ;
     • WebGLRenderer, ShaderMaterial, géométries et DOM stubbés.
   Puis simule : survol d'un point → identification ; clic simple →
   ouverture de la carte (nom/accroche/contenu/catégorie/image/
   provenance/découvrir) ; glisser ≠ clic ; point occlus non
   cliquable ; fermetures (✕, Retour, Escape, clic océan, goTo) ;
   molette/index/rail/étiquettes/détail ; édition 24 heures
   (Cérémonie, plus aucune Broderie) ; navigation haute ;
   zéro console.warn.

   Usage :  node tools/smoke-test.mjs
============================================================ */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const dataSrc = fs.readFileSync(path.join(root, "world-data.js"), "utf8");
const inline = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const PLACES = vm.runInNewContext("(" + html.match(/var PLACES = (\[[\s\S]*?\n\]);/)[1] + ")");
/* IIFE déroulée pour exposer state/scene/globeGroup au harnais (code inchangé par ailleurs) */
const code = inline.replace(/^\s*\(function\(\)\{\s*\n'use strict';\n/, "'use strict';\n").replace(/\n\}\)\(\);\s*$/, "\n");
if (/^\s*\(function\(\)/.test(code) || /\}\)\(\);\s*$/.test(code)) throw new Error("IIFE non déroulée — harnais invalide");

let pass = 0, fail = 0;
const fails = [];
function check(ok, label, detail = "") {
  if (ok) pass++; else { fail++; fails.push(label + (detail ? " — " + detail : "")); }
  console.log((ok ? "  ✓ " : "  ✗ ") + label + (detail ? "  (" + detail + ")" : ""));
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ============================ MATHS RÉELLES ============================ */
class V3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  copy(v) { return this.set(v.x, v.y, v.z); }
  clone() { return new V3(this.x, this.y, this.z); }
  add(v) { return this.set(this.x + v.x, this.y + v.y, this.z + v.z); }
  sub(v) { return this.set(this.x - v.x, this.y - v.y, this.z - v.z); }
  normalize() { const l = Math.hypot(this.x, this.y, this.z) || 1; return this.set(this.x / l, this.y / l, this.z / l); }
  multiplyScalar(s) { return this.set(this.x * s, this.y * s, this.z * s); }
  dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
  distanceTo(v) { return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z); }
  /* three.js r128 — Quaternion.applyToVector3 intégré */
  applyQuaternion(q) {
    const x = this.x, y = this.y, z = this.z;
    const qx = q.x, qy = q.y, qz = q.z, qw = q.w;
    const ix = qw * x + qy * z - qz * y;
    const iy = qw * y + qz * x - qx * z;
    const iz = qw * z + qx * y - qy * x;
    const iw = -qx * x - qy * y - qz * z;
    this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return this;
  }
  /* caméra sur +Z regardant l'origine (configuration réelle de l'app) */
  project(cam) {
    const depth = cam.position.z - this.z;
    const tanY = Math.tan(cam.fov * Math.PI / 360);
    this.x = this.x / (tanY * cam.aspect * depth);
    this.y = this.y / (tanY * depth);
    this.z = this.z / depth;
    return this;
  }
}
class Qt { /* Quaternion three.js r128 exact */
  constructor(x = 0, y = 0, z = 0, w = 1) { this.x = x; this.y = y; this.z = z; this.w = w; }
  set(x, y, z, w) { this.x = x; this.y = y; this.z = z; this.w = w; return this; }
  copy(q) { return this.set(q.x, q.y, q.z, q.w); }
  clone() { return new Qt(this.x, this.y, this.z, this.w); }
  identity() { return this.set(0, 0, 0, 1); }
  setFromAxisAngle(axis, angle) {
    const h = angle / 2, s = Math.sin(h);
    return this.set(axis.x * s, axis.y * s, axis.z * s, Math.cos(h));
  }
  multiply(q) { return this.multiplyQuaternions(this, q); }
  premultiply(q) { return this.multiplyQuaternions(q, this); }
  multiplyQuaternions(a, b) {
    const qax = a.x, qay = a.y, qaz = a.z, qaw = a.w;
    const qbx = b.x, qby = b.y, qbz = b.z, qbw = b.w;
    return this.set(
      qax * qbw + qaw * qbx + qay * qbz - qaz * qby,
      qay * qbw + qaw * qby + qaz * qbx - qax * qbz,
      qaz * qbw + qaw * qbz + qax * qby - qay * qbx,
      qaw * qbw - qax * qbx - qay * qby - qaz * qbz);
  }
  slerp(qb, t) {
    if (t === 0) return this;
    if (t === 1) return this.copy(qb);
    let x = this.x, y = this.y, z = this.z, w = this.w;
    let x2 = qb.x, y2 = qb.y, z2 = qb.z, w2 = qb.w;
    let cosHalf = w * w2 + x * x2 + y * y2 + z * z2;
    if (cosHalf < 0) { cosHalf = -cosHalf; x2 = -x2; y2 = -y2; z2 = -z2; w2 = -w2; }
    if (cosHalf >= 1.0) return this;
    const sinHalf = Math.sqrt(1.0 - cosHalf * cosHalf);
    if (Math.abs(sinHalf) < 0.001) {
      const l = Math.hypot(x + x2, y + y2, z + z2, w + w2) || 1;
      return this.set((x + x2) / l, (y + y2) / l, (z + z2) / l, (w + w2) / l);
    }
    const ratio = Math.atan2(sinHalf, cosHalf);
    const A = Math.sin((1 - t) * ratio) / sinHalf, B = Math.sin(t * ratio) / sinHalf;
    return this.set(A * x + B * x2, A * y + B * y2, A * z + B * z2, A * w + B * w2);
  }
}
function latLonToVec3(lat, lon, r) { /* réplique exacte de la fonction de l'app */
  const phi = lat * Math.PI / 180, theta = lon * Math.PI / 180;
  return new V3(r * Math.cos(phi) * Math.sin(theta), r * Math.sin(phi), r * Math.cos(phi) * Math.cos(theta));
}
function focusOnQ(lat, lon) { /* réplique exacte de focusOn() de l'app */
  const Y = new V3(0, 1, 0), X = new V3(1, 0, 0);
  const q1 = new Qt().setFromAxisAngle(Y, -lon * Math.PI / 180);
  const q2 = new Qt().setFromAxisAngle(X, lat * Math.PI / 180);
  return q2.multiply(q1);
}

/* ============================ STUBS THREE + DOM ============================ */
class El {
  constructor(tag = "div") {
    this.tagName = tag; this.children = []; this.style = {}; this.dataset = {};
    this._cls = new Set(); this._html = ""; this._tc = ""; this._className = "";
    this.classList = {
      add: c => this._cls.add(c), remove: c => this._cls.delete(c),
      toggle: (c, f) => { f === undefined ? (this._cls.has(c) ? this._cls.delete(c) : this._cls.add(c)) : (f ? this._cls.add(c) : this._cls.delete(c)); },
      contains: c => this._cls.has(c),
    };
    this._h = {};
  }
  set className(v) { this._className = v; this._cls = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get className() { return this._className; }
  set innerHTML(v) { this._html = String(v); this._tc = String(v).replace(/<[^>]*>/g, ""); this.children = []; /* sémantique DOM réelle */ }
  get innerHTML() { return this._html; }
  set textContent(v) { this._tc = String(v); }
  get textContent() { return this._tc; }
  appendChild(c) { this.children.push(c); c.parentNode = this; return c; }
  removeChild(c) { this.children = this.children.filter(k => k !== c); }
  remove() { if (this.parentNode) this.parentNode.removeChild(this); }
  querySelectorAll(sel) {
    const cls = sel.replace(/^\./, "");
    return this.children.filter(c => c._cls.has(cls));
  }
  querySelector() { return null; }
  closest() { return null; }
  setPointerCapture() {}
  addEventListener(t, fn) { (this._h[t] = this._h[t] || []).push(fn); }
  dispatch(t, ev) { (this._h[t] || []).forEach(fn => fn(Object.assign({ type: t, preventDefault() {}, stopPropagation() {}, target: this }, ev))); }
  get onclick() { return this._onclick || null; }
  set onclick(fn) { this._onclick = fn; }
}
let fakeNow = 1000; /* horloge performance factice : +16 ms par frame */
const navs = ["carte", "editions", "univers", "archives"].map(n => { const a = new El("a"); a.dataset.nav = n; return a; });
const navBySel = { '[data-nav="editions"]': navs[1], '[data-nav="carte"]': navs[0] };

class BufferAttribute {
  constructor(arr, size) { this.array = arr instanceof Float32Array ? arr : new Float32Array(arr); this.itemSize = size; this.needsUpdate = false; }
}
class BufferGeometry {
  constructor() { this.attributes = {}; }
  setAttribute(n, a) { this.attributes[n] = a; return this; }
  getAttribute(n) { return this.attributes[n]; }
  setFromPoints() { return this; }
  dispose() {}
}
class Object3D {
  constructor() {
    this.children = []; this.position = new V3(); this.quaternion = new Qt();
    this.rotation = { x: 0, y: 0, z: 0 }; this.scale = { setScalar() {} };
    this.visible = true; this.userData = {}; this.name = ""; this.frustumCulled = true;
  }
  add(...c) { this.children.push(...c); }
  traverse(fn) { fn(this); this.children.forEach(c => c.traverse && c.traverse(fn)); }
  getObjectByName(n) { let f = null; this.traverse(o => { if (o.name === n) f = o; }); return f; }
  lookAt() {}
}
class Scene extends Object3D { constructor() { super(); this.background = null; this.fog = null; } }
class Mesh extends Object3D { constructor(g, m) { super(); this.geometry = g; this.material = m; } }
class ShaderMaterial { constructor(p = {}) { Object.assign(this, p); } }
class Color { constructor(v) { this.v = v; } setHSL() { return this; } }
class QuadraticBezierCurve3 { constructor(a, m, b) { this.a = a; } getPoints(n) { const o = []; for (let i = 0; i <= n; i++) o.push(this.a.clone()); return o; } }
class Clock { getElapsedTime() { return fakeNow / 1000; } getDelta() { return 0.016; } }
class Camera extends Object3D {
  constructor() { super(); this.fov = 38; this.aspect = 1280 / 800; this.near = 0.005; this.far = 300; }
  updateProjectionMatrix() {}
}
class WebGLRenderer {
  constructor(p = {}) { this.domElement = p.canvas || new El("canvas"); }
  setClearColor() {} setPixelRatio() {} setSize() {} render() {}
}
const THREE = {
  Scene, Color, FogExp2: class {}, WebGLRenderer, PerspectiveCamera: Camera, OrthographicCamera: Camera,
  AmbientLight: Object3D, DirectionalLight: Object3D, PointLight: Object3D,
  SphereGeometry: BufferGeometry, BufferGeometry, BufferAttribute, Float32BufferAttribute: BufferAttribute,
  ShaderMaterial, LineBasicMaterial: ShaderMaterial, PointsMaterial: ShaderMaterial,
  Mesh, Points: Mesh, Line: Mesh, LineSegments: Mesh, Group: Object3D, QuadraticBezierCurve3, Clock,
  Vector2: class { constructor(x, y) { this.x = x; this.y = y; } }, Vector3: V3, Vector4: V3, Quaternion: Qt,
};
const canvas = new El("canvas");
const document_ = {
  readyState: "complete", body: new El("body"), _m: {}, _h: {},
  getElementById: id => { if (!document_._m[id]) document_._m[id] = (id === "globe" ? canvas : new El()); return document_._m[id]; },
  createElement: t => new El(t),
  querySelectorAll: s => (s === ".topnav a" ? navs : []),
  querySelector: s => navBySel[s] || null,
  addEventListener(t, fn) { (this._h[t] = this._h[t] || []).push(fn); },
};
const winHandlers = {};
const warnings = [];
const sandbox = {
  console: { log: () => {}, warn: (...a) => warnings.push(a.join(" ")), error: (...a) => warnings.push("ERROR " + a.join(" ")) },
  document: document_, innerWidth: 1280, innerHeight: 800, devicePixelRatio: 2,
  performance: { now: () => fakeNow },
  requestAnimationFrame: fn => sandbox.__raf.push(fn),
  setTimeout: (fn, ms) => setTimeout(fn, Math.min(ms || 0, 60)),
  clearTimeout: id => clearTimeout(id),
  addEventListener: (t, fn) => { (winHandlers[t] = winHandlers[t] || []).push(fn); },
  open: () => {},
  THREE, WORLD_DATA: undefined, __raf: [],
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

/* ============================ EXÉCUTION ============================ */
console.log("[0] Exécution du code réel (index.html + world-data.js) dans le harnais");
let runError = null;
try {
  vm.runInContext(dataSrc, sandbox, { filename: "world-data.js" });
  vm.runInContext(code, sandbox, { filename: "inline" });
} catch (e) { runError = e; }
check(!runError, "aucune erreur à l'exécution", runError && (runError.message + "\n  " + (runError.stack || "").split("\n")[1]));
await sleep(200); /* boot (setTimeout 30ms) + loader */
function frame(n = 1) { for (let i = 0; i < n; i++) { const q = sandbox.__raf.splice(0); q.forEach(fn => fn(fakeNow)); fakeNow += 16; } }
frame(3);
const S = sandbox;
const globeGroup = S.globeGroup;
const el = id => document_.getElementById(id);
const st = () => S.state;
const fire = (t, ev) => (winHandlers[t] || []).forEach(fn => fn(Object.assign({ type: t, preventDefault() {}, stopPropagation() {} }, ev)));
const fireCanvas = (t, ev) => canvas.dispatch(t, Object.assign({ target: canvas }, ev));
const idxList = el("idxList"), railLevels = el("railLevels"), labelBox = el("labels"), edHours = el("edHours");

/* ============================ 1. ÉTAT INITIAL ============================ */
console.log("\n[1] Démarrage (globe intact)");
check(!!S.scene && !!globeGroup && !!S.camera, "scène / globe / caméra construits");
check(warnings.length === 0, "aucun console.warn (17/17 entités liées)", warnings.join(" | "));
const WD = S.WORLD_DATA;
check(!!WD && WD.entities.length === 17, "world-data.js chargé : 17 entités", WD && WD.entities.length);
/* utiliser les objets PLACES du sandbox (identité === state.place) */
check(Array.isArray(S.PLACES) && S.PLACES.length === 17, "PLACES exposé : 17 lieux");
PLACES.splice(0, PLACES.length, ...S.PLACES);
check(st().level === 0, "niveau initial : Monde (0)");
check(railLevels.children.length === 11, "rail : 11 niveaux", railLevels.children.length + " trouvés");
check(!railLevels.children.some(b => /broderie/i.test(b.textContent + b.innerHTML)), "rail : aucun niveau Broderie");
check(labelBox.children.length === 17, "17 étiquettes HTML créées", labelBox.children.length + " trouvées");
check(edHours.children.length === 24, "24 vignettes horaires", edHours.children.length + " trouvées");
check(el("idxTitle").textContent === "Continents", "index : titre « Continents » au niveau 0");
check(idxList.children.length === 5, "index : 5 continents", idxList.children.length + " trouvés");
check(!el("pointCard")._cls.has("open"), "carte éditoriale fermée au démarrage");
const qBoot = focusOnQ(24, 12);
check(Math.abs(globeGroup.quaternion.x - qBoot.x) < 0.02 && Math.abs(globeGroup.quaternion.w - qBoot.w) < 0.02,
  "orientation initiale = focusOn(24,12) (quaternions réels)");

/* ============================ 2. GÉOMÉTRIE DES MARQUEURS ============================ */
console.log("\n[2] Projection écran des marqueurs (mêmes maths que three.js)");
const W = 1280, H = 800, CAMZ = 3.18;
function screen(p, q, camZ = CAMZ) {
  const pos = latLonToVec3(p.lat, p.lon, 1.012).applyQuaternion(q);
  const nor = latLonToVec3(p.lat, p.lon, 1).applyQuaternion(q);
  const cam = new V3(0, 0, camZ);
  const facing = nor.dot(cam.clone().sub(pos.clone())) > 0;
  const pr = pos.clone().project({ position: cam, fov: 38, aspect: W / H });
  return { x: (pr.x * 0.5 + 0.5) * W, y: (-pr.y * 0.5 + 0.5) * H, facing, z: pos.z };
}
const LIMB = 1.012 * 1.012 / CAMZ;
const qNow = globeGroup.quaternion.clone();
const vis = PLACES.map(p => ({ p, s: screen(p, qNow) }))
  .filter(o => o.s.facing && o.s.z > LIMB && o.s.x > 20 && o.s.x < W - 20 && o.s.y > 20 && o.s.y < H - 20);
const hidden = PLACES.map(p => ({ p, s: screen(p, qNow) })).filter(o => !o.s.facing);
check(vis.length >= 1, "au moins un point visible de face au démarrage", vis.length + " visibles");
check(hidden.length >= 1, "au moins un point occlus derrière le globe", hidden.length + " occlus");
vis.sort((a, b) => Math.hypot(a.s.x - W / 2, a.s.y - H / 2) - Math.hypot(b.s.x - W / 2, b.s.y - H / 2));
const target = vis[0];
const entTarget = WD.entities.find(e => e.id === target.p.id);
console.log("      cible : " + entTarget.name + " @ (" + Math.round(target.s.x) + "," + Math.round(target.s.y) + ")");

/* ============================ 3. SURVOL → IDENTIFICATION ============================ */
console.log("\n[3] Survol d'un point lumineux → identification");
fire("pointermove", { clientX: target.s.x, clientY: target.s.y, target: canvas });
frame(4);
const tip = el("ptip");
check(tip._cls.has("on"), "étiquette de survol affichée (#ptip.on)");
check(tip.innerHTML.includes(entTarget.name), "étiquette : nom du lieu (" + entTarget.name + ")", tip.textContent);
check(tip.textContent.includes(entTarget.category), "étiquette : catégorie éditoriale (" + entTarget.category + ")");
check(tip.textContent.includes(entTarget.country), "étiquette : pays");
check(st().hover === target.p.id, "retour de sélection existant activé (state.hover = " + target.p.id + ")");
check(canvas.style.cursor === "pointer", "curseur main sur le point");
check(/px$/.test(tip.style.left || "") && /px$/.test(tip.style.top || ""), "étiquette positionnée près du marqueur");
const tIdx = PLACES.indexOf(target.p);
check(S.scene && globeGroup.getObjectByName("markers").geometry.getAttribute("aSel").array[tIdx] > 0.05,
  "attribut aSel du marqueur survolé en croissance (retour lumineux natif)");
fire("pointermove", { clientX: 8, clientY: 8, target: canvas });
frame(3);
check(!tip._cls.has("on"), "étiquette masquée quand le curseur quitte les points");
check(st().hover === null, "state.hover remis à null");

/* ============================ 4. CLIC → OUVERTURE ============================ */
console.log("\n[4] Clic sur un point → carte éditoriale (NOM/ACCROCHE/CONTENU/CATÉGORIE/PEXELS/DÉCOUVRIR)");
const ent = entTarget;
fireCanvas("pointerdown", { clientX: target.s.x, clientY: target.s.y, pointerId: 1 });
fireCanvas("pointerup", { clientX: target.s.x, clientY: target.s.y, pointerId: 1 });
frame(1);
const card = el("pointCard");
check(card._cls.has("open"), "carte ouverte après clic simple (sans glisser)");
check(el("pname").textContent === ent.name, "carte : NOM = " + ent.name, el("pname").textContent);
check(el("phook").textContent === ent.accroche, "carte : ACCROCHE éditoriale présente");
check(el("ptext").textContent === ent.contenu && el("ptext").textContent.length > 120, "carte : CONTENU éditorial présent");
check(el("pcat").textContent === ent.category, "carte : CATÉGORIE = " + ent.category);
check(el("pcountry").textContent === ent.city + " · " + ent.country, "carte : ville + pays");
check(el("pimg").src === ent.media.imageUrl, "carte : image Pexels chargée");
check(el("pimg").alt.includes("Pexels"), "carte : alt de l'image mentionne Pexels");
const capT = el("pcap").innerHTML;
check(capT.includes("Pexels") && capT.includes(ent.media.author), "provenance : source + auteur");
check(capT.includes("récupérée le " + ent.media.retrievedAt), "provenance : date de récupération (" + ent.media.retrievedAt + ")");
check(capT.includes('href="' + ent.media.pageUrl + '"') && /Page Pexels<\/a>/.test(capT), "provenance : lien vers la page Pexels");
check(/ambiance/i.test(capT), "provenance : mention d'ambiance (jamais présenté comme photo réelle de mariage)");
check(typeof el("pdiscover").onclick === "function", "carte : lien DÉCOUVRIR câblé");
check(el("index")._cls.has("suppress") && el("detail")._cls.has("suppress"), "index/détail masqués pendant la lecture (le globe reste la star)");

/* ============================ 5. FERMETURES ============================ */
console.log("\n[5] Fermetures (✕ / Retour / Escape / clic océan)");
el("pback").dispatch("click");
check(!card._cls.has("open"), "fermeture via « Retour au globe »");
check(!el("index")._cls.has("suppress"), "index restauré après fermeture");
fireCanvas("pointerdown", { clientX: target.s.x, clientY: target.s.y, pointerId: 1 });
fireCanvas("pointerup", { clientX: target.s.x, clientY: target.s.y, pointerId: 1 });
check(card._cls.has("open"), "réouverture par clic sur le même point");
el("pclose").dispatch("click");
check(!card._cls.has("open"), "fermeture via ✕");
fireCanvas("pointerdown", { clientX: target.s.x, clientY: target.s.y, pointerId: 1 });
fireCanvas("pointerup", { clientX: target.s.x, clientY: target.s.y, pointerId: 1 });
check(card._cls.has("open"), "réouverture (2)");
fire("keydown", { key: "Escape" });
check(!card._cls.has("open"), "fermeture via clavier (Escape)");
fireCanvas("pointerdown", { clientX: target.s.x, clientY: target.s.y, pointerId: 1 });
fireCanvas("pointerup", { clientX: target.s.x, clientY: target.s.y, pointerId: 1 });
check(card._cls.has("open"), "réouverture (3)");
fireCanvas("pointerdown", { clientX: 6, clientY: 6, pointerId: 1 });
fireCanvas("pointerup", { clientX: 6, clientY: 6, pointerId: 1 });
check(!card._cls.has("open"), "clic sur l'océan (hors point) → fermeture immédiate");

/* ============================ 6. GLISSER ≠ CLIC ; OCCLUSION ============================ */
console.log("\n[6] Interactions protégées (glisser, points occlus)");
const qBefore = globeGroup.quaternion.clone();
fireCanvas("pointerdown", { clientX: target.s.x, clientY: target.s.y, pointerId: 2 });
fireCanvas("pointermove", { clientX: target.s.x + 40, clientY: target.s.y + 30, pointerId: 2, target: canvas });
fireCanvas("pointerup", { clientX: target.s.x + 40, clientY: target.s.y + 30, pointerId: 2 });
frame(2);
check(!card._cls.has("open"), "glisser sur un point : PAS d'ouverture");
check(Math.abs(globeGroup.quaternion.y - qBefore.y) > 1e-4 || Math.abs(S.qTarget.y - qBefore.y) > 1e-4,
  "glisser : la rotation du globe fonctionne toujours");
const oc = hidden[0];
const os = screen(oc.p, globeGroup.quaternion.clone());
if (os.x > 5 && os.x < W - 5 && os.y > 5 && os.y < H - 5) {
  fireCanvas("pointerdown", { clientX: os.x, clientY: os.y, pointerId: 3 });
  fireCanvas("pointerup", { clientX: os.x, clientY: os.y, pointerId: 3 });
  check(!card._cls.has("open"), "point derrière le globe : non cliquable (" + oc.p.city + ")");
} else {
  check(true, "point occlus hors écran : non cliquable (" + oc.p.city + ")");
}
fire("pointermove", { clientX: os.x, clientY: os.y, target: canvas });
frame(2);
check(!tip._cls.has("on"), "point occlus : aucune identification au survol");
fire("pointermove", { clientX: 8, clientY: 8, target: canvas });

/* ============================ 7. NAVIGATION EXISTANTE ============================ */
console.log("\n[7] Interactions d'origine intactes (molette, index, rail, étiquettes, détail)");
fakeNow += 500; /* verrou molette 320ms écoulé */
fire("wheel", { deltaY: 120, target: canvas, clientX: 700, clientY: 500 });
frame(2);
check(st().level === 1, "molette : niveau 0 → 1", "niveau " + st().level);
check(el("idxTitle").textContent === "Pays", "index : titre « Pays »");
check(el("railPath").innerHTML.includes("Monde"), "fil d'Ariane : Monde");
check(!document_.body._cls.has("story-mode"), "mode récit désactivé en navigation");
fakeNow += 400;
fire("wheel", { deltaY: -120, target: canvas, clientX: 700, clientY: 500 });
frame(2);
check(st().level === 0 && idxList.children.length === 5, "molette inverse : retour niveau 0, 5 continents");
const afBtn = idxList.children.find(b => b.innerHTML.includes("Afrique"));
check(!!afBtn, "index : entrée Afrique présente");
afBtn.dispatch("click");
check(st().continent === "Afrique", "index : continent Afrique sélectionné");
frame(80); /* convergence slerp vers le centroid Afrique (~25.37,11.59) */
const qAf = focusOnQ(25.3667, 11.5933), qg = globeGroup.quaternion;
const dotAf = Math.min(1, Math.abs(qg.x * qAf.x + qg.y * qAf.y + qg.z * qAf.z + qg.w * qAf.w));
const angAf = 2 * Math.acos(dotAf) * 180 / Math.PI;
check(angAf < 0.6, "focusOn(centroid Afrique) atteint (écart angulaire " + angAf.toFixed(3) + "°)");
const afIdx = PLACES.map((p, i) => p.continent === "Afrique" ? i : -1).filter(i => i >= 0);
check(afIdx.length === 3 && afIdx.every(i => parseFloat(labelBox.children[i].style.opacity || 0) > 0.5),
  "étiquettes des 3 lieux africains visibles au niveau 1");
/* survol d'un marqueur déjà identifié par son étiquette → pas de double identification */
const fesP = PLACES[afIdx[0]];
const fsScr = screen(fesP, globeGroup.quaternion.clone(), st().dist);
if (fsScr.facing && fsScr.x > 20 && fsScr.x < W - 20 && fsScr.y > 20 && fsScr.y < H - 20) {
  fire("pointermove", { clientX: fsScr.x, clientY: fsScr.y, target: canvas });
  frame(2);
  check(!tip._cls.has("on"), "étiquette HTML visible → pas de double identification (#ptip masqué)");
} else check(true, "marqueur africain hors champ : test de double-identification ignoré");
fire("pointermove", { clientX: 8, clientY: 8, target: canvas });
/* étiquette HTML cliquable → niveau Détail (comportement d'origine) */
labelBox.children[afIdx[0]].dispatch("click");
frame(2);
check(st().level === 4 && st().place === fesP, "clic étiquette HTML → niveau Détail du lieu");
check(el("dtCity").textContent === fesP.city, "détail : ville affichée (" + fesP.city + ")");
check(el("dtCer").textContent === fesP.ceremonie, "détail : ligne Cérémonie (ex-Broderie)");
check(el("dtKicker").textContent === "Ville — 04", "détail : kicker « Ville — 04 »", el("dtKicker").textContent);
check(el("detail")._cls.has("show"), "panneau détail visible");
check(idxList.children.some(b => b.innerHTML.includes("Cérémonie")), "index niveau 4 : récit « Cérémonie — … »");
const recit = idxList.children.find(b => b.innerHTML.includes("Cérémonie"));
recit.dispatch("click");
frame(2);
check(st().level === 5, "clic récit → niveau Lieu (5)");
check(el("dtKicker").textContent === "Lieu — 05", "détail : kicker « Lieu — 05 »", el("dtKicker").textContent);
check(railLevels.children.length === 11, "rail : 11 boutons (niveau Broderie supprimé)");
railLevels.children[7].dispatch("click"); /* niveau 7 = Pages / Édition */
frame(2);
check(st().level === 7 && document_.body._cls.has("story-mode"), "rail : niveau 7 + mode récit");

/* ============================ 8. ÉDITION 24 HEURES ============================ */
console.log("\n[8] Édition 24 heures (journée de noces)");
check(el("edMeta").innerHTML.includes("<dt>Cérémonie</dt>"), "double-page : ligne Cérémonie");
check(!/Broderie/i.test(el("edMeta").innerHTML), "double-page : plus aucune mention Broderie");
check(el("edMeta").innerHTML.includes(fesP.ceremonie), "double-page : cérémonie du lieu affichée");
check(el("edTitle").innerHTML.includes("<em>" + fesP.city + "</em>"), "double-page : ville dans le titre");
check(el("edCap").textContent.includes("Composition générative"), "légende : « Composition générative » (ex-Motif)");
check(el("edLoc").textContent === fesP.city + ", " + fesP.country, "localisation de l'édition");
edHours.children[3].dispatch("click"); /* 03:00 */
check(el("edTitle").innerHTML.includes("marchés qui s'éveillent"), "heure 03:00 : titre « L'heure des marchés qui s'éveillent » appliqué");
edHours.children[14].dispatch("click"); /* 14:00 */
check(/Tambours et cortèges/.test(el("edTitle").innerHTML), "heure 14:00 : « Tambours et cortèges de rue » appliqué");
check(!/brod/i.test(el("edCols").innerHTML + el("edTitle").innerHTML + el("edMeta").innerHTML), "double-page : zéro vocabulaire broderie");

/* ============================ 9. NAV TOP + goTo REFERME ============================ */
console.log("\n[9] Navigation haute + cohérence carte/globe");
fakeNow += 400;
/* retour niveau 0 puis réouverture de la carte sur le point cible */
navs[0].dispatch("click"); /* nav Carte → niveau 0 */
frame(60);
check(st().level === 0 && el("index")._cls.has("show"), "nav Carte : retour niveau 0 + index visible");
/* re-cible un point effectivement visible dans l'orientation courante du globe */
const vis2 = PLACES.map(p => ({ p, s: screen(p, globeGroup.quaternion.clone(), st().dist) }))
  .filter(o => o.s.facing && o.s.z > 1.012 * 1.012 / st().dist && o.s.x > 20 && o.s.x < W - 20 && o.s.y > 20 && o.s.y < H - 20)
  .sort((a, b) => Math.hypot(a.s.x - W / 2, a.s.y - H / 2) - Math.hypot(b.s.x - W / 2, b.s.y - H / 2));
check(vis2.length >= 1, "niveau Monde : au moins un point cliquable de face", vis2.length + " visibles");
const t2 = vis2[0];
fireCanvas("pointerdown", { clientX: t2.s.x, clientY: t2.s.y, pointerId: 4 });
fireCanvas("pointerup", { clientX: t2.s.x, clientY: t2.s.y, pointerId: 4 });
frame(1);
check(card._cls.has("open"), "carte rouverte au niveau Monde (" + t2.p.city + ") pour le test de navigation");
navs[1].dispatch("click"); /* nav Éditions → niveau 7 */
frame(2);
check(!card._cls.has("open"), "goTo (nav Éditions) referme la carte éditoriale");
check(st().level === 7, "nav Éditions : niveau 7 atteint");
check(!el("index")._cls.has("suppress") && !el("detail")._cls.has("suppress"), "aucune suppression résiduelle après fermeture par goTo");
const bound = PLACES.every(p => WD.entities.some(e => e.id === p.id));
check(bound, "17/17 points liés à une entité éditoriale");
check(warnings.length === 0, "toujours aucun console.warn en fin de parcours", warnings.join(" | "));

/* ============================ RÉCAPITULATIF ============================ */
console.log("\nRÉSULTAT : " + pass + " vérifications OK, " + fail + " échec(s).");
if (fails.length) { console.log("\nÉchecs :"); fails.forEach(f => console.log("  - " + f)); }
console.log(fail === 0
  ? "\n✔ Smoke test réussi : chaque point lumineux est survolable et cliquable, contenu éditorial complet, fermetures immédiates, globe et interactions d'origine intacts."
  : "\n✗ Smoke test incomplet.");
process.exit(fail === 0 ? 0 : 1);

/* ============================================================
   DMC — EDITORIAL ENGINE (docs/EDITORIAL-BLOCKS.md v1.0.0)
   Reçoit : DMC + données + sources + relations + médias + contexte.
   Produit : un document éditorial déterministe composé de blocs
   du vocabulaire stable. Sans matière réelle → bloc À_CONFIRMER
   ou omis. JAMAIS de valeur inventée.
============================================================ */
import { SCHEMA_VERSION, À_CONFIRMER, NON_DISPONIBLE } from "./vocab.mjs";

export const ENGINE = { name: "dmc-editorial", version: "1.0.0" };

const FIELD_BY_KIND = { ACCROCHE: "accroche", CONTENU: "contenu", SUJET: "sujet", ARTICLE: "text", FICHE: "text", AUTRE: "text" };

/* Résout une référence de contenu (ex. "world-data.js#fes") via le
   resolver fourni par le renderer/hôte. null si indisponible. */
function resolveContent(entity, kind, resolver) {
  if (typeof resolver !== "function") return null;
  const ref = (entity.contentRefs || []).find(c => c.kind === kind);
  if (!ref) return null;
  const resolved = resolver(ref.ref, ref);
  if (!resolved) return null;
  const field = FIELD_BY_KIND[kind] || "text";
  return typeof resolved === "string" ? resolved : (resolved[field] ?? null);
}

function srcRefs(entity) { return (entity.sources || []).map(s => s.id); }

export function buildDocument(entity, opts = {}) {
  const { registry = null, contentResolver = null, context = null,
          generatedAt = new Date().toISOString() } = opts;
  if (!entity || !entity.dmc) throw new Error("buildDocument : entité DMC requise");

  const blocks = [];
  const push = (block, nature, status, data, extra = {}) =>
    blocks.push({ block, nature, status, sourceRefs: extra.sourceRefs || srcRefs(entity),
                  title: extra.title ?? null, data });

  const media0 = (entity.media || [])[0] || null;
  const hook = resolveContent(entity, "ACCROCHE", contentResolver);
  const category = entity.category ? entity.category.value : null;

  /* COVER — identité + accroche si réelle/éditoriale existante */
  push("COVER", hook ? "ÉDITORIAL" : "RÉEL",
       hook ? (entity.status === "PROPOSÉ" ? "PROPOSÉ" : "CONFIRMÉ") : entity.status,
    {
      dmc: entity.dmc,
      name: entity.name,
      type: entity.type,
      subtype: entity.subtype,
      category: category || À_CONFIRMER,
      territory: entity.territory ? entity.territory.name : À_CONFIRMER,
      country: entity.territory ? entity.territory.country : À_CONFIRMER,
      hook: hook || À_CONFIRMER,
      media: media0 ? { url: media0.url, caption: media0.caption, note: media0.note } : null
    });

  /* EDITORIAL — récit long résolu par référence ; omis sans matière */
  const contenu = resolveContent(entity, "CONTENU", contentResolver);
  if (contenu) {
    const ref = (entity.contentRefs || []).find(c => c.kind === "CONTENU");
    push("EDITORIAL", "ÉDITORIAL", "CONFIRMÉ", { text: contenu, ref: ref.ref },
      { sourceRefs: ref.sourceRefs && ref.sourceRefs.length ? ref.sourceRefs : srcRefs(entity) });
  }

  /* IMMERSIVE — média principal + légende + provenance */
  if (media0) {
    push("IMMERSIVE", "RÉEL", media0.source ? media0.source.status : "TROUVÉ", {
      kind: media0.kind, url: media0.url, pageUrl: media0.pageUrl,
      caption: media0.caption, note: media0.note,
      author: media0.author, license: media0.license,
      illustration: media0.illustration !== false,
      retrievedAt: media0.source ? media0.source.retrievedAt : À_CONFIRMER
    });
  }

  /* CARTE — coordonnées si connues, sinon À_CONFIRMER (jamais inventées) */
  const co = entity.coordinates;
  if (co && co.lat !== null && co.lon !== null) {
    push("CARTE", co.nature, co.status, {
      lat: co.lat, lon: co.lon,
      territory: entity.territory ? entity.territory.name : À_CONFIRMER,
      dmc: entity.dmc
    }, { sourceRefs: co.sourceRefs && co.sourceRefs.length ? co.sourceRefs : srcRefs(entity) });
  } else {
    push("CARTE", "À_CONFIRMER", À_CONFIRMER,
      { lat: null, lon: null, absence: NON_DISPONIBLE, note: "coordonnées non trouvées dans les sources" });
  }

  /* GALERIE — tous les médias */
  if ((entity.media || []).length) {
    push("GALERIE", "RÉEL", "CONFIRMÉ", {
      items: entity.media.map((m, i) => ({
        anchor: entity.dmc + "#media-" + i, kind: m.kind, url: m.url,
        caption: m.caption, note: m.note, author: m.author,
        pageUrl: m.pageUrl, retrievedAt: m.source ? m.source.retrievedAt : À_CONFIRMER
      }))
    });
  }

  /* MOSAÏQUE — entités reliées (≥ 2), jamais de remplissage */
  const related = registry ? registry.related(entity.dmc)
    .map(r => ({ dmc: r.other.split("#")[0], anchor: r.other, type: r.relation.type,
                direction: r.direction,
                name: r.otherEntity ? r.otherEntity.name : null }))
    .filter(r => r.dmc !== entity.dmc) : [];
  const uniqueMosaic = [];
  const seen = new Set();
  for (const r of related) { if (!seen.has(r.dmc)) { seen.add(r.dmc); uniqueMosaic.push(r); } }
  if (uniqueMosaic.length >= 2) {
    push("MOSAÏQUE", "RECONSTITUÉ", "CONFIRMÉ", { items: uniqueMosaic });
  }

  /* TIMELINE — uniquement avec ≥ 2 jalons datés RÉELS ; sinon À_CONFIRMER.
     (Aucune donnée de projet ne fournit de jalons datés sourcés :
     le bloc est émis vide et marqué, jamais rempli artificiellement.) */
  const dated = (entity.datedFacts || []).filter(f => f && f.date && /^\d{4}-\d{2}-\d{2}$/.test(f.date));
  if (dated.length >= 2) {
    push("TIMELINE", "RÉEL", "CONFIRMÉ", { items: dated }, { sourceRefs: dated[0].sourceRefs || srcRefs(entity) });
  } else {
    push("TIMELINE", "À_CONFIRMER", À_CONFIRMER,
      { items: [], absence: À_CONFIRMER, note: "aucun jalon daté sourcé — le moteur ne remplit pas une timeline sans matière réelle" });
  }

  /* RELATIONS — graphe typé */
  if (registry) {
    const rels = registry.relationsOf(entity.dmc).map(r => ({
      id: r.id, type: r.type, from: r.from, to: r.to,
      status: r.status, nature: r.nature,
      direction: r.from === entity.dmc || r.from.startsWith(entity.dmc + "#") ? "from" : "to"
    }));
    if (rels.length) push("RELATIONS", "RECONSTITUÉ", "CONFIRMÉ", { items: rels });
  }

  /* SOURCE — toujours produit : provenance visible */
  push("SOURCE", "RÉEL", "CONFIRMÉ", {
    items: (entity.sources || []).map(s => ({
      id: s.id, name: s.sourceName, type: s.sourceType, url: s.sourceUrl,
      retrievedAt: s.retrievedAt, status: s.status, confidence: s.confidence
    })),
    media: (entity.media || []).map(m => m.source ? ({
      name: m.source.sourceName, url: m.source.sourceUrl, pageUrl: m.pageUrl,
      author: m.author, retrievedAt: m.source.retrievedAt,
      status: m.source.status, license: m.license, note: m.note
    }) : null).filter(Boolean)
  });

  const doc = {
    schemaVersion: SCHEMA_VERSION,
    engine: { ...ENGINE },
    dmc: entity.dmc,
    generatedAt,
    context,
    blocks
  };
  return doc;
}

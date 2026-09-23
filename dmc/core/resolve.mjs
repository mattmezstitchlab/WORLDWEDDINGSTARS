/* ============================================================
   DMC — RÉSOLUTION D'ENTITÉS (anti-doublons)
   Avant toute création : recherche d'une entité existante.
     1. externalIds (même clef + valeur)         → réutilisation
     2. nom normalisé + territoire + type        → réutilisation
     3. alias normalisé + territoire + type      → réutilisation
     4. nom normalisé + type, territoires différents
        et tous deux connus                     → REVIEW (jamais de
                                                   fusion automatique)
     5. sinon                                    → création (DMC
                                                   alloué + provenance)
   Objectif absolu : PAS DE DOUBLONS INUTILES — et jamais de
   fusion erronée non plus.
============================================================ */
import { normalizeName, stripAccents } from "./normalize.mjs";

function terrKey(e) {
  if (!e.territory) return null;
  return (e.territory.countryCode || "") + "|" +
         stripAccents(e.territory.name || "").toLowerCase();
}

export function findExisting(registry, candidate) {
  /* 1. identifiants externes */
  for (const [k, v] of Object.entries(candidate.externalIds || {})) {
    const hits = registry.byExternalId(k, v);
    if (hits.length) return { action: "reuse", entity: hits[0], score: 1, via: "externalId:" + k };
  }
  const n = normalizeName(candidate.name || "");
  if (!n) return { action: "create", entity: null, score: 0, via: "no-name" };
  const ct = terrKey(candidate);

  /* 2. nom + territoire + type */
  for (const e of registry.all()) {
    if (candidate.type && e.type !== candidate.type) continue;
    if (normalizeName(e.name) === n && ct && terrKey(e) === ct) {
      return { action: "reuse", entity: e, score: 0.95, via: "name+territory+type" };
    }
  }
  /* 3. alias + territoire + type */
  for (const e of registry.all()) {
    if (candidate.type && e.type !== candidate.type) continue;
    const aliasHit = (e.aliases || []).some(a => normalizeName(a) === n) ||
                     (candidate.aliases || []).some(a => registry.all().some(x => x === e && normalizeName(x.name) === normalizeName(a)));
    if (aliasHit && ct && terrKey(e) === ct) {
      return { action: "reuse", entity: e, score: 0.85, via: "alias+territory+type" };
    }
  }
  /* 4. même nom+type, territoires connus et différents → revue humaine */
  for (const e of registry.all()) {
    if (candidate.type && e.type !== candidate.type) continue;
    if (normalizeName(e.name) === n && ct && terrKey(e) && terrKey(e) !== ct) {
      return { action: "review", entity: e, score: 0.5, via: "name+type, territoires différents" };
    }
  }
  return { action: "create", entity: null, score: 0, via: "aucune correspondance" };
}

/* Résout ou crée. `allocator` (CodeAllocator) requis pour la création ;
   `create` construit l'entité complète à partir du candidat + DMC. */
export function resolveOrCreate(registry, candidate, { allocator, create, autoReview = false } = {}) {
  const found = findExisting(registry, candidate);
  if (found.action === "reuse") {
    return { action: "reuse", dmc: found.entity.dmc, entity: found.entity,
             score: found.score, via: found.via, created: false };
  }
  if (found.action === "review" && !autoReview) {
    return { action: "review", dmc: found.entity.dmc, entity: found.entity,
             score: found.score, via: found.via, created: false,
             note: "homonyme potentiel — aucune fusion/création automatique" };
  }
  if (typeof create !== "function") throw new Error("resolveOrCreate : fonction `create` requise pour une nouvelle entité");
  const terrName = (candidate.territory && candidate.territory.name) || candidate.name;
  const cc = (candidate.territory && candidate.territory.countryCode) || "XX";
  const dmc = allocator.allocate(cc, terrName);
  const entity = create(candidate, dmc);
  registry.add(entity);
  return { action: "create", dmc, entity, score: 0, via: "nouvelle entité", created: true };
}

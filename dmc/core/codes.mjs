/* ============================================================
   DMC — CODES D'IDENTITÉ (docs/DMC-CODE.md v1.0.0)
   DMC-<PAYS ISO-2>-<TERRITOIRE 3L>-<SÉQUENCE 6 chiffres>
   Règles : immuable, jamais réattribué, préfixe territorial
   unique enregistré dans territories.json, séquence croissante.
============================================================ */
import { stripAccents } from "./normalize.mjs";

export const DMC_RE = /^DMC-[A-Z]{2}-[A-Z]{3}-\d{6}$/;

export function isValidDmc(s) {
  return typeof s === "string" && DMC_RE.test(s);
}

export function parseDmc(dmc) {
  if (!isValidDmc(dmc)) throw new Error("Code DMC invalide : " + JSON.stringify(dmc));
  const [, countryCode, territory, seq] = dmc.match(/^DMC-([A-Z]{2})-([A-Z]{3})-(\d{6})$/);
  return { countryCode, territory, seq: parseInt(seq, 10) };
}

export function makeDmc(countryCode, territoryPrefix, seq) {
  const dmc = "DMC-" + String(countryCode).toUpperCase() + "-" +
              String(territoryPrefix).toUpperCase() + "-" +
              String(seq).padStart(6, "0");
  if (!isValidDmc(dmc)) throw new Error("Construction DMC invalide : " + dmc);
  return dmc;
}

const ARTICLES = /^(le|la|les|l'|el|al|the|a|an|der|die|das|il|lo)\s+/i;

/* Préfixe territorial : 3 lettres, déterministe (décision D7).
   Articles retirés, accents supprimés, non-lettres ignorées.
   Moins de 3 lettres → complété par « X ». */
export function territoryPrefix(name) {
  if (typeof name !== "string" || !name.trim()) throw new Error("Nom de territoire requis pour le préfixe");
  let s = stripAccents(name.trim()).replace(ARTICLES, "").replace(/[^A-Za-z]/g, "").toUpperCase();
  if (!s) throw new Error("Préfixe territorial impossible à dériver de : " + name);
  while (s.length < 3) s += "X";
  return s.slice(0, 3);
}

/* Allocateur de codes adossé au registre des territoires.
   territories : { prefixes: { "FES": { countryCode, territory, allocated } } }
   - même pays+même préfixe → séquence suivante ;
   - collision de préfixe entre pays/territoires différents →
     suffixage déterministe : 2 lettres + lettre supplémentaire
     (X, Y, Z, Q… — ex. BRU → BRX), documenté dans le registre ;
   - un code attribué n'est jamais réattribué. */
export class CodeAllocator {
  constructor(territories) {
    this.territories = territories && territories.prefixes ? territories : { prefixes: {} };
  }

  _findSlot(countryCode, name) {
    const base = territoryPrefix(name);
    const b2 = base.slice(0, 2);
    const candidates = [base].concat(["X", "Y", "Z", "Q", "K", "W", "V", "J", "B", "C"].map(s => b2 + s));
    for (const c of candidates) {
      const slot = this.territories.prefixes[c];
      if (!slot) return { prefix: c, slot: null };
      if (slot.countryCode === countryCode &&
          stripAccents(slot.territory).toLowerCase() === stripAccents(name).toLowerCase()) {
        return { prefix: c, slot };
      }
    }
    throw new Error("Saturation des préfixes pour " + name + " (" + countryCode + ")");
  }

  /* Alloue le prochain DMC pour (pays, territoire). Enregistre le slot. */
  allocate(countryCode, territoryName) {
    const cc = /^[A-Z]{2}$/.test(countryCode || "") ? countryCode : "XX"; /* pays inconnu → À CONFIRMER */
    const { prefix, slot } = this._findSlot(cc, territoryName);
    const entry = slot || (this.territories.prefixes[prefix] = {
      countryCode: cc, territory: territoryName, allocated: 0
    });
    entry.allocated += 1;
    return makeDmc(cc, prefix, entry.allocated);
  }

  /* Réserve un code précis (import/migration) ; idempotent par DMC. */
  reserve(dmc, territoryName) {
    const p = parseDmc(dmc);
    const slot = this.territories.prefixes[p.territory];
    if (!slot) {
      this.territories.prefixes[p.territory] = {
        countryCode: p.countryCode, territory: territoryName || p.territory, allocated: p.seq
      };
    } else if (slot.countryCode !== p.countryCode) {
      throw new Error("Préfixe " + p.territory + " déjà attribué à " + slot.countryCode);
    } else if (p.seq > slot.allocated) {
      slot.allocated = p.seq;
    }
    return dmc;
  }
}

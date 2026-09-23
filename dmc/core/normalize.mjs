/* ============================================================
   DMC — NORMALISATION (jamais destructrice)
   ------------------------------------------------------------
   1. Normalisation d'identité (pour la résolution) : minuscules,
      accents retirés, articles et ponctuation ignorés. Le nom
      d'affichage n'est JAMAIS remplacé par sa forme normalisée.
   2. Typologies canoniques : « musée », « centre culturel »,
      « galerie », « lieu culturel »… → vocabulaire commun, avec
      originalTerm + originalVocabulary toujours conservés.
   3. Catégories éditoriales : alias → canonique (même règle).
============================================================ */

export function stripAccents(s) {
  return String(s == null ? "" : s).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const ARTICLES = /^(le|la|les|l'|l|el|al|the|a|an|der|die|das|il|lo|de|des|du|d'|d)\s+/i;

/* Forme d'identité : « Le Caire » → « caire », « Fès » → « fes » */
export function normalizeName(s) {
  let v = stripAccents(s).toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .replace(/['’-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  let prev = null;
  while (prev !== v) { prev = v; v = v.replace(ARTICLES, "").trim(); }
  return v;
}

/* Typologies canoniques — vocabulaire commun.
   Termes en minuscules sans accents ; correspondance exacte ou
   contenue (mot à mot) selon `match`. Rien n'est deviné : un terme
   inconnu renvoie null et l'appelant marque À_CONFIRMER. */
export const TYPOLOGIES = {
  MUSEE:               { terms: ["musée", "musee", "museum", "musées"], label: "Musée" },
  GALERIE:             { terms: ["galerie", "galerie d'art", "gallery"], label: "Galerie" },
  CENTRE_CULTUREL:     { terms: ["centre culturel", "center culturel", "cultural center", "cultural centre", "centre d'art", "maison de la culture"], label: "Centre culturel" },
  LIEU_CULTUREL:       { terms: ["lieu culturel", "espace culturel", "cultural venue", "friche culturelle"], label: "Lieu culturel" },
  MONUMENT:            { terms: ["monument", "site classé", "patrimoine mondial", "unesco"], label: "Monument / site classé" },
  EDIFICE_RELIGIEUX:   { terms: ["église", "cathédrale", "mosquée", "temple", "synagogue", "basilique", "sanctuaire", "pagode"], label: "Édifice religieux" },
  QUARTIER_HISTORIQUE: { terms: ["médina", "medina", "vieille ville", "quartier historique", "centre historique", "old town"], label: "Quartier historique" },
  MARCHE:              { terms: ["marché", "marche", "souk", "market", "bazar"], label: "Marché" },
  RESTAURANT:          { terms: ["restaurant", "table", "gastronomie", "canteen", "restaurant gastronomique"], label: "Restaurant" },
  HEBERGEMENT:         { terms: ["hôtel", "hotel", "riad", "auberge", "hébergement", "gîte", "hôtel particulier"], label: "Hébergement" },
  ESPACE_NATUREL:      { terms: ["parc", "jardin", "plage", "montagne", "désert", "lac", "vignoble", "volcan", "espace naturel", "réserve"], label: "Espace naturel" },
  LIEU_DE_CEREMONIE:   { terms: ["lieu de cérémonie", "salle de mariage", "wedding venue", "lieu de réception"], label: "Lieu de cérémonie" },
  SALLE_DE_RECEPTION:  { terms: ["salle de réception", "salle des fêtes", "réception", "banquet hall"], label: "Salle de réception" },
  STUDIO_ARTISTIQUE:   { terms: ["studio", "atelier d'artiste", "école d'art", "résidence d'artiste"], label: "Studio artistique" },
  VILLE:               { terms: ["ville", "commune", "city", "municipalité", "métropole"], label: "Ville" },
  VILLAGE:             { terms: ["village", "bourg", "hameau"], label: "Village" }
};

/* Retourne { canonical, label, originalTerm, originalVocabulary } ou null.
   Le vocabulaire d'origine est TOUJOURS conservé. */
export function canonicalTypology(term, vocabulary = null) {
  if (typeof term !== "string" || !term.trim()) return null;
  const t = stripAccents(term.trim().toLowerCase());
  for (const [canonical, def] of Object.entries(TYPOLOGIES)) {
    for (const cand of def.terms) {
      const c = stripAccents(cand.toLowerCase());
      if (t === c || t.split(/[\s,;–—|]+/).includes(c) || c.split(" ").every(w => t.split(/[\s,;–—|]+/).includes(w))) {
        return { canonical, label: def.label, originalTerm: term, originalVocabulary: vocabulary };
      }
    }
  }
  return null; /* inconnu → l'appelant marque À_CONFIRMER, jamais de devinette */
}

/* Catégories éditoriales du projet (world-data.js) + alias fréquents */
export const CATEGORIES = {
  DESTINATION:  { terms: ["destination", "destination mariage", "wedding destination"], label: "Destination" },
  PATRIMOINE:   { terms: ["patrimoine", "heritage", "patrimoine mondial"], label: "Patrimoine" },
  CULTURE:      { terms: ["culture", "culturel", "traditions culturelles"], label: "Culture" },
  TRADITION:    { terms: ["tradition", "traditions", "cérémonie traditionnelle", "rituel"], label: "Tradition" },
  ROMANCE:      { terms: ["romance", "romantique", "ville romantique"], label: "Romance" },
  GASTRONOMIE:  { terms: ["gastronomie", "gastronomy", "festin", "cuisine"], label: "Gastronomie" },
  HONEYMOON:    { terms: ["honeymoon", "lune de miel", "voyage de noces"], label: "Lune de miel" },
  INSOLITE:     { terms: ["insolite", "hors des sentiers", "unusual"], label: "Insolite" }
};

export function canonicalCategory(term) {
  if (typeof term !== "string" || !term.trim()) return null;
  const t = stripAccents(term.trim().toLowerCase());
  for (const [canonical, def] of Object.entries(CATEGORIES)) {
    if (def.terms.some(c => stripAccents(c.toLowerCase()) === t)) {
      return { canonical, label: def.label, originalTerm: term };
    }
  }
  return null;
}

/* Normalisation de dates repérées dans du texte absorbé :
   ne transforme que ce qui est sans ambiguïté, sinon null
   (l'appelant marque À_CONFIRMER — jamais de devinette). */
export function normalizeDate(text) {
  if (typeof text !== "string") return null;
  const iso = text.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];
  const fr = text.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (fr) {
    const a = parseInt(fr[1], 10), b = parseInt(fr[2], 10);
    /* convention jj/mm uniquement si non ambiguë ; mm/jj n'est pas deviné */
    if (a > 12 && b <= 12) return fr[3] + "-" + String(b).padStart(2, "0") + "-" + String(a).padStart(2, "0");
    return null; /* 01/02/2024 : ambigu → À_CONFIRMER */
  }
  return null;
}

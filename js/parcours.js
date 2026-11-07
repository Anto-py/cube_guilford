/**
 * Règles du parcours, sans dépendance à la scène ni au DOM.
 */

export function peutAvancer(etat, derniereEtape) {
  if (etat.mode === 'libre') return false;
  if (etat.etape >= derniereEtape) return false;
  if (etat.etape === 3) {
    return Boolean(etat.fonction && etat.proposition && etat.proposition.validee);
  }
  return true;
}

export function idsTranche(cases, axe, valeur) {
  const ids = new Set();
  for (const c of cases) {
    if (c[axe] === valeur) ids.add(c.id);
  }
  return ids;
}

export function idsProposition(etat, cases) {
  const proposition = etat.proposition;
  if (!proposition) return new Set();
  if (proposition.type === 'case' && proposition.id) return new Set([proposition.id]);
  if (proposition.type === 'tranche' && proposition.axe && proposition.valeur) {
    return idsTranche(cases, proposition.axe, proposition.valeur);
  }
  return new Set();
}

export function idsReponseGuilford(fonction, cases) {
  if (!fonction || !fonction.guilford || fonction.guilford.type !== 'tranche') {
    return new Set();
  }
  return idsTranche(cases, fonction.guilford.axe, fonction.guilford.valeur);
}

/** Libellé lisible d'une case, à défaut d'entrée dans cases.json. */
export function libelleCase(c, vocabulaire) {
  const operation = vocabulaire.operations[c.operation]?.libelle ?? c.operation;
  const contenu = vocabulaire.contenus[c.contenu]?.libelle ?? c.contenu;
  const produit = vocabulaire.produits[c.produit]?.libelle ?? c.produit;
  return `${operation}, ${contenu.toLowerCase()}, ${produit.toLowerCase()}`;
}

/**
 * Chargement des sept fichiers JSON et index de lecture.
 * Les chemins sont résolus depuis ce module, donc indépendants de la page.
 */
const NOMS = ['etapes', 'fonctions', 'cases', 'versions', 'chc', 'glossaire', 'lectures'];

async function chargerJson(nom) {
  const url = new URL(`../data/${nom}.json`, import.meta.url);
  const reponse = await fetch(url);
  if (!reponse.ok) {
    throw new Error(`data/${nom}.json n'a pas pu être chargé (${reponse.status}).`);
  }
  return reponse.json();
}

export async function chargerDonnees() {
  const paires = await Promise.all(
    NOMS.map(async (nom) => [nom, await chargerJson(nom)])
  );
  const brut = Object.fromEntries(paires);

  const donnees = {
    etapes: brut.etapes,
    fonctions: brut.fonctions,
    cases: brut.cases,
    chc: brut.chc,
    glossaire: brut.glossaire,
    lectures: brut.lectures,
    versions: brut.versions.versions,
    vocabulaire: brut.versions.vocabulaire,
  };

  donnees.casesParId = new Map(donnees.cases.map((c) => [c.id, c]));
  donnees.etapesParId = new Map(donnees.etapes.map((e) => [e.id, e]));
  donnees.fonctionsParId = new Map(donnees.fonctions.map((f) => [f.id, f]));
  donnees.versionsParId = new Map(donnees.versions.map((v) => [v.id, v]));
  donnees.glossaireParTerme = new Map(donnees.glossaire.map((g) => [g.terme, g]));
  donnees.noeudsChc = new Map(donnees.chc.map((n) => [n.id, n]));

  return donnees;
}

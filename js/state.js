/**
 * État unique de la page. Rien n'est écrit dans le navigateur : tout se perd
 * au rechargement, conformément au périmètre du projet.
 */
export const etat = {
  etape: 0,
  mode: 'parcours',
  fonction: null,
  /** { type: 'case' | 'tranche' | 'nulle_part', axe?, valeur?, id?, validee } */
  proposition: null,
  version: '1967',
};

const abonnes = new Set();

/** Abonne une fonction de rendu. Retourne une fonction de désabonnement. */
export function abonner(fn) {
  abonnes.add(fn);
  return () => abonnes.delete(fn);
}

/** Applique un changement puis rend à nouveau. */
export function changer(patch) {
  Object.assign(etat, patch);
  for (const fn of abonnes) fn(etat);
}

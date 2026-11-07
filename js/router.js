/**
 * Routage par ancre d'adresse : #etape-N ou #libre.
 * Une ancre inconnue ramène à l'étape 0.
 */
export function lireRoute(etapes) {
  const brut = decodeURIComponent(location.hash.slice(1)).trim();
  const derniere = etapes[etapes.length - 1].id;

  if (brut === 'libre') {
    return { mode: 'libre', etape: 0 };
  }

  const trouve = /^etape-(\d+)$/.exec(brut);
  if (!trouve) {
    return { mode: 'parcours', etape: 0 };
  }

  const numero = Number(trouve[1]);
  const valide = Number.isInteger(numero) && numero >= 0 && numero <= derniere;
  return { mode: 'parcours', etape: valide ? numero : 0 };
}

export function ecrireRoute(mode, etape) {
  const ancre = mode === 'libre' ? '#libre' : `#etape-${etape}`;
  if (location.hash === ancre) return;
  history.replaceState(null, '', ancre);
}

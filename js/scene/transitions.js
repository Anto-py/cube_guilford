/**
 * Moteur d'interpolation maison. Une seule animation à la fois : en lancer une
 * nouvelle achève la précédente, ce qui évite les états intermédiaires bloqués.
 */
let courante = null;

export function easing(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * @param {object} options
 * @param {number} options.duree en millisecondes
 * @param {(t: number) => void} options.surProgres reçoit l'avancement de 0 à 1
 * @param {() => void} [options.surFin]
 */
export function animer({ duree = 600, surProgres, surFin }) {
  if (courante) courante.finir();

  const debut = performance.now();
  let terminee = false;

  const animation = {
    finir() {
      if (terminee) return;
      terminee = true;
      surProgres(1);
      if (surFin) surFin();
      if (courante === animation) courante = null;
    },
  };

  function image(maintenant) {
    if (terminee) return;
    const t = Math.min(1, (maintenant - debut) / duree);
    surProgres(easing(t));
    if (t >= 1) {
      animation.finir();
      return;
    }
    requestAnimationFrame(image);
  }

  courante = animation;
  requestAnimationFrame(image);
  return animation;
}

/** Achève l'animation en cours, s'il y en a une. */
export function achever() {
  if (courante) courante.finir();
}

/**
 * Balisage du glossaire : {{terme}} devient un bouton souligné en pointillés.
 */
export function creerGlossaire(donnees, conteneurTexte) {
  const parTerme = donnees.glossaireParTerme;
  let bulle = null;

  function baliser(texte) {
    return texte.replace(/\{\{([^}]+)\}\}/g, (entier, terme) => {
      const nom = terme.trim();
      if (!parTerme.has(nom)) return entier;
      return `<button type="button" class="terme" data-terme="${nom}">${nom}</button>`;
    });
  }

  function fermer() {
    if (bulle) {
      bulle.remove();
      bulle = null;
    }
  }

  function afficher(element, entree) {
    fermer();
    bulle = document.createElement('div');
    bulle.className = 'glossaire-bulle';
    bulle.innerHTML =
      `<strong>${entree.terme}</strong>` +
      `<p>${entree.definition}</p>` +
      (entree.exemple ? `<p class="glossaire-bulle__exemple">${entree.exemple}</p>` : '');
    document.body.appendChild(bulle);

    const cadre = element.getBoundingClientRect();
    const largeur = bulle.offsetWidth;
    const hauteur = bulle.offsetHeight;
    let gauche = cadre.left + cadre.width / 2 - largeur / 2;
    gauche = Math.max(12, Math.min(gauche, window.innerWidth - largeur - 12));
    let haut = cadre.bottom + 8;
    if (haut + hauteur > window.innerHeight - 12) {
      haut = cadre.top - hauteur - 8;
    }
    bulle.style.left = `${gauche}px`;
    bulle.style.top = `${haut}px`;
  }

  conteneurTexte.addEventListener('click', (ev) => {
    const bouton = ev.target.closest('.terme');
    if (!bouton) return;
    ev.stopPropagation();
    const entree = parTerme.get(bouton.dataset.terme);
    if (entree) afficher(bouton, entree);
  });

  document.addEventListener('click', (ev) => {
    if (ev.target.closest('.glossaire-bulle') || ev.target.closest('.terme')) return;
    fermer();
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') fermer();
  });

  return { baliser, fermer };
}

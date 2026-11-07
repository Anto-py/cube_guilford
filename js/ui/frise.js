/**
 * Frise des quatre versions. Elle porte l'état `version`, y compris le
 * passage à l'arbre CHC.
 */
export function creerFrise(donnees, actions) {
  const conteneur = document.getElementById('frise');

  donnees.versions.forEach((version) => {
    const bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.className = 'jalon';
    bouton.dataset.id = version.id;
    bouton.textContent = version.id === 'chc' ? 'CHC' : version.id;
    bouton.title = version.texte;
    bouton.addEventListener('click', () => actions.changerVersion(version.id));
    conteneur.appendChild(bouton);
  });

  function rendre(etat) {
    const etape = etat.mode === 'parcours' ? donnees.etapesParId.get(etat.etape) : null;
    const visible = etat.mode === 'libre' || Boolean(etape?.frise_visible);
    conteneur.hidden = !visible;
    [...conteneur.children].forEach((bouton) => {
      bouton.classList.toggle('est-actif', bouton.dataset.id === etat.version);
    });
  }

  return { rendre };
}

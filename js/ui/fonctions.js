/**
 * Sélecteur des cinq fonctions suivies. Une seule active à la fois.
 */
export function creerFonctions(donnees, actions) {
  const conteneur = document.getElementById('fonctions');
  const liste = document.getElementById('fonctions__liste');

  donnees.fonctions.forEach((fonction) => {
    const bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.className = 'fonction';
    bouton.dataset.id = fonction.id;
    bouton.textContent = fonction.libelle;
    bouton.addEventListener('click', () => actions.choisirFonction(fonction.id));
    liste.appendChild(bouton);
  });

  function rendre(etat) {
    const visible = etat.mode === 'libre' || etat.etape >= 3;
    conteneur.hidden = !visible;
    [...liste.children].forEach((bouton) => {
      bouton.classList.toggle('est-active', bouton.dataset.id === etat.fonction);
    });
  }

  return { rendre };
}

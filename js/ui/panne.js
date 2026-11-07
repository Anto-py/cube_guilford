/**
 * Remplace la scène par un message quand la 3D ne peut pas fonctionner.
 */
export function afficherPanne(
  titre = "La 3D n'est pas disponible",
  texte = "Ce navigateur ne peut pas afficher la scène 3D. Ouvrez la page dans un Chrome, un Edge ou un Firefox récent."
) {
  const scene = document.getElementById('scene');
  const etiquettes = document.getElementById('etiquettes');
  const chargement = document.getElementById('chargement');
  const panne = document.getElementById('panne');

  if (scene) scene.hidden = true;
  if (etiquettes) etiquettes.hidden = true;
  if (chargement) chargement.hidden = true;

  if (panne) {
    const titreEl = panne.querySelector('h2');
    const texteEl = panne.querySelector('p');
    if (titreEl) titreEl.textContent = titre;
    if (texteEl) texteEl.textContent = texte;
    panne.hidden = false;
  }
}

import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

/**
 * Bulle ancrée dans la scène : elle suit la rotation du cube ou de l'arbre.
 */
export function creerBulle(scene) {
  let objet = null;

  function fermer() {
    if (!objet) return;
    scene.remove(objet);
    objet.element.remove();
    objet = null;
  }

  function ouvrir(position, html) {
    fermer();
    const element = document.createElement('div');
    element.className = 'bulle-3d';
    element.innerHTML = html;

    objet = new CSS2DObject(element);
    objet.position.copy(position);
    objet.position.y += 0.7;
    scene.add(objet);
  }

  return {
    ouvrir,
    fermer,
    get ouverte() {
      return Boolean(objet);
    },
  };
}

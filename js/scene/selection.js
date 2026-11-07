import * as THREE from 'three';

const SEUIL_DEPLACEMENT = 5;

/**
 * Distingue un clic d'une rotation : seul un appui relâché à moins de 5 pixels
 * du point de départ déclenche une sélection.
 *
 * @param {HTMLElement} element surface d'écoute, le canevas
 * @param {THREE.Camera} camera
 * @param {() => THREE.Object3D[]} obtenirObjets objets à tester au moment du clic
 * @param {(touche: object|null) => void} surClic reçoit la première intersection
 */
export function brancherSelection(element, camera, obtenirObjets, surClic) {
  const raycaster = new THREE.Raycaster();
  const pointeur = new THREE.Vector2();
  let appuye = false;
  let departX = 0;
  let departY = 0;

  function placer(ev) {
    const cadre = element.getBoundingClientRect();
    pointeur.x = ((ev.clientX - cadre.left) / cadre.width) * 2 - 1;
    pointeur.y = -((ev.clientY - cadre.top) / cadre.height) * 2 + 1;
  }

  element.addEventListener('pointerdown', (ev) => {
    appuye = true;
    departX = ev.clientX;
    departY = ev.clientY;
  });

  element.addEventListener('pointercancel', () => {
    appuye = false;
  });

  element.addEventListener('pointerup', (ev) => {
    if (!appuye) return;
    appuye = false;

    const deplacement = Math.hypot(ev.clientX - departX, ev.clientY - departY);
    if (deplacement > SEUIL_DEPLACEMENT) return;

    placer(ev);
    raycaster.setFromCamera(pointeur, camera);

    const objets = obtenirObjets().filter(Boolean);
    if (objets.length === 0) {
      surClic(null);
      return;
    }

    const touches = raycaster.intersectObjects(objets, false);
    surClic(touches.length > 0 ? touches[0] : null);
  });
}

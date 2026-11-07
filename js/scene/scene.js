import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

const FOND = 0x0d1617;

export function webglDisponible() {
  try {
    const essai = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (essai.getContext('webgl2') || essai.getContext('webgl'))
    );
  } catch {
    return false;
  }
}

/**
 * Crée le rendu, la scène, la caméra et les contrôles.
 * @returns {object} l'ensemble des pièces, plus la boucle d'animation
 */
export function creerScene(conteneur, conteneurEtiquettes) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  conteneur.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(FOND);

  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    200
  );
  camera.position.set(9, 8, 13);

  const etiquettes = new CSS2DRenderer();
  etiquettes.setSize(window.innerWidth, window.innerHeight);
  etiquettes.domElement.classList.add('calque-etiquettes');
  conteneurEtiquettes.appendChild(etiquettes.domElement);

  const controles = new OrbitControls(camera, renderer.domElement);
  controles.enableDamping = false;
  controles.enablePan = false;
  controles.minDistance = 7;
  controles.maxDistance = 34;
  controles.rotateSpeed = 0.75;
  controles.zoomSpeed = 0.9;
  controles.target.set(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.85));

  const principale = new THREE.DirectionalLight(0xffffff, 1.35);
  principale.position.set(6, 10, 8);
  scene.add(principale);

  const appoint = new THREE.DirectionalLight(0xffffff, 0.45);
  appoint.position.set(-8, -5, -7);
  scene.add(appoint);

  let reduireQualite = false;
  let arret = false;

  function dimensionner() {
    const largeur = window.innerWidth;
    const hauteur = window.innerHeight;
    renderer.setSize(largeur, hauteur);
    etiquettes.setSize(largeur, hauteur);
    cadrer();
  }

  /* Décale le centre optique vers la gauche pour que le cube occupe la zone
   * libre, à côté du panneau, au lieu de passer dessous. */
  function cadrer() {
    const largeur = window.innerWidth;
    const hauteur = window.innerHeight;
    const panneau = largeur > 780 ? document.getElementById('panneau') : null;
    const marge = panneau ? panneau.getBoundingClientRect().width + 24 : 0;

    if (marge > 0) {
      camera.setViewOffset(largeur + marge, hauteur, marge, 0, largeur, hauteur);
    } else {
      camera.clearViewOffset();
      camera.aspect = largeur / hauteur;
      camera.updateProjectionMatrix();
    }
  }

  window.addEventListener('resize', dimensionner);

  cadrer();

  function boucle() {
    if (arret) return;
    renderer.render(scene, camera);
    etiquettes.render(scene, camera);
    requestAnimationFrame(boucle);
  }

  return {
    renderer,
    scene,
    camera,
    controles,
    etiquettes,
    demarrer: () => requestAnimationFrame(boucle),
    dimensionner,
    /** Sous 30 images par seconde : résolution réduite, animations raccourcies. */
    alleger() {
      if (reduireQualite) return;
      reduireQualite = true;
      renderer.setPixelRatio(1);
      dimensionner();
    },
    get estAllege() {
      return reduireQualite;
    },
    arreter() {
      arret = true;
    },
  };
}

/** Mesure les images par seconde sur une durée courte, après le premier rendu. */
export function mesurerImagesParSeconde(duree = 2000) {
  return new Promise((resoudre) => {
    let images = 0;
    const debut = performance.now();

    function compter() {
      images += 1;
      const ecoule = performance.now() - debut;
      if (ecoule < duree) {
        requestAnimationFrame(compter);
      } else {
        resoudre(images / (ecoule / 1000));
      }
    }

    requestAnimationFrame(compter);
  });
}

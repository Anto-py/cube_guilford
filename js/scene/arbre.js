import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const COULEUR_NEUTRE = 0x2b4443;
const COULEUR_ALLUME = 0x127676;
const COULEUR_REVISION = 0xe3a535;

/**
 * Arbre CHC : g au sommet, aptitudes larges en couronne, aptitudes étroites
 * en second cercle. Sphères et tiges seulement, pour rester léger.
 */
export function creerArbre(scene) {
  const groupe = new THREE.Group();
  groupe.visible = false;
  scene.add(groupe);

  const geometrieSphere = new THREE.SphereGeometry(0.23, 18, 14);
  const geometrieTige = new THREE.BufferGeometry();

  let noeuds = [];
  let meshes = new Map();
  let tiges = null;
  let anneauG = null;
  let g = null;

  function vider() {
    [...meshes.values()].forEach((mesh) => {
      groupe.remove(mesh);
      mesh.material.dispose();
      if (mesh.userData.etiquette) mesh.userData.etiquette.element.remove();
    });
    meshes = new Map();
    if (tiges) {
      groupe.remove(tiges);
      tiges.geometry.dispose();
      tiges.material.dispose();
      tiges = null;
    }
    if (anneauG) {
      groupe.remove(anneauG);
      anneauG.geometry.dispose();
      anneauG.material.dispose();
      anneauG = null;
    }
    noeuds = [];
  }

  function construire(liste) {
    vider();
    noeuds = liste;

    const larges = liste.filter((n) => n.niveau === 'large');
    const positions = new Map();
    positions.set('g', new THREE.Vector3(0, 3.1, 0));

    larges.forEach((n, i) => {
      const angle = (i / larges.length) * Math.PI * 2;
      positions.set(
        n.id,
        new THREE.Vector3(Math.cos(angle) * 2.8, 0.9, Math.sin(angle) * 2.8)
      );
    });

    larges.forEach((n, i) => {
      const angle = (i / larges.length) * Math.PI * 2;
      const enfants = n.enfants || [];
      enfants.forEach((enfant, j) => {
        const decalage = (j - (enfants.length - 1) / 2) * 0.42;
        positions.set(
          enfant,
          new THREE.Vector3(
            Math.cos(angle + decalage) * 4.4,
            -1.1,
            Math.sin(angle + decalage) * 4.4
          )
        );
      });
    });

    const sommets = [];

    liste.forEach((noeud) => {
      const position = positions.get(noeud.id);
      if (!position) return;

      const materiau = new THREE.MeshStandardMaterial({
        color: COULEUR_NEUTRE,
        roughness: 0.7,
        metalness: 0.05,
      });

      const mesh = new THREE.Mesh(geometrieSphere, materiau);
      mesh.position.copy(position);
      mesh.userData.id = noeud.id;

      const element = document.createElement('span');
      element.className = 'etiquette etiquette--inerte';
      element.textContent = noeud.sigle;
      const etiquette = new CSS2DObject(element);
      etiquette.position.set(0, 0.38, 0);
      mesh.add(etiquette);
      mesh.userData.etiquette = etiquette;

      groupe.add(mesh);
      meshes.set(noeud.id, mesh);

      if (noeud.parent) {
        const parent = positions.get(noeud.parent);
        if (parent) {
          sommets.push(
            parent.x, parent.y, parent.z,
            position.x, position.y, position.z
          );
        }
      }

      if (noeud.id === 'g') g = mesh;
    });

    geometrieTige.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(sommets, 3)
    );
    tiges = new THREE.LineSegments(
      geometrieTige,
      new THREE.LineBasicMaterial({ color: 0x3f5f5d })
    );
    groupe.add(tiges);

    const points = [];
    for (let i = 0; i <= 64; i += 1) {
      const angle = (i / 64) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * 0.48, Math.sin(angle) * 0.48, 0));
    }
    anneauG = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineDashedMaterial({
        color: COULEUR_REVISION,
        dashSize: 0.12,
        gapSize: 0.1,
      })
    );
    anneauG.computeLineDistances();
    anneauG.position.set(0, 3.1, 0);
    anneauG.visible = false;
    groupe.add(anneauG);

    groupe.scale.setScalar(0.9);
  }

  function peindre({ allumes = new Set(), diffus = false } = {}) {
    meshes.forEach((mesh, id) => {
      const allume = allumes.has(id);
      mesh.material.color.set(allume ? COULEUR_ALLUME : COULEUR_NEUTRE);
      mesh.material.emissive.set(allume ? COULEUR_ALLUME : 0x000000);
      mesh.material.emissiveIntensity = allume ? 0.35 : 0;
      mesh.material.opacity = allume && diffus ? 0.6 : 1;
      mesh.material.transparent = allume && diffus;
    });
  }

  return {
    groupe,
    construire,
    peindre,
    positionDe(id) {
      return meshes.get(id)?.position ?? null;
    },
    objetDe(id) {
      return meshes.get(id) ?? null;
    },
    meshes() {
      return [...meshes.values()];
    },
    /** g perd son relief à l'étape 8 : translucide, entouré d'un pointillé. */
    marquerRevision(actif) {
      if (g) {
        g.material.transparent = actif;
        g.material.opacity = actif ? 0.35 : 1;
      }
      if (anneauG) anneauG.visible = actif;
    },
    /** CSS2DRenderer ignore la visibilité des parents : on la porte aussi
     *  sur chaque étiquette, sinon les sigles restent affichés sur le cube. */
    definirVisible(visible) {
      groupe.visible = visible;
      meshes.forEach((mesh) => {
        if (mesh.userData.etiquette) mesh.userData.etiquette.visible = visible;
      });
    },
  };
}
import * as THREE from 'three';

const TAILLE_CASE = 0.82;
const PAS = 1;

const COULEURS = {
  fondNeutre: new THREE.Color(0x2b4443),
  areteNeutre: new THREE.Color(0x3f5f5d),
  proposition: new THREE.Color(0xe4632e),
  reponse: new THREE.Color(0xe3a535),
  survol: new THREE.Color(0xf2efe6),
};

/**
 * Cube de Guilford : une instance par case, plus un calque d'arêtes fusionnées.
 * Deux appels de dessin au total, quel que soit le nombre de cases.
 */
export function creerCube(scene) {
  const groupe = new THREE.Group();
  groupe.visible = false;
  scene.add(groupe);

  const geometrie = new THREE.BoxGeometry(TAILLE_CASE, TAILLE_CASE, TAILLE_CASE);
  const geometrieAretes = new THREE.EdgesGeometry(geometrie);
  const sourceAretes = geometrieAretes.attributes.position.array;
  const flottantsParCase = sourceAretes.length;

  const materiauCases = new THREE.MeshStandardMaterial({
    roughness: 0.88,
    metalness: 0.04,
  });
  const materiauAretes = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
  });

  let maillage = null;
  let aretes = null;
  let cases = [];
  let indexParId = new Map();
  let versionConstruite = null;

  function vider() {
    if (maillage) {
      groupe.remove(maillage);
      maillage.dispose();
      maillage = null;
    }
    if (aretes) {
      groupe.remove(aretes);
      aretes.geometry.dispose();
      aretes = null;
    }
    cases = [];
    indexParId = new Map();
  }

  /**
   * Construit la grille d'une version. L'identifiant d'une case est le
   * trigramme de Guilford : code d'opération, de contenu, de produit.
   */
  function construire(version, vocabulaire) {
    vider();
    versionConstruite = version.id;

    const operations = version.operations;
    const produits = version.produits;
    const contenus = version.contenus;
    const nx = operations.length;
    const ny = produits.length;
    const nz = contenus.length;

    let index = 0;
    for (let i = 0; i < nx; i += 1) {
      for (let j = 0; j < ny; j += 1) {
        for (let k = 0; k < nz; k += 1) {
          const operation = operations[i];
          const produit = produits[j];
          const contenu = contenus[k];
          const id =
            vocabulaire.operations[operation].code +
            vocabulaire.contenus[contenu].code +
            vocabulaire.produits[produit].code;

          cases.push({
            id,
            operation,
            contenu,
            produit,
            index,
            position: new THREE.Vector3(
              (i - (nx - 1) / 2) * PAS,
              (j - (ny - 1) / 2) * PAS,
              (k - (nz - 1) / 2) * PAS
            ),
          });
          indexParId.set(id, index);
          index += 1;
        }
      }
    }

    maillage = new THREE.InstancedMesh(geometrie, materiauCases, cases.length);
    const matrice = new THREE.Matrix4();

    cases.forEach((c, i) => {
      matrice.makeTranslation(c.position.x, c.position.y, c.position.z);
      maillage.setMatrixAt(i, matrice);
      maillage.setColorAt(i, COULEURS.fondNeutre);
    });
    maillage.instanceMatrix.needsUpdate = true;
    if (maillage.instanceColor) maillage.instanceColor.needsUpdate = true;
    groupe.add(maillage);

    const positions = new Float32Array(cases.length * flottantsParCase);
    const couleurs = new Float32Array(cases.length * flottantsParCase);

    cases.forEach((c, i) => {
      const decalage = i * flottantsParCase;
      for (let s = 0; s < flottantsParCase; s += 3) {
        positions[decalage + s] = sourceAretes[s] + c.position.x;
        positions[decalage + s + 1] = sourceAretes[s + 1] + c.position.y;
        positions[decalage + s + 2] = sourceAretes[s + 2] + c.position.z;
        couleurs[decalage + s] = COULEURS.areteNeutre.r;
        couleurs[decalage + s + 1] = COULEURS.areteNeutre.g;
        couleurs[decalage + s + 2] = COULEURS.areteNeutre.b;
      }
    });

    const geometrieFusionnee = new THREE.BufferGeometry();
    geometrieFusionnee.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometrieFusionnee.setAttribute('color', new THREE.BufferAttribute(couleurs, 3));

    aretes = new THREE.LineSegments(geometrieFusionnee, materiauAretes);
    groupe.add(aretes);

    groupe.scale.setScalar(0.92);
  }

  /**
   * Applique les couleurs de sens : proposition (orange), réponse de Guilford
   * (jaune), les deux (fond orange, arête jaune).
   */
  function peindre({ proposition = new Set(), reponse = new Set(), survol = null } = {}) {
    if (!maillage || !aretes) return;

    const attributCouleurs = aretes.geometry.getAttribute('color');
    const couleurs = attributCouleurs.array;

    for (let i = 0; i < cases.length; i += 1) {
      const id = cases[i].id;
      const estProposition = proposition.has(id);
      const estReponse = reponse.has(id);

      let fond = COULEURS.fondNeutre;
      let arete = COULEURS.areteNeutre;

      if (estProposition && estReponse) {
        fond = COULEURS.proposition;
        arete = COULEURS.reponse;
      } else if (estProposition) {
        fond = COULEURS.proposition;
        arete = COULEURS.proposition;
      } else if (estReponse) {
        fond = COULEURS.reponse;
        arete = COULEURS.reponse;
      }

      if (survol === id) {
        arete = COULEURS.survol;
      }

      maillage.setColorAt(i, fond);

      const decalage = i * flottantsParCase;
      for (let s = 0; s < flottantsParCase; s += 3) {
        couleurs[decalage + s] = arete.r;
        couleurs[decalage + s + 1] = arete.g;
        couleurs[decalage + s + 2] = arete.b;
      }
    }

    if (maillage.instanceColor) maillage.instanceColor.needsUpdate = true;
    attributCouleurs.needsUpdate = true;
  }

  return {
    groupe,
    construire,
    peindre,
    get cases() {
      return cases;
    },
    get maillage() {
      return maillage;
    },
    get version() {
      return versionConstruite;
    },
    idDepuisInstance(instanceId) {
      return cases[instanceId]?.id ?? null;
    },
    caseParId(id) {
      const index = indexParId.get(id);
      return index === undefined ? null : cases[index];
    },
  };
}

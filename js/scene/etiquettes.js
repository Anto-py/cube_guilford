import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const PAS = 1;

/**
 * Étiquettes d'axes, en HTML positionné en 3D. Un clic sur une étiquette
 * désigne toute la tranche qu'elle nomme (étape 3).
 */
export function creerEtiquettes(groupeParent, surTranche) {
  const groupe = new THREE.Group();
  groupeParent.add(groupe);

  const objets = [];
  let clicActif = false;

  function vider() {
    objets.forEach((objet) => {
      groupe.remove(objet);
      objet.element.remove();
    });
    objets.length = 0;
  }

  function ajouter(texte, axe, valeur, position) {
    const element = document.createElement('button');
    element.type = 'button';
    element.className = 'etiquette';
    element.textContent = texte;
    element.dataset.axe = axe;
    element.dataset.valeur = valeur;
    element.addEventListener('click', () => {
      if (!clicActif) return;
      surTranche({ axe, valeur });
    });

    const objet = new CSS2DObject(element);
    objet.position.copy(position);
    groupe.add(objet);
    objets.push(objet);
    return element;
  }

  function ajouterLegende(texte, position) {
    const element = document.createElement('span');
    element.className = 'etiquette-legende';
    element.textContent = texte;
    const objet = new CSS2DObject(element);
    objet.position.copy(position);
    groupe.add(objet);
    objets.push(objet);
  }

  function construire(version, vocabulaire) {
    vider();

    const nx = version.operations.length;
    const ny = version.produits.length;
    const nz = version.contenus.length;
    const xMin = -((nx - 1) / 2) * PAS;
    const xMax = ((nx - 1) / 2) * PAS;
    const yMin = -((ny - 1) / 2) * PAS;
    const zMax = ((nz - 1) / 2) * PAS;
    const zDevant = zMax + 1.1;

    /* Opérations : rangée sous le cube, décalée en quinconce pour que les
     * libellés courts ne se chevauchent pas en projection. */
    version.operations.forEach((valeur, i) => {
      ajouter(
        vocabulaire.operations[valeur].libelle_court ?? vocabulaire.operations[valeur].libelle,
        'operation',
        valeur,
        new THREE.Vector3(xMin + i * PAS, yMin - 0.95 - (i % 2) * 0.95, zDevant)
      );
    });

    /* Produits : colonne de gauche, dans l'ordre vertical du cube. */
    ajouterLegende('Produits', new THREE.Vector3(xMin - 1.25, 3.1, zDevant));
    version.produits.forEach((valeur, j) => {
      ajouter(
        vocabulaire.produits[valeur].libelle,
        'produit',
        valeur,
        new THREE.Vector3(xMin - 1.25, yMin + j * PAS, zDevant)
      );
    });

    /* Contenus : colonne de droite, à mi-profondeur pour ne pas glisser
     * sur la face avant du cube. */
    ajouterLegende('Contenus', new THREE.Vector3(xMax + 2.8, 2.4, 0));
    version.contenus.forEach((valeur, k) => {
      ajouter(
        vocabulaire.contenus[valeur].libelle,
        'contenu',
        valeur,
        new THREE.Vector3(xMax + 2.8, -2.1 + k * 1.05, 0)
      );
    });
  }

  return {
    groupe,
    construire,
    rendreCliquables(actif) {
      clicActif = actif;
      objets.forEach((objet) => {
        objet.element.classList.toggle('etiquette--inerte', !actif);
      });
    },
    definirVisible(visible) {      groupe.visible = visible;
      /* CSS2DRenderer ignore la visibilité des parents : chaque étiquette
       * doit porter la sienne, sinon elle reste affichée sur l'arbre. */
      objets.forEach((objet) => {
        objet.visible = visible;
      });
    },
  };
}

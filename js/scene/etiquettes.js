import * as THREE from 'three';

/**
 * Repères des trois axes.
 *
 * Ils sont posés à des places fixes autour de la scène, donc ils ne peuvent
 * ni se chevaucher ni passer derrière le cube. La flèche de chacun indique la
 * direction réelle de son axe à l'écran, recalculée à chaque mouvement : c'est
 * elle qui porte l'information, la position ne fait que répartir les trois.
 *
 * Un cercle remplace la flèche quand l'axe pointe vers la caméra : dans ce cas
 * les valeurs se superposent en profondeur et aucune direction n'est lisible.
 */
export function creerEtiquettes(conteneur, camera) {
  const axes = [
    { titre: 'Opérations', classe: 'repere--operations', vecteur: new THREE.Vector3(1, 0, 0) },
    { titre: 'Produits', classe: 'repere--produits', vecteur: new THREE.Vector3(0, 1, 0) },
    { titre: 'Contenus', classe: 'repere--contenus', vecteur: new THREE.Vector3(0, 0, 1) },
  ];

  const reperes = axes.map(({ titre, classe, vecteur }) => {
    const element = document.createElement('div');
    element.className = `repere ${classe}`;

    const texte = document.createElement('span');
    texte.className = 'repere__titre';
    texte.textContent = titre;

    const fleche = document.createElement('span');
    fleche.className = 'repere__fleche';
    fleche.textContent = '→';

    element.append(texte, fleche);
    conteneur.appendChild(element);

    return { element, fleche, vecteur };
  });

  const origine = new THREE.Vector3();

  function mettreAJour() {
    origine.set(0, 0, 0).project(camera);

    for (const { fleche, vecteur } of reperes) {
      const bout = vecteur.clone().project(camera);
      const dx = (bout.x - origine.x) * window.innerWidth * 0.5;
      const dy = -(bout.y - origine.y) * window.innerHeight * 0.5;

      if (Math.hypot(dx, dy) < 8) {
        fleche.textContent = '◎';
        fleche.style.transform = 'none';
        continue;
      }

      fleche.textContent = '→';
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      fleche.style.transform = `rotate(${angle}deg)`;
    }
  }

  return {
    mettreAJour,
    definirVisible(visible) {
      conteneur.hidden = !visible;
    },
  };
}

/**
 * Légende des trois axes, dans le panneau.
 *
 * Elle vit hors de la scène pour une raison simple : un texte qui tourne avec
 * un cube finit toujours par se retrouver du mauvais côté ou par se chevaucher.
 * Ici les valeurs sont groupées sous leur axe, lisibles à tout moment.
 */
export function creerLegende(donnees, actions) {
  const conteneur = document.getElementById('legende');
  let versionAffichee = null;

  function construire(version) {
    conteneur.innerHTML = '';

    const groupes = [
      {
        axe: 'operation',
        titre: 'Opérations',
        valeurs: version.operations,
        table: donnees.vocabulaire.operations,
      },
      {
        axe: 'produit',
        titre: 'Produits',
        valeurs: version.produits,
        table: donnees.vocabulaire.produits,
      },
      {
        axe: 'contenu',
        titre: 'Contenus',
        valeurs: version.contenus,
        table: donnees.vocabulaire.contenus,
      },
    ];

    for (const groupe of groupes) {
      const section = document.createElement('section');
      section.className = 'legende__groupe';

      const titre = document.createElement('h2');
      titre.className = 'legende__titre';
      titre.textContent = groupe.titre;
      section.appendChild(titre);

      const liste = document.createElement('div');
      liste.className = 'legende__valeurs';

      for (const valeur of groupe.valeurs) {
        const bouton = document.createElement('button');
        bouton.type = 'button';
        bouton.className = 'legende__valeur';
        bouton.dataset.axe = groupe.axe;
        bouton.dataset.valeur = valeur;
        bouton.textContent = groupe.table[valeur].libelle;
        bouton.addEventListener('click', () => {
          actions.proposerTranche({ axe: groupe.axe, valeur });
        });
        liste.appendChild(bouton);
      }

      section.appendChild(liste);
      conteneur.appendChild(section);
    }
  }

  function rendre(etat) {
    if (etat.version === 'chc') {
      conteneur.hidden = true;
      return;
    }

    conteneur.hidden = false;

    if (versionAffichee !== etat.version) {
      construire(donnees.versionsParId.get(etat.version));
      versionAffichee = etat.version;
    }

    const selectionnable =
      etat.mode === 'parcours' && etat.etape === 3 && Boolean(etat.fonction);
    const proposition = etat.proposition;

    for (const bouton of conteneur.querySelectorAll('.legende__valeur')) {
      bouton.disabled = !selectionnable;

      const selection =
        proposition &&
        proposition.type === 'tranche' &&
        proposition.axe === bouton.dataset.axe &&
        proposition.valeur === bouton.dataset.valeur;

      bouton.classList.toggle('est-active', Boolean(selection));
    }
  }

  return { rendre };
}

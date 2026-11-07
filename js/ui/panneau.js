import { peutAvancer as avancable } from '../parcours.js';

/**
 * Panneau de texte : titre, explication, navigation.
 * L'étape 9 remplace « Suivant » par « Explorer librement » ; le mode libre
 * remplace la navigation par « Refaire le parcours ».
 */
export function creerPanneau(donnees, actions, baliser) {
  const elCompteur = document.getElementById('compteur');
  const elTitre = document.getElementById('titre');
  const elTexte = document.getElementById('texte');
  const elPrecedent = document.getElementById('precedent');
  const elSuivant = document.getElementById('suivant');

  const derniere = donnees.etapes[donnees.etapes.length - 1].id;

  elPrecedent.addEventListener('click', () => actions.precedent());
  elSuivant.addEventListener('click', () => actions.suivant());

  function paragraphes(etat) {
    if (etat.mode === 'libre') {
      return [
        "Le cube et l'arbre sont manipulables librement. Cliquez sur une case pour lire la tâche qui la définit, sur un nœud pour lire sa définition.",
        'La frise change de version. Le sélecteur change la fonction suivie.',
      ];
    }

    const etape = donnees.etapesParId.get(etat.etape);
    const textes = [...etape.texte];
    const fonction = etat.fonction ? donnees.fonctionsParId.get(etat.fonction) : null;

    if (etat.etape === 3 && fonction) {
      textes.unshift(fonction.consigne);
    }

    if (fonction && [4, 7, 8].includes(etat.etape)) {
      const complement = fonction.textes?.[`etape${etat.etape}`];
      if (complement) textes.push(complement);
    }

    return textes;
  }

  function rendre(etat) {
    const enLibre = etat.mode === 'libre';
    const etape = donnees.etapesParId.get(etat.etape);

    elCompteur.textContent = enLibre ? 'Mode libre' : `Étape ${etat.etape} / ${derniere}`;
    elTitre.textContent = enLibre ? 'Explorer librement' : etape.titre;
    elTexte.innerHTML = paragraphes(etat)
      .map((t) => `<p>${baliser(t)}</p>`)
      .join('');

    const fonction = etat.fonction ? donnees.fonctionsParId.get(etat.fonction) : null;
    if (!enLibre && fonction && [4, 7, 8].includes(etat.etape) && fonction.guilford?.rapprochement) {
      const note = document.createElement('p');
      note.className = 'panneau__note';
      note.textContent =
        "Rapprochement : ce lien relève de l'interprétation, pas d'une définition de l'auteur.";
      elTexte.appendChild(note);
    }

    elPrecedent.hidden = enLibre;
    elPrecedent.disabled = etat.etape === 0;

    if (enLibre) {
      elSuivant.textContent = 'Refaire le parcours';
      elSuivant.disabled = false;
    } else if (etat.etape === derniere) {
      elSuivant.textContent = 'Explorer librement';
      elSuivant.disabled = false;
    } else {
      elSuivant.textContent = 'Suivant';
      elSuivant.disabled = !avancable(etat, derniere);
    }
  }

  return { rendre };
}

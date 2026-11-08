import * as THREE from 'three';
import { etat, changer, abonner } from './state.js';
import { chargerDonnees } from './donnees.js';
import { lireRoute, ecrireRoute } from './router.js';
import { creerScene, webglDisponible, mesurerImagesParSeconde } from './scene/scene.js';
import { creerCube } from './scene/cube.js';
import { creerEtiquettes } from './scene/etiquettes.js';
import { creerArbre } from './scene/arbre.js';
import { brancherSelection } from './scene/selection.js';
import { animer } from './scene/transitions.js';
import { creerPanneau } from './ui/panneau.js';
import { creerFonctions } from './ui/fonctions.js';
import { creerFrise } from './ui/frise.js';
import { creerLegende } from './ui/legende.js';
import { creerBulle } from './ui/bulle.js';
import { creerGlossaire } from './ui/glossaire.js';
import { creerControles } from './ui/controles.js';
import { afficherPanne } from './ui/panne.js';
import { brancherClavier } from './clavier.js';
import {
  peutAvancer,
  idsProposition,
  idsReponseGuilford,
  libelleCase,
} from './parcours.js';

const DERNIERE_ETAPE = 9;

async function demarrer() {
  const chargement = document.getElementById('chargement');

  if (!webglDisponible()) {
    afficherPanne();
    return;
  }

  let donnees;
  try {
    donnees = await chargerDonnees();
  } catch (erreur) {
    console.error(erreur);
    afficherPanne(
      'Les données ne se chargent pas',
      `${erreur.message} La page doit être servie par un serveur local, pas ouverte par double clic.`
    );
    return;
  }

  const scene3d = creerScene(
    document.getElementById('scene'),
    document.getElementById('etiquettes')
  );

  const cube = creerCube(scene3d.scene);
  const arbre = creerArbre(scene3d.scene);
  const bulle = creerBulle(scene3d.scene);

  arbre.construire(donnees.chc);

  const etiquettes = creerEtiquettes(
    document.getElementById('reperes'),
    scene3d.camera
  );

  /* Les repères d'axes suivent le point de vue : leur flèche se recalcule à
   * chaque mouvement de la caméra, sinon elle indique une fausse direction. */
  scene3d.controles.addEventListener('change', () => etiquettes.mettreAJour());
  window.addEventListener('resize', () => etiquettes.mettreAJour());
  etiquettes.mettreAJour();

  const glossaire = creerGlossaire(donnees, document.getElementById('texte'));
  const panneau = creerPanneau(
    donnees,
    { precedent, suivant },
    glossaire.baliser
  );
  const fonctions = creerFonctions(donnees, { choisirFonction });
  const frise = creerFrise(donnees, { changerVersion });
  const legende = creerLegende(donnees, { proposerTranche });

  creerControles({ zoomer, recentrer: recadrer });

  const boutonValider = document.getElementById('valider');
  const boutonNullePart = document.getElementById('nulle-part');
  boutonValider.addEventListener('click', valider);
  boutonNullePart.addEventListener('click', nullePart);

  /* ---------- Caméra ---------- */

  function glisserCamera(visee, duree = 650) {
    const depart = scene3d.camera.position.clone();
    const arrivee = new THREE.Vector3(...visee.position);
    const cibleDepart = scene3d.controles.target.clone();
    const cibleArrivee = new THREE.Vector3(...visee.cible);

    animer({
      duree: scene3d.estAllege ? duree / 2 : duree,
      surProgres: (t) => {
        scene3d.camera.position.lerpVectors(depart, arrivee, t);
        scene3d.controles.target.lerpVectors(cibleDepart, cibleArrivee, t);
        scene3d.controles.update();
      },
    });
  }

  function recadrer() {
    const etape = etat.mode === 'parcours' ? donnees.etapesParId.get(etat.etape) : null;
    glisserCamera(etape?.camera ?? { position: [9, 8, 13], cible: [0, 0, 0] });
  }

  function zoomer(facteur) {
    const distance = scene3d.camera.position.distanceTo(scene3d.controles.target);
    const visee = THREE.MathUtils.clamp(
      distance / facteur,
      scene3d.controles.minDistance,
      scene3d.controles.maxDistance
    );
    const direction = scene3d.camera.position
      .clone()
      .sub(scene3d.controles.target)
      .normalize();
    scene3d.camera.position
      .copy(scene3d.controles.target)
      .addScaledVector(direction, visee);
    scene3d.controles.update();
  }

  /* ---------- Navigation ---------- */

  function allerEtape(numero) {
    const etape = donnees.etapesParId.get(numero);
    if (!etape) return;
    bulle.fermer();
    changer({ etape: numero, mode: 'parcours', version: etape.version });
    ecrireRoute('parcours', numero);
    glisserCamera(etape.camera);
  }

  function suivant() {
    if (etat.mode === 'libre') {
      allerParcours();
      return;
    }
    if (etat.etape >= DERNIERE_ETAPE) {
      allerLibre();
      return;
    }
    if (!peutAvancer(etat, DERNIERE_ETAPE)) return;
    allerEtape(etat.etape + 1);
  }

  function precedent() {
    if (etat.mode === 'libre' || etat.etape === 0) return;
    allerEtape(etat.etape - 1);
  }

  function allerLibre() {
    bulle.fermer();
    changer({ mode: 'libre', proposition: null });
    ecrireRoute('libre', 0);
  }

  function allerParcours() {
    bulle.fermer();
    changer({ mode: 'parcours', etape: 0, version: '1967' });
    ecrireRoute('parcours', 0);
    glisserCamera(donnees.etapesParId.get(0).camera);
  }

  function choisirFonction(id) {
    if (etat.fonction === id) return;
    bulle.fermer();
    changer({ fonction: id, proposition: null });
  }

  function changerVersion(id) {
    if (etat.version === id) return;
    bulle.fermer();
    changer({ version: id });
  }

  /* ---------- Proposition ---------- */

  function proposerTranche({ axe, valeur }) {
    if (etat.mode !== 'parcours' || etat.etape !== 3 || !etat.fonction) return;
    changer({ proposition: { type: 'tranche', axe, valeur, validee: false } });
  }

  function proposerCase(id) {
    if (!etat.fonction) return;
    const actuelle = etat.proposition;
    if (actuelle && actuelle.type === 'case' && actuelle.id === id) {
      changer({ proposition: null });
      return;
    }
    changer({ proposition: { type: 'case', id, validee: false } });
  }

  function valider() {
    if (!etat.proposition || etat.proposition.validee) return;
    changer({ proposition: { ...etat.proposition, validee: true } });
  }

  function nullePart() {
    if (etat.mode !== 'parcours' || etat.etape !== 3 || !etat.fonction) return;
    changer({ proposition: { type: 'nulle_part', validee: false } });
  }

  /* ---------- Bulles ---------- */

  function ouvrirBulleCase(c) {
    const entree = donnees.casesParId.get(c.id);
    let html;

    if (entree) {
      html = `<strong>${entree.libelle_courant}</strong>`;
      if (entree.exemple) html += `<p>${entree.exemple}</p>`;
      if (entree.source) html += `<p class="bulle__source">${entree.source}</p>`;
    } else {
      html =
        `<strong>${libelleCase(c, donnees.vocabulaire)}</strong>` +
        '<p class="bulle__vide">Exemple à rédiger.</p>';
    }

    bulle.ouvrir(c.position, html);
  }

  function ouvrirBulleNoeud(id) {
    const noeud = donnees.noeudsChc.get(id);
    if (!noeud) return;
    const position =
      arbre.positionDe(id) ?? new THREE.Vector3(0, 0, 0);
    bulle.ouvrir(
      position,
      `<strong>${noeud.sigle}, ${noeud.libelle_courant}</strong><p>${noeud.definition}</p>`
    );
  }

  /* ---------- Sélection ---------- */

  brancherSelection(
    scene3d.renderer.domElement,
    scene3d.camera,
    () => (etat.version === 'chc' ? arbre.meshes() : [cube.maillage]),
    (touche) => {
      if (!touche) {
        bulle.fermer();
        return;
      }

      if (etat.version === 'chc') {
        const id = touche.object.userData?.id;
        if (id) ouvrirBulleNoeud(id);
        return;
      }

      const id = cube.idDepuisInstance(touche.instanceId);
      if (!id) return;

      if (etat.mode === 'parcours' && etat.etape === 3) {
        proposerCase(id);
        return;
      }

      const c = cube.caseParId(id);
      if (c) ouvrirBulleCase(c);
    }
  );

  /* ---------- Rendu ---------- */

  function rendre() {
    const enArbre = etat.version === 'chc';

    if (!enArbre && cube.version !== etat.version) {
      const version = donnees.versionsParId.get(etat.version);
      cube.construire(version, donnees.vocabulaire);

      const depart = cube.groupe.scale.x;
      animer({
        duree: scene3d.estAllege ? 200 : 420,
        surProgres: (t) => {
          cube.groupe.scale.setScalar(depart + (1 - depart) * t);
        },
      });
    }

    cube.groupe.visible = !enArbre;
    arbre.definirVisible(enArbre);
    etiquettes.definirVisible(!enArbre);

    if (enArbre) {
      const fonction = etat.fonction
        ? donnees.fonctionsParId.get(etat.fonction)
        : null;
      arbre.peindre({
        allumes: new Set(fonction?.chc?.noeuds ?? []),
        diffus: fonction?.chc?.type === 'diffuse',
      });
      arbre.marquerRevision(etat.mode === 'parcours' && etat.etape === 8);
    } else if (cube.cases.length > 0) {
      const fonction = etat.fonction
        ? donnees.fonctionsParId.get(etat.fonction)
        : null;
      cube.peindre({
        proposition: idsProposition(etat, cube.cases),
        reponse:
          etat.etape >= 4
            ? idsReponseGuilford(fonction, cube.cases)
            : new Set(),
      });
    }

    panneau.rendre(etat);
    fonctions.rendre(etat);
    frise.rendre(etat);
    legende.rendre(etat);

    const enProposition = etat.mode === 'parcours' && etat.etape === 3;
    const barreActions = document.getElementById('actions');
    barreActions.hidden = !enProposition;

    const validee = Boolean(etat.proposition?.validee);
    boutonValider.disabled = !etat.fonction || !etat.proposition || validee;
    boutonValider.textContent = validee ? 'Proposition validée' : 'Valider';
    boutonNullePart.disabled = !etat.fonction;
  }

  /* ---------- Démarrage ---------- */

  function appliquerRoute() {
    const route = lireRoute(donnees.etapes);

    if (route.mode === 'libre') {
      changer({
        mode: 'libre',
        etape: DERNIERE_ETAPE,
        version: '1967',
        fonction: 'creativite',
        proposition: null,
      });
      glisserCamera(donnees.etapesParId.get(DERNIERE_ETAPE).camera);
      return;
    }

    const etape = donnees.etapesParId.get(route.etape);
    changer({
      mode: 'parcours',
      etape: route.etape,
      version: etape.version,
      fonction:
        route.etape > 3 ? etat.fonction ?? 'creativite' : etat.fonction,
      proposition: null,
    });
    glisserCamera(etape.camera);
  }

  brancherClavier({
    suivant,
    precedent,
    zoomer,
    recentrer: recadrer,
    fermer: () => bulle.fermer(),
  });

  window.addEventListener('hashchange', appliquerRoute);

  abonner(rendre);
  appliquerRoute();
  scene3d.demarrer();

  requestAnimationFrame(() => {
    chargement.hidden = true;
  });

  mesurerImagesParSeconde(2000).then((imagesParSeconde) => {
    if (imagesParSeconde < 30) scene3d.alleger();
  });
}

demarrer();

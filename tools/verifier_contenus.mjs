#!/usr/bin/env node
/**
 * Contrôle déterministe des données de la page.
 *
 *   node tools/verifier_contenus.mjs            contrôle de cohérence
 *   node tools/verifier_contenus.mjs --strict   exige en plus les 96 exemples
 *
 * Sort en erreur (code 1) sur une incohérence structurelle. Un manque de
 * contenu n'est qu'un avertissement, sauf en mode strict.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict');

const erreurs = [];
const avertissements = [];

const lire = (nom) => {
  try {
    return JSON.parse(readFileSync(join(racine, 'data', `${nom}.json`), 'utf8'));
  } catch (e) {
    erreurs.push(`data/${nom}.json illisible : ${e.message}`);
    return null;
  }
};

const signale = (liste, message) => liste.push(message);
const erreur = (message) => erreurs.push(message);

const STATUTS = new Set(['a_verifier', 'verifie']);
const NIVEAUX_LECTURE = new Set(['vulgarisation', 'intermediaire', 'source']);

const brutVersions = lire('versions');
const cases = lire('cases');
const fonctions = lire('fonctions');
const chc = lire('chc');
const glossaire = lire('glossaire');
const lectures = lire('lectures');
const etapes = lire('etapes');

if (erreurs.length === 0) {
  const { vocabulaire, versions } = brutVersions;

  /* ---- Vocabulaire ---- */
  for (const axe of ['operations', 'contenus', 'produits']) {
    const table = vocabulaire?.[axe] ?? {};
    if (Object.keys(table).length === 0) {
      erreur(`vocabulaire.${axe} est vide.`);
      continue;
    }
    for (const [cle, valeur] of Object.entries(table)) {
      if (!valeur.code) erreur(`vocabulaire.${axe}.${cle} n'a pas de code.`);
      if (!valeur.libelle) erreur(`vocabulaire.${axe}.${cle} n'a pas de libellé.`);
    }
  }

  /* ---- Versions ---- */
  const versionsCubes = versions.filter((v) => v.forme === 'cube');
  const codesParVersion = new Map();

  for (const version of versions) {
    if (!STATUTS.has(version.statut)) {
      erreur(`version ${version.id} : statut « ${version.statut} » inconnu.`);
    }
    if (version.forme !== 'cube') continue;

    const axes = [
      ['operations', version.operations, 'operations'],
      ['contenus', version.contenus, 'contenus'],
      ['produits', version.produits, 'produits'],
    ];

    for (const [nomChamp, valeurs, table] of axes) {
      if (!Array.isArray(valeurs) || valeurs.length === 0) {
        erreur(`version ${version.id} : ${nomChamp} vide.`);
        continue;
      }
      for (const valeur of valeurs) {
        if (!vocabulaire[table]?.[valeur]) {
          erreur(`version ${version.id} : ${nomChamp} « ${valeur} » absent du vocabulaire.`);
        }
      }
    }

    const attendu =
      version.operations.length * version.contenus.length * version.produits.length;
    if (version.cases !== attendu) {
      erreur(
        `version ${version.id} : ${version.cases} cases annoncées, ${attendu} attendues par les axes.`
      );
    }

    const ids = new Set();
    for (const operation of version.operations) {
      for (const produit of version.produits) {
        for (const contenu of version.contenus) {
          ids.add(
            vocabulaire.operations[operation].code +
              vocabulaire.contenus[contenu].code +
              vocabulaire.produits[produit].code
          );
        }
      }
    }
    if (ids.size !== attendu) {
      erreur(`version ${version.id} : les trigrammes ne sont pas uniques (${ids.size} pour ${attendu}).`);
    }
    codesParVersion.set(version.id, ids);
  }

  const version1967 = versionsCubes.find((v) => v.id === '1967');

  /* ---- Cases ---- */
  const idsCases = new Set();
  const casesAvecExemple = new Set();

  for (const entree of cases) {
    if (idsCases.has(entree.id)) erreur(`case ${entree.id} : identifiant en double.`);
    idsCases.add(entree.id);

    for (const champ of ['operation', 'contenu', 'produit']) {
      if (!vocabulaire[`${champ}s`]?.[entree[champ]]) {
        erreur(`case ${entree.id} : ${champ} « ${entree[champ]} » absent du vocabulaire.`);
      }
    }

    if (!Array.isArray(entree.versions) || entree.versions.length === 0) {
      erreur(`case ${entree.id} : champ versions vide.`);
    } else {
      for (const v of entree.versions) {
        if (!brutVersions.versions.some((x) => x.id === v)) {
          erreur(`case ${entree.id} : version « ${v} » inconnue.`);
        }
      }
    }

    if (!STATUTS.has(entree.statut)) {
      erreur(`case ${entree.id} : statut « ${entree.statut} » inconnu.`);
    }

    if (entree.exemple) casesAvecExemple.add(entree.id);
  }

  /* ---- Fonctions ---- */
  for (const fonction of fonctions) {
    if (!STATUTS.has(fonction.statut)) {
      erreur(`fonction ${fonction.id} : statut inconnu.`);
    }

    const g = fonction.guilford;
    if (!g) {
      erreur(`fonction ${fonction.id} : bloc guilford manquant.`);
    } else if (g.type === 'tranche') {
      if (!['operation', 'contenu', 'produit'].includes(g.axe)) {
        erreur(`fonction ${fonction.id} : axe « ${g.axe} » inconnu.`);
      } else if (!vocabulaire[`${g.axe}s`]?.[g.valeur]) {
        erreur(`fonction ${fonction.id} : valeur « ${g.valeur} » absente du vocabulaire.`);
      }
    } else if (!['nulle_part', 'diffuse'].includes(g.type)) {
      erreur(`fonction ${fonction.id} : type guilford « ${g.type} » inconnu.`);
    }

    for (const noeud of fonction.chc?.noeuds ?? []) {
      if (!chc.some((n) => n.id === noeud)) {
        erreur(`fonction ${fonction.id} : nœud CHC « ${noeud} » absent de chc.json.`);
      }
    }
  }

  /* ---- CHC ---- */
  const idsChc = new Set(chc.map((n) => n.id));
  for (const noeud of chc) {
    if (!STATUTS.has(noeud.statut)) erreur(`CHC ${noeud.id} : statut inconnu.`);
    if (noeud.parent && !idsChc.has(noeud.parent)) {
      erreur(`CHC ${noeud.id} : parent « ${noeud.parent} » inconnu.`);
    }
    for (const enfant of noeud.enfants ?? []) {
      if (!idsChc.has(enfant)) {
        erreur(`CHC ${noeud.id} : enfant « ${enfant} » inconnu.`);
        continue;
      }
      const cible = chc.find((n) => n.id === enfant);
      if (cible.parent !== noeud.id) {
        erreur(`CHC ${enfant} : parent déclaré « ${cible.parent} », attendu « ${noeud.id} ».`);
      }
    }
  }

  /* ---- Glossaire ---- */
  const termes = new Set();
  for (const entree of glossaire) {
    if (termes.has(entree.terme)) erreur(`glossaire : « ${entree.terme} » en double.`);
    termes.add(entree.terme);
    if (!entree.definition) erreur(`glossaire : « ${entree.terme} » sans définition.`);
  }

  /* ---- Étapes : balises de glossaire ---- */
  const textes = [
    ...etapes.flatMap((e) => e.texte ?? []),
    ...fonctions.flatMap((f) => Object.values(f.textes ?? {})),
  ];
  for (const texte of textes) {
    for (const trouve of texte.matchAll(/\{\{([^}]+)\}\}/g)) {
      const terme = trouve[1].trim();
      if (!termes.has(terme)) {
        erreur(`balise {{${terme}}} sans entrée au glossaire.`);
      }
    }
  }

  /* ---- Lectures ---- */
  for (const lecture of lectures) {
    if (!NIVEAUX_LECTURE.has(lecture.niveau)) {
      erreur(`lecture « ${lecture.reference} » : niveau « ${lecture.niveau} » inconnu.`);
    }
    if (!STATUTS.has(lecture.statut)) {
      erreur(`lecture « ${lecture.reference} » : statut inconnu.`);
    }
  }

  /* ---- Contenu attendu ---- */
  const tranchesCompletes = [
    'production_divergente',
    'memoire',
    'production_convergente',
    'evaluation',
  ];

  if (version1967) {
    const attendues = [];
    for (const operation of version1967.operations) {
      if (!tranchesCompletes.includes(operation)) continue;
      for (const contenu of version1967.contenus) {
        for (const produit of version1967.produits) {
          attendues.push(
            vocabulaire.operations[operation].code +
              vocabulaire.contenus[contenu].code +
              vocabulaire.produits[produit].code
          );
        }
      }
    }

    const manquantes = attendues.filter((id) => !casesAvecExemple.has(id));
    if (manquantes.length > 0) {
      signale(
        avertissements,
        `Contenu : ${manquantes.length} case(s) des quatre tranches sans exemple (sur ${attendues.length}).`
      );
    }

    if (strict && manquantes.length > 0) {
      erreur(`Mode strict : ${manquantes.length} exemple(s) manquant(s), dont ${manquantes.slice(0, 5).join(', ')}.`);
    }
  }

  const aVerifier = [
    ...cases,
    ...fonctions,
    ...chc,
    ...lectures,
    ...versions,
  ].filter((x) => x.statut === 'a_verifier').length;

  console.log(`Contenus : ${cases.length} case(s), ${casesAvecExemple.size} avec exemple.`);
  console.log(`Encore à vérifier : ${aVerifier} entrée(s).`);
}

for (const message of avertissements) {
  console.log(`Avertissement : ${message}`);
}

for (const message of erreurs) {
  console.error(`Erreur : ${message}`);
}

if (erreurs.length > 0) {
  console.error(`\n${erreurs.length} erreur(s).`);
  process.exit(1);
}

console.log('\nDonnées cohérentes.');

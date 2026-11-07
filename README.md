# Le cube de Guilford

Une visualisation en trois dimensions pour comprendre, puis discuter, deux modèles de l'intelligence :

- le **cube de Guilford** (structure de l'intellect), ses 120 cases de 1967, ses révisions à 150 puis 180 cases ;
- le **modèle hiérarchique CHC** (Cattell, Horn, Carroll), qui remplace le cube par un arbre.

L'objectif est de vulgariser pour des enseignants non spécialistes : la créativité n'est pas une faculté séparée, c'est une tranche du cube, et le CHC n'est pas la vérité définitive.

## Utilisation

Un serveur local est nécessaire : les modules JavaScript et le chargement des données JSON refusent le protocole `file://`.

```sh
python3 -m http.server
```

Puis ouvrir <http://localhost:8000>.

Navigation : souris ou pavé tactile pour tourner et zoomer, flèches gauche et droite au clavier pour changer d'étape, `0` pour recentrer, `Échap` pour fermer une bulle. Une étape peut être ouverte directement par son ancre (`#etape-4`) et le mode libre par `#libre`.

## Contrôle des données

```sh
node tools/verifier_contenus.mjs
node tools/verifier_contenus.mjs --strict
```

Le script vérifie la cohérence des sept fichiers de `data/` (identifiants uniques, valeurs d'axe connues, nœuds du CHC référencés, balises de glossaire résolues) et affiche le nombre d'entrées encore marquées `a_verifier`. Le mode strict exige en plus les 96 exemples des quatre tranches complètes.

## Sources

Les contenus scientifiques sont en cours de vérification et portent tous un statut explicite. Les références citées dans l'application figurent dans `data/lectures.json`.

## Technique

HTML, CSS et JavaScript en modules ES natifs, sans build ni framework. Three.js 0.160.0 est embarqué dans `vendor/three/` et chargé par une import map, pour fonctionner sur les réseaux qui filtrent les CDN. Les contenus vivent dans `data/`, séparés du code.

Licence du moteur : MIT, voir `vendor/three/LICENSE`.

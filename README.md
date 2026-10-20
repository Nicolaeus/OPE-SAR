# OPE-SAR

OPE-SAR est une application web d'aide aux opérations de recherche et sauvetage en mer. Elle centralise une carte opérationnelle, les stations SNSM, la météo, les marées, les calculs SAR et les premiers outils OSC.

Le projet est actuellement une application front-end vanilla JavaScript, sans bundler ni framework applicatif. Les modules sont charges directement par le navigateur via `type="module"`.

## Fonctionnalites

- Carte maritime basée sur Leaflet.
- Sélection et affichage des stations.
- Récupération météo et marine via Open-Meteo.
- Calculs de marées a partir de ports de référence locaux.
- Calcul de dérive SAR depuis une dernière position connue.
- Génération de patterns de recherche: carre expansif, secteur, parallèle, creeping line.
- Première interface OSC pour la conduite de mission.
- Support PWA initial avec manifest et service worker.

## Structure

```text
assets/
  css/                 Styles globaux et composants d'interface
  images/              Images, icones et marqueurs
data/
  coastline/           Limites cotieres GeoJSON/JSON
  stations/            Donnees stations
src/
  core/                Bootstrap, configuration, services, store
  modules/             Modules métier: map, stations, weather, tides, sar, osc
  shared/              UI, constantes, modèles et utilitaires partages
tests/                 Emplacement prévu pour les tests unitaires et intégration
```

## Lancement local

L'application doit être servie par un serveur HTTP local, car elle utilise des modules ES, `fetch()` et un service worker.

Exemples:

```bash
python -m http.server 8000
```

Puis ouvrir:

```text
http://localhost:8000
```

Avec Node.js:

```bash
npx serve .
```

## Sources de donnees

- Stations: `data/stations/stations.json`
- Limites cotières: `data/coastline/*.json`
- Ports de marée: `src/modules/tides/data/tidal_ports.json`
- Météo terrestre: Open-Meteo Forecast API
- Météo marine: Open-Meteo Marine API
- Fonds cartographiques: tuiles externes configurées dans `src/modules/map/layers/BaseLayers.js`

## Mode hors ligne

Le service worker met en cache le socle applicatif et les données locales critiques. Les ressources externes comme les tuiles cartographiques, les polices Google, Leaflet, Chart.js et les API météo dépendent toujours du réseau au premier chargement.

Priorités recommandées pour renforcer le mode hors ligne:

- Ajouter un cache dédié aux derniers bulletins météo et marées consultées.
- Afficher clairement si une donnée vient du réseau ou du cache.
- Héberger localement les dépendances critiques actuellement chargées par CDN.
- Définir une stratégie de cache spécifique pour les tuiles cartographiques.

## Modules principaux

### Carte

Le module `src/modules/map` initialise Leaflet, les fonds de carte et les couches opérationnelles.

### Stations

Le module `src/modules/stations` charge les stations, crée les marqueurs et propage l'événement `station:selected`.

### Meteo

Le module `src/modules/weather` récupère la météo et la mer autour de la station sélectionnée, puis met a jour le widget d’en-tête.

### Marees

Le module `src/modules/tides` calcule la hauteur d'eau courante, les pleines mers, basses mers et coefficients approximatifs depuis les données harmoniques locales.

### SAR

Le module `src/modules/sar` orchestre:

- le placement de la dernière position connue;
- le calcul de dérive;
- l'estimation du DATUM;
- le rayon de recherche;
- la génération de patterns;
- l'affichage cartographique.

### OSC

Le module `src/modules/osc` contient les premiers modèles et services pour la gestion d'une mission OSC: moyens, timeline, secteurs, communications et SITREP.

## Points d'attention

- Plusieurs fichiers `core` et modules futurs sont encore vides ou partiellement préparés.
- Les dossiers de tests existent mais ne contiennent pas encore de tests.
- Certaines dépendances sont chargées par CDN depuis `index.html`.
- Le logo applicatif est disponible dans `assets/images/logos/OPESAR_logo_sf.png`.
- Les données de limites cotières existent aussi dans `src/modules/CoastalLimits/data`, ce qui cree une duplication a nettoyer.

## Prochaines améliorations recommandées

1. Ajouter des tests unitaires sur les calculs SAR, marées et patterns.
2. Nettoyer ou compléter les fichiers vides.
3. Centraliser les appels réseau dans `ApiService`.
4. Mettre en place une vraie persistance offline via `IndexedDB`.
5. Remplacer les `alert()` par une notification UI integree.
6. Rendre les cartes de l'interface compatibles tactile.
7. Héberger localement Leaflet, Chart.js et les polices si l'usage offline est prioritaire.

## Statut

Version applicative déclarée: `21.0.1`.

Le projet est utilisable comme prototype opérationnel avance, mais il doit encore etre durci avant un usage terrain critique.

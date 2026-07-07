# OPE-SAR

OPE-SAR est une application web d'aide aux operations de recherche et sauvetage en mer. Elle centralise une carte operationnelle, les stations SNSM, la meteo, les marees, les calculs SAR et les premiers outils OSC.

Le projet est actuellement une application front-end vanilla JavaScript, sans bundler ni framework applicatif. Les modules sont charges directement par le navigateur via `type="module"`.

## Fonctionnalites

- Carte maritime basee sur Leaflet.
- Selection et affichage des stations.
- Recuperation meteo et marine via Open-Meteo.
- Calculs de marees a partir de ports de reference locaux.
- Calcul de derive SAR depuis une derniere position connue.
- Generation de patterns de recherche: carre expansif, secteur, parallele, creeping line.
- Premiere interface OSC pour la conduite de mission.
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
  modules/             Modules metier: map, stations, weather, tides, sar, osc
  shared/              UI, constantes, modeles et utilitaires partages
tests/                 Emplacement prevu pour les tests unitaires et integration
```

## Lancement local

L'application doit etre servie par un serveur HTTP local, car elle utilise des modules ES, `fetch()` et un service worker.

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
- Limites cotieres: `data/coastline/*.json`
- Ports de maree: `src/modules/tides/data/tidal_ports.json`
- Meteo terrestre: Open-Meteo Forecast API
- Meteo marine: Open-Meteo Marine API
- Fonds cartographiques: tuiles externes configurees dans `src/modules/map/layers/BaseLayers.js`

## Mode hors ligne

Le service worker met en cache le socle applicatif et les donnees locales critiques. Les ressources externes comme les tuiles cartographiques, les polices Google, Leaflet, Chart.js et les API meteo dependent toujours du reseau au premier chargement.

Priorites recommandees pour renforcer le mode hors ligne:

- Ajouter un cache dedie aux derniers bulletins meteo et marees consultees.
- Afficher clairement si une donnee vient du reseau ou du cache.
- Heberger localement les dependances critiques actuellement chargees par CDN.
- Definir une strategie de cache specifique pour les tuiles cartographiques.

## Modules principaux

### Carte

Le module `src/modules/map` initialise Leaflet, les fonds de carte et les couches operationnelles.

### Stations

Le module `src/modules/stations` charge les stations, cree les marqueurs et propage l'evenement `station:selected`.

### Meteo

Le module `src/modules/weather` recupere la meteo et la mer autour de la station selectionnee, puis met a jour le widget d'en-tete.

### Marees

Le module `src/modules/tides` calcule la hauteur d'eau courante, les pleines mers, basses mers et coefficients approximatifs depuis les donnees harmoniques locales.

### SAR

Le module `src/modules/sar` orchestre:

- le placement de la derniere position connue;
- le calcul de derive;
- l'estimation du DATUM;
- le rayon de recherche;
- la generation de patterns;
- l'affichage cartographique.

### OSC

Le module `src/modules/osc` contient les premiers modeles et services pour la gestion d'une mission OSC: moyens, timeline, secteurs, communications et SITREP.

## Points d'attention

- Plusieurs fichiers `core` et modules futurs sont encore vides ou partiellement prepares.
- Les dossiers de tests existent mais ne contiennent pas encore de tests.
- Certaines dependances sont chargees par CDN depuis `index.html`.
- Le logo applicatif est disponible dans `assets/images/logos/OPESAR_logo_sf.png`.
- Les donnees de limites cotieres existent aussi dans `src/modules/CoastalLimits/data`, ce qui cree une duplication a nettoyer.

## Prochaines ameliorations recommandees

1. Ajouter des tests unitaires sur les calculs SAR, marees et patterns.
2. Nettoyer ou completer les fichiers vides.
3. Centraliser les appels reseau dans `ApiService`.
4. Mettre en place une vraie persistance offline via `IndexedDB`.
5. Remplacer les `alert()` par une notification UI integree.
6. Rendre les cartes de l'interface compatibles tactile.
7. Heberger localement Leaflet, Chart.js et les polices si l'usage offline est prioritaire.

## Statut

Version applicative declaree: `21.0.0`.

Le projet est utilisable comme prototype operationnel avance, mais il doit encore etre durci avant un usage terrain critique.

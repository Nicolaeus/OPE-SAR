# Vendor

Ce dossier contient les dépendances tierces embarquées dans OPE-SAR.

## Philosophie

OPE-SAR est conçu pour fonctionner :

- entièrement hors ligne ;
- sans CDN ;
- sans téléchargement dynamique ;
- sans dépendance à un service externe.

Toutes les bibliothèques nécessaires au fonctionnement de l'application
sont stockées localement dans ce dossier.

## Règles

- Une bibliothèque = un sous-dossier.
- Conserver le fichier LICENSE.
- Conserver le README d'origine lorsque disponible.
- Les mises à jour sont réalisées manuellement et testées avant intégration.
- Aucune bibliothèque ne doit effectuer d'appel réseau obligatoire.

## Bibliothèques prévues

- pdf-lib
- Leaflet
- Proj4
- GeoTIFF.js
- MapLibre GL JS (si nécessaire)

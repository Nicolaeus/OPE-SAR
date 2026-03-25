/**
 * SERVICE WORKER - Mission Nautique SAR
 * Gère le cache pour le mode hors-ligne.
 */

const CACHE_NAME = 'mission-nautique-v20'; // Changez le nom pour forcer une mise à jour chez les utilisateurs

// Liste des ressources à mettre en cache immédiatement
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/style.css',
    // Modules JS splittés
    './js/globals.js',
    './js/map-engine.js',
    './js/navigation.js',
    './js/sar-engine.js',
    './js/tide.js',
    './js/weather.js',
    './js/ais.js',
    './js/config.js',
    // Librairies externes (Leaflet)
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    // Icones (ajustez les chemins selon votre dossier assets)
    './assets/favicon.ico'
];

/**
 * 1. INSTALLATION
 * Mise en cache des fichiers statiques.
 */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('SW: Mise en cache des ressources critiques');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    // Force le SW à prendre le contrôle immédiatement
    self.skipWaiting();
});

/**
 * 2. ACTIVATION
 * Nettoyage des anciens caches pour libérer de l'espace.
 */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('SW: Suppression ancien cache', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

/**
 * 3. STRATÉGIE DE FETCH
 * Stratégie : "Cache First, falling back to Network"
 * On intercepte chaque requête pour voir si on l'a en cache.
 */
self.addEventListener('fetch', (event) => {
    // On ne cache pas les requêtes WebSocket (AIS) ou les appels API Météo (données trop changeantes)
    if (event.request.url.includes('aisstream.io') || event.request.url.includes('open-meteo.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Si le fichier est en cache, on le sert
            if (cachedResponse) {
                return cachedResponse;
            }

            // Sinon, on va sur le réseau
            return fetch(event.request).then((networkResponse) => {
                // Optionnel : On peut mettre en cache dynamiquement les fichiers JSON de données (ports, zones)
                if (event.request.url.includes('.json')) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            });
        }).catch(() => {
            // Fallback si tout échoue (offline total et pas en cache)
            console.log('SW: Ressource non disponible offline');
        })
    );
});

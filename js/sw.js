// Nom du cache (à changer à chaque mise à jour majeure du code)
const CACHE_NAME = 'mission-nautique-v1';

// Liste des fichiers à mettre en cache immédiatement (Offline ready)
const ASSETS_TO_CACHE = [
    'index.html',
    'css/style.css',
    'js/app.js',
    'js/coastal.js',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    // Ajoute ici tes icônes
    'assets/icon-192.png'
];

// 1. Installation : On télécharge les ressources critiques
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Installation du cache : OK');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. Activation : On nettoie les vieux caches si nécessaire
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
});

// 3. Stratégie réseau : "Cache First, falling back to Network"
// Très important pour la rapidité sur smartphone
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Si le fichier est en cache, on le donne tout de suite
            if (cachedResponse) {
                return cachedResponse;
            }
            // Sinon, on va le chercher sur Internet
            return fetch(event.request).then((networkResponse) => {
                // Optionnel : On peut mettre en cache dynamiquement les fichiers JSON chargés
                if (event.request.url.includes('.json')) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            });
        })
    );
});

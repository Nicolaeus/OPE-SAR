/**
 * MAP-ENGINE.JS
 * Initialisation Leaflet, gestion des fonds de carte,
 * marqueurs fixes SNSM, badge ETA curseur et logique drag des cards.
 *
 * Dépendances : globals.js (map, baseLayers, rangeCircle, driftLine,
 *               isoLayers, navLine, ports, landMass)
 * Doit être chargé APRÈS globals.js et Leaflet/Turf.
 */

// ============================================================
// 1. INITIALISATION DE LA CARTE
// ============================================================

/**
 * Crée l'instance Leaflet, définit les fonds de carte,
 * charge la masse terrestre et place les marqueurs de station.
 * Appelée une seule fois au boot depuis config.js.
 */
function initMap() {

    // --- Fonds de carte (packs Fond + OpenSeaMap) ---
    baseLayers.osm = L.layerGroup([
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            crossOrigin: true
        }),
        L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenSeaMap contributors'
        })
    ]);

    baseLayers.satellite = L.layerGroup([
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri'
        }),
        L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenSeaMap contributors'
        })
    ]);

    baseLayers.dark = L.layerGroup([
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 20
        }),
        L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenSeaMap contributors'
        })
    ]);

    // --- Création de la carte ---
    map = L.map('map', {
        center: [47.8012, -3.7429],
        zoom: 12,
        zoomControl: false
    });

    // Fond OSM par défaut
    baseLayers.osm.addTo(map);

    // Contrôle zoom repositionné en bas à droite (loin du pouce gauche sur mobile)
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // --- Calque lignes côtières (géré par coastal.js) ---
    // coastalLinesGroup est déclaré dans coastal.js, on l'ajoute à la carte ici
    if (typeof coastalLinesGroup !== 'undefined') {
        coastalLinesGroup.addTo(map);
    }

    // --- Écouteur déplacement carte → rechargement zones côtières ---
    map.on('moveend', () => {
        const toggle = document.getElementById('toggleCoastalLines');
        if (toggle && toggle.checked) {
            const center = map.getCenter();
            if (typeof updateCoastalLines === 'function') {
                updateCoastalLines(center.lat, center.lng);
            }
        }
    });

    // --- Chargement masse terrestre (pour calculs Turf) ---
    loadLandData();

    // --- Marqueurs fixes des stations SNSM ---
    initStationMarkers();

    // --- Badge ETA au survol de la carte ---
    initEtaBadge();
}

// ============================================================
// 2. MASSE TERRESTRE (Turf — détection route/terre)
// ============================================================

async function loadLandData() {
    try {
        const res = await fetch(
            'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements.geojson'
        );
        const data = await res.json();
        landMass = turf.combine(data).features[0];
        // Premier calcul une fois les données disponibles
        if (typeof calculate === 'function') calculate();
    } catch (e) {
        console.error('GeoJSON masse terrestre :', e);
        // On calcule quand même sans détection terre
        if (typeof calculate === 'function') calculate();
    }
}

// ============================================================
// 3. FONDS DE CARTE
// ============================================================

/**
 * Change le fond de carte actif.
 * @param {string} type  Clé dans baseLayers : 'osm' | 'satellite' | 'dark'
 */
function changeMapBase(type) {
    // Retirer tous les fonds actifs
    Object.values(baseLayers).forEach(layer => {
        if (map.hasLayer(layer)) map.removeLayer(layer);
    });

    // Activer le nouveau fond
    if (baseLayers[type]) {
        baseLayers[type].addTo(map);
    }

    // Ramener les calques de calcul au premier plan
    if (driftLine   && map.hasLayer(driftLine))   driftLine.bringToFront();
    if (rangeCircle && map.hasLayer(rangeCircle)) rangeCircle.bringToFront();
    if (navLine     && map.hasLayer(navLine))     navLine.bringToFront();
    isoLayers.forEach(l => { if (map.hasLayer(l)) l.bringToFront(); });
}

// ============================================================
// 4. TOGGLE BALISAGE OPENSEAMAP (seamark séparé)
// ============================================================

let seamarkLayer = null;

/**
 * Active/désactive le calque OpenSeaMap indépendamment du fond de carte.
 * Appelée par le toggle dans la card AIS (index.html).
 */
function toggleAISLayer() {
    const cb = document.getElementById('toggle-ais');
    if (!seamarkLayer) {
        seamarkLayer = L.tileLayer(
            'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
            { maxZoom: 18, zIndex: 1000, opacity: 1 }
        );
    }
    cb.checked ? seamarkLayer.addTo(map)
               : (map.hasLayer(seamarkLayer) && map.removeLayer(seamarkLayer));
}

// ============================================================
// 5. MARQUEURS FIXES — STATIONS SNSM
// ============================================================

function initStationMarkers() {
    const snsmIcon = L.icon({
        iconUrl:    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
        shadowUrl:  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize:   [25, 41],
        iconAnchor: [12, 41],
        popupAnchor:[1, -34],
        shadowSize: [41, 41]
    });

    // On boucle sur ton dataset (stations provient de ton JSON chargé)
    // Note : Assure-toi que 'stations' est accessible (global ou passé en paramètre)
    if (typeof stations !== 'undefined') {
        stations.forEach(station => {
            if (station.localisation && station.localisation.latitude) {
                const marker = L.marker([station.localisation.latitude, station.localisation.longitude], { icon: snsmIcon })
                    .addTo(map);
                
                // AU CLIC : On affiche la card au lieu de la popup Leaflet
                marker.on('click', (e) => {
                    L.DomEvent.stopPropagation(e); // Empêche le clic de se propager à la carte
                    displayStationDetails(station);
                });
            }
        });
    }

    // Fermer la card si on clique ailleurs sur la carte
    map.on('click', () => {
        closeStationCard();
    });
}

// ============================================================
// 6. BADGE ETA AU SURVOL DE LA CARTE
// ============================================================

function initEtaBadge() {
    const badge = document.getElementById('eta-cursor-badge');
    if (!badge) return;

    map.on('mousemove', (e) => {
        // N'afficher que si on n'est pas en mode placement de marqueur
        if (map.getContainer().style.cursor === 'crosshair') {
            badge.style.display = 'none';
            return;
        }

        const portKey  = document.getElementById('portSelector').value;
        const startPos = L.latLng(ports[portKey][0], ports[portKey][1]);
        const distMN   = startPos.distanceTo(e.latlng) / 1852;
        const vitesse  = parseFloat(document.getElementById('dashSpeed').innerText) || 1;
        const timeMin  = (distMN / vitesse) * 60;
        const hours    = Math.floor(timeMin / 60);
        const mins     = Math.round(timeMin % 60);
        const label    = hours > 0 ? `${hours}h${mins}` : `${mins} min`;

        badge.style.display = 'block';
        badge.style.left    = (e.originalEvent.pageX + 15) + 'px';
        badge.style.top     = (e.originalEvent.pageY + 15) + 'px';
        badge.innerHTML     = `⏱️ ${label} (${distMN.toFixed(1)} MN)`;
    });

    map.on('mouseout', () => {
        badge.style.display = 'none';
    });
}

// ============================================================
// 7. RESET ORIENTATION NORD
// ============================================================

/**
 * Recentre la carte au Nord (0°).
 * Appelée par le bouton N du compas.
 */
function resetMapNorth() {
    if (map.setBearing) {
        map.setBearing(0);
    } else {
        map.setView(map.getCenter(), map.getZoom(), { animate: true });
    }
}

// ============================================================
// 8. CARDS FLOTTANTES — DRAG & DROP SOURIS
//    Sur mobile, ce système sera remplacé par sheet-manager.js
// ============================================================

/**
 * Rend une card flottante déplaçable à la souris via son header h4.
 * @param {HTMLElement} el  L'élément .floating-card
 */
function makeDraggable(el) {
    const handle = el.querySelector('h4') || el;
    let x0 = 0, y0 = 0, x1 = 0, y1 = 0;

    handle.addEventListener('mousedown', (e) => {
        // Ne pas déclencher si clic sur un bouton dans le header
        if (e.target.closest('button')) return;

        e.preventDefault();
        el.style.bottom = 'auto'; // Désancre du bas si positionné ainsi

        x0 = e.clientX;
        y0 = e.clientY;

        const onMove = (e) => {
            x1 = x0 - e.clientX;
            y1 = y0 - e.clientY;
            x0 = e.clientX;
            y0 = e.clientY;
            el.style.top  = (el.offsetTop  - y1) + 'px';
            el.style.left = (el.offsetLeft - x1) + 'px';
        };

        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup',   onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup',   onUp);
    });
}

/**
 * COASTAL.JS
 * Chargement et affichage des limites côtières pré-calculées
 * (300m / 2MN / 6MN / 12MN) depuis les fichiers GeoJSON locaux.
 *
 * Dépendances : map (globals.js / map-engine.js)
 * Doit être chargé APRÈS map-engine.js.
 */

// ============================================================
// 1. ÉTAT
// ============================================================

// Déclaré ici — map-engine.js l'ajoute à la carte via coastalLinesGroup.addTo(map)
let coastalLinesGroup  = L.layerGroup();
let currentLoadedZone  = null;
let coastalPaneCreated = false;

// ============================================================
// 2. INDEX DES ZONES GÉOGRAPHIQUES
//    Format : [latMin, lngMin, latMax, lngMax]
// ============================================================

const coastalZones = {
    "nord":            [50.0,  1.5,  51.1,  2.6 ],
    "manche":          [49.2,  0.0,  50.2,  1.6 ],
    "normandie":       [48.4, -2.1,  49.8,  0.1 ],
    "bretagne_ne":     [48.4, -2.83, 49.2, -1.9 ],
    "bretagne_no":     [48.4, -5.2,  49.2, -2.83],
    "bretagne_so":     [47.3, -5.2,  48.5, -3.20],
    "bretagne_se":     [47.3, -3.20, 48.5, -2.0 ],
    "atlantique_nord": [45.6, -3.0,  47.4, -1.0 ],
    "atlantique_sud":  [43.3, -2.0,  45.7, -1.0 ],
    "med_ouest":       [42.0,  3.0,  44.0,  4.8 ],
    "med_centre":      [42.0,  4.8,  44.0,  6.5 ],
    "med_est":         [42.0,  6.5,  44.0,  7.8 ]
};

// ============================================================
// 3. CHARGEMENT D'UNE ZONE
// ============================================================

/**
 * Charge le fichier GeoJSON de la zone côtière correspondant à (lat, lng).
 * Ne recharge pas si la zone est déjà active.
 *
 * @param {number} lat
 * @param {number} lng
 */
async function loadCoastalZone(lat, lng) {
    // Trouver la zone
    let zoneName = null;
    for (const [name, b] of Object.entries(coastalZones)) {
        if (lat >= b[0] && lat <= b[2] && lng >= b[1] && lng <= b[3]) {
            zoneName = name; break;
        }
    }
    if (!zoneName || zoneName === currentLoadedZone) return;

    // Créer le pane Leaflet une seule fois (z-index entre tuiles et marqueurs)
    if (!coastalPaneCreated) {
        const pane = map.createPane('coastalPane');
        pane.style.zIndex = 450;
        pane.style.pointerEvents = 'none';
        coastalPaneCreated = true;
    }

    try {
        // Les fichiers JSON sont dans data/zones_nav/
        const response = await fetch(`data/zones_nav/zones_${zoneName}.json`);
        if (!response.ok) {
            console.warn(`Coastal: fichier zones_${zoneName}.json introuvable`);
            return;
        }
        const data = await response.json();

        coastalLinesGroup.clearLayers();

        L.geoJSON(data, {
            pane: 'coastalPane',
            style: (feature) => {
                const lim = feature.properties.limite;
                if (lim === '300m') return { color: '#f87171', weight: 2,   dashArray: '5,8', opacity: 0.8 };
                if (lim === '2MN')  return { color: '#fbbf24', weight: 2.5,                   opacity: 0.8 };
                if (lim === '6MN')  return { color: '#34d399', weight: 2.5,                   opacity: 0.8 };
                if (lim === '12MN') return { color: '#60a5fa', weight: 2.5,                   opacity: 0.7 };
                return { color: '#ffffff', weight: 1 };
            }
        }).addTo(coastalLinesGroup);

        currentLoadedZone = zoneName;
        console.log('⚓ Zone côtière chargée :', zoneName);
    } catch (e) {
        console.error('Coastal — erreur chargement JSON :', e);
    }
}

/**
 * Alias appelé par map-engine.js sur l'événement moveend.
 * Même signature que loadCoastalZone.
 */
function updateCoastalLines(lat, lng) {
    loadCoastalZone(lat, lng);
}

// ============================================================
// 4. TOGGLE (depuis la card Sélecteur de carte)
// ============================================================

/**
 * Active ou désactive l'affichage des lignes côtières.
 * @param {boolean} isEnabled  État du checkbox dans l'UI
 */
function toggleCoastalLayers(isEnabled) {
    const toggle  = document.getElementById('toggleCoastalLines');
    const checked = toggle ? toggle.checked : isEnabled;

    if (checked) {
        const center = map.getCenter();
        loadCoastalZone(center.lat, center.lng);
        coastalLinesGroup.addTo(map);
    } else {
        if (map.hasLayer(coastalLinesGroup)) map.removeLayer(coastalLinesGroup);
    }
}

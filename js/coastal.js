
/* --- GESTION DES LIGNES CÔTIÈRES PRÉ-CALCULÉES (300m / 2MN / 6MN / 12MN) --- */
let coastalLinesGroup = L.layerGroup();
let currentLoadedZone = null;
let coastalPaneCreated = false;

// Coordonnées des zones (identiques à ton script Python)
const coastalZones = {
    "nord": [50.0, 1.5, 51.1, 2.6],
    "manche": [49.2, 0.0, 50.2, 1.6],
    "normandie": [48.4, -2.1, 49.8, 0.1],
    "bretagne_ne": [48.4, -2.83, 49.2, -1.9],
    "bretagne_no": [48.4, -5.2, 49.2, -2.83],
    "bretagne_so": [47.3, -5.2, 48.5, -3.20],
    "bretagne_se": [47.3, -3.20, 48.5, -2.0],
    "atlantique_nord": [45.6, -3.0, 47.4, -1.0],
    "atlantique_sud": [43.3, -2.0, 45.7, -1.0],
    "med_ouest": [42.0, 3.0, 44.0, 4.8],
    "med_centre": [42.0, 4.8, 44.0, 6.5],
    "med_est": [42.0, 6.5, 44.0, 7.8]
};

async function loadCoastalZone(lat, lng) {
    // 1. Trouver la zone
    let zoneName = null;
    for (const [name, b] of Object.entries(coastalZones)) {
        if (lat >= b[0] && lat <= b[2] && lng >= b[1] && lng <= b[3]) {
            zoneName = name;
            break;
        }
    }

    if (!zoneName || zoneName === currentLoadedZone) return;

    // 2. Préparer le Pane (si pas fait)
    if (!coastalPaneCreated) {
        const pane = map.createPane('coastalPane');
        pane.style.zIndex = 450;
        pane.style.pointerEvents = 'none';
        coastalPaneCreated = true;
    }

    // 3. Charger le JSON
    try {
        const response = await fetch(`zones_${zoneName}.json`);
        if (!response.ok) return;
        const data = await response.json();

        coastalLinesGroup.clearLayers(); // On vide l'ancienne zone

        L.geoJSON(data, {
            pane: 'coastalPane',
            style: function(feature) {
                const lim = feature.properties.limite;
                if (lim === '300m') return { color: '#f87171', weight: 2, dashArray: '5,8', opacity: 0.8 };
                if (lim === '2MN')  return { color: '#fbbf24', weight: 2.5, opacity: 0.8 };
                if (lim === '6MN')  return { color: '#34d399', weight: 2.5, opacity: 0.8 };
                if (lim === '12MN') return { color: '#60a5fa', weight: 2.5, opacity: 0.7 };
                return { color: '#ffffff', weight: 1 };
            }
        }).addTo(coastalLinesGroup);

        currentLoadedZone = zoneName;
        console.log("⚓ Zone chargée : " + zoneName);
    } catch (e) {
        console.error("Erreur chargement JSON côte:", e);
    }
}

function toggleCoastalLayers(isEnabled) {
    const toggleBtn = document.getElementById('toggleCoastalLines');
    const checked = toggleBtn ? toggleBtn.checked : isEnabled;

    if (checked) {
        const center = map.getCenter();
        loadCoastalZone(center.lat, center.lng);
        coastalLinesGroup.addTo(map);
    } else {
        map.removeLayer(coastalLinesGroup);
    }
}

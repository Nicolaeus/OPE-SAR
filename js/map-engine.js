/**
 * MAP-ENGINE.JS
 * Gestion de Leaflet, des fonds de carte et des conversions de coordonnées.
 */

/**
 * 1. INITIALISATION DE LA CARTE
 */
function initMap() {
    // Création de l'objet map (variable globale définie dans globals.js)
    map = L.map('map', {
        center: [47.75, -3.5], // Centré par défaut sur la zone Bretagne Sud
        zoom: 10,
        zoomControl: false
    });

    // Ajout du contrôle de zoom en bas à droite
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Définition des fonds de carte
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    });

    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri'
    });

    // On stocke dans l'objet global baseLayers
    window.baseLayers = {
        "osm": osm,
        "sat": satellite
    };

    // On active OSM par défaut
    osm.addTo(map);
    
    // On prépare le calque pour les plages (beachLayer est global)
    beachLayer.addTo(map);
    loadBeachData();
}

/**
 * 2. GESTION DES COUCHES ET FONDS DE CARTE
 */
function changeMapBase(type) {
    // Retirer toutes les couches de base actives
    Object.values(baseLayers).forEach(layer => {
        if (map.hasLayer(layer)) map.removeLayer(layer);
    });
    
    // Activer la nouvelle couche
    if (baseLayers[type]) {
        baseLayers[type].addTo(map);
    }
    
    // Assurer que les éléments de calcul (dérives, zones) restent au-dessus
    if (typeof driftLine !== 'undefined' && driftLine && map.hasLayer(driftLine)) driftLine.bringToFront();
    if (typeof rangeCircle !== 'undefined' && rangeCircle && map.hasLayer(rangeCircle)) rangeCircle.bringToFront();
    if (typeof searchArea !== 'undefined' && searchArea && map.hasLayer(searchArea)) searchArea.bringToFront();

    // Gestion du calque AIS/Seamark si coché
    const cb = document.getElementById('toggle-ais');
    if (cb && cb.checked && typeof aisLayer !== 'undefined' && aisLayer) {
        aisLayer.addTo(map);
    }
}

let seamarkLayer = null;
function toggleAISLayer() {
    const cb = document.getElementById('toggle-ais');
    if (!seamarkLayer) {
        seamarkLayer = L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
            maxZoom: 18,
            zIndex: 1000,
            opacity: 1
        });
    }
    
    if (cb.checked) {
        seamarkLayer.addTo(map);
    } else {
        if (map.hasLayer(seamarkLayer)) map.removeLayer(seamarkLayer);
    }
}

/**
 * 3. DONNÉES ET MARQUEURS (Plages)
 */
async function loadBeachData() {
    try {
        const response = await fetch('data/postes_plages.json');
        if (!response.ok) return;
        const data = await response.json();

        data.postes.forEach(poste => {
            const marker = L.marker(poste.coords, {
                icon: L.divIcon({
                    className: 'beach-icon',
                    html: '<i class="fas fa-life-ring"></i>',
                    iconSize: [24, 24]
                })
            }).addTo(beachLayer);

            marker.bindPopup(`<b>${poste.plage}</b><br>Infrastructure: ${poste.infrastructure.type}`);

            if (poste.zone_bain && poste.zone_bain.coordinates) {
                L.polygon(poste.zone_bain.coordinates, {
                    color: poste.zone_bain.couleur || '#3b82f6',
                    weight: 2,
                    fillOpacity: 0.3
                }).addTo(beachLayer);
            }
        });
    } catch (e) {
        console.error("Erreur chargement postes :", e);
    }
}

/**
 * 4. CONVERSIONS ET COORDONNÉES
 */
function dmsToDecimal(deg, min, sec, hem) {
    let val = parseFloat(deg) + parseFloat(min) / 60 + parseFloat(sec) / 3600;
    return (hem === 'S' || hem === 'W') ? -val : val;
}

function updateDmsFieldsFromLatLng(lat, lng) {
    const latD = Math.floor(Math.abs(lat));
    const latM = Math.floor((Math.abs(lat) - latD) * 60);
    const latS = Math.round(((Math.abs(lat) - latD) * 60 - latM) * 60);
    const latH = lat >= 0 ? 'N' : 'S';

    const lngD = Math.floor(Math.abs(lng));
    const lngM = Math.floor((Math.abs(lng) - lngD) * 60);
    const lngS = Math.round(((Math.abs(lng) - lngD) * 60 - lngM) * 60);
    const lngH = lng >= 0 ? 'E' : 'W';

    if (document.getElementById('latDeg')) {
        document.getElementById('latDeg').value = latD;
        document.getElementById('latMin').value = latM;
        document.getElementById('latSec').value = latS;
        document.getElementById('latHem').value = latH;
        document.getElementById('lngDeg').value = lngD;
        document.getElementById('lngMin').value = lngM;
        document.getElementById('lngSec').value = lngS;
        document.getElementById('lngHem').value = lngH;
    }
}

function updateLkpFromDms() {
    const lat = dmsToDecimal(
        document.getElementById('latDeg').value,
        document.getElementById('latMin').value,
        document.getElementById('latSec').value,
        document.getElementById('latHem').value
    );
    const lng = dmsToDecimal(
        document.getElementById('lngDeg').value,
        document.getElementById('lngMin').value,
        document.getElementById('lngSec').value,
        document.getElementById('lngHem').value
    );

    const pos = L.latLng(lat, lng);
    
    if (vsdMarker) {
        vsdMarker.setLatLng(pos);
    } else {
        vsdMarker = L.marker(pos, { draggable: true }).addTo(map);
    }
    
    map.panTo(pos);
    if (typeof updateDrift === 'function') updateDrift();
    if (typeof calculate === 'function') calculate();
}

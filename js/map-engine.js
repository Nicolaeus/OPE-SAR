async function loadBeachData() {
    try {
        const response = await fetch('data/postes_plages.json');
        const data = await response.json();

        data.postes.forEach(poste => {
            // 1. Création du Marqueur (Le Poste)
            const marker = L.marker(poste.coords, {
                icon: L.divIcon({
                    className: 'beach-icon',
                    html: '<i class="fas fa-life-ring"></i>',
                    iconSize: [24, 24]
                })
            }).addTo(beachLayer);

            marker.bindPopup(`<b>${poste.plage}</b><br>Infrastructure: ${poste.infrastructure.type}`);

            // 2. Création de la Zone de Bain (Le Polygone)
            if (poste.zone_bain && poste.zone_bain.coordinates) {
                L.polygon(poste.zone_bain.coordinates, {
                    color: poste.zone_bain.couleur || '#3b82f6',
                    weight: 2,
                    fillOpacity: 0.3
                }).addTo(beachLayer);
            }
        });

    } catch (e) {
        console.error("Erreur lors du chargement des postes :", e);
    }
}

/**
 * ============================================================
 * SECTION : GESTION DES COUCHES ET FONDS DE CARTE
 * ============================================================
 */

function changeMapBase(type) {
    Object.values(baseLayers).forEach(layer => {
        if (map.hasLayer(layer)) map.removeLayer(layer);
    });
    
    if (baseLayers[type]) {
        baseLayers[type].addTo(map);
    }
    
    if (typeof driftLine !== 'undefined' && driftLine && map.hasLayer(driftLine)) {
        driftLine.bringToFront();
    }
    
    if (typeof rangeCircle !== 'undefined' && rangeCircle && map.hasLayer(rangeCircle)) {
        rangeCircle.bringToFront();
    }
    
    if (typeof searchArea !== 'undefined' && searchArea && map.hasLayer(searchArea)) {
        searchArea.bringToFront();
    }

    if (document.getElementById('toggle-ais') && document.getElementById('toggle-ais').checked) {
        if (typeof aisLayer !== 'undefined' && aisLayer) {
            aisLayer.addTo(map);
        }
    }
}

let seamarkLayer = null;
function toggleAISLayer() {
    const cb=document.getElementById('toggle-ais');
    if(!seamarkLayer) seamarkLayer=L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',{maxZoom:18,zIndex:1000,opacity:1});
    cb.checked ? seamarkLayer.addTo(map) : (map.hasLayer(seamarkLayer)&&map.removeLayer(seamarkLayer));
}

// --- CONFIGURATION DES FONDS DE CARTE ---
// voir au début du code script

// On garde l'OSM par défaut au démarrage
baseLayers.osm.addTo(map);

/**
 * Change la couche de fond de la carte
 * @param {string} type - Clé correspondant à l'objet baseLayers (osm, satellite, bathy, etc.)
 */
function changeMapBase(type) {
    // 1. Nettoyage : Retirer toutes les couches de base actives
    // On boucle sur l'objet baseLayers pour tout nettoyer proprement
    Object.values(baseLayers).forEach(layer => {
        if (map.hasLayer(layer)) map.removeLayer(layer);
    });
    
    // 2. Activation : Ajouter la nouvelle couche sélectionnée
    // Cela ajoute le "pack" (Fond + Balisage) défini dans ton objet baseLayers
    if (baseLayers[type]) {
        baseLayers[type].addTo(map);
    }
    
    // 3. Superposition : Ramener les éléments de calcul au-dessus
    // Note : bringToFront() fonctionne sur les lignes et cercles, pas sur les marqueurs
    
    // La ligne de dérive (Drift Line)
    if (typeof driftLine !== 'undefined' && driftLine && map.hasLayer(driftLine)) {
        driftLine.bringToFront();
    }
    
    // Le cercle de rayon d'action (Range Circle)
    if (typeof rangeCircle !== 'undefined' && rangeCircle && map.hasLayer(rangeCircle)) {
        rangeCircle.bringToFront();
    }
    
    // Les cercles de probabilité ou zones de recherche
    if (typeof searchArea !== 'undefined' && searchArea && map.hasLayer(searchArea)) {
        searchArea.bringToFront();
    }

    // Gestion de l'AIS si la case est cochée
    if (document.getElementById('toggle-ais') && document.getElementById('toggle-ais').checked) {
        if (typeof aisLayer !== 'undefined' && aisLayer) {
            aisLayer.addTo(map); // On s'assure qu'elle est ajoutée après le fond
        }
    }
}

// À ajouter dans map-engine.js
/**
 * Met à jour les champs DMS de l'interface à partir d'une position Lat/Lng
 */
function updateDmsFieldsFromLatLng(lat, lng) {
    const latD = Math.floor(Math.abs(lat));
    const latM = Math.floor((Math.abs(lat) - latD) * 60);
    const latS = Math.round(((Math.abs(lat) - latD) * 60 - latM) * 60);
    const latH = lat >= 0 ? 'N' : 'S';

    const lngD = Math.floor(Math.abs(lng));
    const lngM = Math.floor((Math.abs(lng) - lngD) * 60);
    const lngS = Math.round(((Math.abs(lng) - lngD) * 60 - lngM) * 60);
    const lngH = lng >= 0 ? 'E' : 'W';

    document.getElementById('latDeg').value = latD;
    document.getElementById('latMin').value = latM;
    document.getElementById('latSec').value = latS;
    document.getElementById('latHem').value = latH;

    document.getElementById('lngDeg').value = lngD;
    document.getElementById('lngMin').value = lngM;
    document.getElementById('lngSec').value = lngS;
    document.getElementById('lngHem').value = lngH;
}

/**
 * Place le LKP manuellement à partir des champs DMS du formulaire
 */
function updateLkpFromDms() {
    const lat = dmsToDecimal(
        parseInt(document.getElementById('latDeg').value),
        parseInt(document.getElementById('latMin').value),
        parseInt(document.getElementById('latSec').value),
        document.getElementById('latHem').value
    );
    const lng = dmsToDecimal(
        parseInt(document.getElementById('lngDeg').value),
        parseInt(document.getElementById('lngMin').value),
        parseInt(document.getElementById('lngSec').value),
        document.getElementById('lngHem').value
    );

    const pos = L.latLng(lat, lng);
    
    if (vsdMarker) {
        vsdMarker.setLatLng(pos);
    } else {
        vsdMarker = L.marker(pos, { draggable: true }).addTo(map);
    }
    
    map.panTo(pos);
    updateDrift();
    calculate();
}

// À mettre à la fin de map-engine.js
function dmsToDecimal(deg, min, sec, hem) {
    let val = deg + min / 60 + sec / 3600;
    return (hem === 'S' || hem === 'W') ? -val : val;
}

function updateLkpFromDms() {
    const lat = dmsToDecimal(
        parseInt(document.getElementById('latDeg').value) || 0,
        parseInt(document.getElementById('latMin').value) || 0,
        parseInt(document.getElementById('latSec').value) || 0,
        document.getElementById('latHem').value
    );
    const lng = dmsToDecimal(
        parseInt(document.getElementById('lngDeg').value) || 0,
        parseInt(document.getElementById('lngMin').value) || 0,
        parseInt(document.getElementById('lngSec').value) || 0,
        document.getElementById('lngHem').value
    );

    const pos = L.latLng(lat, lng);
    if (vsdMarker) {
        vsdMarker.setLatLng(pos);
    } else {
        vsdMarker = L.marker(pos, { draggable: true }).addTo(map);
    }
    map.panTo(pos);
    updateDrift();
    calculate();
}

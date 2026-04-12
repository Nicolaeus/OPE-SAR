/**
 * NAVIGATION.JS
 * Calcul du dashboard navire : vitesse réelle, rayon d'action, isochrones.
 * Gestion des états de mer et de visibilité.
 *
 * Dépendances : globals.js (fleet, ports, portCams, seaStates, currentSea,
 *               currentVisibility, rangeCircle, isoLayers, landMass, map)
 *              weather.js (getLiveWeather, updateWebcam)
 *              tide.js    (updateTide)
 *              sar-engine.js (updateDrift)
 */

// ============================================================
// 1. CALCUL PRINCIPAL — DASHBOARD
// ============================================================

/**
 * Recalcule tout à chaque changement d'input header
 * (navire, port, vitesse, mer, visibilité, remorquage).
 */
function calculate() {
    const ship    = fleet[document.getElementById('shipSelector').value];
    const portKey = document.getElementById('portSelector').value;
    const coords  = ports[portKey];
    if (!ship || !coords) return;

    // 1. Météo + webcam
    getLiveWeather(coords[0], coords[1]);
    updateTide();
    updateWebcam(portKey);

    // 2. Vitesse réelle (bridée état de mer + visibilité + vMax navire)
    const vSelected   = parseInt(document.getElementById('vSelector').value.replace('v', ''));
    let finalVitesse  = Math.min(vSelected, ship.vMax, seaStates[currentSea].vLimit);
    if (currentVisibility === 'night' || currentVisibility === 'fog') {
        finalVitesse = Math.min(finalVitesse, 10);
    }

    // 3. Rayon d'action (avec malus remorquage et état de mer)
    const isTowing = document.getElementById('towCheck').checked;
    let r = ship.rangeNominal / seaStates[currentSea].fuelMulti;
    if (isTowing) r /= ship.towPenalty;

    // 4. Mise à jour dashboard
    document.getElementById('dashShip').innerText  = ship.name;
    document.getElementById('dashSpeed').innerText = finalVitesse + ' kts';
    document.getElementById('dashRange').innerText = r.toFixed(1) + ' MN';
    document.getElementById('dashTank').innerText  = ship.tank + ' L';
    document.getElementById('dashCons').innerText  = ship.cons;

    // 5. Nettoyage anciens tracés
    if (rangeCircle) map.removeLayer(rangeCircle);
    isoLayers.forEach(l => map.removeLayer(l));
    isoLayers = [];

    // 6. Cercle d'autonomie (découpé sur la masse terrestre si disponible)
    try {
        const circleTurf = turf.circle([coords[1], coords[0]], r, { units: 'nauticalmiles' });
        let finalGeo = circleTurf;
        if (landMass) {
            const diff = turf.difference(circleTurf, landMass);
            if (diff) finalGeo = diff;
        }
        rangeCircle = L.geoJSON(finalGeo, {
            style: { color: isTowing ? '#ef6c00' : '#1565c0', weight: 3, fillOpacity: 0.1 }
        }).addTo(map);
    } catch (e) { console.warn('Turf — rayon d\'action:', e); }

    // 7. Isochrones 15 / 30 / 45 / 60 min
    [15, 30, 45, 60].forEach(minutes => {
        const distMN = finalVitesse * (minutes / 60);
        if (distMN > r) return; // Hors autonomie
        try {
            const isoTurf = turf.circle([coords[1], coords[0]], distMN, { units: 'nauticalmiles' });
            let isoGeo = isoTurf;
            if (landMass) {
                const diff = turf.difference(isoTurf, landMass);
                if (diff) isoGeo = diff;
            }
            const layer = L.geoJSON(isoGeo, {
                style: { color: '#2e7d32', weight: 1, dashArray: '5, 8', fill: false }
            }).addTo(map).bindTooltip(`${minutes} min`, { sticky: true, opacity: 0.6 });
            isoLayers.push(layer);
        } catch (e) { console.warn('Turf — isochrone:', e); }
    });

    // 8. Recentrage carte sur le port
    map.panTo(coords);

    // 9. Mise à jour lignes côtières si actives
    const toggleCoastal = document.getElementById('toggleCoastalLines');
    if (toggleCoastal && toggleCoastal.checked && typeof updateCoastalLines === 'function') {
        updateCoastalLines(coords[0], coords[1]);
    }

    // 10. Recalcul dérive SAR si un LKP est posé
    if (typeof updateDrift === 'function') updateDrift();
}

// ============================================================
// 2. ÉTAT DE MER
// ============================================================

/**
 * Appelée par les boutons BELLE / FORMÉE / FORTE dans le header.
 * @param {number}      level  Index dans seaStates (0 | 1 | 2)
 * @param {HTMLElement} btn    Bouton cliqué (pour activer la classe)
 */
function setSea(level, btn) {
    currentSea = level;
    document.querySelectorAll('.sea-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    calculate();
}

// ============================================================
// 3. VISIBILITÉ
// ============================================================

/**
 * Appelée par les boutons Jour / Nuit / Brouillard dans le header.
 * @param {string|boolean} mode  'day' | 'night' | 'fog'  (true → 'day')
 * @param {HTMLElement}    btn
 */
function setVis(mode, btn) {
    // Normalisation (le bouton Jour passe true depuis le HTML original)
    currentVisibility = (mode === true) ? 'day' : mode;

    btn.parentElement.querySelectorAll('.sea-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Filtre visuel sur la carte
    const mapEl = document.getElementById('map');
    if (mapEl) {
        if (currentVisibility === 'fog')   mapEl.style.filter = 'contrast(0.7) brightness(1.1) blur(0.5px)';
        else if (currentVisibility === 'night') mapEl.style.filter = 'brightness(0.6) contrast(1.2)';
        else                               mapEl.style.filter = '';
    }

    calculate();
}

// ============================================================
// 4. UTILITAIRE GÉODÉSIQUE
// ============================================================

/**
 * Calcule la position d'arrivée à partir d'un point, d'un cap et d'une distance.
 * Formule de Vincenty simplifiée (sphère).
 *
 * @param  {L.LatLng} latlng  Point de départ
 * @param  {number}   brng    Cap en degrés (0 = Nord)
 * @param  {number}   dist    Distance en mètres
 * @returns {L.LatLng}
 */
function calculateDestination(latlng, brng, dist) {
    const R  = 6371e3;
    const d  = dist / R;
    const θ  = brng * Math.PI / 180;
    const φ1 = latlng.lat * Math.PI / 180;
    const λ1 = latlng.lng * Math.PI / 180;
    const φ2 = Math.asin(Math.sin(φ1) * Math.cos(d) + Math.cos(φ1) * Math.sin(d) * Math.cos(θ));
    const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(d) * Math.cos(φ1), Math.cos(d) - Math.sin(φ1) * Math.sin(φ2));
    return L.latLng(φ2 * 180 / Math.PI, λ2 * 180 / Math.PI);
}/**
 * NAVIGATION.JS
 * Moteur de calcul opérationnel : Route, Consommation, ETA et Zigzag.
 */

/**
 * Calcule une destination à partir d'un point, d'un cap et d'une distance (mètres)
 */
function calculateDestination(latlng, brng, dist) {
    const R = 6371e3; 
    const d = dist / R;
    const θ = brng * Math.PI / 180;
    const φ1 = latlng.lat * Math.PI / 180;
    const λ1 = latlng.lng * Math.PI / 180;

    const φ2 = Math.asin(Math.sin(φ1) * Math.cos(d) + Math.cos(φ1) * Math.sin(d) * Math.cos(θ));
    const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(d) * Math.cos(φ1), Math.cos(d) - Math.sin(φ1) * Math.sin(φ2));

    return L.latLng(φ2 * 180 / Math.PI, λ2 * 180 / Math.PI);
}

/**
 * Convertit DMS en Décimal
 */
function dmsToDecimal(deg, min, sec, hem) {
    let val = deg + min / 60 + sec / 3600;
    return (hem === 'S' || hem === 'W') ? -val : val;
}

/**
 * FONCTION PRINCIPALE : CALCUL DU DASHBOARD
 * Appelé à chaque changement d'input (Navire, Port, Vitesse, Météo)
 */
function calculate() {
    const shipKey = document.getElementById('shipSelector').value;
    const ship = fleet[shipKey];
    const portKey = document.getElementById('portSelector').value;
    const coords = ports[portKey];

    if (!ship || !coords) return;

    // 1. Mise à jour de la Webcam (Spécifique au port)
    updateWebcam(portKey);

    // 2. Récupération météo si nécessaire
    if (typeof getLiveWeather === 'function') getLiveWeather(coords[0], coords[1]);

    // 3. Calcul de la vitesse finale (Bridage Mer / Visibilité / Navire)
    const vSelected = parseInt(document.getElementById('vSelector').value.replace('v', ''));
    let finalVitesse = Math.min(vSelected, ship.vMax, seaStates[currentSea].vLimit);
    
    // Bridage Visibilité (Nuit/Brouillard)
    if (currentVisibility === 'night' || currentVisibility === 'fog') {
        finalVitesse = Math.min(finalVitesse, 10); 
    }

    window.currentVitesse = finalVitesse; // Partage pour le module SAR

    // 4. LOGIQUE DE ZIGZAG (Louvoyage face à la houle)
    // On augmente la distance à parcourir si la houle est forte et de face
    let distMultiplier = 1.0;
    if (window.currentSwellHeight > 2.0) {
        // Dans app(2).js, on applique un ratio si la mer est 'rough'
        distMultiplier = (currentSea === 'rough') ? 1.3 : 1.15;
    }

    // 5. Calculs de distance Port <-> LKP
    const startPoint = L.latLng(coords);
    const endPoint = vsdMarker ? vsdMarker.getLatLng() : startPoint;
    const distanceMeters = map.distance(startPoint, endPoint);
    const distanceNM = (distanceMeters / 1852) * distMultiplier;

    // 6. Consommation et Autonomie
    const fuelCons = parseInt(ship.cons);
    const fuelNeeded = (distanceNM / finalVitesse) * fuelCons;
    // Autonomie basée sur la conso horaire et l'état de la mer
    const rangeNM = (ship.tank / fuelCons) * finalVitesse / seaStates[currentSea].fuelMulti;

    // 7. Mise à jour de l'UI Dashboard
    updateNavigationUI(distanceNM, finalVitesse, fuelNeeded, rangeNM, ship);
    
    // 8. Tracés sur la carte
    renderNavigationMap(startPoint, endPoint, rangeNM);
}

function updateWebcam(portKey) {
    const cams = {
        'PortManec\'h': 'port-manech', 
        'Concarneau': 'concarneau/ville-close', 
        'BegMeil': 'fouesnant/beg-meil'
    };
    const frame = document.getElementById('webcam-frame');
    if (frame && cams[portKey]) {
        const newSrc = `https://www.skaping.com/snsm/${cams[portKey]}`;
        if (frame.src !== newSrc) frame.src = newSrc;
    }
}

function updateNavigationUI(dist, speed, fuel, range, ship) {
    document.getElementById('dashSpeed').innerText = speed + " kts";
    document.getElementById('dashDist').innerText = dist.toFixed(1) + " NM";
    document.getElementById('dashFuel').innerText = Math.round(fuel) + " L";
    
    const rangeEl = document.getElementById('dashRange');
    if (rangeEl) {
        rangeEl.innerText = Math.round(range) + " NM";
        // Alerte visuelle si le carburant est insuffisant pour l'aller-retour (ou l'aller simple selon ta logique)
        rangeEl.style.color = (range < dist) ? '#ef4444' : '#34d399';
    }
}

function renderNavigationMap(start, end, rangeNM) {
    // Ligne Port -> LKP
    if (navLine) map.removeLayer(navLine);
    navLine = L.polyline([start, end], {
        color: '#3b82f6',
        weight: 3,
        dashArray: '10, 10',
        opacity: 0.6
    }).addTo(map);

    // Cercle d'autonomie
    if (rangeCircle) map.removeLayer(rangeCircle);
    rangeCircle = L.circle(start, {
        radius: rangeNM * 1852,
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.05,
        weight: 2
    }).addTo(map);
}

/**
 * Utilitaires pour les boutons de temps (+15, +30, Now)
 */
function addTimeDepart(mins) {
    const input = document.getElementById('timeDepart');
    if (!input) return;
    let [h, m] = input.value.split(':').map(Number);
    let d = new Date();
    d.setHours(h, m + mins);
    input.value = d.getHours().toString().padStart(2, '0') + ":" + d.getMinutes().toString().padStart(2, '0');
    calculate();
}

function setDepartNow() {
    const now = new Date();
    const val = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    document.getElementById('timeDepart').value = val;
    calculate();
}

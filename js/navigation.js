/**
 * NAVIGATION.JS
 * Moteur de calcul géodésique, logique de navigation et Dashboard.
 */

// ============================================================
// SECTION 1 : OUTILS GÉODÉSIQUES (PURS)
// ============================================================

/**
 * Calcule une destination à partir d'un point, d'un cap et d'une distance
 */
function calculateDestination(latlng, brng, dist) {
    const R = 6371e3; // Rayon de la Terre en mètres
    const d = dist / R;
    const θ = brng * Math.PI / 180;
    const φ1 = latlng.lat * Math.PI / 180;
    const λ1 = latlng.lng * Math.PI / 180;

    const φ2 = Math.asin(Math.sin(φ1) * Math.cos(d) + Math.cos(φ1) * Math.sin(d) * Math.cos(θ));
    const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(d) * Math.cos(φ1), Math.cos(d) - Math.sin(φ1) * Math.sin(φ2));

    return L.latLng(φ2 * 180 / Math.PI, λ2 * 180 / Math.PI);
}

/**
 * Convertit DMS en Décimal pour les calculs
 */
function dmsToDecimal(deg, min, sec, hem) {
    let val = deg + min / 60 + sec / 3600;
    return (hem === 'S' || hem === 'W') ? -val : val;
}

// ============================================================
// SECTION 2 : LOGIQUE MÉTIER & DASHBOARD
// ============================================================

function calculate() {
    // 1. Récupération des données d'entrée
    const shipKey = document.getElementById('shipSelector').value;
    const ship = fleet[shipKey];
    const portKey = document.getElementById('portSelector').value;
    const coords = ports[portKey];

    if (!ship || !coords) return;

    // 2. Mise à jour environnementale locale
    if (typeof getLiveWeather === 'function') getLiveWeather(coords[0], coords[1]);
    if (typeof updateTide === 'function') updateTide();
    
    // 3. Calcul de la vitesse réelle (bridée par mer/visibilité)
    const vSelected = parseInt(document.getElementById('vSelector').value.replace('v', ''));
    let finalVitesse = Math.min(vSelected, ship.vMax, seaStates[currentSea].vLimit);
    
    if (currentVisibility === 'night' || currentVisibility === 'fog') {
        finalVitesse = Math.min(finalVitesse, 10); 
    }

    // --- LOGIQUE ZIGZAG (LOUVOYAGE) ---
    // Si la houle est de face (> 2m) et angle < 45°, on applique une pénalité de distance
    const swellDir = parseFloat(document.getElementById('swellDir').value) || 0;
    // On estime ici un cap simplifié vers le LKP si présent, sinon vers le large
    let distMultiplier = 1.0;
    if (window.currentSwellHeight > 2.0) {
        distMultiplier = 1.25; // On parcourt 25% de distance en plus pour louvoyer
        console.log("🌊 Mer forte : calcul avec louvoyage (Distance x1.25)");
    }

    // 4. Calcul de distance et autonomie
    const lkpCoords = vsdMarker ? vsdMarker.getLatLng() : L.latLng(coords);
    const distanceMètres = map.distance(L.latLng(coords), lkpCoords);
    const distanceNM = (distanceMètres / 1852) * distMultiplier;

    const fuelNeeded = (distanceNM / finalVitesse) * parseInt(ship.cons);
    const rangeNM = (ship.tank / parseInt(ship.cons)) * finalVitesse / seaStates[currentSea].fuelMulti;

    window.currentVitesse = finalVitesse; // Partage pour les autres modules

    // 5. Mise à jour UI
    updateNavigationUI(distanceNM, finalVitesse, fuelNeeded, rangeNM, ship);
    
    // 6. Mise à jour Carte (Lignes et Cercles)
    renderNavigationAssets(coords, lkpCoords, rangeNM);
}

function updateNavigationUI(dist, speed, fuel, range, ship) {
    document.getElementById('dashSpeed').innerText = speed + " kts";
    document.getElementById('dashDist').innerText = dist.toFixed(1) + " NM";
    document.getElementById('dashFuel').innerText = Math.round(fuel) + " L";
    
    const rangeEl = document.getElementById('dashRange');
    if (rangeEl) {
        rangeEl.innerText = Math.round(range) + " NM";
        rangeEl.style.color = (range < dist) ? '#ef4444' : '#34d399';
    }
}

// ============================================================
// SECTION 3 : AFFICHAGE CARTOGRAPHIQUE
// ============================================================

function renderNavigationAssets(portCoords, targetCoords, rangeNM) {
    // Ligne de navigation (Port -> LKP)
    if (navLine) map.removeLayer(navLine);
    navLine = L.polyline([portCoords, targetCoords], {
        color: '#3b82f6',
        weight: 3,
        dashArray: '10, 10',
        opacity: 0.6
    }).addTo(map);

    // Cercle de rayon d'action (Carburant)
    if (rangeCircle) map.removeLayer(rangeCircle);
    rangeCircle = L.circle(portCoords, {
        radius: rangeNM * 1852,
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.1,
        weight: 2
    }).addTo(map);
}

/**
 * Utilitaires pour les boutons de temps
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
    document.getElementById('timeDepart').value = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    calculate();
}

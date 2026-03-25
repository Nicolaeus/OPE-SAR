/**
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

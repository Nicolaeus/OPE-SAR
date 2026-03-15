/**
 * NAVIGATION.JS
 * Moteur de calcul géodésique, logique de navigation et Dashboard.
 */

// ============================================================
// SECTION 1 : OUTILS GÉODÉSIQUES (PURS)
// ============================================================

/**
 * Calcule une destination à partir d'un point, d'un cap et d'une distance
 * @param {L.LatLng} latlng - Point de départ
 * @param {number} brng - Cap en degrés (0-360)
 * @param {number} dist - Distance en mètres
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
 * Déplace un point selon une distance en Milles Nautiques (MN)
 */
function movePoint(latlng, brngDeg, distMN) {
    return calculateDestination(latlng, brngDeg, distMN * 1852);
}

/**
 * Convertit Degrés Minutes Secondes en Décimal
 */
function dmsToDecimal(deg, min, sec, hem) {
    let decimal = deg + (min / 60) + (sec / 3600);
    return (hem === 'S' || hem === 'W') ? -decimal : decimal;
}

/**
 * Met à jour les champs DMS du formulaire à partir d'une position Leaflet
 */
function updateDmsFieldsFromLatLng(lat, lng) {
    const toD = (decimal) => {
        const abs = Math.abs(decimal);
        const deg = Math.floor(abs);
        const minF = (abs - deg) * 60;
        const min = Math.floor(minF);
        const sec = Math.round((minF - min) * 60);
        return { deg, min, sec };
    };

    const latD = toD(lat), lonD = toD(lng);

    document.getElementById('lkp-lat-deg').value = latD.deg;
    document.getElementById('lkp-lat-min').value = latD.min;
    document.getElementById('lkp-lat-sec').value = latD.sec;
    document.getElementById('lkp-lat-hem').value = lat >= 0 ? 'N' : 'S';

    document.getElementById('lkp-lon-deg').value = lonD.deg;
    document.getElementById('lkp-lon-min').value = lonD.min;
    document.getElementById('lkp-lon-sec').value = lonD.sec;
    document.getElementById('lkp-lon-hem').value = lng >= 0 ? 'E' : 'W';

    // Appel du refresh de l'affichage decimal dans config.js si existant
    if (typeof onLkpInput === 'function') onLkpInput(); 
}

// ============================================================
// SECTION 2 : LOGIQUE DE CALCUL DU DASHBOARD
// ============================================================

function calculate() {
    // 1. Récupération des données de base
    const ship = fleet[document.getElementById('shipSelector').value];
    const portKey = document.getElementById('portSelector').value;
    const coords = ports[portKey];
    
    // 2. Mise à jour de l'environnement (Appels vers weather.js et tide.js)
    if (typeof getLiveWeather === 'function') getLiveWeather(coords[0], coords[1]);
    if (typeof updateTide === 'function') updateTide();
    
    // 3. Gestion Webcam spécifique au port
    const cams = {
        'PortManec\'h': 'port-manech', 
        'Concarneau': 'concarneau/ville-close', 
        'BegMeil': 'fouesnant/beg-meil'
    };
    const frame = document.getElementById('webcam-frame');
    if (frame && cams[portKey]) {
        const newSrc = `https://www.skaping.com/snsm/${cams[portKey]}`;
        if(frame.src !== newSrc) frame.src = newSrc;
    }

    // 4. Calcul de la vitesse réelle (bridée par météo/visibilité)
    const selectedVValue = document.getElementById('vSelector').value; 
    const vSelected = parseInt(selectedVValue.replace('v', ''));
    
    // Accès à la globale currentSea définie dans globals.js
    let finalVitesse = Math.min(vSelected, ship.vMax, seaStates[currentSea].vLimit);
    
    // Bridage visibilité
    if (currentVisibility === 'night' || currentVisibility === 'fog') {
        finalVitesse = Math.min(finalVitesse, 10); 
    }
    
    // 5. Mise à jour de l'UI Dashboard
    document.getElementById('dashSpeed').innerText = finalVitesse + " kts";
    
    // Calcul de l'autonomie ajustée
    let rangeAdjusted = ship.rangeNominal / seaStates[currentSea].fuelMulti;
    document.getElementById('dashRange').innerText = rangeAdjusted.toFixed(1) + " MN";

    // 6. Relancer le calcul de dérive SAR si un LKP existe
    if (typeof updateDrift === 'function') updateDrift();
}

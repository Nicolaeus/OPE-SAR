/**
 * NAVIGATION.JS
 * Moteur de calcul géodésique et logique de navigation.
 */

// --- OUTILS GÉODÉSIQUES (PURS) ---

function calculateDestination(latlng, brng, dist) {
    const R = 6371e3; // Rayon Terre en m
    const d = dist / R;
    const θ = brng * Math.PI / 180;
    const φ1 = latlng.lat * Math.PI / 180;
    const λ1 = latlng.lng * Math.PI / 180;

    const φ2 = Math.asin(Math.sin(φ1) * Math.cos(d) + Math.cos(φ1) * Math.sin(d) * Math.sin(θ));
    const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(d) * Math.cos(φ1), Math.cos(d) - Math.sin(φ1) * Math.sin(φ2));

    return L.latLng(φ2 * 180 / Math.PI, λ2 * 180 / Math.PI);
}

function movePoint(latlng, brngDeg, distMN) {
    return calculateDestination(latlng, brngDeg, distMN * 1852);
}

function dmsToDecimal(deg, min, sec, hem) {
    let decimal = deg + (min / 60) + (sec / 3600);
    return (hem === 'S' || hem === 'W') ? -decimal : decimal;
}

/**
 * Mise à jour des champs DMS du formulaire à partir d'une position Leaflet
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

    if (typeof onLkpInput === 'function') onLkpInput(); 
}

// --- LOGIQUE DASHBOARD (Anciennement calculate()) ---

function calculate() {
    const ship = fleet[document.getElementById('shipSelector').value];
    const portKey = document.getElementById('portSelector').value;
    const coords = ports[portKey];
    
    // Mise à jour environnementale
    if (typeof getLiveWeather === 'function') getLiveWeather(coords[0], coords[1]);
    if (typeof updateTide === 'function') updateTide();
    
    // Gestion Webcam
    const cams = {'PortManec\'h': 'port-manech', 'Concarneau': 'concarneau/ville-close', 'BegMeil': 'fouesnant/beg-meil'};
    const frame = document.getElementById('webcam-frame');
    if (frame) {
        const newSrc = `https://www.skaping.com/snsm/${cams[portKey]}`;
        if(frame.src !== newSrc) frame.src = newSrc;
    }

    // Calcul Vitesse
    const selectedVValue = document.getElementById('vSelector').value;
    const vSelected = parseInt(selectedVValue.replace('v', ''));
    
    let finalVitesse = Math.min(vSelected, ship.vMax, seaStates[currentSea].vLimit);
    if (currentVisibility === 'night' || currentVisibility === 'fog') {
        finalVitesse = Math.min(finalVitesse, 10); 
    }
    
    // UI Update
    document.getElementById('dashSpeed').innerText = finalVitesse + " kts";
    updateDrift();
}

/**
 * CONFIG.JS
 * Initialisation, Event Listeners et branchements entre modules.
 */

window.addEventListener('DOMContentLoaded', () => {
    // 1. Initialisation de la carte (Base)
    if (typeof loadBeachData === 'function') loadBeachData();
    
    // 2. Rendre les cartes flottantes déplaçables
    document.querySelectorAll('.floating-card').forEach(card => {
        if (typeof makeDraggable === 'function') makeDraggable(card);
    });    
    
    // 3. Gestion de l'édition manuelle de la houle
    const swellField = document.getElementById('swellDir');
    if (swellField) {
        swellField.addEventListener('input', () => {
            swellField.dataset.manualEdit = 'true';
            const label = document.getElementById('swell-auto-label');
            if (label) { 
                label.textContent = '✏️ Manuel'; 
                label.style.color = '#fbbf24'; 
            }
        });
    }

    // 4. Initialisation des horloges (LKP et Départ par défaut à "Maintenant")
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ":" + 
                    now.getMinutes().toString().padStart(2, '0');
    
    const lkpTimeInput = document.getElementById('timeLKP');
    const departTimeInput = document.getElementById('timeDepart');
    if (lkpTimeInput) lkpTimeInput.value = timeStr;
    if (departTimeInput) departTimeInput.value = timeStr;

    // 5. Chargement initial des données de marée (JSON)
    if (typeof loadTidalData === 'function') {
        loadTidalData();
    }

    // 6. Premier calcul global (Met à jour Météo/Vitesse/Marée pour le port par défaut)
    setTimeout(() => {
        if (typeof calculate === 'function') calculate();
    }, 500);
});

/**
 * Gestion de la saisie manuelle des coordonnées DMS (Input LKP)
 */
function onLkpInput() {
    const latDeg = parseFloat(document.getElementById('lkp-lat-deg').value);
    const latMin = parseFloat(document.getElementById('lkp-lat-min').value) || 0;
    const latSec = parseFloat(document.getElementById('lkp-lat-sec').value) || 0;
    const latHem = document.getElementById('lkp-lat-hem').value;

    const lonDeg = parseFloat(document.getElementById('lkp-lon-deg').value);
    const lonMin = parseFloat(document.getElementById('lkp-lon-min').value) || 0;
    const lonSec = parseFloat(document.getElementById('lkp-lon-sec').value) || 0;
    const lonHem = document.getElementById('lkp-lon-hem').value;

    const display = document.getElementById('lkp-decimal-display');

    if (isNaN(latDeg) || isNaN(lonDeg)) {
        if (display) display.textContent = '-- , --';
        return;
    }

    // Calcul des décimales via navigation.js
    const lat = dmsToDecimal(latDeg, latMin, latSec, latHem);
    const lon = dmsToDecimal(lonDeg, lonMin, lonSec, lonHem);

    if (display) {
        display.textContent = `${lat.toFixed(5)} , ${lon.toFixed(5)}`;
        display.style.color = '#38bdf8';
    }

    // Mise à jour du marqueur sur la carte
    if (map) {
        const newPos = L.latLng(lat, lon);
        if (vsdMarker) {
            vsdMarker.setLatLng(newPos);
        } else {
            vsdMarker = L.marker(newPos, { draggable: true }).addTo(map);
            vsdMarker.on('drag', () => {
                updateDmsFieldsFromLatLng(vsdMarker.getLatLng().lat, vsdMarker.getLatLng().lng);
                updateDrift();
            });
        }
        updateDrift();
    }
}

/**
 * Mise à jour de la visibilité (Impacte la vitesse dans calculate())
 */
function setVisibility(mode) {
    currentVisibility = mode;
    document.querySelectorAll('.vis-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    // Relance le calcul car la vitesse max peut être bridée par la visibilité
    calculate();
}

/**
 * ============================================================
 * SECTION : INITIALISATION ET ÉVÉNEMENTS
 * ============================================================
 */

window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.floating-card').forEach(card => {
        makeDraggable(card);
    });    
    
    const swellField = document.getElementById('swellDir');
    if (swellField) {
        swellField.addEventListener('input', () => {
            swellField.dataset.manualEdit = 'true';
            const label = document.getElementById('swell-auto-label');
            if (label) { label.textContent = '✏ Saisie manuelle'; label.style.color = '#fbbf24'; }
        });
    }

    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    document.getElementById('timeLKP').value = timeStr;
    document.getElementById('timeDepart').value = timeStr;
});

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
        display.textContent = '-- , --';
        display.style.color = '#64748b';
        return;
    }

    const lat = dmsToDecimal(latDeg, latMin, latSec, latHem);
    const lon = dmsToDecimal(lonDeg, lonMin, lonSec, lonHem);

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        display.textContent = '⚠ Coordonnées invalides';
        display.style.color = '#ef4444';
        return;
    }

    display.textContent = `${lat.toFixed(5)}° , ${lon.toFixed(5)}°`;
    display.style.color = '#4ade80';
}

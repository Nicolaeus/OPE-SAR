/**
 * CONFIG.JS
 * Chef d'orchestre : Initialisation, écouteurs d'événements et Service Worker.
 */

// ============================================================
// SECTION 1 : INITIALISATION GÉNÉRALE
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
    // 1. Allumage du moteur Leaflet
    if (typeof initMap === 'function') initMap();

    // 2. Fenêtres déplaçables
    document.querySelectorAll('.floating-card').forEach(card => makeDraggable(card));

    // 3. Premier calcul (après un micro-délai pour Leaflet)
    setTimeout(() => {
        if (typeof calculate === 'function') calculate();
    }, 500);

    // 4. Écouteurs pour la saisie manuelle de coordonnées
    document.querySelectorAll('.dms-input').forEach(input => {
        input.addEventListener('change', updateLkpFromDms);
    });
});

window.addEventListener('DOMContentLoaded', async () => {
    console.log("⚓ Mission Nautique SAR : Initialisation...");

    // 1. Rendre les cartes flottantes déplaçables (Ta logique originale)
    document.querySelectorAll('.floating-card').forEach(card => {
        makeDraggable(card);
    });

    // 2. Initialiser les champs de temps (Heure actuelle par défaut)
    if (typeof setDepartNow === 'function') setDepartNow();

    // 3. Charger la zone côtière par défaut (Ex: Cornouaille)
    if (typeof loadCoastalZone === 'function') loadCoastalZone('bretagne_so');

    // 4. Lancer un premier calcul global
    if (typeof calculate === 'function') calculate();

    // 5. Enregistrer le Service Worker pour le mode Offline
    registerServiceWorker();
});

// ============================================================
// SECTION 2 : ÉCOUTEURS D'ÉVÉNEMENTS (LISTENERS)
// ============================================================

/**
 * Branchement des changements d'inputs sur la fonction calculate()
 */
const autoCalculateTriggers = [
    'shipSelector', 'portSelector', 'vSelector', 
    'windDir', 'windSpd', 'currDir', 'currSpd', 
    'timeLKP', 'timeDepart'
];

autoCalculateTriggers.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('input', () => {
            // Si on change la météo manuellement, on peut appeler updateDrift directement
            if (id.includes('wind') || id.includes('curr')) {
                if (typeof updateDrift === 'function') updateDrift();
            }
            if (typeof calculate === 'function') calculate();
        });
    }
});

/**
 * Détection de l'édition manuelle de la houle
 */
const swellField = document.getElementById('swellDir');
if (swellField) {
    swellField.addEventListener('input', () => {
        swellField.dataset.manualEdit = 'true';
        const label = document.getElementById('swell-auto-label');
        if (label) {
            label.textContent = '✍️ Manuel';
            label.style.color = '#fbbf24';
        }
        if (typeof calculate === 'function') calculate();
    });
}

// ============================================================
// SECTION 3 : GESTION DU SERVICE WORKER & UI
// ============================================================

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('SW: Enregistré avec succès (Scope: ' + reg.scope + ')'))
            .catch(err => console.error('SW: Échec de l\'enregistrement', err));
    }
}

/**
 * Fonction makeDraggable (Ta fonction originale de app(2).js)
 */
function makeDraggable(el) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = el.querySelector('.card-header') || el;

    header.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        el.style.bottom = "auto"; // Désactive l'ancrage bas
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        el.style.top = (el.offsetTop - pos2) + "px";
        el.style.left = (el.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// À vérifier/ajouter dans les listeners de config.js
document.getElementById('btn-start-sar')?.addEventListener('click', startSarMission);
document.getElementById('btn-reset-sar')?.addEventListener('click', resetSarMission);
document.getElementById('btn-connect-ais')?.addEventListener('click', connectAIS);

// Listener pour la mise à jour manuelle des coordonnées
document.querySelectorAll('.dms-input').forEach(input => {
    input.addEventListener('change', updateLkpFromDms);
});

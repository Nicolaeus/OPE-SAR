/**
 * CONFIG.JS
 * Chef d'orchestre : boot de l'application, écouteurs d'événements, Service Worker.
 *
 * Doit être chargé EN DERNIER, après tous les autres modules.
 * Ne contient aucune logique métier — seulement du câblage.
 */

// ============================================================
// 1. BOOT — DOMContentLoaded (un seul écouteur)
// ============================================================

window.addEventListener('DOMContentLoaded', () => {
    console.log('⚓ OPESAR — Initialisation...');

    // 1. Carte Leaflet
    initMap();

    // 2. Cards flottantes déplaçables (desktop)
    document.querySelectorAll('.floating-card').forEach(card => makeDraggable(card));

    // 3. Heure initiale dans les champs SAR
    const now     = new Date();
    const timeStr = _pad(now.getHours()) + ':' + _pad(now.getMinutes());
    const timeLKP = document.getElementById('timeLKP');
    const timeDep = document.getElementById('timeDepart');
    if (timeLKP) timeLKP.value = timeStr;
    if (timeDep) timeDep.value = timeStr;

    // 4. Écoute saisie manuelle houle
    const swellField = document.getElementById('swellDir');
    if (swellField) {
        swellField.addEventListener('input', () => {
            swellField.dataset.manualEdit = 'true';
            const label = document.getElementById('swell-auto-label');
            if (label) { label.textContent = '✏ Saisie manuelle'; label.style.color = '#fbbf24'; }
        });
    }

    // 5. Écouteurs inputs header → recalcul automatique
    _bindCalculate(['shipSelector', 'portSelector', 'vSelector', 'towCheck']);

    // 6. Écouteurs champs SAR → recalcul dérive
    _bindDrift(['curDir', 'curSpeed', 'swellDir', 'timeLKP', 'timeDepart', 'targetType']);

    // 7. Service Worker (PWA offline)
    _registerServiceWorker();

    // 8. Premier calcul (délai 300ms — Leaflet a besoin d'un tick pour init)
    setTimeout(() => {
        if (typeof calculate === 'function') calculate();
    }, 300);

    console.log('⚓ OPESAR — Prêt.');
});

// ============================================================
// 2. ÉCOUTEURS D'ÉVÉNEMENTS
// ============================================================

function _bindCalculate(ids) {
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const event = el.tagName === 'INPUT' && el.type === 'checkbox' ? 'change' : 'change';
        el.addEventListener(event, () => {
            if (typeof calculate === 'function') calculate();
        });
    });
}

function _bindDrift(ids) {
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('change', () => {
            if (typeof updateDrift === 'function') updateDrift();
        });
        el.addEventListener('input', () => {
            if (typeof updateDrift === 'function') updateDrift();
        });
    });
}

// ============================================================
// 3. SERVICE WORKER
// ============================================================

function _registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('./sw.js')
        .then(reg  => console.log('SW enregistré — scope:', reg.scope))
        .catch(err => console.error('SW échec:', err));
}

// ============================================================
// 4. UTILITAIRE
// ============================================================

function _pad(n) { return String(n).padStart(2, '0'); }

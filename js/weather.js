/**
 * WEATHER.JS
 * Récupération météo Open-Meteo (terrestre + marine) et mise à jour de l'UI.
 *
 * Dépendances : globals.js (currentSurgeMeters, currentSwellHeight)
 * Appelle après fetch : updateTide() (tide.js), updateDrift() (sar-engine.js)
 */

/**
 * Interroge les deux API Open-Meteo en parallèle pour un point géographique.
 * Met à jour la card météo et pousse les variables globales de surcote et de houle.
 *
 * @param {number} lat  Latitude du port actif
 * @param {number} lng  Longitude du port actif
 */
async function getLiveWeather(lat, lng) {
    // Léger décalage vers le large pour l'API marine (évite les valeurs côtières aberrantes)
    const offLat = lat - 0.02;

    try {
        const [resL, resM] = await Promise.all([
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,cloud_cover,wind_speed_10m,wind_direction_10m,surface_pressure&timezone=auto`),
            fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${offLat}&longitude=${lng}&current=sea_surface_temperature,wave_height,wave_direction&timezone=auto`)
        ]);

        const dL = await resL.json();
        const dM = await resM.json();

        // --- 1. MÉTÉO TERRESTRE (vent, pression, nuages, température air) ---
        if (dL.current) {
            const windDeg   = dL.current.wind_direction_10m;
            const windKts   = Math.round(dL.current.wind_speed_10m / 1.852);
            const pressure  = dL.current.surface_pressure;
            const surgeCm   = Math.round(1013.25 - pressure);

            // Surcote/décote barométrique — utilisée par tide.js
            window.currentSurgeMeters = surgeCm / 100;

            // Direction vent en texte (rose des vents 16 points)
            const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
            const windDirStr = dirs[Math.round(windDeg / 22.5) % 16];

            // Mise à jour card météo
            _setText('val-cloud',    dL.current.cloud_cover + '%');
            _setText('val-temp-air', dL.current.temperature_2m + '°C');
            _setText('val-wind',     windKts + ' kts ' + windDirStr);

            const pressureEl = document.getElementById('val-pressure');
            if (pressureEl) {
                const trendLabel = surgeCm > 0 ? ' (Surcote +' : ' (Décote ';
                pressureEl.innerText = Math.round(pressure) + ' hPa' + trendLabel + Math.abs(surgeCm) + 'cm)';
            }

            // Flèche direction vent (rotée dans la card météo + data-attribute pour SAR)
            const windArrow = document.getElementById('wind-dir-icon');
            if (windArrow) {
                windArrow.style.transform = `rotate(${windDeg + 180}deg)`;
                windArrow.dataset.windProvenance = windDeg;
            }
        }

        // --- 2. MÉTÉO MARINE (houle, température eau) ---
        if (dM.current) {
            _setText('val-water', dM.current.sea_surface_temperature + '°C');
            _setText('val-swell', dM.current.wave_height + ' m');

            // Pré-remplir direction houle seulement si l'utilisateur n'a pas saisi manuellement
            if (dM.current.wave_direction !== undefined) {
                const swellField = document.getElementById('swellDir');
                if (swellField && !swellField.dataset.manualEdit) {
                    swellField.value = Math.round(dM.current.wave_direction);
                    const label = document.getElementById('swell-auto-label');
                    if (label) {
                        label.textContent = '↑ Auto météo — éditable';
                        label.style.color = '#38bdf8';
                    }
                }
                // Variable globale utilisée par sar-engine.js pour le calcul zigzag
                window.currentSwellHeight = dM.current.wave_height || 0;
            }
        }

        // --- 3. SYNCHRONISATION DES MODULES DÉPENDANTS ---
        if (typeof updateTide  === 'function') updateTide();
        if (typeof updateDrift === 'function') updateDrift();

    } catch (e) {
        console.warn('getLiveWeather — API Error:', e);
    }
}

/**
 * Webcam Skaping associée au port sélectionné.
 * Appelée par calculate() dans navigation.js.
 *
 * @param {string} portKey  Clé du port (doit correspondre à portCams dans globals.js)
 */
function updateWebcam(portKey) {
    const frame = document.getElementById('webcam-frame');
    if (!frame) return;
    const slug = portCams[portKey];
    if (!slug) return;
    const newSrc = `https://www.skaping.com/snsm/${slug}`;
    if (frame.src !== newSrc) frame.src = newSrc;
}

// ── utilitaire privé ──────────────────────────────────────────
function _setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}

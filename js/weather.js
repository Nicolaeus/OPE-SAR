/**
 * WEATHER.JS
 * Récupération des données Open-Meteo et mise à jour de l'état environnemental.
 */

/**
 * Interroge les API météo pour un point donné
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 */
async function getLiveWeather(lat, lng) {
    // On applique ton décalage de 0.02 degré vers le large pour les données marines
    const offLat = lat - 0.02; 
    
    try {
        const [resL, resM] = await Promise.all([
            // API Terrestre : Vent, Pression, Nuages
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,cloud_cover,wind_speed_10m,wind_direction_10m,surface_pressure&timezone=auto`),
            // API Marine : Température eau, Houle (hauteur et direction)
            fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${offLat}&longitude=${lng}&current=sea_surface_temperature,wave_height,wave_direction&timezone=auto`)
        ]);
        
        const dL = await resL.json();
        const dM = await resM.json();
        
        // --- 1. TRAITEMENT MÉTÉO TERRE (Vent, Pression, Nuages) ---
        if(dL.current) {
            const windDeg = dL.current.wind_direction_10m;
            const pressure = dL.current.surface_pressure;
            const cloudCover = dL.current.cloud_cover;
            
            // Mise à jour des inputs UI
            document.getElementById('windDir').value = Math.round(windDeg);
            document.getElementById('windSpd').value = Math.round(dL.current.wind_speed_10m);
            document.getElementById('val-temp').innerText = dL.current.temperature_2m + "°C";

            // Calcul de la surcote (Loi de Laplace : 1hPa de moins = 1cm d'eau en plus)
            // Référence standard : 1013.25 hPa
            const surgeCm = Math.round(1013.25 - pressure); 
            window.currentSurgeMeters = surgeCm / 100;

            // Détermination de la visibilité jour/nuit (simplifiée par l'icône)
            updateWeatherIcon(cloudCover);
        }

        // --- 2. TRAITEMENT MÉTÉO MER (Houle & Temp Eau) ---
        if(dM.current) {
            document.getElementById('val-water').innerText = dM.current.sea_surface_temperature + "°C";
            document.getElementById('val-swell').innerText = dM.current.wave_height + " m";

            const swellField = document.getElementById('swellDir');
            // On ne met à jour la direction de houle que si l'utilisateur ne l'a pas modifiée manuellement
            if (swellField && !swellField.dataset.manualEdit) {
                swellField.value = Math.round(dM.current.wave_direction || 0);
                const label = document.getElementById('swell-auto-label');
                if (label) {
                    label.textContent = '🔄 Auto';
                    label.style.color = '#38bdf8';
                }
            }
            
            // Variable globale cruciale pour le calcul du zigzag dans navigation.js
            window.currentSwellHeight = dM.current.wave_height || 0;
        }
        
        // --- 3. SYNCHRONISATION DES AUTRES MODULES ---
        // La météo ayant changé, on force le recalcul de la marée et de la dérive
        if (typeof updateTide === 'function') updateTide(); 
        if (typeof updateDrift === 'function') updateDrift();

    } catch (e) {
        console.error("Erreur API Météo :", e);
    }
}

/**
 * Gère l'affichage de l'icône météo et l'état de visibilité
 */
function updateWeatherIcon(cloudCover) {
    const weatherIcon = document.getElementById('weather-icon');
    if (!weatherIcon) return;

    const hour = new Date().getHours();
    const isNight = hour < 7 || hour > 21;

    if (isNight) {
        weatherIcon.className = "fas fa-moon text-indigo-400";
        currentVisibility = 'night';
    } else {
        if (cloudCover > 70) {
            weatherIcon.className = "fas fa-cloud text-gray-400";
            currentVisibility = 'day'; // On pourrait ajouter 'fog' si cloud_cover est extrême
        } else if (cloudCover > 20) {
            weatherIcon.className = "fas fa-cloud-sun text-blue-300";
            currentVisibility = 'day';
        } else {
            weatherIcon.className = "fas fa-sun text-yellow-400";
            currentVisibility = 'day';
        }
    }
}

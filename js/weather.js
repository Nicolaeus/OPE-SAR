/**
 * WEATHER.JS
 * Récupération des données Open-Meteo et mise à jour de l'état environnemental.
 */

async function getLiveWeather(lat, lng) {
    const offLat = lat - 0.02; // Décalage pour avoir des données "mer"
    try {
        const [resL, resM] = await Promise.all([
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,cloud_cover,wind_speed_10m,wind_direction_10m,surface_pressure&timezone=auto`),
            fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${offLat}&longitude=${lng}&current=sea_surface_temperature,wave_height,wave_direction&timezone=auto`)
        ]);
        
        const dL = await resL.json();
        const dM = await resM.json();
        
        // --- 1. TRAITEMENT MÉTÉO TERRE (Vent, Pression, Nuages) ---
        if(dL.current) {
            const windDeg = dL.current.wind_direction_10m;
            const pressure = dL.current.surface_pressure;
            const cloudCover = dL.current.cloud_cover;
            
            // Calcul de la surcote (Loi de Laplace simplifiée : 1hPa = 1cm)
            const surgeCm = Math.round(1013.25 - pressure); 
            window.currentSurgeMeters = surgeCm / 100; // Stocké pour tide.js

            const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
            const windDirStr = directions[Math.round(windDeg / 22.5) % 16];

            // Mise à jour UI
            document.getElementById('val-temp').innerText = Math.round(dL.current.temperature_2m) + "°C";
            document.getElementById('val-cloud').innerText = cloudCover + "%";
            document.getElementById('windSpd').value = Math.round(dL.current.wind_speed_10m / 1.852); // km/h -> kts
            document.getElementById('windDir').value = windDeg;
            document.getElementById('dashWind').innerText = Math.round(dL.current.wind_speed_10m / 1.852) + " kts " + windDirStr;
            
            if(document.getElementById('val-pressure')) {
                const trend = surgeCm > 0 ? " (Surcote + " : " (Décote ";
                document.getElementById('val-pressure').innerText = Math.round(pressure) + " hPa" + trend + Math.abs(surgeCm) + "cm)";
            }

            // Rotation de la flèche de vent
            const windIcon = document.getElementById('wind-dir-icon');
            if (windIcon) {
                windIcon.style.transform = `rotate(${windDeg + 180}deg)`;
                windIcon.dataset.windProvenance = windDeg;
            }

            // --- LOGIQUE DES ICÔNES ET VISIBILITÉ ---
            const weatherIcon = document.getElementById('weather-icon');
            if (weatherIcon) {
                if (cloudCover > 80) {
                    weatherIcon.className = "fas fa-cloud text-slate-400"; // Couvert
                    currentVisibility = 'day'; // On pourrait affiner ici si brouillard
                } else if (cloudCover > 20) {
                    weatherIcon.className = "fas fa-cloud-sun text-blue-300"; // Partiel
                    currentVisibility = 'day';
                } else {
                    weatherIcon.className = "fas fa-sun text-yellow-400"; // Beau
                    currentVisibility = 'day';
                }
            }
        }

        // --- 2. TRAITEMENT MÉTÉO MER (Houle & Temp Eau) ---
        if(dM.current) {
            document.getElementById('val-water').innerText = dM.current.sea_surface_temperature + "°C";
            document.getElementById('val-swell').innerText = dM.current.wave_height + " m";

            const swellField = document.getElementById('swellDir');
            if (swellField && !swellField.dataset.manualEdit) {
                swellField.value = Math.round(dM.current.wave_direction || 0);
                const label = document.getElementById('swell-auto-label');
                if (label) label.style.color = '#38bdf8';
            }
            
            // Mise à jour de la variable globale pour le calcul de vitesse
            window.currentSwellHeight = dM.current.wave_height || 0;
        }
        
        // --- 3. RE-SYNCHRONISATION ---
        // On relance la marée et la dérive car elles dépendent de la pression et du vent
        if (typeof updateTide === 'function') updateTide(); 
        if (typeof updateDrift === 'function') updateDrift();

    } catch (e) {
        console.error("Erreur API Météo:", e);
    }
}

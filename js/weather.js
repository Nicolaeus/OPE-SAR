async function getLiveWeather(lat, lng) {
    const offLat = lat - 0.02;
    try {
        const [resL, resM] = await Promise.all([
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,cloud_cover,wind_speed_10m,wind_direction_10m,surface_pressure&timezone=auto`),
            fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${offLat}&longitude=${lng}&current=sea_surface_temperature,wave_height,wave_direction&timezone=auto`)
        ]);
        
        const dL = await resL.json(), dM = await resM.json();
        
        if(dL.current) {
            const windDeg = dL.current.wind_direction_10m;
            const pressure = dL.current.surface_pressure;
            
            const surgeCm = Math.round(1013.25 - pressure); 
            window.currentSurgeMeters = surgeCm / 100;

            const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
            const windDirStr = directions[Math.round(windDeg / 22.5) % 16];

            document.getElementById('val-cloud').innerText = dL.current.cloud_cover + "%";
            document.getElementById('val-temp-air').innerText = dL.current.temperature_2m + "°C";
            document.getElementById('val-wind').innerText = Math.round(dL.current.wind_speed_10m / 1.852) + " kts " + windDirStr;
            
            if(document.getElementById('val-pressure')) {
                const trend = surgeCm > 0 ? " (Surcote +" : " (Décote ";
                document.getElementById('val-pressure').innerText = Math.round(pressure) + " hPa" + trend + Math.abs(surgeCm) + "cm)";
            }

            document.getElementById('wind-dir-icon').style.transform = `rotate(${windDeg + 180}deg)`;
            document.getElementById('wind-dir-icon').dataset.windProvenance = windDeg;
        }

        if(dM.current) {
            document.getElementById('val-water').innerText = dM.current.sea_surface_temperature + "°C";
            document.getElementById('val-swell').innerText = dM.current.wave_height + " m";

            // Pré-remplir le champ direction houle (éditable par l'utilisateur)
            if (dM.current.wave_direction !== undefined) {
                const swellField = document.getElementById('swellDir');
                // On ne remplace que si le champ n'a pas été édité manuellement
                if (!swellField.dataset.manualEdit) {
                    swellField.value = Math.round(dM.current.wave_direction);
                    document.getElementById('swell-auto-label').style.color = '#38bdf8';
                }
                window.currentSwellHeight = dM.current.wave_height || 0;
            }
        }
        
        updateTide(); 
        updateDrift();
        
    } catch (e) { console.warn("Météo API Error", e); }
}

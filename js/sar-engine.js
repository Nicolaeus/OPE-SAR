/**
 * SAR-ENGINE.JS
 * Moteur de calcul des dérives (Drift), du DATUM et des Search Patterns.
 */

// --- SECTION : CALCUL DE DÉRIVE & DATUM ---

function updateDrift() {
    if (!vsdMarker) return;

    const lkp = vsdMarker.getLatLng();
    const portKey = document.getElementById('portSelector').value;
    
    // 1. Récupération des forces environnementales
    const windDir = parseFloat(document.getElementById('windDir').value) || 0;
    const windSpd = parseFloat(document.getElementById('windSpd').value) || 0;
    const currDir = parseFloat(document.getElementById('currDir').value) || 0;
    const currSpd = parseFloat(document.getElementById('currSpd').value) || 0;
    
    // 2. Intégration de la marée dans la dérive (Optionnel/Avancé)
    // Ici on pourrait ajuster currSpd selon le marnage calculé dans tide.js
    
    // 3. Calcul du Leeway (Dérive propre au type de cible - ex: 3% du vent)
    const leewaySpd = windSpd * 0.03;
    const leewayDir = (windDir + 180) % 360; // Le vent pousse, il ne tire pas

    // 4. Sommation vectorielle (Courant + Leeway)
    const toRad = Math.PI / 180;
    const vx = (currSpd * Math.sin(currDir * toRad)) + (leewaySpd * Math.sin(leewayDir * toRad));
    const vy = (currSpd * Math.cos(currDir * toRad)) + (leewaySpd * Math.cos(leewayDir * toRad));
    
    const totalDriftSpd = Math.sqrt(vx*vx + vy*vy);
    const totalDriftDir = (Math.atan2(vx, vy) * 180 / Math.PI + 360) % 360;

    document.getElementById('driftTotal').innerText = totalDriftSpd.toFixed(1) + " nds";

    // 5. Calcul du temps écoulé depuis le LKP
    const timeLKP = document.getElementById('timeLKP').value;
    if (timeLKP) {
        const now = new Date();
        const [h, m] = timeLKP.split(':');
        const lkpTime = new Date();
        lkpTime.setHours(h, m);
        
        let hoursPassed = (now - lkpTime) / 3600000;
        if (hoursPassed < 0) hoursPassed += 24; // Gestion passage minuit

        const driftDistMN = totalDriftSpd * hoursPassed;
        const datumPos = movePoint(lkp, totalDriftDir, driftDistMN);

        // --- AFFICHAGE CARTO ---
        
        // Ligne de dérive
        if (driftLine) map.removeLayer(driftLine);
        driftLine = L.polyline([lkp, datumPos], {
            color: '#ef4444',
            weight: 3,
            dashArray: '5, 10',
            opacity: 0.7
        }).addTo(map);

        // Marqueur DATUM
        if (driftEndMarker) map.removeLayer(driftEndMarker);
        driftEndMarker = L.marker(datumPos, {
            icon: L.divIcon({
                className: 'datum-icon',
                html: '<div style="background:#ef4444;width:12px;height:12px;border:2px solid #fff;border-radius:50%;box-shadow:0 0 8px #ef4444;"></div>'
            })
        }).addTo(map).bindTooltip(`DATUM (T+${hoursPassed.toFixed(1)}h)`, { permanent: false });
    }
}

// --- SECTION : PATTERNS DE RECHERCHE ---

function selectPattern(type) {
    currentSearchPattern = type;
    document.querySelectorAll('.pattern-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById('btn-' + type);
    if (activeBtn) activeBtn.classList.add('active');
    
    // Affichage/Masquage des options spécifiques (CSP, Track spacing...)
    document.getElementById('pattern-options').style.display = 'block';
    renderSearchPattern();
}

function clearSearchPattern() {
    searchPatternLayers.forEach(l => map.removeLayer(l));
    searchPatternLayers = [];
    if (searchCircleLayer) map.removeLayer(searchCircleLayer);
}

function renderSearchPattern() {
    clearSearchPattern();
    if (!currentSearchPattern || !driftEndMarker) return;

    const datum = driftEndMarker.getLatLng();
    const s = parseFloat(document.getElementById('trackSpacing').value) || 0.2; // Milles nautiques
    
    // Exemple : Expanding Square Search (SS)
    if (currentSearchPattern === 'expanding') {
        let currentPos = datum;
        let dist = s;
        let bearing = 0; // Nord initial

        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 2; j++) {
                let nextPos = movePoint(currentPos, bearing, dist);
                let line = L.polyline([currentPos, nextPos], {color: '#fbbf24', weight: 3}).addTo(map);
                searchPatternLayers.push(line);
                currentPos = nextPos;
                bearing = (bearing + 90) % 360;
            }
            dist += s;
        }
    }
    // ... (Ajouter ici les autres patterns : Creeping, Sector, etc.)
}

/**
 * Commande de lancement d'une mission
 */
function startSarMission() {
    map.getContainer().style.cursor = 'crosshair';
    map.once('click', function(e) {
        if (vsdMarker) map.removeLayer(vsdMarker);
        vsdMarker = L.marker(e.latlng, { draggable: true }).addTo(map).bindPopup("<b>LKP</b>").openPopup();
        
        updateDmsFieldsFromLatLng(e.latlng.lat, e.latlng.lng);
        
        vsdMarker.on('drag', () => {
            updateDmsFieldsFromLatLng(vsdMarker.getLatLng().lat, vsdMarker.getLatLng().lng);
            updateDrift();
        });
        
        updateDrift();
        map.getContainer().style.cursor = '';
    });
}

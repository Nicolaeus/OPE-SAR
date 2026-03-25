/**
 * SAR-ENGINE.JS
 * Moteur de calcul des dérives, du DATUM et des schémas de recherche (Search Patterns).
 */

// ============================================================
// SECTION 1 : CALCUL DE DÉRIVE & DATUM
// ============================================================

/**
 * Calcule la position estimée (DATUM) après dérive
 */
function updateDrift() {
    if (!vsdMarker) return;

    const lkp = vsdMarker.getLatLng();
    
    // 1. Récupération des paramètres environnementaux
    const windDir = parseFloat(document.getElementById('windDir').value) || 0;
    const windSpd = parseFloat(document.getElementById('windSpd').value) || 0;
    const currDir = parseFloat(document.getElementById('currDir').value) || 0;
    const currSpd = parseFloat(document.getElementById('currSpd').value) || 0;
    
    const timeLKP = document.getElementById('timeLKP').value;
    const timeDepart = document.getElementById('timeDepart').value;

    // 2. Calcul du temps de dérive (Delta T)
    const [hL, mL] = timeLKP.split(':').map(Number);
    const [hD, mD] = timeDepart.split(':').map(Number);
    let dt = (hD + mD / 60) - (hL + mL / 60);
    if (dt < 0) dt += 24; // Gestion passage minuit

    // 3. Calcul du Leeway (Dérive propre à l'objet - 3% du vent par défaut)
    const leewaySpd = windSpd * 0.03;
    const leewayDir = (windDir + 180) % 360; // Le vent pousse l'objet

    // 4. Sommation vectorielle (Courant + Leeway)
    const toRad = Math.PI / 180;
    const vx = (currSpd * Math.sin(currDir * toRad)) + (leewaySpd * Math.sin(leewayDir * toRad));
    const vy = (currSpd * Math.cos(currDir * toRad)) + (leewaySpd * Math.cos(leewayDir * toRad));

    const totalDriftSpd = Math.sqrt(vx * vx + vy * vy);
    const totalDriftDir = (Math.atan2(vx, vy) * 180 / Math.PI + 360) % 360;
    const totalDistNM = totalDriftSpd * dt;

    // 5. Calcul du point DATUM
    const datum = calculateDestination(lkp, totalDriftDir, totalDistNM * 1852);

    // 6. Mise à jour de l'UI SAR
    document.getElementById('val-drift-dist').innerText = totalDistNM.toFixed(2) + " NM";
    document.getElementById('val-drift-dir').innerText = Math.round(totalDriftDir) + "°";

    renderDriftAssets(lkp, datum);
}

function renderDriftAssets(lkp, datum) {
    // Marqueur DATUM
    if (!driftEndMarker) {
        driftEndMarker = L.marker(datum, {
            icon: L.divIcon({ className: 'datum-icon', html: '<i class="fas fa-crosshairs"></i>', iconSize: [30, 30] })
        }).addTo(map).bindPopup("<b>DATUM</b> (Position estimée)");
    } else {
        driftEndMarker.setLatLng(datum);
    }

    // Ligne de dérive (LKP -> DATUM)
    if (driftLine) map.removeLayer(driftLine);
    driftLine = L.polyline([lkp, datum], {
        color: '#fbbf24',
        weight: 4,
        dashArray: '5, 10'
    }).addTo(map);

    // Cercle d'incertitude (Rayon arbitraire basé sur le temps)
    if (searchArea) map.removeLayer(searchArea);
    const uncertaintyRadius = 0.5 + (0.1 * map.distance(lkp, datum) / 1852); // NM
    searchArea = L.circle(datum, {
        radius: uncertaintyRadius * 1852,
        color: '#fbbf24',
        fillOpacity: 0.1,
        weight: 1
    }).addTo(map);
}

// ============================================================
// SECTION 2 : SEARCH PATTERNS (Tracés de recherche)
// ============================================================

function clearSearchPattern() {
    searchPatternLayers.forEach(layer => map.removeLayer(layer));
    searchPatternLayers = [];
}

function selectPattern(type) {
    currentSearchPattern = type;
    document.querySelectorAll('.pattern-btn').forEach(btn => btn.classList.remove('active'));
    // Note: Ajouter la classe active sur le bouton cliqué via l'event
    renderSearchPattern();
}

function renderSearchPattern() {
    if (!driftEndMarker || !currentSearchPattern) return;
    clearSearchPattern();

    const datum = driftEndMarker.getLatLng();
    const s = parseFloat(document.getElementById('trackSpacing').value) || 0.2; // NM
    
    if (currentSearchPattern === 'expanding') {
        drawExpandingSquare(datum, s);
    } else if (currentSearchPattern === 'sector') {
        drawSectorSearch(datum, s);
    }
}

function drawExpandingSquare(startPos, spacing) {
    let currentPos = startPos;
    let dist = spacing;
    let bearing = 0;

    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 2; j++) {
            let nextPos = calculateDestination(currentPos, bearing, dist * 1852);
            let line = L.polyline([currentPos, nextPos], { color: '#fbbf24', weight: 3 }).addTo(map);
            searchPatternLayers.push(line);
            currentPos = nextPos;
            bearing = (bearing + 90) % 360;
        }
        dist += spacing;
    }
}

// ============================================================
// SECTION 3 : COMMANDES DE MISSION
// ============================================================

function startSarMission() {
    // Change le curseur pour indiquer qu'on attend un clic
    map.getContainer().style.cursor = 'crosshair';
    
    map.once('click', function(e) {
        map.getContainer().style.cursor = '';
        
        if (vsdMarker) map.removeLayer(vsdMarker);
        
        vsdMarker = L.marker(e.latlng, { draggable: true }).addTo(map)
            .bindPopup("<b>LKP</b> (Dernière Position Connue)").openPopup();
        
        // Mise à jour des champs de saisie (DMS)
        if (typeof updateDmsFieldsFromLatLng === 'function') {
            updateDmsFieldsFromLatLng(e.latlng.lat, e.latlng.lng);
        }

        vsdMarker.on('drag', () => {
            if (typeof updateDmsFieldsFromLatLng === 'function') {
                updateDmsFieldsFromLatLng(vsdMarker.getLatLng().lat, vsdMarker.getLatLng().lng);
            }
            updateDrift();
            if (typeof calculate === 'function') calculate();
        });

        updateDrift();
        if (typeof calculate === 'function') calculate();
    });
}

function resetSarMission() {
    if (vsdMarker) map.removeLayer(vsdMarker);
    if (driftEndMarker) map.removeLayer(driftEndMarker);
    if (driftLine) map.removeLayer(driftLine);
    if (searchArea) map.removeLayer(searchArea);
    clearSearchPattern();
    
    vsdMarker = null;
    driftEndMarker = null;
    driftLine = null;
    searchArea = null;
}

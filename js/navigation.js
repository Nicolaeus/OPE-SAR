    function calculate() {
    const ship = fleet[document.getElementById('shipSelector').value];
    const portKey = document.getElementById('portSelector').value;
    const coords = ports[portKey];
    const cams = {'PortManec\'h': 'port-manech', 'Concarneau': 'concarneau/ville-close', 'BegMeil': 'fouesnant/beg-meil'};
    
    getLiveWeather(coords[0], coords[1]);
    updateTide();
    
    const frame = document.getElementById('webcam-frame');
    const newSrc = `https://www.skaping.com/snsm/${cams[portKey]}`;
    if(frame.src !== newSrc) frame.src = newSrc;

    // 1. RÉCUPÉRATION DE LA VITESSE SÉLECTIONNÉE
    const selectedVValue = document.getElementById('vSelector').value; // ex: "v15nds"
    const vSelected = parseInt(selectedVValue.replace('v', '')); // On garde 15
    
    // 2. CALCUL DE LA VITESSE RÉELLE (Bridée par météo/visibilité)
    let finalVitesse = Math.min(vSelected, ship.vMax, seaStates[currentSea].vLimit);
    if (currentVisibility === 'night' || currentVisibility === 'fog') {
        finalVitesse = Math.min(finalVitesse, 10); 
    }
    
    // 3. MISE À JOUR DASHBOARD
    let r = ship.rangeNominal / seaStates[currentSea].fuelMulti;
    const isTowing = document.getElementById('towCheck').checked;
    if(isTowing) r /= ship.towPenalty;
    
    document.getElementById('dashShip').innerText = ship.name;
    document.getElementById('dashRange').innerText = r.toFixed(1) + " MN";
    document.getElementById('dashSpeed').innerText = finalVitesse + " kts";
    document.getElementById('dashTank').innerText = ship.tank + " L";
    document.getElementById('dashCons').innerText = ship.cons;

    // 4. NETTOYAGE DES ANCIENS TRACÉS
    if (rangeCircle) map.removeLayer(rangeCircle);
    isoLayers.forEach(layer => map.removeLayer(layer));
    isoLayers = [];

    // 5. DESSIN DU RAYON D'ACTION (AUTONOMIE)
    try {
        const circleTurf = turf.circle([coords[1], coords[0]], r, { units: 'nauticalmiles' });
        let finalGeo = circleTurf;
        if (landMass) { 
            const diff = turf.difference(circleTurf, landMass); 
            if (diff) finalGeo = diff; 
        }
        rangeCircle = L.geoJSON(finalGeo, { 
            style: { color: isTowing ? '#ef6c00' : '#1565c0', weight: 3, fillOpacity: 0.1 } 
        }).addTo(map);
    } catch (e) { console.warn("Turf Error Range"); }

    // 6. DESSIN DES ISOCHRONES (15, 30, 45, 60 min)
    const intervals = [15, 30, 45, 60];
    intervals.forEach(minutes => {
        const distMN = finalVitesse * (minutes / 60);
        if (distMN <= r) { // On ne dessine l'isochrone que s'il est dans le rayon d'autonomie
            try {
                const isoTurf = turf.circle([coords[1], coords[0]], distMN, { units: 'nauticalmiles' });
                let isoGeo = isoTurf;
                if (landMass) {
                    const diff = turf.difference(isoTurf, landMass);
                    if (diff) isoGeo = diff;
                }
                const layer = L.geoJSON(isoGeo, {
                    style: { color: '#2e7d32', weight: 1, dashArray: '5, 8', fill: false }
                }).addTo(map).bindTooltip(`${minutes} min`, {sticky: true, opacity: 0.6});
                isoLayers.push(layer);
            } catch (e) { console.warn("Turf Error Iso"); }
        }
    });

    map.panTo(coords);
    updateDrift();
}

    function setSea(l, b) { currentSea = l; document.querySelectorAll('.sea-btn').forEach(x => x.classList.remove('active')); b.classList.add('active'); calculate(); }
/**
 * Calcule la dérive totale (Vent + Courant), met à jour la rose des vents 
 * et positionne le point de rendez-vous (DATUM) sur la carte.
 */
/**
 * Calcule la dérive totale (Vent + Courant), met à jour la rose des vents 
 * et positionne le point de rendez-vous (DATUM) sur la carte.
 * Logique : Courant standard / Vent inversé.
 */
function updateDrift() {
    // --- 1. DONNÉES D'ENTRÉE ---
    const windText        = document.getElementById('val-wind').innerText;
    const windSpeedKts    = parseFloat(windText) || 0;
    const targetLeewayFactor = parseFloat(document.getElementById('targetType').value);
    const windDir         = parseFloat(document.getElementById('wind-dir-icon').dataset.windProvenance) || 0;
    const curDir          = parseFloat(document.getElementById('curDir').value)   || 0;
    const curSpeed        = parseFloat(document.getElementById('curSpeed').value) || 0;
    const swellDir        = parseFloat(document.getElementById('swellDir').value);
    const swellHeight     = window.currentSwellHeight || parseFloat(document.getElementById('val-swell').innerText) || 0;

    // --- 2. CALCUL VECTORIEL DÉRIVE ---
    const rad = (d) => d * Math.PI / 180;
    const driftWindSpeed  = windSpeedKts * targetLeewayFactor;
    const anglePoussee    = (windDir + 180) % 360;

    const vdx = driftWindSpeed * Math.sin(rad(anglePoussee)) + curSpeed * Math.sin(rad(curDir));
    const vdy = driftWindSpeed * Math.cos(rad(anglePoussee)) + curSpeed * Math.cos(rad(curDir));

    const totalDriftSpeed = Math.sqrt(vdx * vdx + vdy * vdy);
    let totalDriftDir     = Math.atan2(vdx, vdy) * (180 / Math.PI);
    totalDriftDir         = (totalDriftDir + 360) % 360;

    // Affichage dérive
    document.getElementById('driftTotal').innerText = `${totalDriftSpeed.toFixed(1)} nds @ ${Math.round(totalDriftDir)}°`;

    // --- 3. COMPAS VECTORIEL ---
    const scale = 20;
    document.getElementById('vector-wind').style.height    = (driftWindSpeed * scale) + 'px';
    document.getElementById('vector-wind').style.transform = `rotate(${anglePoussee}deg)`;
    document.getElementById('vector-current').style.height    = (curSpeed * scale) + 'px';
    document.getElementById('vector-current').style.transform = `rotate(${curDir}deg)`;
    document.getElementById('vector-result').style.height    = (totalDriftSpeed * scale) + 'px';
    document.getElementById('vector-result').style.transform = `rotate(${totalDriftDir}deg)`;

    // --- 4. CALCUL HOULE & ROUTE OPTIMALE ---
    const swellWarningEl  = document.getElementById('swell-warning');
    const swellWarningTxt = document.getElementById('swell-warning-text');
    const zigzagDetailEl  = document.getElementById('zigzag-detail');
    const zigzagCapsEl    = document.getElementById('zigzag-caps');
    const routeEl         = document.getElementById('val-eta-route');

    // Seuil houle significative : > 1.0 m
    const SWELL_THRESHOLD = 1.0;
    let useZigzag = false;
    let zigzagCaps = null;

    if (!isNaN(swellDir) && swellHeight > SWELL_THRESHOLD && vsdMarker) {
        const portKey  = document.getElementById('portSelector').value;
        const shipPos  = L.latLng(ports[portKey][0], ports[portKey][1]);
        const datumPos = driftEndMarker ? driftEndMarker.getLatLng() : null;

        if (datumPos) {
            const capDirect = (turf.bearing(turf.point([shipPos.lng, shipPos.lat]), turf.point([datumPos.lng, datumPos.lat])) + 360) % 360;

            // Angle entre le cap direct et la houle
            let angleDiff = Math.abs(capDirect - swellDir) % 360;
            if (angleDiff > 180) angleDiff = 360 - angleDiff;

            // Risque si < 30° (quasi face) ou > 150° (quasi arrière plein)
            const isFaceOrArriere = angleDiff < 30 || angleDiff > 150;

            if (isFaceOrArriere) {
                useZigzag = true;
                // Route optimale : couper la houle à 45° → 2 caps alternés
                const cap1 = (swellDir + 45)  % 360;
                const cap2 = (swellDir + 315) % 360; // swellDir - 45

                // On choisit le cap qui se rapproche le plus du datum
                const diff1 = Math.abs(((cap1 - capDirect) + 180 + 360) % 360 - 180);
                const diff2 = Math.abs(((cap2 - capDirect) + 180 + 360) % 360 - 180);
                const capA  = diff1 <= diff2 ? cap1 : cap2;
                const capB  = diff1 <= diff2 ? cap2 : cap1;

                zigzagCaps = { capA: Math.round(capA), capB: Math.round(capB), angleDiff: Math.round(angleDiff) };

                const situation = angleDiff < 30 ? 'face à la houle' : 'houle de travers arrière';
                swellWarningTxt.innerHTML = `Houle ${swellHeight}m — cap direct ${situation} (${Math.round(angleDiff)}°). Route en zigzag recommandée à ±45°.`;
                swellWarningEl.style.display = 'block';

                zigzagCapsEl.innerHTML = `Cap aller : <b style="color:#fbbf24;">${zigzagCaps.capA}°</b> &nbsp;|&nbsp; Cap retour : <b style="color:#fbbf24;">${zigzagCaps.capB}°</b>`;
                zigzagDetailEl.style.display = 'block';
                routeEl.textContent = 'ZIGZAG ±45°';
                routeEl.style.color = '#fbbf24';
            } else {
                swellWarningEl.style.display  = 'none';
                zigzagDetailEl.style.display  = 'none';
                routeEl.textContent = 'DIRECTE';
                routeEl.style.color = '#4ade80';
            }
        }
    } else {
        swellWarningEl.style.display  = 'none';
        zigzagDetailEl.style.display  = 'none';
        routeEl.textContent = 'DIRECTE';
        routeEl.style.color = '#4ade80';
    }

    // --- 5. CALCUL DATUM & INTERCEPTION ---
    if (vsdMarker) {
        const portKey      = document.getElementById('portSelector').value;
        const shipPos      = L.latLng(ports[portKey][0], ports[portKey][1]);
        const lkpPos       = vsdMarker.getLatLng();
        const shipSpeed    = parseFloat(document.getElementById('dashSpeed').innerText) || 1;
        const distTransitMN = shipPos.distanceTo(lkpPos) / 1852;
        const transitTimeMin = (distTransitMN / shipSpeed) * 60;

        const tLKP = document.getElementById('timeLKP').value.split(':');
        const tDep = document.getElementById('timeDepart').value.split(':');
        const dateLKP = new Date(); dateLKP.setHours(tLKP[0], tLKP[1], 0);
        const dateDep = new Date(); dateDep.setHours(tDep[0], tDep[1], 0);
        const waitTime = (dateDep - dateLKP) / 60000;
        const totalDriftTimeMin = waitTime + transitTimeMin;

        const driftDistMetres = totalDriftSpeed * 1852 * (totalDriftTimeMin / 60);
        const datumPos = calculateDestination(lkpPos, totalDriftDir, driftDistMetres);

        const pointPort  = turf.point([shipPos.lng, shipPos.lat]);
        const pointDatum = turf.point([datumPos.lng, datumPos.lat]);
        const bearing    = turf.bearing(pointPort, pointDatum);
        const heading    = (bearing + 360) % 360;

        // Mise à jour affichage interception
        document.getElementById('val-eta-time').textContent = Math.round(transitTimeMin) + ' min';
        document.getElementById('val-eta-dist').textContent = distTransitMN.toFixed(1) + ' MN';
        document.getElementById('val-eta-cap').textContent  = Math.round(heading) + '°';

        // Compatibilité ancien ID
        document.getElementById('val-eta').innerText = `${Math.round(transitTimeMin)} min (${distTransitMN.toFixed(1)} MN) au ${Math.round(heading)}°`;

        // Tracés carte
        if (driftLine) map.removeLayer(driftLine);
        driftLine = L.polyline([lkpPos, datumPos], { color: '#d32f2f', weight: 3, dashArray: '5, 10' }).addTo(map);

        if (driftEndMarker) map.removeLayer(driftEndMarker);
        driftEndMarker = L.circleMarker(datumPos, {
            radius: 8, color: '#ffeb3b', fillColor: '#d32f2f', fillOpacity: 0.8, weight: 2
        }).addTo(map).bindTooltip(`DATUM (${Math.round(transitTimeMin)} min)`, { permanent: true });

		// Route : directe ou zigzag, avec détection terre
		if (navLine) map.removeLayer(navLine);

		const routeLine = turf.lineString([
			[shipPos.lng, shipPos.lat],
			[datumPos.lng, datumPos.lat]
		]);

		const crossesLand = landMass && turf.booleanIntersects(routeLine, landMass);

		if (crossesLand) {
			// Route passe par la terre → waypoint de contournement par le large
			const midLat = (shipPos.lat + datumPos.lat) / 2 - 0.05; // décale vers le sud (large)
			const midLng = (shipPos.lng + datumPos.lng) / 2;
			const midPoint = L.latLng(midLat, midLng);
			navLine = L.polyline([shipPos, midPoint, datumPos], {
				color: '#f59e0b', weight: 3, dashArray: '10, 5', opacity: 0.85
			}).addTo(map);
			document.getElementById('val-eta-route').textContent = '⚠️ CONTOURNEMENT';
			document.getElementById('val-eta-route').style.color = '#f97316';
		} else if (useZigzag && zigzagCaps) {
			const midDist  = distTransitMN / 2;
			const midPoint = calculateDestination(shipPos, zigzagCaps.capA, midDist * 1852);
			navLine = L.polyline([shipPos, midPoint, datumPos], {
				color: '#f59e0b', weight: 3, dashArray: '10, 5', opacity: 0.85
			}).addTo(map);
		} else {
			navLine = L.polyline([shipPos, datumPos], { color: '#1565c0', weight: 4, opacity: 0.7 }).addTo(map);
		}
    }
}


function startSarMission() {
    map.getContainer().style.cursor = 'crosshair';
    map.once('click', function(e) {
        if (vsdMarker) map.removeLayer(vsdMarker);
        vsdMarker = L.marker(e.latlng, { draggable: true })
            .addTo(map)
            .bindPopup("<b>LKP (Dernière Position)</b>")
            .openPopup();

        // Remplir les champs DMS avec la position cliquée
        updateDmsFieldsFromLatLng(e.latlng.lat, e.latlng.lng);

        // Indicateur visuel
        document.getElementById('lkp-status-dot').style.background = '#4ade80';
        document.getElementById('lkp-status-dot').style.boxShadow  = '0 0 6px #4ade80';

        vsdMarker.on('drag', () => {
            const pos = vsdMarker.getLatLng();
            updateDmsFieldsFromLatLng(pos.lat, pos.lng);
            updateDrift();
        });

        // Afficher la card pattern de recherche
        document.getElementById('searchCard').style.setProperty('display', 'block', 'important');

        updateDrift();
        map.getContainer().style.cursor = '';
    });
}

    loadLandData();
    setInterval(updateTide, 600000);
	

	function calculateDestination(latlng, brng, dist) {
    const R = 6371e3; // Rayon de la Terre en mètres
    const d = dist / R;
    const θ = brng * Math.PI / 180;
    const φ1 = latlng.lat * Math.PI / 180;
    const λ1 = latlng.lng * Math.PI / 180;

    const φ2 = Math.asin(Math.sin(φ1) * Math.cos(d) + Math.cos(φ1) * Math.sin(d) * Math.cos(θ));
    const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(d) * Math.cos(φ1), Math.cos(d) - Math.sin(φ1) * Math.sin(φ2));

    return L.latLng(φ2 * 180 / Math.PI, λ2 * 180 / Math.PI);
}

const now = new Date();
const timeStr = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
document.getElementById('timeLKP').value = timeStr;
document.getElementById('timeDepart').value = timeStr;

function resetSarMission() {
    if (vsdMarker) { map.removeLayer(vsdMarker); vsdMarker = null; }
    if (driftEndMarker) { map.removeLayer(driftEndMarker); driftEndMarker = null; }
    if (driftLine) { map.removeLayer(driftLine); driftLine = null; }
    if (navLine) { map.removeLayer(navLine); navLine = null; }
    
    document.getElementById('driftTotal').innerText = "-- nds";
    document.getElementById('val-eta').innerText = "-- min";
    
    const now = new Date();
    const timeStr = String(now.getHours()).padStart(2, '0') + ":" + String(now.getMinutes()).padStart(2, '0');
    document.getElementById('timeLKP').value = timeStr;
    document.getElementById('timeDepart').value = timeStr;

    map.getContainer().style.cursor = '';

    // Réinitialiser les champs GPS
    ['lkp-lat-deg','lkp-lat-min','lkp-lat-sec','lkp-lon-deg','lkp-lon-min','lkp-lon-sec'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('lkp-lat-hem').value = 'N';
    document.getElementById('lkp-lon-hem').value = 'W';
    document.getElementById('lkp-decimal-display').textContent = '-- , --';
    document.getElementById('lkp-decimal-display').style.color = '#64748b';
    document.getElementById('lkp-status-dot').style.background = '#334155';
    document.getElementById('lkp-status-dot').style.boxShadow  = 'none';

    // Masquer et réinitialiser la card pattern
    clearSearchPattern();
    document.getElementById('searchCard').style.setProperty('display', 'none', 'important');

    console.log("Mission SAR réinitialisée.");
}

/**
 * Convertit les champs DMS en degrés décimaux et met à jour l'affichage
 * Appelé à chaque frappe dans un champ GPS
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

    // On n'affiche que si au moins degrés lat ET lon sont saisis
    if (isNaN(latDeg) || isNaN(lonDeg)) {
        display.textContent = '-- , --';
        display.style.color = '#64748b';
        return;
    }

    const lat = dmsToDecimal(latDeg, latMin, latSec, latHem);
    const lon = dmsToDecimal(lonDeg, lonMin, lonSec, lonHem);

    // Validation plage
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        display.textContent = '⚠ Coordonnées invalides';
        display.style.color = '#ef4444';
        return;
    }

    display.textContent = `${lat.toFixed(5)}° , ${lon.toFixed(5)}°`;
    display.style.color = '#4ade80';
}

/**
 * Convertit DMS → degrés décimaux
 */
function dmsToDecimal(deg, min, sec, hem) {
    const decimal = deg + (min / 60) + (sec / 3600);
    return (hem === 'S' || hem === 'W') ? -decimal : decimal;
}

/**
 * Valide les coordonnées DMS, place le marqueur LKP et lance le calcul
 */
function placeLkpFromGps() {
    const latDeg = parseFloat(document.getElementById('lkp-lat-deg').value);
    const latMin = parseFloat(document.getElementById('lkp-lat-min').value) || 0;
    const latSec = parseFloat(document.getElementById('lkp-lat-sec').value) || 0;
    const latHem = document.getElementById('lkp-lat-hem').value;

    const lonDeg = parseFloat(document.getElementById('lkp-lon-deg').value);
    const lonMin = parseFloat(document.getElementById('lkp-lon-min').value) || 0;
    const lonSec = parseFloat(document.getElementById('lkp-lon-sec').value) || 0;
    const lonHem = document.getElementById('lkp-lon-hem').value;

    if (isNaN(latDeg) || isNaN(lonDeg)) {
        alert('Veuillez saisir au minimum les degrés de latitude et longitude.');
        return;
    }

    const lat = dmsToDecimal(latDeg, latMin, latSec, latHem);
    const lon = dmsToDecimal(lonDeg, lonMin, lonSec, lonHem);

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        alert('Coordonnées hors limites. Vérifiez la saisie.');
        return;
    }

    const latlng = L.latLng(lat, lon);

    // Place ou déplace le marqueur LKP
    if (vsdMarker) map.removeLayer(vsdMarker);
    vsdMarker = L.marker(latlng, { draggable: true })
        .addTo(map)
        .bindPopup(`<b>LKP (Dernière Position)</b><br><small>${latDeg}°${latMin}'${latSec}"${latHem} / ${lonDeg}°${lonMin}'${lonSec}"${lonHem}</small>`)
        .openPopup();

    vsdMarker.on('drag', () => {
        // Quand on déplace manuellement, on met à jour les champs DMS
        const pos = vsdMarker.getLatLng();
        updateDmsFieldsFromLatLng(pos.lat, pos.lng);
        updateDrift();
    });

    // Centrer la carte sur le LKP
    map.setView(latlng, Math.max(map.getZoom(), 12));

    // Indicateur visuel
    document.getElementById('lkp-status-dot').style.background = '#4ade80';
    document.getElementById('lkp-status-dot').style.boxShadow  = '0 0 6px #4ade80';

    // Afficher la card pattern
    document.getElementById('searchCard').style.setProperty('display', 'block', 'important');

    updateDrift();
}

/**
 * Met à jour les champs DMS depuis des coordonnées décimales
 * (utilisé quand on déplace le marqueur à la main)
 */
function updateDmsFieldsFromLatLng(lat, lng) {
    const toD = (decimal) => {
        const abs  = Math.abs(decimal);
        const deg  = Math.floor(abs);
        const minF = (abs - deg) * 60;
        const min  = Math.floor(minF);
        const sec  = Math.round((minF - min) * 60);
        return { deg, min, sec };
    };

    const latD = toD(lat), lonD = toD(lng);

    document.getElementById('lkp-lat-deg').value = latD.deg;
    document.getElementById('lkp-lat-min').value = latD.min;
    document.getElementById('lkp-lat-sec').value = latD.sec;
    document.getElementById('lkp-lat-hem').value  = lat >= 0 ? 'N' : 'S';

    document.getElementById('lkp-lon-deg').value = lonD.deg;
    document.getElementById('lkp-lon-min').value = lonD.min;
    document.getElementById('lkp-lon-sec').value = lonD.sec;
    document.getElementById('lkp-lon-hem').value  = lng >= 0 ? 'E' : 'W';

    onLkpInput(); // Rafraîchit l'affichage décimal
}



let searchPatternLayers = [];
let searchCircleLayer   = null;
let currentSearchPattern = 'expanding';

function selectPattern(type) {
    currentSearchPattern = type;
    document.querySelectorAll('.pattern-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + type).classList.add('active');
    document.getElementById('row-sector-angle').style.display  = (type === 'sector')                        ? 'flex' : 'none';
    document.getElementById('row-orientation').style.display   = (type === 'parallel' || type === 'creeping') ? 'flex' : 'none';
    const labelPasses = document.getElementById('label-passes');
    const unitPasses  = document.getElementById('unit-passes');
    if (type === 'sector')        { labelPasses.textContent = 'Nombre de rayons :';       unitPasses.textContent = 'n'; }
    else if (type === 'expanding'){ labelPasses.textContent = 'Taille du carré (tours) :'; unitPasses.textContent = 'n'; }
    else                          { labelPasses.textContent = 'Nombre de passes :';        unitPasses.textContent = 'n'; }
}

function movePoint(latlng, brngDeg, distMN) {
    return calculateDestination(latlng, brngDeg, distMN * 1852);
}

function clearSearchPattern() {
    searchPatternLayers.forEach(l => map.removeLayer(l));
    searchPatternLayers = [];
    if (searchCircleLayer) { map.removeLayer(searchCircleLayer); searchCircleLayer = null; }
    document.getElementById('stat-surface').textContent  = '--';
    document.getElementById('stat-distance').textContent = '--';
    document.getElementById('stat-duration').textContent = '--';
    document.getElementById('search-status-dot').style.background  = '#334155';
    document.getElementById('search-status-dot').style.boxShadow   = 'none';
}

function renderSearchPattern() {
    clearSearchPattern();

    if (!driftEndMarker) {
        alert("Calculez d'abord le DATUM avant de générer un pattern de recherche.");
        return;
    }

    const datum       = driftEndMarker.getLatLng();
    const spacing     = parseFloat(document.getElementById('searchSpacing').value)     || 0.3;
    const passes      = parseInt(document.getElementById('searchPasses').value)        || 4;
    const uncertainty = parseFloat(document.getElementById('searchUncertainty').value) || 0.5;
    const orientation = parseFloat(document.getElementById('searchOrientation').value) || 0;
    const sectorAngle = parseFloat(document.getElementById('searchSectorAngle').value) || 120;
    const shipSpeed   = parseFloat(document.getElementById('dashSpeed').innerText)     || 5;

    const styleTrack = { color: '#f59e0b', weight: 2, opacity: 0.85, dashArray: '8, 5' };
    let waypoints = [];

    // 1. EXPANDING SQUARE
    if (currentSearchPattern === 'expanding') {
        let pos = datum, dist = spacing, dir = 0;
        waypoints.push(pos);
        for (let i = 0; i < passes * 4; i++) {
            pos = movePoint(pos, dir, dist);
            waypoints.push(pos);
            dir = (dir + 90) % 360;
            if (i % 2 === 1) dist += spacing;
        }
    }

    // 2. CREEPING LINE (raquette)
    else if (currentSearchPattern === 'creeping') {
        const legLen = spacing * (passes + 1);
        const back   = (orientation + 180) % 360;
        const perp   = (orientation + 90)  % 360;
        let pos = movePoint(datum, back, (passes * spacing) / 2);
        waypoints.push(pos);
        for (let i = 0; i < passes; i++) {
            pos = movePoint(pos, orientation, legLen); waypoints.push(pos);
            if (i < passes - 1) {
                pos = movePoint(pos, perp, spacing);   waypoints.push(pos);
                pos = movePoint(pos, back, legLen);    waypoints.push(pos);
                pos = movePoint(pos, perp, spacing);   waypoints.push(pos);
            }
        }
    }

    // 3. SECTOR SEARCH
    else if (currentSearchPattern === 'sector') {
        const angleStep  = sectorAngle / (passes - 1 || 1);
        const startAngle = (orientation - sectorAngle / 2 + 360) % 360;
        for (let i = 0; i < passes; i++) {
            const ang = (startAngle + i * angleStep) % 360;
            waypoints.push(datum);
            waypoints.push(movePoint(datum, ang, spacing * passes));
            waypoints.push(datum);
        }
    }

    // 4. PARALLEL TRACK
    else if (currentSearchPattern === 'parallel') {
        const legLen   = spacing * (passes + 1);
        const back     = (orientation + 180) % 360;
        const perp     = (orientation + 90)  % 360;
        let pos = movePoint(datum, (perp + 180) % 360, (passes * spacing) / 2);
        pos = movePoint(pos, back, legLen / 2);
        waypoints.push(pos);
        for (let i = 0; i < passes; i++) {
            pos = movePoint(pos, orientation, legLen); waypoints.push(pos);
            if (i < passes - 1) {
                pos = movePoint(pos, perp, spacing);   waypoints.push(pos);
            }
        }
    }

    // --- Dessin du tracé ---
    if (waypoints.length > 1) {
        searchPatternLayers.push(L.polyline(waypoints, styleTrack).addTo(map));

        // Flèches de direction sur chaque segment
        for (let i = 0; i < waypoints.length - 1; i++) {
            const mid  = L.latLng((waypoints[i].lat + waypoints[i+1].lat) / 2, (waypoints[i].lng + waypoints[i+1].lng) / 2);
            const brng = turf.bearing(turf.point([waypoints[i].lng, waypoints[i].lat]), turf.point([waypoints[i+1].lng, waypoints[i+1].lat]));
            const arrowIcon = L.divIcon({ html: `<div style="transform:rotate(${brng}deg);color:#fbbf24;font-size:14px;line-height:1;">▲</div>`, className: '', iconSize: [14,14], iconAnchor: [7,7] });
            searchPatternLayers.push(L.marker(mid, { icon: arrowIcon, interactive: false }).addTo(map));
        }

        // Point de départ vert
        const startIcon = L.divIcon({ html: `<div style="width:12px;height:12px;background:#22c55e;border:2px solid #fff;border-radius:50%;"></div>`, className: '', iconSize:[12,12], iconAnchor:[6,6] });
        searchPatternLayers.push(L.marker(waypoints[0], { icon: startIcon }).addTo(map).bindTooltip('Départ recherche', { direction: 'top' }));
    }

    // --- Cercle d'incertitude ---
    if (uncertainty > 0) {
        searchCircleLayer = L.circle(datum, {
            radius: uncertainty * 1852, color: '#a78bfa', weight: 2, dashArray: '6,6',
            fill: true, fillColor: '#7c3aed', fillOpacity: 0.08
        }).addTo(map).bindTooltip(`Incertitude ±${uncertainty} MN`, { sticky: true });
    }

    // --- Statistiques ---
    let totalDistMN = 0;
    for (let i = 0; i < waypoints.length - 1; i++) totalDistMN += waypoints[i].distanceTo(waypoints[i+1]) / 1852;
    const lats = waypoints.map(w => w.lat), lngs = waypoints.map(w => w.lng);
    const dLat = (Math.max(...lats) - Math.min(...lats)) * 60;
    const dLng = (Math.max(...lngs) - Math.min(...lngs)) * 60 * Math.cos(datum.lat * Math.PI / 180);
    const durationMin = Math.round((totalDistMN / shipSpeed) * 60);

    document.getElementById('stat-surface').textContent  = (dLat * dLng).toFixed(2) + ' MN²';
    document.getElementById('stat-distance').textContent = totalDistMN.toFixed(1) + ' MN';
    document.getElementById('stat-duration').textContent = durationMin + ' min';
    document.getElementById('search-status-dot').style.background = '#f59e0b';
    document.getElementById('search-status-dot').style.boxShadow  = '0 0 6px #f59e0b';
}

// --- ICONES SNSM ---
const snsmIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png', // Ou une icône SNSM si tu en as une
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Ajout des marqueurs fixes pour tes stations
Object.entries(ports).forEach(([name, coords]) => {
    L.marker(coords, {icon: snsmIcon})
     .addTo(map)
     .bindPopup(`<b>Station SNSM de ${name}</b><br>Prête pour intervention`);
});

// --- LOGIQUE DE DÉPLACEMENT DES CARDS ---

function makeDraggable(el) {
    // On utilise le H4 (titre) comme poignée pour déplacer la carte
    const header = el.querySelector('h4');
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    if (header) {
        header.onmousedown = dragMouseDown;
    } else {
        el.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();

        // Désactive l'ancre du bas dès qu'on clique sur la carte pour la bouger
        el.style.bottom = "auto"; 
        
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // Calcul du mouvement
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // Nouvelle position de la carte
        el.style.top = (el.offsetTop - pos2) + "px";
        el.style.left = (el.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}


// Initialisation au chargement de la page
window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.floating-card').forEach(card => {
        makeDraggable(card);
    });	
    // Détection édition manuelle du champ houle
    const swellField = document.getElementById('swellDir');
    if (swellField) {
        swellField.addEventListener('input', () => {
            swellField.dataset.manualEdit = 'true';
            const label = document.getElementById('swell-auto-label');
            if (label) { label.textContent = '✏ Saisie manuelle'; label.style.color = '#fbbf24'; }
        });
    }
});

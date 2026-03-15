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

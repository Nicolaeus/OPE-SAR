/**
 * SAR-ENGINE.JS
 * Calcul de dérive (LKP → DATUM), gestion de la mission SAR,
 * saisie coordonnées DMS, et patterns de recherche.
 *
 * Dépendances : globals.js (vsdMarker, driftEndMarker, driftLine, navLine,
 *               searchPatternLayers, searchCircleLayer, currentSearchPattern,
 *               ports, map, landMass)
 *              navigation.js (calculateDestination)
 */

// ============================================================
// 1. CALCUL DE DÉRIVE & DATUM
// ============================================================

/**
 * Calcule la dérive vectorielle (vent léeway + courant),
 * met à jour le compas vectoriel et positionne le DATUM sur la carte.
 * Ne fait rien si aucun LKP n'est posé.
 */
function updateDrift() {
    // --- Données d'entrée ---
    const windText           = document.getElementById('val-wind')?.innerText || '';
    const windSpeedKts       = parseFloat(windText) || 0;
    const targetLeewayFactor = parseFloat(document.getElementById('targetType')?.value) || 0.05;
    const windDir            = parseFloat(document.getElementById('wind-dir-icon')?.dataset.windProvenance) || 0;
    const curDir             = parseFloat(document.getElementById('curDir')?.value)   || 0;
    const curSpeed           = parseFloat(document.getElementById('curSpeed')?.value) || 0;
    const swellDir           = parseFloat(document.getElementById('swellDir')?.value);
    const swellHeight        = window.currentSwellHeight
                             || parseFloat(document.getElementById('val-swell')?.innerText) || 0;

    // --- Calcul vectoriel dérive ---
    const rad            = d => d * Math.PI / 180;
    const driftWindSpeed = windSpeedKts * targetLeewayFactor;
    const anglePoussee   = (windDir + 180) % 360;

    const vdx = driftWindSpeed * Math.sin(rad(anglePoussee)) + curSpeed * Math.sin(rad(curDir));
    const vdy = driftWindSpeed * Math.cos(rad(anglePoussee)) + curSpeed * Math.cos(rad(curDir));

    const totalDriftSpeed = Math.sqrt(vdx * vdx + vdy * vdy);
    const totalDriftDir   = (Math.atan2(vdx, vdy) * 180 / Math.PI + 360) % 360;

    // Affichage dérive résultante
    const driftEl = document.getElementById('driftTotal');
    if (driftEl) driftEl.innerText = `${totalDriftSpeed.toFixed(1)} nds @ ${Math.round(totalDriftDir)}°`;

    // --- Compas vectoriel ---
    const scale = 20;
    _setVector('vector-wind',    driftWindSpeed * scale, anglePoussee);
    _setVector('vector-current', curSpeed       * scale, curDir);
    _setVector('vector-result',  totalDriftSpeed * scale, totalDriftDir);

    // --- Houle & route optimale ---
    const SWELL_THRESHOLD = 1.0;
    let useZigzag  = false;
    let zigzagCaps = null;

    const swellWarnEl = document.getElementById('swell-warning');
    const swellWarnTxt = document.getElementById('swell-warning-text');
    const zigzagEl    = document.getElementById('zigzag-detail');
    const zigzagCapsEl = document.getElementById('zigzag-caps');
    const routeEl     = document.getElementById('val-eta-route');

    if (!isNaN(swellDir) && swellHeight > SWELL_THRESHOLD && vsdMarker && driftEndMarker) {
        const portKey  = document.getElementById('portSelector').value;
        const shipPos  = L.latLng(ports[portKey][0], ports[portKey][1]);
        const datumPos = driftEndMarker.getLatLng();
        const capDirect = (turf.bearing(
            turf.point([shipPos.lng, shipPos.lat]),
            turf.point([datumPos.lng, datumPos.lat])
        ) + 360) % 360;

        let angleDiff = Math.abs(capDirect - swellDir) % 360;
        if (angleDiff > 180) angleDiff = 360 - angleDiff;

        if (angleDiff < 30 || angleDiff > 150) {
            useZigzag = true;
            const cap1 = (swellDir + 45)  % 360;
            const cap2 = (swellDir + 315) % 360;
            const d1   = Math.abs(((cap1 - capDirect) + 180 + 360) % 360 - 180);
            const d2   = Math.abs(((cap2 - capDirect) + 180 + 360) % 360 - 180);
            const capA = d1 <= d2 ? cap1 : cap2;
            const capB = d1 <= d2 ? cap2 : cap1;
            zigzagCaps = { capA: Math.round(capA), capB: Math.round(capB) };

            const situation = angleDiff < 30 ? 'face à la houle' : 'houle de travers arrière';
            if (swellWarnTxt) swellWarnTxt.innerHTML = `Houle ${swellHeight}m — cap direct ${situation} (${Math.round(angleDiff)}°). Route en zigzag recommandée à ±45°.`;
            if (swellWarnEl)  swellWarnEl.style.display = 'block';
            if (zigzagCapsEl) zigzagCapsEl.innerHTML = `Cap aller : <b style="color:#fbbf24;">${zigzagCaps.capA}°</b> &nbsp;|&nbsp; Cap retour : <b style="color:#fbbf24;">${zigzagCaps.capB}°</b>`;
            if (zigzagEl)     zigzagEl.style.display = 'block';
            if (routeEl)      { routeEl.textContent = 'ZIGZAG ±45°'; routeEl.style.color = '#fbbf24'; }
        } else {
            _hideSwellWarnings(swellWarnEl, zigzagEl, routeEl);
        }
    } else {
        _hideSwellWarnings(swellWarnEl, zigzagEl, routeEl);
    }

    // --- Calcul DATUM & interception ---
    if (!vsdMarker) return;

    const portKey       = document.getElementById('portSelector').value;
    const shipPos       = L.latLng(ports[portKey][0], ports[portKey][1]);
    const lkpPos        = vsdMarker.getLatLng();
    const shipSpeed     = parseFloat(document.getElementById('dashSpeed')?.innerText) || 1;
    const distTransitMN = shipPos.distanceTo(lkpPos) / 1852;
    const transitTimeMin = (distTransitMN / shipSpeed) * 60;

    const tLKP = (document.getElementById('timeLKP')?.value || '00:00').split(':');
    const tDep = (document.getElementById('timeDepart')?.value || '00:00').split(':');
    const dateLKP = new Date(); dateLKP.setHours(+tLKP[0], +tLKP[1], 0);
    const dateDep = new Date(); dateDep.setHours(+tDep[0], +tDep[1], 0);
    const waitTime = (dateDep - dateLKP) / 60000;
    const totalDriftTimeMin = waitTime + transitTimeMin;

    const driftDistMetres = totalDriftSpeed * 1852 * (totalDriftTimeMin / 60);
    const datumPos = calculateDestination(lkpPos, totalDriftDir, driftDistMetres);

    const bearing = turf.bearing(
        turf.point([shipPos.lng, shipPos.lat]),
        turf.point([datumPos.lng, datumPos.lat])
    );
    const heading = (bearing + 360) % 360;

    // Affichage interception
    _setTxt('val-eta-time', Math.round(transitTimeMin) + ' min');
    _setTxt('val-eta-dist', distTransitMN.toFixed(1) + ' MN');
    _setTxt('val-eta-cap',  Math.round(heading) + '°');
    _setTxt('val-eta',      `${Math.round(transitTimeMin)} min (${distTransitMN.toFixed(1)} MN) au ${Math.round(heading)}°`);

    // Tracé dérive LKP → DATUM
    if (driftLine) map.removeLayer(driftLine);
    driftLine = L.polyline([lkpPos, datumPos], {
        color: '#d32f2f', weight: 3, dashArray: '5, 10'
    }).addTo(map);

    // Marqueur DATUM
    if (driftEndMarker) map.removeLayer(driftEndMarker);
    driftEndMarker = L.circleMarker(datumPos, {
        radius: 8, color: '#ffeb3b', fillColor: '#d32f2f', fillOpacity: 0.8, weight: 2
    }).addTo(map).bindTooltip(`DATUM (${Math.round(transitTimeMin)} min)`, { permanent: true });

    // Route : terre, zigzag ou directe
    if (navLine) map.removeLayer(navLine);
    const routeLine   = turf.lineString([[shipPos.lng, shipPos.lat], [datumPos.lng, datumPos.lat]]);
    const crossesLand = landMass && turf.booleanIntersects(routeLine, landMass);

    if (crossesLand) {
        const midLat  = (shipPos.lat + datumPos.lat) / 2 - 0.05;
        const midLng  = (shipPos.lng + datumPos.lng) / 2;
        navLine = L.polyline([shipPos, L.latLng(midLat, midLng), datumPos], {
            color: '#f59e0b', weight: 3, dashArray: '10, 5', opacity: 0.85
        }).addTo(map);
        if (routeEl) { routeEl.textContent = '⚠️ CONTOURNEMENT'; routeEl.style.color = '#f97316'; }
    } else if (useZigzag && zigzagCaps) {
        const midPoint = calculateDestination(shipPos, zigzagCaps.capA, (distTransitMN / 2) * 1852);
        navLine = L.polyline([shipPos, midPoint, datumPos], {
            color: '#f59e0b', weight: 3, dashArray: '10, 5', opacity: 0.85
        }).addTo(map);
    } else {
        navLine = L.polyline([shipPos, datumPos], {
            color: '#1565c0', weight: 4, opacity: 0.7
        }).addTo(map);
    }
}

// ============================================================
// 2. COMMANDES DE MISSION SAR
// ============================================================

/**
 * Active le mode "clic sur carte" pour placer le LKP.
 */
function startSarMission() {
    map.getContainer().style.cursor = 'crosshair';
    map.once('click', (e) => {
        _placeLkpMarker(e.latlng);
        document.getElementById('searchCard')?.style.setProperty('display', 'block', 'important');
        updateDrift();
        map.getContainer().style.cursor = '';
    });
}

/**
 * Réinitialise toute la mission SAR.
 */
function resetSarMission() {
    if (vsdMarker)      { map.removeLayer(vsdMarker);      vsdMarker      = null; }
    if (driftEndMarker) { map.removeLayer(driftEndMarker); driftEndMarker = null; }
    if (driftLine)      { map.removeLayer(driftLine);      driftLine      = null; }
    if (navLine)        { map.removeLayer(navLine);         navLine        = null; }

    _setTxt('driftTotal', '-- nds');
    _setTxt('val-eta',    '-- min');

    const now     = new Date();
    const timeStr = _padTime(now.getHours()) + ':' + _padTime(now.getMinutes());
    const timeLKP = document.getElementById('timeLKP');
    const timeDep = document.getElementById('timeDepart');
    if (timeLKP) timeLKP.value = timeStr;
    if (timeDep) timeDep.value = timeStr;

    map.getContainer().style.cursor = '';

    // Vider champs DMS
    ['lkp-lat-deg','lkp-lat-min','lkp-lat-sec',
     'lkp-lon-deg','lkp-lon-min','lkp-lon-sec'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const latHem = document.getElementById('lkp-lat-hem'); if (latHem) latHem.value = 'N';
    const lonHem = document.getElementById('lkp-lon-hem'); if (lonHem) lonHem.value = 'W';
    const disp   = document.getElementById('lkp-decimal-display');
    if (disp) { disp.textContent = '-- , --'; disp.style.color = '#64748b'; }
    const dot = document.getElementById('lkp-status-dot');
    if (dot)  { dot.style.background = '#334155'; dot.style.boxShadow = 'none'; }

    clearSearchPattern();
    document.getElementById('searchCard')?.style.setProperty('display', 'none', 'important');
}

// ============================================================
// 3. SAISIE COORDONNÉES DMS
// ============================================================

/** Appelée à chaque frappe dans les champs DMS → affiche les décimales. */
function onLkpInput() {
    const latDeg = parseFloat(document.getElementById('lkp-lat-deg')?.value);
    const latMin = parseFloat(document.getElementById('lkp-lat-min')?.value) || 0;
    const latSec = parseFloat(document.getElementById('lkp-lat-sec')?.value) || 0;
    const latHem = document.getElementById('lkp-lat-hem')?.value;
    const lonDeg = parseFloat(document.getElementById('lkp-lon-deg')?.value);
    const lonMin = parseFloat(document.getElementById('lkp-lon-min')?.value) || 0;
    const lonSec = parseFloat(document.getElementById('lkp-lon-sec')?.value) || 0;
    const lonHem = document.getElementById('lkp-lon-hem')?.value;
    const disp   = document.getElementById('lkp-decimal-display');
    if (!disp) return;

    if (isNaN(latDeg) || isNaN(lonDeg)) {
        disp.textContent = '-- , --'; disp.style.color = '#64748b'; return;
    }
    const lat = dmsToDecimal(latDeg, latMin, latSec, latHem);
    const lon = dmsToDecimal(lonDeg, lonMin, lonSec, lonHem);
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        disp.textContent = '⚠ Coordonnées invalides'; disp.style.color = '#ef4444'; return;
    }
    disp.textContent = `${lat.toFixed(5)}° , ${lon.toFixed(5)}°`;
    disp.style.color = '#4ade80';
}

/** Valide les champs DMS, place le marqueur LKP et lance le calcul. */
function placeLkpFromGps() {
    const latDeg = parseFloat(document.getElementById('lkp-lat-deg')?.value);
    const latMin = parseFloat(document.getElementById('lkp-lat-min')?.value) || 0;
    const latSec = parseFloat(document.getElementById('lkp-lat-sec')?.value) || 0;
    const latHem = document.getElementById('lkp-lat-hem')?.value;
    const lonDeg = parseFloat(document.getElementById('lkp-lon-deg')?.value);
    const lonMin = parseFloat(document.getElementById('lkp-lon-min')?.value) || 0;
    const lonSec = parseFloat(document.getElementById('lkp-lon-sec')?.value) || 0;
    const lonHem = document.getElementById('lkp-lon-hem')?.value;

    if (isNaN(latDeg) || isNaN(lonDeg)) {
        alert('Veuillez saisir au minimum les degrés de latitude et longitude.'); return;
    }
    const lat = dmsToDecimal(latDeg, latMin, latSec, latHem);
    const lon = dmsToDecimal(lonDeg, lonMin, lonSec, lonHem);
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        alert('Coordonnées hors limites. Vérifiez la saisie.'); return;
    }

    _placeLkpMarker(L.latLng(lat, lon));
    map.setView(L.latLng(lat, lon), Math.max(map.getZoom(), 12));
    document.getElementById('searchCard')?.style.setProperty('display', 'block', 'important');
    updateDrift();
}

/** Convertit DMS → degrés décimaux. */
function dmsToDecimal(deg, min, sec, hem) {
    const d = parseFloat(deg) + parseFloat(min) / 60 + parseFloat(sec) / 3600;
    return (hem === 'S' || hem === 'W') ? -d : d;
}

/** Met à jour les champs DMS depuis des coordonnées décimales (ex: drag marqueur). */
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

    _setVal('lkp-lat-deg', latD.deg); _setVal('lkp-lat-min', latD.min); _setVal('lkp-lat-sec', latD.sec);
    _setVal('lkp-lon-deg', lonD.deg); _setVal('lkp-lon-min', lonD.min); _setVal('lkp-lon-sec', lonD.sec);
    const lh = document.getElementById('lkp-lat-hem'); if (lh) lh.value = lat >= 0 ? 'N' : 'S';
    const lo = document.getElementById('lkp-lon-hem'); if (lo) lo.value = lng >= 0 ? 'E' : 'W';
    onLkpInput();
}

// ============================================================
// 4. BOUTONS DE TEMPS SAR
// ============================================================

/** Ajoute `mins` minutes à l'heure LKP et la place dans le champ Départ. */
function addTimeDepart(mins) {
    const timeLKP = document.getElementById('timeLKP')?.value;
    if (!timeLKP) return;
    const [hrs, mns] = timeLKP.split(':').map(Number);
    const d = new Date(); d.setHours(hrs); d.setMinutes(mns + mins);
    const dep = document.getElementById('timeDepart');
    if (dep) dep.value = _padTime(d.getHours()) + ':' + _padTime(d.getMinutes());
    updateDrift();
}

/** Aligne l'heure de départ sur l'heure réelle. */
function setDepartNow() {
    const now = new Date();
    const dep = document.getElementById('timeDepart');
    if (dep) dep.value = _padTime(now.getHours()) + ':' + _padTime(now.getMinutes());
    updateDrift();
}

// ============================================================
// 5. PATTERNS DE RECHERCHE
// ============================================================

function selectPattern(type) {
    currentSearchPattern = type;
    document.querySelectorAll('.pattern-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('btn-' + type);
    if (btn) btn.classList.add('active');

    // Affichage conditionnel des options
    const rowSector = document.getElementById('row-sector-angle');
    const rowOrient = document.getElementById('row-orientation');
    const lblPasses = document.getElementById('label-passes');
    const unitPasses = document.getElementById('unit-passes');
    if (rowSector) rowSector.style.display = (type === 'sector')                             ? 'flex' : 'none';
    if (rowOrient) rowOrient.style.display = (type === 'parallel' || type === 'creeping') ? 'flex' : 'none';
    if (lblPasses) {
        lblPasses.textContent = type === 'sector'   ? 'Nombre de rayons :'
                              : type === 'expanding' ? 'Taille du carré (tours) :'
                              : 'Nombre de passes :';
    }
    if (unitPasses) unitPasses.textContent = 'n';
}

function clearSearchPattern() {
    searchPatternLayers.forEach(l => map.removeLayer(l));
    searchPatternLayers = [];
    if (searchCircleLayer) { map.removeLayer(searchCircleLayer); searchCircleLayer = null; }
    _setTxt('stat-surface',  '--');
    _setTxt('stat-distance', '--');
    _setTxt('stat-duration', '--');
    const dot = document.getElementById('search-status-dot');
    if (dot) { dot.style.background = '#334155'; dot.style.boxShadow = 'none'; }
}

function renderSearchPattern() {
    clearSearchPattern();
    if (!driftEndMarker) { alert("Calculez d'abord le DATUM."); return; }

    const datum       = driftEndMarker.getLatLng();
    const spacing     = parseFloat(document.getElementById('searchSpacing')?.value)     || 0.3;
    const passes      = parseInt(document.getElementById('searchPasses')?.value)         || 4;
    const uncertainty = parseFloat(document.getElementById('searchUncertainty')?.value)  || 0.5;
    const orientation = parseFloat(document.getElementById('searchOrientation')?.value)  || 0;
    const sectorAngle = parseFloat(document.getElementById('searchSectorAngle')?.value)  || 120;
    const shipSpeed   = parseFloat(document.getElementById('dashSpeed')?.innerText)      || 5;

    const style    = { color: '#f59e0b', weight: 2, opacity: 0.85, dashArray: '8, 5' };
    const movePt   = (ll, brng, mn) => calculateDestination(ll, brng, mn * 1852);
    let waypoints  = [];

    if (currentSearchPattern === 'expanding') {
        let pos = datum, dist = spacing, dir = 0;
        waypoints.push(pos);
        for (let i = 0; i < passes * 4; i++) {
            pos = movePt(pos, dir, dist); waypoints.push(pos);
            dir = (dir + 90) % 360;
            if (i % 2 === 1) dist += spacing;
        }
    } else if (currentSearchPattern === 'creeping') {
        const legLen = spacing * (passes + 1);
        const back   = (orientation + 180) % 360;
        const perp   = (orientation + 90)  % 360;
        let pos = movePt(datum, back, (passes * spacing) / 2); waypoints.push(pos);
        for (let i = 0; i < passes; i++) {
            pos = movePt(pos, orientation, legLen); waypoints.push(pos);
            if (i < passes - 1) {
                pos = movePt(pos, perp, spacing);   waypoints.push(pos);
                pos = movePt(pos, back, legLen);    waypoints.push(pos);
                pos = movePt(pos, perp, spacing);   waypoints.push(pos);
            }
        }
    } else if (currentSearchPattern === 'sector') {
        const step  = sectorAngle / (passes - 1 || 1);
        const start = (orientation - sectorAngle / 2 + 360) % 360;
        for (let i = 0; i < passes; i++) {
            const ang = (start + i * step) % 360;
            waypoints.push(datum);
            waypoints.push(movePt(datum, ang, spacing * passes));
            waypoints.push(datum);
        }
    } else if (currentSearchPattern === 'parallel') {
        const legLen = spacing * (passes + 1);
        const back   = (orientation + 180) % 360;
        const perp   = (orientation + 90)  % 360;
        let pos = movePt(datum, (perp + 180) % 360, (passes * spacing) / 2);
        pos = movePt(pos, back, legLen / 2); waypoints.push(pos);
        for (let i = 0; i < passes; i++) {
            pos = movePt(pos, orientation, legLen); waypoints.push(pos);
            if (i < passes - 1) { pos = movePt(pos, perp, spacing); waypoints.push(pos); }
        }
    }

    if (waypoints.length > 1) {
        searchPatternLayers.push(L.polyline(waypoints, style).addTo(map));
        for (let i = 0; i < waypoints.length - 1; i++) {
            const mid  = L.latLng((waypoints[i].lat + waypoints[i+1].lat) / 2, (waypoints[i].lng + waypoints[i+1].lng) / 2);
            const brng = turf.bearing(turf.point([waypoints[i].lng, waypoints[i].lat]), turf.point([waypoints[i+1].lng, waypoints[i+1].lat]));
            searchPatternLayers.push(L.marker(mid, {
                icon: L.divIcon({ html: `<div style="transform:rotate(${brng}deg);color:#fbbf24;font-size:14px;line-height:1;">▲</div>`, className: '', iconSize: [14,14], iconAnchor: [7,7] }),
                interactive: false
            }).addTo(map));
        }
        searchPatternLayers.push(L.marker(waypoints[0], {
            icon: L.divIcon({ html: '<div style="width:12px;height:12px;background:#22c55e;border:2px solid #fff;border-radius:50%;"></div>', className: '', iconSize:[12,12], iconAnchor:[6,6] })
        }).addTo(map).bindTooltip('Départ recherche', { direction: 'top' }));
    }

    if (uncertainty > 0) {
        searchCircleLayer = L.circle(datum, {
            radius: uncertainty * 1852, color: '#a78bfa', weight: 2, dashArray: '6,6',
            fill: true, fillColor: '#7c3aed', fillOpacity: 0.08
        }).addTo(map).bindTooltip(`Incertitude ±${uncertainty} MN`, { sticky: true });
    }

    let totalDistMN = 0;
    for (let i = 0; i < waypoints.length - 1; i++) totalDistMN += waypoints[i].distanceTo(waypoints[i+1]) / 1852;
    const lats = waypoints.map(w => w.lat), lngs = waypoints.map(w => w.lng);
    const dLat = (Math.max(...lats) - Math.min(...lats)) * 60;
    const dLng = (Math.max(...lngs) - Math.min(...lngs)) * 60 * Math.cos(datum.lat * Math.PI / 180);
    const durationMin = Math.round((totalDistMN / shipSpeed) * 60);

    _setTxt('stat-surface',  (dLat * dLng).toFixed(2) + ' MN²');
    _setTxt('stat-distance', totalDistMN.toFixed(1) + ' MN');
    _setTxt('stat-duration', durationMin + ' min');
    const dot = document.getElementById('search-status-dot');
    if (dot) { dot.style.background = '#f59e0b'; dot.style.boxShadow = '0 0 6px #f59e0b'; }
}

// ============================================================
// PRIVÉ
// ============================================================

function _placeLkpMarker(latlng) {
    if (vsdMarker) map.removeLayer(vsdMarker);
    vsdMarker = L.marker(latlng, { draggable: true })
        .addTo(map)
        .bindPopup('<b>LKP (Dernière Position Connue)</b>')
        .openPopup();
    vsdMarker.on('drag', () => {
        updateDmsFieldsFromLatLng(vsdMarker.getLatLng().lat, vsdMarker.getLatLng().lng);
        updateDrift();
    });
    updateDmsFieldsFromLatLng(latlng.lat, latlng.lng);
    const dot = document.getElementById('lkp-status-dot');
    if (dot) { dot.style.background = '#4ade80'; dot.style.boxShadow = '0 0 6px #4ade80'; }
}

function _setVector(id, height, rotateDeg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.height    = height + 'px';
    el.style.transform = `rotate(${rotateDeg}deg)`;
}

function _hideSwellWarnings(warnEl, zigzagEl, routeEl) {
    if (warnEl)  warnEl.style.display  = 'none';
    if (zigzagEl) zigzagEl.style.display = 'none';
    if (routeEl) { routeEl.textContent = 'DIRECTE'; routeEl.style.color = '#4ade80'; }
}

function _setTxt(id, value) {
    const el = document.getElementById(id); if (el) el.innerText = value;
}

function _setVal(id, value) {
    const el = document.getElementById(id); if (el) el.value = value;
}

function _padTime(n) { return String(n).padStart(2, '0'); }

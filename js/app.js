 // Configuration Flotte
    const fleet = {
        nsh1: { name: "NSH1", tank: 3400, vMax: 25, rangeNominal: 50, towPenalty: 1.4, cons: "180 L/h" },
        nsh2: { name: "NSH2", tank: 2600, vMax: 25, rangeNominal: 40, towPenalty: 1.4, cons: "140 L/h" },
        nsc1: { name: "NSC1", tank: 1500, vMax: 30, rangeNominal: 30, towPenalty: 1.5, cons: "110 L/h" },
        nsc2: { name: "NSC2", tank: 400,  vMax: 30, rangeNominal: 20, towPenalty: 1.6, cons: "60 L/h" },
        nsc3: { name: "NSC3", tank: 150,  vMax: 30, rangeNominal: 6,  towPenalty: 1.7, cons: "25 L/h" },
        nsc4: { name: "NSC4 (Jet)", tank: 45, vMax: 60, rangeNominal: 6, towPenalty: 2.0, cons: "15 L/h" }
    };
	// Ports
    const ports = { 'PortManec\'h': [47.80065597908025, -3.737681838252376], 'Concarneau': [47.8732, -3.9142], 'BegMeil': [47.8554, -3.9785], 'Doelan':[47.7711,-3.6102] };

    const seaStates = [{ vLimit: 60, fuelMulti: 1.0 }, { vLimit: 18, fuelMulti: 1.3 }, { vLimit: 10, fuelMulti: 1.8 }];

	// --- CONFIGURATION DES COUCHES SPÉCIFIQUES ---
const baseLayers = {
    // OSM + Les balises
    osm: L.layerGroup([
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            crossOrigin: true // Aide pour la gestion des en-têtes
        }),
        L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenSeaMap contributors'
        })
    ]),
    
    // Satellite + Les balises
    satellite: L.layerGroup([
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
        }),
        L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenSeaMap contributors'
        })
    ]),
    
    // Dark + Les balises
    dark: L.layerGroup([
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 20
        }),
        L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenSeaMap contributors'
        })
    ])
};


    let currentSea = 0, rangeCircle = null, landMass = null;
    let tideData = { current: 0, pm: {h:0, t:0}, bm: {h:0, t:0}, points: [] };
    let vsdMarker = null;
	
	let driftLine = null;
	let driftEndMarker = null;
	let navLine = null;
	let isoLayers = [];
	
	let currentVisibility = 'day';
	
	
	function setVis(mode, btn) {
		currentVisibility = mode;
		// On retire la classe active de tous les boutons du groupe
		btn.parentElement.querySelectorAll('.sea-btn').forEach(b => b.classList.remove('active'));
		btn.classList.add('active');
		calculate(); // Relance le calcul pour impacter la vitesse
		// Optionnel : Effet visuel sur la carte
		const mapEl = document.getElementById('map');
		if (mode === 'fog') mapEl.style.filter = 'contrast(0.7) brightness(1.1) blur(0.5px)';
		else if (mode === 'night') mapEl.style.filter = 'brightness(0.6) contrast(1.2)';
		else mapEl.style.filter = '';
	}
	function addTimeDepart(mins) {
    const timeLKP = document.getElementById('timeLKP').value;
    if (!timeLKP) return;

    const [hrs, mns] = timeLKP.split(':').map(Number);
    let date = new Date();
    date.setHours(hrs);
    date.setMinutes(mns + mins);

    const newTime = 
        String(date.getHours()).padStart(2, '0') + ":" + 
        String(date.getMinutes()).padStart(2, '0');
    
    document.getElementById('timeDepart').value = newTime;
    updateDrift();
}

// Ajoute X minutes par rapport à l'heure du LKP
function addTimeDepart(mins) {
    const timeLKP = document.getElementById('timeLKP').value;
    if (!timeLKP) return;

    const [hrs, mns] = timeLKP.split(':').map(Number);
    let date = new Date();
    date.setHours(hrs);
    date.setMinutes(mns + mins);

    const newTime = 
        String(date.getHours()).padStart(2, '0') + ":" + 
        String(date.getMinutes()).padStart(2, '0');
    
    document.getElementById('timeDepart').value = newTime;
    updateDrift();
}

// Aligne l'heure de départ sur l'heure réelle de l'ordinateur
function setDepartNow() {
    const now = new Date();
    const timeStr = 
        String(now.getHours()).padStart(2, '0') + ":" + 
        String(now.getMinutes()).padStart(2, '0');
    
    document.getElementById('timeDepart').value = timeStr;
    updateDrift();
}

    const map = L.map('map', { zoomControl: false }).setView([47.8012, -3.7429], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png').addTo(map);

	// On ajoute le groupe de calques pour les lignes côtières sur la carte
	coastalLinesGroup.addTo(map);

    async function loadLandData() {
        try {
            const res = await fetch('https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements.geojson');
            const data = await res.json();
            landMass = turf.combine(data).features[0];
            calculate();
        } catch (e) { console.error("GeoJSON Error:", e); calculate(); }
    }
	
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

// Écouteur pour charger les zones JSON quand on bouge la carte
map.on('moveend', () => {
    const toggle = document.getElementById('toggleCoastalLines');
    if (toggle && toggle.checked) {
        const center = map.getCenter();
        updateCoastalLines(center.lat, center.lng);
    }
});

/**
 * Gère le calcul et l'affichage des marées en 100% LOCAL
 */
// ============================================================
// MARÉES — Calcul harmonique offline (constantes SHOM)
// ============================================================
const TIDAL_PORTS = {
    "Concarneau": {
        datum: 2.53,
        constituents: [
            { name:'M2',  freq:28.9841042, amp:1.714, phase:108.4 },
            { name:'S2',  freq:30.0000000, amp:0.583, phase:141.2 },
            { name:'N2',  freq:28.4397295, amp:0.341, phase: 88.1 },
            { name:'K1',  freq:15.0410686, amp:0.100, phase:221.3 },
            { name:'O1',  freq:13.9430356, amp:0.072, phase:198.7 },
            { name:'K2',  freq:30.0821373, amp:0.158, phase:141.8 },
            { name:'P1',  freq:14.9589314, amp:0.033, phase:220.1 },
            { name:'M4',  freq:57.9682084, amp:0.058, phase: 32.1 },
            { name:'MS4', freq:58.9841042, amp:0.038, phase: 78.4 },
        ]
    },
    "PortManec'h": {
        datum: 2.48,
        constituents: [
            { name:'M2',  freq:28.9841042, amp:1.695, phase:110.2 },
            { name:'S2',  freq:30.0000000, amp:0.576, phase:143.1 },
            { name:'N2',  freq:28.4397295, amp:0.338, phase: 90.0 },
            { name:'K1',  freq:15.0410686, amp:0.099, phase:222.0 },
            { name:'O1',  freq:13.9430356, amp:0.071, phase:199.5 },
            { name:'K2',  freq:30.0821373, amp:0.156, phase:143.0 },
            { name:'P1',  freq:14.9589314, amp:0.032, phase:221.0 },
            { name:'M4',  freq:57.9682084, amp:0.055, phase: 34.0 },
            { name:'MS4', freq:58.9841042, amp:0.036, phase: 80.0 },
        ]
    },
    "BegMeil": {
        datum: 2.50,
        constituents: [
            { name:'M2',  freq:28.9841042, amp:1.705, phase:109.3 },
            { name:'S2',  freq:30.0000000, amp:0.579, phase:142.0 },
            { name:'N2',  freq:28.4397295, amp:0.339, phase: 89.0 },
            { name:'K1',  freq:15.0410686, amp:0.099, phase:221.5 },
            { name:'O1',  freq:13.9430356, amp:0.071, phase:199.0 },
            { name:'K2',  freq:30.0821373, amp:0.157, phase:142.5 },
            { name:'P1',  freq:14.9589314, amp:0.032, phase:220.5 },
            { name:'M4',  freq:57.9682084, amp:0.056, phase: 33.0 },
            { name:'MS4', freq:58.9841042, amp:0.037, phase: 79.0 },
        ]
    }
};

const J2000 = new Date('2000-01-01T12:00:00Z');

function tideAt(date, portKey) {
    const port = TIDAL_PORTS[portKey] || TIDAL_PORTS["Concarneau"];
    const t = (date - J2000) / 3600000; // heures depuis J2000
    let h = port.datum;
    for (const c of port.constituents) {
        h += c.amp * Math.cos((c.freq * t - c.phase) * Math.PI / 180);
    }
    return Math.max(0, h);
}

function tideDay(portKey, baseDate) {
    const pts = [];
    for (let i = 0; i <= 96; i++) {
        const d = new Date(baseDate);
        d.setMinutes(d.getMinutes() + i * 15);
        pts.push({ time: d, h: tideAt(d, portKey) });
    }
    // Trouver les extrêmes
    const ext = [];
    for (let i = 1; i < pts.length - 1; i++) {
        if (pts[i].h > pts[i-1].h && pts[i].h > pts[i+1].h) ext.push({ ...pts[i], type: 'PM' });
        if (pts[i].h < pts[i-1].h && pts[i].h < pts[i+1].h) ext.push({ ...pts[i], type: 'BM' });
    }
    return { pts, ext };
}

function updateTide() {
    const portKey = document.getElementById('portSelector').value;
    const now = new Date();
    const surge = window.currentSurgeMeters || 0;

    // Calcul sur 24h depuis minuit
    const midnight = new Date(now); midnight.setHours(0,0,0,0);
    const { pts, ext } = tideDay(portKey, midnight);

    const currentH = tideAt(now, portKey) + surge;

    // Marnage du jour
    const heights = pts.map(p => p.h);
    const maxH = Math.max(...heights) + surge;
    const minH = Math.min(...heights) + surge;
    const marnage = maxH - minH;
    const coeff = Math.min(120, Math.max(20, Math.round((marnage / 4.5) * 100)));

    // Affichage
    document.getElementById('val-coeff').innerText = coeff;
    document.getElementById('val-coeff').style.color = coeff > 95 ? '#ef4444' : coeff > 70 ? '#f97316' : '#4ade80';
    document.getElementById('val-marnage').innerText = marnage.toFixed(2) + ' m';
    document.getElementById('val-cur-height').innerHTML = currentH.toFixed(2) + ' m';

    // Prochains PM/BM
    const next = ext.filter(e => e.time > now);
    const nextPM = next.find(e => e.type === 'PM');
    const nextBM = next.find(e => e.type === 'BM');
    const fmt = d => d ? `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}` : '--:--';
    document.getElementById('val-pm-time').innerText = nextPM ? `${fmt(nextPM.time)} (${(nextPM.h+surge).toFixed(2)}m)` : '--';
    document.getElementById('val-bm-time').innerText = nextBM ? `${fmt(nextBM.time)} (${(nextBM.h+surge).toFixed(2)}m)` : '--';

    // Tendance
    const in15 = tideAt(new Date(now.getTime() + 900000), portKey);
    const isRising = in15 > currentH;
    const trendEl = document.getElementById('tideTrend');
    if (trendEl) {
        trendEl.innerText = isRising ? '▲ MARÉE MONTANTE' : '▼ MARÉE DESCENDANTE';
        trendEl.className = 'tide-status ' + (isRising ? 'status-up' : 'status-down');
    }

    // Courbe
    const graphPoints = pts.map(p => p.h + surge);
    renderTideChart(graphPoints, currentH);
}

function updateCoeffFromLevels(dayLevels) {
    const max = Math.max(...dayLevels);
    const min = Math.min(...dayLevels);
    const marnage = max - min;
    // On recalcule le coeff SHOM (Approx Bretagne Sud : 100 = 4.5m marnage)
    const coeff = Math.round((marnage / 4.5) * 100);
    document.getElementById('val-coeff').innerText = Math.min(Math.max(coeff, 20), 120);
}

// --- BASE DE DONNÉES COURANTS (Extraite des Atlas SHOM) ---
// Structure : [Heure de la PM, Direction (deg), Vitesse (noeuds) pour Coeff 95]
const tideCurrents = {
    'Concarneau': {
        '-6': { dir: 285, speed: 0.4 }, // 6h avant PM (Jusant)
        '-4': { dir: 290, speed: 0.8 },
        '-2': { dir: 300, speed: 0.5 },
        '0' : { dir: 0,   speed: 0.1 }, // PM (Étale)
        '+2': { dir: 110, speed: 0.6 }, // 2h après PM (Flot)
        '+4': { dir: 120, speed: 0.9 },
        '+6': { dir: 115, speed: 0.5 }
    }
};

function getShomCurrent() {
    const portKey = document.getElementById('portSelector').value;
    const coeff = parseInt(document.getElementById('val-coeff').innerText) || 70;
    
    // 1. Calculer l'intervalle par rapport à la PM
    // (On utilise l'heure PM que tu as déjà calculée ou récupérée)
    const pmTimeStr = document.getElementById('val-pm-time').innerText.split(' ')[0]; // ex: "14h30"
    if (!pmTimeStr) return { dir: 0, speed: 0 };

    const now = new Date();
    const [pmH, pmM] = pmTimeStr.split('h').map(Number);
    const pmDate = new Date(); pmDate.setHours(pmH, pmM, 0);
    
    // Différence en heures
    const diffHours = Math.round((now - pmDate) / 3600000);
    const key = (diffHours > 0 ? '+' : '') + diffHours;

    // 2. Récupérer la donnée de base
    const data = tideCurrents[portKey]?.[key] || { dir: 0, speed: 0 };

    // 3. Modulation par le coefficient (Règle de trois simple)
    // Vitesse = Vitesse_Atlas * (Coeff_Actuel / 95)
    const realSpeed = (data.speed * (coeff / 95)).toFixed(2);

    return { direction: data.dir, speed: realSpeed };
}

/**
 * Dessine la courbe de marée
 */
function renderTideChart(points, currentH) {
    const canvas = document.getElementById('tideChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.offsetWidth;
    const h = canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);
    const maxVal = Math.max(...points), minVal = Math.min(...points), range = (maxVal - minVal) || 1, padding = h * 0.15;
    const getX = (i) => (i / (points.length - 1)) * w;
    const getY = (val) => (h - padding) - ((val - minVal) / range) * (h - 2 * padding);
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(2, 136, 209, 0.3)'); grad.addColorStop(1, 'rgba(2, 136, 209, 0)');
    ctx.beginPath(); ctx.moveTo(0, h);
    points.forEach((v, i) => ctx.lineTo(getX(i), getY(v)));
    ctx.lineTo(w, h); ctx.fillStyle = grad; ctx.fill();
    ctx.beginPath(); points.forEach((v, i) => i === 0 ? ctx.moveTo(getX(i), getY(v)) : ctx.lineTo(getX(i), getY(v)));
    ctx.strokeStyle = '#1a237e'; ctx.lineWidth = 3; ctx.stroke();
    const nowY = getY(currentH);
    ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(211, 47, 47, 0.3)';
    ctx.beginPath(); ctx.moveTo(0, nowY); ctx.lineTo(w, nowY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#d32f2f'; ctx.beginPath(); ctx.arc(w / 2, nowY, 6, 0, Math.PI * 2); ctx.fill();
}


    function formatTime(h) { const hh = Math.floor(h); const mm = Math.round((h - hh) * 60); return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`; }

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
	const toggle = document.getElementById('toggleCoastalLines');
    if (toggle && toggle.checked) {
        updateCoastalLines(coords[0], coords[1]);
    }
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
/**
 * Réinitialise la vue de la carte au Nord (0°)
 */
function resetMapNorth() {
    // Si un plugin de rotation est présent, on remet le bearing à 0
    if (map.setBearing) {
        map.setBearing(0);
    } else {
        // Sinon simple recentrage fluide
        map.setView(map.getCenter(), map.getZoom(), { animate: true });
    }
    console.log("Carte réalignée sur le Nord magnétique.");
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

const etaBadge = document.getElementById('eta-cursor-badge');

map.on('mousemove', function(e) {
    // On ne l'affiche que si on n'est pas en train de placer un marqueur
    if (map.getContainer().style.cursor !== 'crosshair') {
        const portKey = document.getElementById('portSelector').value;
        const startPos = L.latLng(ports[portKey][0], ports[portKey][1]);
        const mousePos = e.latlng;

        // Distance en Milles Nautiques
        const distMN = startPos.distanceTo(mousePos) / 1852;
        
        // On récupère la vitesse affichée sur le dashboard (déjà bridée par la météo)
        const vitesseStr = document.getElementById('dashSpeed').innerText;
        const vitesse = parseFloat(vitesseStr) || 1; // Sécurité division par zéro

        // Temps en minutes
        const timeMin = (distMN / vitesse) * 60;
        const hours = Math.floor(timeMin / 60);
        const mins = Math.round(timeMin % 60);
        
        let timeDisplay = hours > 0 ? `${hours}h${mins}` : `${mins} min`;

        // Mise à jour du badge
        etaBadge.style.display = 'block';
        etaBadge.style.left = (e.originalEvent.pageX + 15) + 'px';
        etaBadge.style.top = (e.originalEvent.pageY + 15) + 'px';
        etaBadge.innerHTML = `⏱️ ${timeDisplay} (${distMN.toFixed(1)} MN)`;
    } else {
        etaBadge.style.display = 'none';
    }
});

// Cacher le badge quand la souris quitte la carte
map.on('mouseout', function() {
    etaBadge.style.display = 'none';
});

// ============================================================
// AIS — AISStream.io WebSocket
// ============================================================
const AIS_API_KEY = '9a5cb754a648740650bbfee683c836ed89f13e6b';

let aisWS = null, aisShips = {}, aisMarkers = {}, aisMsgCount = 0, aisMsgTimer = null, aisActiveFilter = 'all';
const AIS_PROXIMITY_NM = 0.5;
const AIS_TYPES = {
    cargo:    { color:'#64748b', label:'Cargo',    codes:[70,71,72,73,74,75,76,77,78,79] },
    tanker:   { color:'#ef4444', label:'Tanker',   codes:[80,81,82,83,84,85,86,87,88,89] },
    sailing:  { color:'#38bdf8', label:'Voile',    codes:[36,37] },
    fishing:  { color:'#fbbf24', label:'Pêche',    codes:[30] },
    passenger:{ color:'#a78bfa', label:'Passager', codes:[60,61,62,63,64,65,66,67,68,69] },
    sar:      { color:'#f97316', label:'SAR',      codes:[51] },
    other:    { color:'#475569', label:'Autre',    codes:[] },
};
function getShipType(t) { for(const[k,v] of Object.entries(AIS_TYPES)) if(v.codes.includes(t)) return{key:k,...v}; return{key:'other',...AIS_TYPES.other}; }

function toggleAISStream() { aisWS&&aisWS.readyState===WebSocket.OPEN ? disconnectAIS() : connectAIS(); }

function connectAIS() {
    const key = document.getElementById('ais-api-key').value.trim() || AIS_API_KEY;
    setAISStatus('connecting');
    aisWS = new WebSocket('wss://stream.aisstream.io/v0/stream');
    aisWS.onopen = () => {
        const b = map.getBounds();
        aisWS.send(JSON.stringify({ APIkey:key, BoundingBoxes:[[[b.getSouth()-0.2,b.getWest()-0.2],[b.getNorth()+0.2,b.getEast()+0.2]]], FilterMessageTypes:["PositionReport","ShipStaticData"] }));
        setAISStatus('connected');
        map.on('moveend', resubscribeAIS);
        aisMsgTimer = setInterval(() => { document.getElementById('ais-msg-rate').textContent=aisMsgCount; aisMsgCount=0; }, 60000);
    };
    aisWS.onmessage = e => { try { aisMsgCount++; handleAISMessage(JSON.parse(e.data)); } catch(err){} };
    aisWS.onerror = () => setAISStatus('error');
    aisWS.onclose = () => { setAISStatus('disconnected'); map.off('moveend',resubscribeAIS); clearInterval(aisMsgTimer); };
}

function disconnectAIS() {
    if(aisWS){aisWS.close();aisWS=null;}
    Object.values(aisMarkers).forEach(m=>map.removeLayer(m));
    aisMarkers={}; aisShips={};
    document.getElementById('ais-count').textContent='0';
    document.getElementById('ais-closest').textContent='--';
    document.getElementById('ais-ship-list').innerHTML='<div style="text-align:center;color:#334155;font-size:0.68rem;padding:16px 0;">Déconnecté</div>';
    setAISStatus('disconnected');
}

function resubscribeAIS() {
    if(!aisWS||aisWS.readyState!==WebSocket.OPEN) return;
    const key=document.getElementById('ais-api-key').value.trim(), b=map.getBounds();
    aisWS.send(JSON.stringify({APIkey:key,BoundingBoxes:[[[b.getSouth()-0.2,b.getWest()-0.2],[b.getNorth()+0.2,b.getEast()+0.2]]],FilterMessageTypes:["PositionReport","ShipStaticData"]}));
}

function handleAISMessage(msg) {
    const mmsi=msg.MetaData?.MMSI; if(!mmsi) return;
    if(!aisShips[mmsi]) aisShips[mmsi]={mmsi,name:'MMSI '+mmsi,type:0,lat:null,lng:null,sog:0,cog:0,lastSeen:null};
    const ship=aisShips[mmsi]; ship.lastSeen=new Date();
    if(msg.Message?.PositionReport){const p=msg.Message.PositionReport;ship.lat=p.Latitude;ship.lng=p.Longitude;ship.sog=p.Sog?.toFixed(1)||'0';ship.cog=Math.round(p.Cog||0);updateAISMarker(ship);}
    if(msg.Message?.ShipStaticData){const s=msg.Message.ShipStaticData;ship.name=(s.Name||ship.name).trim();ship.type=s.Type||0;ship.dest=(s.Destination||'').trim();updateAISMarker(ship);}
    updateAISPanel();
}

function updateAISMarker(ship) {
    if(ship.lat===null) return;
    const ti=getShipType(ship.type);
    if(aisActiveFilter!=='all'&&ti.key!==aisActiveFilter){if(aisMarkers[ship.mmsi]){map.removeLayer(aisMarkers[ship.mmsi]);delete aisMarkers[ship.mmsi];}return;}
    const icon=L.divIcon({className:'',html:`<div style="width:10px;height:10px;border-radius:50%;background:${ti.color};border:2px solid rgba(255,255,255,0.6);box-shadow:0 0 6px ${ti.color};transform:rotate(${ship.cog}deg);position:relative;"><div style="position:absolute;top:-5px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:3px solid transparent;border-right:3px solid transparent;border-bottom:5px solid ${ti.color};"></div></div>`,iconSize:[10,10],iconAnchor:[5,5]});
    const popup=`<b>${ship.name}</b><br>${ti.label} • MMSI ${ship.mmsi}<br>${ship.sog} nds @ ${ship.cog}°${ship.dest?'<br>→ '+ship.dest:''}`;
    if(aisMarkers[ship.mmsi]){aisMarkers[ship.mmsi].setLatLng([ship.lat,ship.lng]).setIcon(icon);aisMarkers[ship.mmsi].getPopup()?.setContent(popup);}
    else{aisMarkers[ship.mmsi]=L.marker([ship.lat,ship.lng],{icon}).bindPopup(popup).addTo(map);}
}

function updateAISPanel() {
    const stationPos=L.latLng(ports[document.getElementById('portSelector').value][0],ports[document.getElementById('portSelector').value][1]);
    let ships=Object.values(aisShips).filter(s=>s.lat!==null);
    if(aisActiveFilter!=='all') ships=ships.filter(s=>getShipType(s.type).key===aisActiveFilter);
    ships.forEach(s=>s._dist=stationPos.distanceTo(L.latLng(s.lat,s.lng))/1852);
    ships.sort((a,b)=>a._dist-b._dist);
    document.getElementById('ais-count').textContent=Object.keys(aisShips).length;
    if(ships.length){
        document.getElementById('ais-closest').textContent=ships[0]._dist.toFixed(1)+' MN';
        const alertEl=document.getElementById('ais-alert');
        if(ships[0]._dist<AIS_PROXIMITY_NM){document.getElementById('ais-alert-msg').textContent=`${ships[0].name} à ${(ships[0]._dist*1852).toFixed(0)}m`;alertEl.classList.add('on');}
        else alertEl.classList.remove('on');
    }
    const listEl=document.getElementById('ais-ship-list');
    if(!ships.length){listEl.innerHTML='<div style="text-align:center;color:#334155;font-size:0.68rem;padding:12px 0;">Aucun navire pour le moment…</div>';return;}
    listEl.innerHTML=ships.slice(0,12).map(s=>{
        const t=getShipType(s.type),age=s.lastSeen?Math.round((Date.now()-s.lastSeen)/1000):'--';
        return `<div class="ais-ship-item ${s._dist<1?'close':''}" onclick="map.setView([${s.lat},${s.lng}],14);aisMarkers[${s.mmsi}]?.openPopup();">
            <div class="ais-dot" style="background:${t.color};box-shadow:0 0 5px ${t.color};"></div>
            <div class="ais-sname">${s.name}</div>
            <div class="ais-smeta"><b>${s._dist.toFixed(1)} MN</b><br>${s.sog} nds · ${age}s</div>
        </div>`;
    }).join('');
}

function aisFilter(type,btn) {
    aisActiveFilter=type;
    document.querySelectorAll('.ais-fbtn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    Object.values(aisShips).forEach(s=>updateAISMarker(s));
    updateAISPanel();
}

function setAISStatus(state) {
    const light=document.getElementById('ais-status-light'),btn=document.getElementById('ais-connect-btn');
    const s={connecting:{c:'#fbbf24',sh:'0 0 8px #fbbf24',t:'Connexion…',cl:''},connected:{c:'#10b981',sh:'0 0 10px #10b981',t:'Déconnecter',cl:'off'},disconnected:{c:'#1e3a2a',sh:'none',t:'Connecter',cl:''},error:{c:'#ef4444',sh:'0 0 8px #ef4444',t:'Réessayer',cl:''}}[state]||{c:'#1e3a2a',sh:'none',t:'Connecter',cl:''};
    light.style.background=s.c; light.style.boxShadow=s.sh; btn.textContent=s.t; btn.className='ais-connect-btn '+s.cl;
}

setInterval(()=>{
    const cut=Date.now()-600000;
    Object.keys(aisShips).forEach(mmsi=>{if(aisShips[mmsi].lastSeen&&aisShips[mmsi].lastSeen<cut){if(aisMarkers[mmsi]){map.removeLayer(aisMarkers[mmsi]);delete aisMarkers[mmsi];}delete aisShips[mmsi];}});
},60000);

// Balisage OpenSeaMap (toggle séparé)
let seamarkLayer = null;
function toggleAISLayer() {
    const cb=document.getElementById('toggle-ais');
    if(!seamarkLayer) seamarkLayer=L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',{maxZoom:18,zIndex:1000,opacity:1});
    cb.checked ? seamarkLayer.addTo(map) : (map.hasLayer(seamarkLayer)&&map.removeLayer(seamarkLayer));
}


// --- CONFIGURATION DES FONDS DE CARTE ---
// voir au début du code script

// On garde l'OSM par défaut au démarrage
baseLayers.osm.addTo(map);

/**
 * Change la couche de fond de la carte
 * @param {string} type - Clé correspondant à l'objet baseLayers (osm, satellite, bathy, etc.)
 */
function changeMapBase(type) {
    // 1. Nettoyage : Retirer toutes les couches de base actives
    // On boucle sur l'objet baseLayers pour tout nettoyer proprement
    Object.values(baseLayers).forEach(layer => {
        if (map.hasLayer(layer)) map.removeLayer(layer);
    });
    
    // 2. Activation : Ajouter la nouvelle couche sélectionnée
    // Cela ajoute le "pack" (Fond + Balisage) défini dans ton objet baseLayers
    if (baseLayers[type]) {
        baseLayers[type].addTo(map);
    }
    
    // 3. Superposition : Ramener les éléments de calcul au-dessus
    // Note : bringToFront() fonctionne sur les lignes et cercles, pas sur les marqueurs
    
    // La ligne de dérive (Drift Line)
    if (typeof driftLine !== 'undefined' && driftLine && map.hasLayer(driftLine)) {
        driftLine.bringToFront();
    }
    
    // Le cercle de rayon d'action (Range Circle)
    if (typeof rangeCircle !== 'undefined' && rangeCircle && map.hasLayer(rangeCircle)) {
        rangeCircle.bringToFront();
    }
    
    // Les cercles de probabilité ou zones de recherche
    if (typeof searchArea !== 'undefined' && searchArea && map.hasLayer(searchArea)) {
        searchArea.bringToFront();
    }

    // Gestion de l'AIS si la case est cochée
    if (document.getElementById('toggle-ais') && document.getElementById('toggle-ais').checked) {
        if (typeof aisLayer !== 'undefined' && aisLayer) {
            aisLayer.addTo(map); // On s'assure qu'elle est ajoutée après le fond
        }
    }
}

// ============================================================
// SAISIE COORDONNÉES GPS LKP (Format DMS)
// ============================================================

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

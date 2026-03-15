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

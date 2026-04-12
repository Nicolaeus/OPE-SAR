/**
 * TIDE.JS
 * Calcul harmonique des marées (offline, constantes SHOM)
 * et rendu graphique Canvas.
 *
 * Dépendances : globals.js (window.currentSurgeMeters)
 * Source de vérité : constantes TIDAL_PORTS issues d'app.js
 *                    (plus complètes que TIDAL_DATA de globals.js)
 */

// ============================================================
// 1. CONSTANTES HARMONIQUES (SHOM — Bretagne Sud)
// ============================================================

const J2000 = new Date('2000-01-01T12:00:00Z');

const TIDAL_PORTS = {
    "Concarneau": {
        datum: 2.53,
        constituents: [
            { name: 'M2',  freq: 28.9841042, amp: 1.714, phase: 108.4 },
            { name: 'S2',  freq: 30.0000000, amp: 0.583, phase: 141.2 },
            { name: 'N2',  freq: 28.4397295, amp: 0.341, phase:  88.1 },
            { name: 'K1',  freq: 15.0410686, amp: 0.100, phase: 221.3 },
            { name: 'O1',  freq: 13.9430356, amp: 0.072, phase: 198.7 },
            { name: 'K2',  freq: 30.0821373, amp: 0.158, phase: 141.8 },
            { name: 'P1',  freq: 14.9589314, amp: 0.033, phase: 220.1 },
            { name: 'M4',  freq: 57.9682084, amp: 0.058, phase:  32.1 },
            { name: 'MS4', freq: 58.9841042, amp: 0.038, phase:  78.4 },
        ]
    },
    "PortManec'h": {
        datum: 2.48,
        constituents: [
            { name: 'M2',  freq: 28.9841042, amp: 1.695, phase: 110.2 },
            { name: 'S2',  freq: 30.0000000, amp: 0.576, phase: 143.1 },
            { name: 'N2',  freq: 28.4397295, amp: 0.338, phase:  90.0 },
            { name: 'K1',  freq: 15.0410686, amp: 0.099, phase: 222.0 },
            { name: 'O1',  freq: 13.9430356, amp: 0.071, phase: 199.5 },
            { name: 'K2',  freq: 30.0821373, amp: 0.156, phase: 143.0 },
            { name: 'P1',  freq: 14.9589314, amp: 0.032, phase: 221.0 },
            { name: 'M4',  freq: 57.9682084, amp: 0.055, phase:  34.0 },
            { name: 'MS4', freq: 58.9841042, amp: 0.036, phase:  80.0 },
        ]
    },
    "BegMeil": {
        datum: 2.50,
        constituents: [
            { name: 'M2',  freq: 28.9841042, amp: 1.705, phase: 109.3 },
            { name: 'S2',  freq: 30.0000000, amp: 0.579, phase: 142.0 },
            { name: 'N2',  freq: 28.4397295, amp: 0.339, phase:  89.0 },
            { name: 'K1',  freq: 15.0410686, amp: 0.099, phase: 221.5 },
            { name: 'O1',  freq: 13.9430356, amp: 0.071, phase: 199.0 },
            { name: 'K2',  freq: 30.0821373, amp: 0.157, phase: 142.5 },
            { name: 'P1',  freq: 14.9589314, amp: 0.032, phase: 220.5 },
            { name: 'M4',  freq: 57.9682084, amp: 0.056, phase:  33.0 },
            { name: 'MS4', freq: 58.9841042, amp: 0.037, phase:  79.0 },
        ]
    }
};

// Atlas courants SHOM — Concarneau (direction °, vitesse nds pour coeff 95)
const TIDE_CURRENTS = {
    "Concarneau": {
        '-6': { dir: 285, speed: 0.4 },
        '-4': { dir: 290, speed: 0.8 },
        '-2': { dir: 300, speed: 0.5 },
        '0':  { dir: 0,   speed: 0.1 },
        '+2': { dir: 110, speed: 0.6 },
        '+4': { dir: 120, speed: 0.9 },
        '+6': { dir: 115, speed: 0.5 }
    }
};

// ============================================================
// 2. CALCUL HARMONIQUE
// ============================================================

/**
 * Hauteur d'eau à une date donnée pour un port.
 * Inclut la surcote/décote barométrique de window.currentSurgeMeters.
 *
 * @param  {Date}   date     Instant T
 * @param  {string} portKey  Clé dans TIDAL_PORTS
 * @returns {number} Hauteur en mètres (≥ 0)
 */
function tideAt(date, portKey) {
    const port = TIDAL_PORTS[portKey] || TIDAL_PORTS["Concarneau"];
    const t = (date - J2000) / 3600000; // heures depuis J2000
    let h = port.datum;
    for (const c of port.constituents) {
        h += c.amp * Math.cos((c.freq * t - c.phase) * Math.PI / 180);
    }
    return Math.max(0, h);
}

/**
 * Génère les points de hauteur sur 24h (pas 15 min) depuis minuit.
 * Retourne aussi les extrema (PM/BM).
 *
 * @param  {string} portKey
 * @param  {Date}   baseDate  Minuit du jour courant
 * @returns {{ pts: Array, ext: Array }}
 */
function tideDay(portKey, baseDate) {
    const pts = [];
    for (let i = 0; i <= 96; i++) {
        const d = new Date(baseDate);
        d.setMinutes(d.getMinutes() + i * 15);
        pts.push({ time: d, h: tideAt(d, portKey) });
    }
    const ext = [];
    for (let i = 1; i < pts.length - 1; i++) {
        if (pts[i].h > pts[i-1].h && pts[i].h > pts[i+1].h) ext.push({ ...pts[i], type: 'PM' });
        if (pts[i].h < pts[i-1].h && pts[i].h < pts[i+1].h) ext.push({ ...pts[i], type: 'BM' });
    }
    return { pts, ext };
}

// ============================================================
// 3. MISE À JOUR DE LA CARD MARÉE
// ============================================================

function updateTide() {
    const portKey = document.getElementById('portSelector').value;
    const now     = new Date();
    const surge   = window.currentSurgeMeters || 0;

    const midnight = new Date(now); midnight.setHours(0, 0, 0, 0);
    const { pts, ext } = tideDay(portKey, midnight);

    const currentH = tideAt(now, portKey) + surge;

    // Marnage & coefficient
    const heights = pts.map(p => p.h);
    const maxH    = Math.max(...heights) + surge;
    const minH    = Math.min(...heights) + surge;
    const marnage = maxH - minH;
    const coeff   = Math.min(120, Math.max(20, Math.round((marnage / 4.5) * 100)));

    const coeffEl = document.getElementById('val-coeff');
    if (coeffEl) {
        coeffEl.innerText = coeff;
        coeffEl.style.color = coeff > 95 ? '#ef4444' : coeff > 70 ? '#f97316' : '#4ade80';
    }
    _setTxt('val-marnage',   marnage.toFixed(2) + ' m');
    _setTxt('val-cur-height', currentH.toFixed(2) + ' m');

    // Prochains PM / BM
    const fmt  = d => `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
    const next = ext.filter(e => e.time > now);
    const pm   = next.find(e => e.type === 'PM');
    const bm   = next.find(e => e.type === 'BM');
    _setTxt('val-pm-time', pm ? `${fmt(pm.time)} (${(pm.h + surge).toFixed(2)}m)` : '--');
    _setTxt('val-bm-time', bm ? `${fmt(bm.time)} (${(bm.h + surge).toFixed(2)}m)` : '--');

    // Tendance (montante / descendante)
    const in15    = tideAt(new Date(now.getTime() + 900000), portKey);
    const isRising = in15 > currentH;
    const trendEl  = document.getElementById('tideTrend');
    if (trendEl) {
        trendEl.innerText   = isRising ? '▲ MARÉE MONTANTE' : '▼ MARÉE DESCENDANTE';
        trendEl.className   = 'tide-status-overlay ' + (isRising ? 'status-up' : 'status-down');
    }

    // Graphique
    renderTideChart(pts.map(p => p.h + surge), currentH);
}

// ============================================================
// 4. COURANT TIDAL (Atlas SHOM)
// ============================================================

/**
 * Retourne direction et vitesse du courant tidal au port actif,
 * modulé par le coefficient du jour.
 * Utilisable pour pré-remplir les champs courant de la card SAR.
 */
function getShomCurrent() {
    const portKey  = document.getElementById('portSelector').value;
    const coeff    = parseInt(document.getElementById('val-coeff')?.innerText) || 70;
    const pmStr    = document.getElementById('val-pm-time')?.innerText.split(' ')[0];
    if (!pmStr || pmStr === '--') return { direction: 0, speed: 0 };

    const [pmH, pmM] = pmStr.split(':').map(Number);
    const pmDate = new Date(); pmDate.setHours(pmH, pmM, 0);
    const diffH  = Math.round((new Date() - pmDate) / 3600000);
    const key    = (diffH >= 0 ? '+' : '') + diffH;

    const data     = TIDE_CURRENTS[portKey]?.[key] || { dir: 0, speed: 0 };
    const realSpeed = parseFloat((data.speed * (coeff / 95)).toFixed(2));
    return { direction: data.dir, speed: realSpeed };
}

// ============================================================
// 5. GRAPHIQUE CANVAS
// ============================================================

/**
 * Dessine la courbe de marée sur le canvas #tideChart.
 *
 * @param {number[]} points   Tableau de hauteurs (pts × 15min sur 24h)
 * @param {number}   currentH Hauteur actuelle (point rouge)
 */
function renderTideChart(points, currentH) {
    const canvas = document.getElementById('tideChart');
    if (!canvas) return;

    const ctx  = canvas.getContext('2d');
    const w    = canvas.width  = canvas.offsetWidth;
    const h    = canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);

    const maxVal  = Math.max(...points);
    const minVal  = Math.min(...points);
    const range   = (maxVal - minVal) || 1;
    const padding = h * 0.15;

    const getX = i   => (i / (points.length - 1)) * w;
    const getY = val => (h - padding) - ((val - minVal) / range) * (h - 2 * padding);

    // Zone remplie sous la courbe
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(2, 136, 209, 0.3)');
    grad.addColorStop(1, 'rgba(2, 136, 209, 0)');
    ctx.beginPath();
    ctx.moveTo(0, h);
    points.forEach((v, i) => ctx.lineTo(getX(i), getY(v)));
    ctx.lineTo(w, h);
    ctx.fillStyle = grad;
    ctx.fill();

    // Courbe principale
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#1a237e';
    ctx.lineWidth   = 3;
    points.forEach((v, i) => i === 0 ? ctx.moveTo(getX(i), getY(v)) : ctx.lineTo(getX(i), getY(v)));
    ctx.stroke();

    // Ligne horizontale "maintenant"
    const nowY = getY(currentH);
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(211, 47, 47, 0.3)';
    ctx.beginPath(); ctx.moveTo(0, nowY); ctx.lineTo(w, nowY); ctx.stroke();
    ctx.setLineDash([]);

    // Point rouge "hauteur actuelle"
    ctx.fillStyle = '#d32f2f';
    ctx.beginPath();
    ctx.arc(w / 2, nowY, 6, 0, Math.PI * 2);
    ctx.fill();
}

// ── utilitaire privé ──────────────────────────────────────────
function _setTxt(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}

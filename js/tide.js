/**
 * TIDE.JS
 * Calcul des marées par la méthode harmonique et affichage du graphique.
 */

const J2000 = new Date('2000-01-01T12:00:00Z');
let TIDAL_DATA = null;

/**
 * Chargement initial des données de ports
 */
async function loadTidalData() {
    try {
        const response = await fetch('data/ports/tidal_ports.json');
        TIDAL_DATA = await response.json();
        console.log("🌊 Données marégraphiques chargées.");
        updateTide(); // Première exécution
    } catch (e) {
        console.error("Erreur chargement tidal_ports.json:", e);
    }
}

/**
 * Calcul de la hauteur d'eau à une date précise
 */
function tideAt(date, portKey) {
    if (!TIDAL_DATA || !TIDAL_DATA[portKey]) return 0;
    
    const port = TIDAL_DATA[portKey];
    const t = (date - J2000) / 3600000; // Heures depuis J2000
    let h = port.datum;

    // Somme des constituants harmoniques (M2, S2, N2, K1, O1)
    for (const c of port.constituents) {
        h += c.amp * Math.cos((c.freq * t - c.phase) * Math.PI / 180);
    }

    // Ajout de la surcote météo (provenant de weather.js via window)
    const surge = window.currentSurgeMeters || 0;
    return Math.max(0, h + surge);
}

/**
 * Mise à jour globale de l'UI Marée
 */
function updateTide() {
    const portKey = document.getElementById('portSelector').value;
    if (!TIDAL_DATA) {
        loadTidalData();
        return;
    }

    const now = new Date();
    const currentH = tideAt(now, portKey);

    // 1. Mise à jour des textes
    const tideValEl = document.getElementById('tide-level');
    if (tideValEl) {
        tideValEl.innerText = currentH.toFixed(2) + " m";
        // Petit indicateur visuel pour la surcote
        if (window.currentSurgeMeters !== 0) {
            tideValEl.title = `Inclut ${(window.currentSurgeMeters * 100).toFixed(0)}cm de surcote/décote`;
        }
    }

    // 2. Calcul des extrêmes du jour (PM/BM) pour l'affichage
    const points = [];
    const baseDate = new Date(now);
    baseDate.setHours(0, 0, 0, 0);

    for (let i = 0; i <= 96; i++) { // Toutes les 15 min sur 24h
        const d = new Date(baseDate.getTime() + i * 15 * 60000);
        points.push(tideAt(d, portKey));
    }

    // 3. Rendu du graphique Canvas
    drawTideChart(points, currentH);
}

/**
 * Dessin du graphique de marée
 */
function drawTideChart(points, currentH) {
    const canvas = document.getElementById('tideChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.offsetWidth;
    const h = canvas.height = canvas.offsetHeight;
    
    ctx.clearRect(0, 0, w, h);

    const maxVal = Math.max(...points) + 0.5;
    const minVal = Math.min(...points) - 0.5;
    const range = maxVal - minVal;
    const padding = 20;

    const getX = (i) => (i / (points.length - 1)) * w;
    const getY = (val) => (h - padding) - ((val - minVal) / range) * (h - 2 * padding);

    // Dégradé de remplissage
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(2, 136, 209, 0.3)');
    grad.addColorStop(1, 'rgba(2, 136, 209, 0)');

    ctx.beginPath();
    ctx.moveTo(0, h);
    points.forEach((v, i) => ctx.lineTo(getX(i), getY(v)));
    ctx.lineTo(w, h);
    ctx.fillStyle = grad;
    ctx.fill();

    // Ligne de courbe
    ctx.beginPath();
    points.forEach((v, i) => i === 0 ? ctx.moveTo(getX(i), getY(v)) : ctx.lineTo(getX(i), getY(v)));
    ctx.strokeStyle = '#0288d1';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Marqueur temps actuel
    const now = new Date();
    const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
    const currentX = (minutesSinceMidnight / 1440) * w;

    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.moveTo(currentX, 0);
    ctx.lineTo(currentX, h);
    ctx.strokeStyle = '#ef4444';
    ctx.stroke();
    ctx.setLineDash([]);
}

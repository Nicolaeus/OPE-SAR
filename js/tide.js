/**
 * TIDE.JS
 * Moteur de calcul des marées (Méthode Harmonique) et rendu graphique.
 */

const J2000 = new Date('2000-01-01T12:00:00Z');

/**
 * Calcul de la hauteur d'eau à une date précise pour un port donné
 * @param {Date} date - L'instant T
 * @param {string} portKey - La clé du port (ex: 'PortManec\'h')
 */
function tideAt(date, portKey) {
    // Note : TIDAL_DATA doit être chargé ou présent dans globals.js
    if (!TIDAL_DATA || !TIDAL_DATA[portKey]) return 0;
    
    const port = TIDAL_DATA[portKey];
    const t = (date - J2000) / 3600000; // Nombre d'heures depuis J2000
    let h = port.datum; // Niveau moyen (Z0)

    // Somme des constituants harmoniques (M2, S2, N2, K1, O1)
    // On reprend exactement tes formules de sommation cosinusoidale
    for (const c of port.constituents) {
        h += c.amp * Math.cos((c.freq * t - c.phase) * Math.PI / 180);
    }

    // Intégration de la surcote météo (window.currentSurgeMeters calculé dans weather.js)
    return h + (window.currentSurgeMeters || 0);
}

/**
 * Mise à jour de l'affichage de la marée (Texte + Graphique)
 */
function updateTide() {
    const portKey = document.getElementById('portSelector').value;
    const now = new Date();
    
    // 1. Calcul de la hauteur actuelle
    const currentH = tideAt(now, portKey);
    const tideDisplay = document.getElementById('val-tide');
    if (tideDisplay) {
        tideDisplay.innerText = currentH.toFixed(2) + " m";
    }

    // 2. Génération des points pour le graphique (sur 24h)
    const points = [];
    const startTime = new Date(now.getTime() - 6 * 3600000); // 6h avant
    for (let i = 0; i <= 24; i++) {
        const checkTime = new Date(startTime.getTime() + i * 3600000);
        points.push(tideAt(checkTime, portKey));
    }

    renderTideChart(points);
}

/**
 * Rendu du graphique sur le Canvas
 * Reprise de ta logique de dessin 2D (Canvas API)
 */
function renderTideChart(points) {
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

    // Dessin du dégradé (Zone sous la courbe)
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(2, 136, 209, 0.3)');
    grad.addColorStop(1, 'rgba(2, 136, 209, 0)');

    ctx.beginPath();
    ctx.moveTo(0, h);
    points.forEach((v, i) => ctx.lineTo(getX(i), getY(v)));
    ctx.lineTo(w, h);
    ctx.fillStyle = grad;
    ctx.fill();

    // Dessin de la ligne de courbe principale
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#0288d1';
    ctx.lineWidth = 3;
    points.forEach((v, i) => {
        if (i === 0) ctx.moveTo(getX(i), getY(v));
        else ctx.lineTo(getX(i), getY(v));
    });
    ctx.stroke();

    // Indicateur "Maintenant" (Ligne verticale rouge)
    const nowX = getX(6); // Puisqu'on a commencé 6h avant, l'heure actuelle est à l'index 6
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#ef4444';
    ctx.moveTo(nowX, 0);
    ctx.lineTo(nowX, h);
    ctx.stroke();
}

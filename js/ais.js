/**
 * AIS.JS
 * Flux temps réel AISStream.io : WebSocket, marqueurs carte, panel navires.
 *
 * Dépendances : globals.js (aisWS, aisShips, aisMarkers, aisMsgCount,
 *               aisMsgTimer, aisActiveFilter, AIS_API_KEY, ports, map)
 */

// ============================================================
// 1. TYPES DE NAVIRES
// ============================================================

const AIS_PROXIMITY_NM = 0.5;

const AIS_TYPES = {
    cargo:    { color: '#64748b', label: 'Cargo',    codes: [70,71,72,73,74,75,76,77,78,79] },
    tanker:   { color: '#ef4444', label: 'Tanker',   codes: [80,81,82,83,84,85,86,87,88,89] },
    sailing:  { color: '#38bdf8', label: 'Voile',    codes: [36,37] },
    fishing:  { color: '#fbbf24', label: 'Pêche',    codes: [30] },
    passenger:{ color: '#a78bfa', label: 'Passager', codes: [60,61,62,63,64,65,66,67,68,69] },
    sar:      { color: '#f97316', label: 'SAR',      codes: [51] },
    other:    { color: '#475569', label: 'Autre',    codes: [] }
};

function getShipType(typeCode) {
    for (const [k, v] of Object.entries(AIS_TYPES)) {
        if (v.codes.includes(typeCode)) return { key: k, ...v };
    }
    return { key: 'other', ...AIS_TYPES.other };
}

// ============================================================
// 2. CONNEXION WEBSOCKET
// ============================================================

/** Bascule connexion ON/OFF. Appelée par le bouton "Connecter" de la card AIS. */
function toggleAISStream() {
    aisWS && aisWS.readyState === WebSocket.OPEN ? disconnectAIS() : connectAIS();
}

function connectAIS() {
    const key = document.getElementById('ais-api-key')?.value.trim() || AIS_API_KEY;
    setAISStatus('connecting');

    aisWS = new WebSocket('wss://stream.aisstream.io/v0/stream');

    aisWS.onopen = () => {
        const b = map.getBounds();
        aisWS.send(JSON.stringify({
            APIkey: key,
            BoundingBoxes: [[[b.getSouth() - 0.2, b.getWest() - 0.2],
                             [b.getNorth() + 0.2, b.getEast() + 0.2]]],
            FilterMessageTypes: ['PositionReport', 'ShipStaticData']
        }));
        setAISStatus('connected');
        map.on('moveend', resubscribeAIS);
        aisMsgTimer = setInterval(() => {
            const el = document.getElementById('ais-msg-rate');
            if (el) el.textContent = aisMsgCount;
            aisMsgCount = 0;
        }, 60000);
    };

    aisWS.onmessage = (e) => {
        try { aisMsgCount++; handleAISMessage(JSON.parse(e.data)); } catch (_) {}
    };

    aisWS.onerror  = () => setAISStatus('error');
    aisWS.onclose  = () => {
        setAISStatus('disconnected');
        map.off('moveend', resubscribeAIS);
        clearInterval(aisMsgTimer);
    };
}

function disconnectAIS() {
    if (aisWS) { aisWS.close(); aisWS = null; }
    Object.values(aisMarkers).forEach(m => map.removeLayer(m));
    aisMarkers = {};
    aisShips   = {};
    _setTxt('ais-count',   '0');
    _setTxt('ais-closest', '--');
    const list = document.getElementById('ais-ship-list');
    if (list) list.innerHTML = '<div style="text-align:center;color:#334155;font-size:0.68rem;padding:16px 0;">Déconnecté</div>';
    setAISStatus('disconnected');
}

function resubscribeAIS() {
    if (!aisWS || aisWS.readyState !== WebSocket.OPEN) return;
    const key = document.getElementById('ais-api-key')?.value.trim() || AIS_API_KEY;
    const b   = map.getBounds();
    aisWS.send(JSON.stringify({
        APIkey: key,
        BoundingBoxes: [[[b.getSouth() - 0.2, b.getWest() - 0.2],
                         [b.getNorth() + 0.2, b.getEast() + 0.2]]],
        FilterMessageTypes: ['PositionReport', 'ShipStaticData']
    }));
}

// ============================================================
// 3. TRAITEMENT DES MESSAGES
// ============================================================

function handleAISMessage(msg) {
    const mmsi = msg.MetaData?.MMSI;
    if (!mmsi) return;

    if (!aisShips[mmsi]) {
        aisShips[mmsi] = { mmsi, name: 'MMSI ' + mmsi, type: 0,
                           lat: null, lng: null, sog: 0, cog: 0, lastSeen: null };
    }
    const ship = aisShips[mmsi];
    ship.lastSeen = new Date();

    if (msg.Message?.PositionReport) {
        const p   = msg.Message.PositionReport;
        ship.lat  = p.Latitude;
        ship.lng  = p.Longitude;
        ship.sog  = p.Sog?.toFixed(1) || '0';
        ship.cog  = Math.round(p.Cog  || 0);
        updateAISMarker(ship);
    }
    if (msg.Message?.ShipStaticData) {
        const s   = msg.Message.ShipStaticData;
        ship.name = (s.Name || ship.name).trim();
        ship.type = s.Type  || 0;
        ship.dest = (s.Destination || '').trim();
        updateAISMarker(ship);
    }
    updateAISPanel();
}

// ============================================================
// 4. MARQUEURS CARTE
// ============================================================

function updateAISMarker(ship) {
    if (ship.lat === null) return;
    const ti = getShipType(ship.type);

    // Filtrage actif
    if (aisActiveFilter !== 'all' && ti.key !== aisActiveFilter) {
        if (aisMarkers[ship.mmsi]) { map.removeLayer(aisMarkers[ship.mmsi]); delete aisMarkers[ship.mmsi]; }
        return;
    }

    const html = `<div style="width:10px;height:10px;border-radius:50%;
        background:${ti.color};border:2px solid rgba(255,255,255,0.6);
        box-shadow:0 0 6px ${ti.color};transform:rotate(${ship.cog}deg);position:relative;">
        <div style="position:absolute;top:-5px;left:50%;transform:translateX(-50%);
        width:0;height:0;border-left:3px solid transparent;border-right:3px solid transparent;
        border-bottom:5px solid ${ti.color};"></div></div>`;

    const icon   = L.divIcon({ className: '', html, iconSize: [10,10], iconAnchor: [5,5] });
    const popup  = `<b>${ship.name}</b><br>${ti.label} · MMSI ${ship.mmsi}<br>${ship.sog} nds @ ${ship.cog}°${ship.dest ? '<br>→ ' + ship.dest : ''}`;

    if (aisMarkers[ship.mmsi]) {
        aisMarkers[ship.mmsi].setLatLng([ship.lat, ship.lng]).setIcon(icon);
        aisMarkers[ship.mmsi].getPopup()?.setContent(popup);
    } else {
        aisMarkers[ship.mmsi] = L.marker([ship.lat, ship.lng], { icon })
            .bindPopup(popup).addTo(map);
    }
}

// ============================================================
// 5. PANEL LISTE NAVIRES
// ============================================================

function updateAISPanel() {
    const portKey     = document.getElementById('portSelector')?.value || "PortManec'h";
    const stationPos  = L.latLng(ports[portKey][0], ports[portKey][1]);
    let ships         = Object.values(aisShips).filter(s => s.lat !== null);

    if (aisActiveFilter !== 'all') {
        ships = ships.filter(s => getShipType(s.type).key === aisActiveFilter);
    }
    ships.forEach(s => s._dist = stationPos.distanceTo(L.latLng(s.lat, s.lng)) / 1852);
    ships.sort((a, b) => a._dist - b._dist);

    _setTxt('ais-count', Object.keys(aisShips).length);

    if (ships.length) {
        _setTxt('ais-closest', ships[0]._dist.toFixed(1) + ' MN');
        const alertEl = document.getElementById('ais-alert');
        if (alertEl) {
            if (ships[0]._dist < AIS_PROXIMITY_NM) {
                const msgEl = document.getElementById('ais-alert-msg');
                if (msgEl) msgEl.textContent = `${ships[0].name} à ${(ships[0]._dist * 1852).toFixed(0)}m`;
                alertEl.classList.add('on');
            } else {
                alertEl.classList.remove('on');
            }
        }
    }

    const listEl = document.getElementById('ais-ship-list');
    if (!listEl) return;
    if (!ships.length) {
        listEl.innerHTML = '<div style="text-align:center;color:#334155;font-size:0.68rem;padding:12px 0;">Aucun navire pour le moment…</div>';
        return;
    }

    listEl.innerHTML = ships.slice(0, 12).map(s => {
        const t   = getShipType(s.type);
        const age = s.lastSeen ? Math.round((Date.now() - s.lastSeen) / 1000) : '--';
        return `<div class="ais-ship-item ${s._dist < 1 ? 'close' : ''}"
            onclick="map.setView([${s.lat},${s.lng}],14);aisMarkers[${s.mmsi}]?.openPopup();">
            <div class="ais-dot" style="background:${t.color};box-shadow:0 0 5px ${t.color};"></div>
            <div class="ais-sname">${s.name}</div>
            <div class="ais-smeta"><b>${s._dist.toFixed(1)} MN</b><br>${s.sog} nds · ${age}s</div>
        </div>`;
    }).join('');
}

// ============================================================
// 6. FILTRES & STATUT
// ============================================================

function aisFilter(type, btn) {
    aisActiveFilter = type;
    document.querySelectorAll('.ais-fbtn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    Object.values(aisShips).forEach(s => updateAISMarker(s));
    updateAISPanel();
}

function setAISStatus(state) {
    const light = document.getElementById('ais-status-light');
    const btn   = document.getElementById('ais-connect-btn');
    const cfg   = {
        connecting:   { c: '#fbbf24', sh: '0 0 8px #fbbf24', t: 'Connexion…',  cl: ''    },
        connected:    { c: '#10b981', sh: '0 0 10px #10b981', t: 'Déconnecter', cl: 'off' },
        disconnected: { c: '#1e3a2a', sh: 'none',             t: 'Connecter',   cl: ''    },
        error:        { c: '#ef4444', sh: '0 0 8px #ef4444',  t: 'Réessayer',   cl: ''    }
    }[state] || { c: '#1e3a2a', sh: 'none', t: 'Connecter', cl: '' };

    if (light) { light.style.background = cfg.c; light.style.boxShadow = cfg.sh; }
    if (btn)   { btn.textContent = cfg.t; btn.className = 'ais-connect-btn ' + cfg.cl; }
}

// ============================================================
// 7. PURGE AUTO (navires > 10 min sans signal)
// ============================================================

setInterval(() => {
    const cut = Date.now() - 600000;
    Object.keys(aisShips).forEach(mmsi => {
        if (aisShips[mmsi].lastSeen && aisShips[mmsi].lastSeen < cut) {
            if (aisMarkers[mmsi]) { map.removeLayer(aisMarkers[mmsi]); delete aisMarkers[mmsi]; }
            delete aisShips[mmsi];
        }
    });
}, 60000);

// ── utilitaire privé ──────────────────────────────────────────
function _setTxt(id, value) {
    const el = document.getElementById(id); if (el) el.innerText = value;
}/**
 * AIS.JS
 * Gestion du flux temps réel AISStream.io et affichage des navires sur la carte.
 */

// Seuil de proximité pour une éventuelle alerte (en Milles Nautiques)
const AIS_PROXIMITY_NM = 0.5; 

// Reprise de tes types de navires et couleurs de app(2).js
const AIS_TYPES = {
    cargo:    { color:'#64748b', label:'Cargo',    codes:[70,71,72,73,74,75,76,77,78,79] },
    tanker:   { color:'#ef4444', label:'Tanker',   codes:[80,81,82,83,84,85,86,87,88,89] },
    sailing:  { color:'#38bdf8', label:'Voile',    codes:[36,37] },
    fishing:  { color:'#fbbf24', label:'Pêche',    codes:[30] },
    passenger:{ color:'#a78bfa', label:'Passager', codes:[60,61,62,63,64,65,66,67,68,69] },
    sar:      { color:'#f97316', label:'SAR',      codes:[51] }, // Très important pour ton app
    other:    { color:'#475569', label:'Autre',    codes:[] }
};

/**
 * Initialisation de la connexion WebSocket
 */
function connectAIS() {
    // Si une connexion existe déjà, on la ferme (bascule ON/OFF)
    if (aisWS) {
        aisWS.close();
        aisWS = null;
        setAISStatus('offline');
        // Nettoyage de la carte
        Object.values(aisMarkers).forEach(m => map.removeLayer(m));
        aisMarkers = {};
        return;
    }

    const apiKey = document.getElementById('ais-api-key')?.value.trim() || AIS_API_KEY;
    if (!apiKey) {
        alert("Clé API AIS manquante.");
        return;
    }

    setAISStatus('connecting');
    aisWS = new WebSocket("wss://stream.aisstream.io/v0/stream");

    aisWS.onopen = () => {
        setAISStatus('online');
        // On s'abonne à la zone Bretagne Sud / Manche Ouest (Bounding Box)
        const subscriptionMessage = {
            APIKey: apiKey,
            BoundingBoxes: [[[47.0, -5.5], [48.5, -2.5]]] 
        };
        aisWS.send(JSON.stringify(subscriptionMessage));
    };

    aisWS.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (!data.MetaData || !data.Message) return;

        const mmsi = data.MetaData.MMSI;
        const msgType = data.MessageType;

        // On ne traite que les messages de position (PositionReport)
        if (msgType === "PositionReport") {
            const pos = data.Message.PositionReport;
            const ship = {
                mmsi: mmsi,
                name: data.MetaData.ShipName.trim() || "Inconnu",
                lat: pos.Latitude,
                lng: pos.Longitude,
                cog: pos.Cog, // Course Over Ground
                sog: pos.Sog, // Speed Over Ground
                type: data.MetaData.ShipType
            };
            
            updateShipMarker(ship);
        }
    };

    aisWS.onerror = (err) => {
        console.error("Erreur AIS WebSocket:", err);
        setAISStatus('error');
    };
}

/**
 * Création ou mise à jour du marqueur sur la carte
 */
function updateShipMarker(ship) {
    // 1. Détermination de la couleur selon le type
    let color = AIS_TYPES.other.color;
    for (const key in AIS_TYPES) {
        if (AIS_TYPES[key].codes.includes(ship.type)) {
            color = AIS_TYPES[key].color;
            break;
        }
    }

    // 2. Filtrage (si l'utilisateur a sélectionné un type précis)
    if (aisActiveFilter !== 'all' && getShipCategory(ship.type) !== aisActiveFilter) {
        if (aisMarkers[ship.mmsi]) map.removeLayer(aisMarkers[ship.mmsi]);
        return;
    }

    // 3. Création du HTML du marqueur (Flèche orientée selon le COG)
    const rotation = ship.cog || 0;
    const html = `
        <div class="ais-marker-container" style="transform: rotate(${rotation}deg);">
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" fill="${color}" stroke="white" stroke-width="1"/>
            </svg>
        </div>`;

    if (aisMarkers[ship.mmsi]) {
        // Mise à jour position et icône
        aisMarkers[ship.mmsi].setLatLng([ship.lat, ship.lng]);
        aisMarkers[ship.mmsi].setIcon(L.divIcon({ className: 'ais-div-icon', html: html, iconSize: [24, 24] }));
    } else {
        // Création
        aisMarkers[ship.mmsi] = L.marker([ship.lat, ship.lng], {
            icon: L.divIcon({ className: 'ais-div-icon', html: html, iconSize: [24, 24] })
        }).addTo(map);
    }

    // Tooltip avec infos navire
    aisMarkers[ship.mmsi].bindTooltip(`
        <b>${ship.name}</b><br>
        Vitesse: ${ship.sog} kts<br>
        Cap: ${ship.cog}°
    `, { direction: 'top', sticky: true });
}

/**
 * Aide au filtrage
 */
function getShipCategory(typeCode) {
    for (const [key, val] of Object.entries(AIS_TYPES)) {
        if (val.codes.includes(typeCode)) return key;
    }
    return 'other';
}

/**
 * Mise à jour visuelle du bouton de statut
 */
function setAISStatus(status) {
    const light = document.getElementById('ais-status-light');
    const label = document.getElementById('ais-status-label');
    if (!light || !label) return;

    switch(status) {
        case 'online':
            light.style.backgroundColor = '#22c55e'; // Vert
            label.innerText = "Connecté";
            break;
        case 'connecting':
            light.style.backgroundColor = '#eab308'; // Jaune
            label.innerText = "Connexion...";
            break;
        case 'error':
            light.style.backgroundColor = '#ef4444'; // Rouge
            label.innerText = "Erreur";
            break;
        default:
            light.style.backgroundColor = '#64748b'; // Gris
            label.innerText = "Déconnecté";
    }
}

/**
 * AIS.JS
 * Gestion du flux temps réel AISStream.io et affichage des navires.
 */

const AIS_PROXIMITY_NM = 0.5; // Seuil d'alerte proximité
const AIS_TYPES = {
    cargo:    { color:'#64748b', label:'Cargo',    codes:[70,71,72,73,74,75,76,77,78,79] },
    tanker:   { color:'#ef4444', label:'Tanker',   codes:[80,81,82,83,84,85,86,87,88,89] },
    sailing:  { color:'#38bdf8', label:'Voile',    codes:[36,37] },
    fishing:  { color:'#fbbf24', label:'Pêche',    codes:[30] },
    passenger:{ color:'#a78bfa', label:'Passager', codes:[60,61,62,63,64,65,66,67,68,69] },
    sar:      { color:'#f97316', label:'SAR',      codes:[51] },
    other:    { color:'#475569', label:'Autre',    codes:[] }
};

/**
 * Initialisation de la connexion WebSocket
 */
function connectAIS() {
    if (aisWS) {
        aisWS.close();
        return;
    }

    const apiKey = document.getElementById('ais-api-key')?.value.trim() || AIS_API_KEY;
    if (!apiKey) {
        alert("Clé API AISStream manquante.");
        return;
    }

    setAISStatus('connecting');
    aisWS = new WebSocket("wss://stream.aisstream.io/v0/stream");

    aisWS.onopen = () => {
        setAISStatus('connected');
        // On s'abonne à la zone Bretagne Sud / Atlantique
        const subscription = {
            APIKey: apiKey,
            BoundingBoxes: [[[46.0, -6.0], [49.0, -1.0]]], 
            FiltersShipType: [30, 36, 37, 51, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89]
        };
        aisWS.send(JSON.stringify(subscription));
        
        // Timer pour les stats de messages
        aisMsgTimer = setInterval(() => {
            document.getElementById('ais-msg-rate').innerText = aisMsgCount + " msg/min";
            aisMsgCount = 0;
        }, 60000);
    };

    aisWS.onmessage = (event) => {
        aisMsgCount++;
        const msg = JSON.parse(event.data);
        handleAISMessage(msg);
    };

    aisWS.onclose = () => {
        setAISStatus('disconnected');
        clearInterval(aisMsgTimer);
        aisWS = null;
    };

    aisWS.onerror = () => setAISStatus('error');
}

/**
 * Traitement des messages entrants
 */
function handleAISMessage(msg) {
    const mmsi = msg.MetaData.MMSI;
    if (!aisShips[mmsi]) {
        aisShips[mmsi] = { mmsi, lastSeen: Date.now() };
    }

    const ship = aisShips[mmsi];
    ship.lastSeen = Date.now();
    ship.name = msg.MetaData.ShipName.trim() || ship.name || "Inconnu";

    if (msg.MessageType === "PositionReport") {
        ship.lat = msg.Message.PositionReport.Latitude;
        ship.lng = msg.Message.PositionReport.Longitude;
        ship.cog = msg.Message.PositionReport.Cog;
        ship.sog = msg.Message.PositionReport.Sog;
        updateAISMarker(ship);
    } else if (msg.MessageType === "ShipStaticData") {
        ship.typeCode = msg.Message.ShipStaticData.Type;
        ship.typeLabel = getAISShipType(ship.typeCode);
        updateAISMarker(ship);
    }
    
    // Mise à jour périodique du panel latéral
    if (aisMsgCount % 5 === 0) updateAISPanel();
}

/**
 * Mise à jour visuelle d'un navire sur la carte
 */
function updateAISMarker(ship) {
    if (!ship.lat || !ship.lng || !map) return;

    // Filtre d'affichage
    const typeKey = Object.keys(AIS_TYPES).find(k => AIS_TYPES[k].codes.includes(ship.typeCode)) || 'other';
    const isVisible = (aisActiveFilter === 'all' || aisActiveFilter === typeKey);

    if (!isVisible) {
        if (aisMarkers[ship.mmsi]) map.removeLayer(aisMarkers[ship.mmsi]);
        return;
    }

    const color = AIS_TYPES[typeKey].color;
    const rotation = ship.cog || 0;

    const html = `
        <div class="ais-ship-icon" style="transform: rotate(${rotation}deg);">
            <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" fill="${color}" stroke="white" stroke-width="1"/>
            </svg>
        </div>`;

    if (aisMarkers[ship.mmsi]) {
        aisMarkers[ship.mmsi].setLatLng([ship.lat, ship.lng]);
        aisMarkers[ship.mmsi].setIcon(L.divIcon({ className: '', html: html, iconSize: [20, 20] }));
    } else {
        aisMarkers[ship.mmsi] = L.marker([ship.lat, ship.lng], {
            icon: L.divIcon({ className: '', html: html, iconSize: [20, 20] })
        }).addTo(map);
    }

    aisMarkers[ship.mmsi].bindTooltip(`<b>${ship.name}</b><br>${ship.sog} kts / ${ship.cog}°`, { direction: 'top' });
}

/**
 * Gestion des boutons de statut
 */
function setAISStatus(state) {
    const light = document.getElementById('ais-status-light');
    const btn = document.getElementById('ais-connect-btn');
    if (!light || !btn) return;

    const states = {
        connecting: { c: '#fbbf24', t: 'Connexion…' },
        connected: { c: '#10b981', t: 'Déconnecter' },
        disconnected: { c: '#475569', t: 'Connecter' },
        error: { c: '#ef4444', t: 'Réessayer' }
    };

    const s = states[state];
    light.style.background = s.c;
    light.style.boxShadow = `0 0 10px ${s.c}`;
    btn.textContent = s.t;
}

function getAISShipType(code) {
    for (const key in AIS_TYPES) {
        if (AIS_TYPES[key].codes.includes(code)) return AIS_TYPES[key].label;
    }
    return "Autre";
}

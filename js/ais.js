/**
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

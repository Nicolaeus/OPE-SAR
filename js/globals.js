/**
 * GLOBALS.JS
 * État centralisé de l'application OPESAR - V20.0.0
 *
 * RÈGLES :
 *  - Ce fichier doit être chargé EN PREMIER, avant tous les autres scripts.
 *  - Ne contient QUE des déclarations de variables et des données statiques.
 *  - Aucune logique métier, aucun appel DOM, aucune dépendance Leaflet ici.
 */

// ============================================================
// 1. INSTANCE CARTE (Leaflet)
//    Déclarée ici, initialisée dans map-engine.js
// ============================================================
let map;

// ============================================================
// 2. CALQUES CARTE
//    Les calques Leaflet sont créés dans map-engine.js et
//    stockés ici pour être accessibles par tous les modules.
// ============================================================
let baseLayers    = {};   // { osm, satellite, dark } — rempli par map-engine.js
let rangeCircle   = null; // Cercle d'autonomie du navire
let isoLayers     = [];   // Isochrones 15/30/45/60 min
let driftLine     = null; // Ligne LKP → DATUM
let navLine       = null; // Route vers le DATUM (directe, zigzag ou contournement)
let landMass      = null; // GeoJSON masse terrestre (France) pour calcul Turf

// ============================================================
// 3. MARQUEURS ET POSITIONS
// ============================================================
let vsdMarker     = null; // Marqueur LKP (Last Known Position), draggable
let driftEndMarker = null; // Marqueur DATUM (position estimée après dérive)

// ============================================================
// 4. ÉTAT OPÉRATIONNEL
// ============================================================

// État de la mer — INDEX du tableau seaStates ci-dessous (0=belle, 1=formée, 2=forte)
// Modifié par setSea() dans navigation.js
let currentSea = 0;

// Visibilité — 'day' | 'night' | 'fog'
// Modifié par setVis() dans navigation.js
let currentVisibility = 'day';

// Données météo temps réel — poussées par weather.js
window.currentSurgeMeters = 0; // Surcote/décote barométrique en mètres
window.currentSwellHeight = 0; // Hauteur de houle significative en mètres

// ============================================================
// 5. DONNÉES DE CONFIGURATION — FLOTTE
//    Source de vérité : data/flotte/fleet.js (futur chargement JSON)
//    En attendant, données inline ici.
// ============================================================
const fleet = {
    nsh1: { name: "NSH1",       tank: 3400, vMax: 25, rangeNominal: 50, towPenalty: 1.4, cons: "180 L/h" },
    nsh2: { name: "NSH2",       tank: 2600, vMax: 25, rangeNominal: 40, towPenalty: 1.4, cons: "140 L/h" },
    nsc1: { name: "NSC1",       tank: 1500, vMax: 30, rangeNominal: 30, towPenalty: 1.5, cons: "110 L/h" },
    nsc2: { name: "NSC2",       tank: 400,  vMax: 30, rangeNominal: 20, towPenalty: 1.6, cons: "60 L/h"  },
    nsc3: { name: "NSC3",       tank: 150,  vMax: 30, rangeNominal: 6,  towPenalty: 1.7, cons: "25 L/h"  },
    nsc4: { name: "NSC4 (Jet)", tank: 45,   vMax: 60, rangeNominal: 6,  towPenalty: 2.0, cons: "15 L/h"  }
};

// ============================================================
// 6. DONNÉES DE CONFIGURATION — PORTS / STATIONS SNSM
//    Source de vérité future : data/ports/ports.json
// ============================================================
const ports = {
    "PortManec'h": [47.80065597908025, -3.737681838252376],
    "Concarneau":  [47.8732, -3.9142],
    "BegMeil":     [47.8554, -3.9785],
    "Doelan":      [47.7711, -3.6102]
};

// Webcams associées aux stations (utilisées dans navigation.js → calculate())
const portCams = {
    "PortManec'h": "port-manech",
    "Concarneau":  "concarneau/ville-close",
    "BegMeil":     "fouesnant/beg-meil"
};

// ============================================================
// 7. DONNÉES DE CONFIGURATION — ÉTATS DE MER
//    Tableau indexé : currentSea = 0 (belle) | 1 (formée) | 2 (forte)
// ============================================================
const seaStates = [
    { label: "Belle",  vLimit: 60, fuelMulti: 1.0 },
    { label: "Formée", vLimit: 18, fuelMulti: 1.3 },
    { label: "Forte",  vLimit: 10, fuelMulti: 1.8 }
];

// ============================================================
// 8. ÉTAT SAR & PATTERNS DE RECHERCHE
// ============================================================
let currentSearchPattern = 'expanding'; // 'expanding' | 'creeping' | 'sector' | 'parallel'
let searchPatternLayers  = [];          // Calques polyline du tracé de recherche
let searchCircleLayer    = null;        // Cercle d'incertitude autour du DATUM

// ============================================================
// 9. FLUX AIS
//    ⚠️  Clé API en clair — à externaliser dans une variable
//        d'environnement ou un fichier .env avant mise en prod.
// ============================================================
let aisWS          = null; // Instance WebSocket AISStream.io
let aisShips       = {};   // Données brutes des navires { mmsi: {...} }
let aisMarkers     = {};   // Instances des marqueurs Leaflet { mmsi: marker }
let aisMsgCount    = 0;    // Compteur messages/min (affiché dans le panel AIS)
let aisMsgTimer    = null; // setInterval du compteur
let aisActiveFilter = 'all';
const AIS_API_KEY  = '9a5cb754a648740650bbfee683c836ed89f13e6b';

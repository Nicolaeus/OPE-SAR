/**
 * GLOBALS.JS
 * État centralisé de l'application - V20.0.0
 * Ce fichier doit être chargé AVANT tous les autres scripts.
 */

// --- 1. Éléments de la Carte (Leaflet) ---
let map; 
let beachLayer = L.layerGroup();
let coastalLinesGroup = L.layerGroup();
let driftLine = null;
let navLine = null;
let rangeCircle = null;
let searchArea = null;

// --- 2. Marqueurs et Positions ---
let vsdMarker = null;      // Point LKP (Last Known Position)
let driftEndMarker = null; // Point DATUM (Position estimée après dérive)
let waypointMarkers = [];  // Pour de futures extensions de route

// --- 3. État Environnemental (Globales) ---
let currentSea = 'calm';      // 'calm', 'choppy', 'rough'
let currentVisibility = 'day'; // 'day', 'night', 'fog'
window.currentSurgeMeters = 0; // Surcote liée à la pression (poussée par weather.js)
window.currentSwellHeight = 0; // Hauteur de houle (poussée par weather.js)
window.currentVitesse = 0;     // Vitesse fond calculée (utilisée par navigation.js)

// --- 4. Données de Configuration (Data) ---
// Note : Ces objets seront écrasés si tu utilises le chargement JSON externe
let fleet = {
    nsh1: { name: "NSH1", tank: 3400, vMax: 25, rangeNominal: 50, towPenalty: 1.4, cons: "180 L/h" },
    nsh2: { name: "NSH2", tank: 2600, vMax: 25, rangeNominal: 40, towPenalty: 1.4, cons: "140 L/h" },
    nsc1: { name: "NSC1", tank: 1500, vMax: 30, rangeNominal: 30, towPenalty: 1.5, cons: "110 L/h" },
    nsc2: { name: "NSC2", tank: 400,  vMax: 30, rangeNominal: 20, towPenalty: 1.6, cons: "60 L/h" },
    nsc3: { name: "NSC3", tank: 150,  vMax: 30, rangeNominal: 6,  towPenalty: 1.7, cons: "25 L/h" },
    nsc4: { name: "NSC4 (Jet)", tank: 45, vMax: 60, rangeNominal: 6, towPenalty: 2.0, cons: "15 L/h" }
};

let ports = { 
    'PortManec\'h': [47.80065597908025, -3.737681838252376], 
    'Concarneau': [47.8732, -3.9142], 
    'BegMeil': [47.8554, -3.9785],
    'Doelan': [47.7711, -3.6102]
};

// À ajouter dans globals.js (Section 4)
const TIDAL_DATA = {
    'PortManec\'h': {
        datum: 3.15,
        constituents: [
            { name: 'M2', amp: 1.45, freq: 28.984104, phase: 185.2 },
            { name: 'S2', amp: 0.52, freq: 30.0,      phase: 220.5 },
            { name: 'N2', amp: 0.28, freq: 28.43973,  phase: 160.8 },
            { name: 'K1', amp: 0.08, freq: 15.041069, phase: 70.2 },
            { name: 'O1', amp: 0.06, freq: 13.943035, phase: 50.5 }
        ]
    },
    'Concarneau': {
        datum: 3.20,
        constituents: [
            { name: 'M2', amp: 1.48, freq: 28.984104, phase: 188.5 },
            { name: 'S2', amp: 0.54, freq: 30.0,      phase: 224.1 },
            { name: 'N2', amp: 0.30, freq: 28.43973,  phase: 164.2 }
        ]
    }
};

const seaStates = {
    'calm': { vLimit: 60, fuelMulti: 1.0 },
    'choppy': { vLimit: 18, fuelMulti: 1.3 },
    'rough': { vLimit: 10, fuelMulti: 1.8 }
};

// --- 5. État SAR & Recherche ---
let currentSearchPattern = null;
let searchPatternLayers = []; // Stockage des polylines pour pouvoir les effacer
let searchCircleLayer = null;

// --- 6. Flux AIS ---
let aisWS = null;
let aisShips = {};   // Données brutes des navires
let aisMarkers = {}; // Instances des marqueurs Leaflet
let aisActiveFilter = 'all';
const AIS_API_KEY = '9a5cb754a648740650bbfee683c836ed89f13e6b'; // À sécuriser plus tard

// --- 7. Utilitaires UI ---
// Variables pour le calcul des DMS (Degrés Minutes Secondes)
let lastValidLat = 47.8012;
let lastValidLng = -3.7429;

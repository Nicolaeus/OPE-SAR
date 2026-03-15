/**
 * GLOBALS.JS
 * Déclaration des variables d'état partagées entre les modules.
 */

// --- Instances et Layers de la Carte ---
let map; 
let beachLayer = L.layerGroup();
let coastalLinesGroup = L.layerGroup();
let driftLine, navLine, rangeCircle, searchArea;

// --- Marqueurs SAR ---
let vsdMarker = null;      // Ton point LKP
let driftEndMarker = null; // Ton point DATUM calculé

// --- État Environnemental ---
let currentSea = 'calm';
let currentVisibility = 'day';
window.currentSurgeMeters = 0; // Surcote météo
window.currentSwellHeight = 0; // Hauteur de houle pour calcul vitesse

// --- État SAR & Recherche ---
let currentSearchPattern = null;
let searchPatternLayers = [];
let searchCircleLayer = null;

// --- AIS ---
let aisWS = null;
let aisShips = {};
let aisMarkers = {};
let aisMsgCount = 0;
let aisMsgTimer = null;
let aisActiveFilter = 'all';
const AIS_API_KEY = '9a5cb754a648740650bbfee683c836ed89f13e6b';

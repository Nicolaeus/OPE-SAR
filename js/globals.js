/**
 * GLOBALS.JS
 * État partagé de l'application
 */

// --- Instances Map & Layers ---
let map; 
let beachLayer = L.layerGroup();
let coastalLinesGroup = L.layerGroup();
let driftLine, navLine, rangeCircle, searchArea;

// --- Marqueurs SAR ---
let vsdMarker = null;      // Marqueur LKP
let driftEndMarker = null; // Marqueur DATUM

// --- État Environnemental ---
let currentSea = 'calm';
let currentVisibility = 'day';
window.currentSurgeMeters = 0; // Utilisé par la marée
window.currentSwellHeight = 0; // Utilisé par le calcul de vitesse

// --- État SAR & Patterns ---
let currentSearchPattern = null;
let searchPatternLayers = [];
let searchCircleLayer = null;

// --- Configuration AIS ---
const AIS_API_KEY = '9a5cb754a648740650bbfee683c836ed89f13e6b';

/**
 * ==========================================================
 * OPE-SAR Core
 * ----------------------------------------------------------
 * Collections.js
 *
 * Déclaration centralisée des collections IndexedDB.
 *
 * Toutes les collections de l'application sont définies ici.
 *
 * Aucun nom de collection ne doit être écrit en dur
 * ailleurs dans le projet.
 * ==========================================================
 */

const Collections = Object.freeze({

    // =============================================
    // Paramètres
    // =============================================

    SETTINGS:
        'settings',

    // =============================================
    // Stations SNSM
    // =============================================

    STATIONS:
        'stations',

    STATION_REFERENCES:
        'station_references',

    // =============================================
    // Cartographie
    // =============================================

    MAP:
        'map',

    LAYERS:
        'layers',

    // =============================================
    // Météo
    // =============================================

    WEATHER:
        'weather',

    TIDES:
        'tides',

    AIS:
        'ais',

    // =============================================
    // SAR
    // =============================================

    MISSIONS:
        'missions',

    PATTERNS:
        'patterns',

    SEARCH_AREAS:
        'search_areas',

    DRIFT:
        'drift',

    // =============================================
    // OSC
    // =============================================

    OSC:
        'osc',

    SITREPS:
        'sitreps',

    TIMELINE:
        'timeline',

    // =============================================
    // Documents
    // =============================================

    DOCUMENTS:
        'documents',

    ATTACHMENTS:
        'attachments',

    // =============================================
    // Journal
    // =============================================

    LOGS:
        'logs',

    // =============================================
    // Cache
    // =============================================

    CACHE:
        'cache'

});

export default Collections;

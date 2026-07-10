/**
 * ==========================================================
 * OPE-SAR Core
 * ----------------------------------------------------------
 * CacheKeys.js
 *
 * Déclaration centralisée des clés de cache.
 *
 * Toutes les données temporaires de l'application
 * doivent utiliser ces constantes.
 *
 * Ne jamais écrire une clé de cache "en dur".
 * ==========================================================
 */

const CacheKeys = Object.freeze({

    // ======================================================
    // Météo
    // ======================================================

    WEATHER:
        'weather',

    FORECAST:
        'forecast',

    GRIB:
        'grib',

    // ======================================================
    // Marées
    // ======================================================

    TIDES:
        'tides',

    TIDE_PREDICTIONS:
        'tide_predictions',

    // ======================================================
    // AIS
    // ======================================================

    AIS:
        'ais',

    AIS_TARGETS:
        'ais_targets',

    // ======================================================
    // Cartographie
    // ======================================================

    MAP_TILES:
        'map_tiles',

    MAP_STYLE:
        'map_style',

    // ======================================================
    // Calculs
    // ======================================================

    SAR_DRIFT:
        'sar_drift',

    SAR_PATTERN:
        'sar_pattern',

    OSC_SIMULATION:
        'osc_simulation',

    // ======================================================
    // Téléchargements
    // ======================================================

    DOWNLOADS:
        'downloads',

    // ======================================================
    // Divers
    // ======================================================

    TEMP:
        'temp'

});

export default CacheKeys;

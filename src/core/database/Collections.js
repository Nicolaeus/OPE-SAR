/**
 * ==========================================================
 * OPE-SAR Core
 * ----------------------------------------------------------
 * Collections.js
 *
 * Déclaration des collections IndexedDB.
 *
 * Les données de référence (JSON, API, GRIB...)
 * ne sont PAS stockées ici.
 *
 * Seules les données utilisateur et les caches
 * persistants sont enregistrés.
 * ==========================================================
 */

const Collections = Object.freeze({

    // =============================================
    // Paramètres utilisateur
    // =============================================

    SETTINGS:
        'settings',

    // =============================================
    // Missions SAR
    // =============================================

    MISSIONS:
        'missions',

    // =============================================
    // Missions OSC
    // =============================================

    OSC:
        'osc',

    SITREPS:
        'sitreps',

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

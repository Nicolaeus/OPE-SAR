/**
 * PatrolEvents.js
 *
 * Evénements métier du module Patrol.
 */

const PatrolEvents = {

    // Cycle de vie
    PATROL_STARTED: 'PATROL_STARTED',
    PATROL_RESUMED: 'PATROL_RESUMED',
    PATROL_PAUSED: 'PATROL_PAUSED',
    PATROL_COMPLETED: 'PATROL_COMPLETED',

    // Navigation
    POSITION: 'POSITION',
    WAYPOINT: 'WAYPOINT',

    // Communications
    CROSS_CALL: 'CROSS_CALL',
    RADIO_MESSAGE: 'RADIO_MESSAGE',

    // SAR
    SAR_STARTED: 'SAR_STARTED',
    SAR_COMPLETED: 'SAR_COMPLETED',

    // OSC
    OSC_CREATED: 'OSC_CREATED',

    // Navigation / Machine
    ENGINE_START: 'ENGINE_START',
    ENGINE_STOP: 'ENGINE_STOP',
    FUEL_UPDATE: 'FUEL_UPDATE',

    // Météo
    WEATHER_UPDATE: 'WEATHER_UPDATE',

    // Divers
    NOTE: 'NOTE'

};

export default Object.freeze(PatrolEvents);

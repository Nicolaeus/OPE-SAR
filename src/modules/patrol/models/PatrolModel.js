/**
 * PatrolModel.js
 *
 * Modèle métier d'une patrouille.
 *
 * Une patrouille représente une sortie opérationnelle d'une unité
 * (SNSM, Marine, etc.) et peut contenir différents événements :
 *
 * - départ
 * - escales
 * - positions GPS
 * - appels CROSS
 * - missions SAR
 * - observations
 * - retour au port
 */

export default class PatrolModel {

    constructor() {

        /**
         * Identifiant unique
         */
        this.id = crypto.randomUUID();

        /**
         * Etat de la patrouille
         *
         * INACTIVE
         * UNDERWAY
         * IN_PORT
         * COMPLETED
         */
        this.status = 'INACTIVE';

        /**
         * Station d'origine
         */
        this.station = null;

        /**
         * Embarcation
         */
        this.vessel = null;

        /**
         * Equipage
         */
        this.crew = [
        
            {
                id: crypto.randomUUID(),
                role: "captain",
                mandatory: true,
                lastname: "",
                firstname: ""
            },
        
            {
                id: crypto.randomUUID(),
                role: "deck",
                mandatory: true,
                lastname: "",
                firstname: ""
            },
        
            {
                id: crypto.randomUUID(),
                role: "deck",
                mandatory: true,
                lastname: "",
                firstname: ""
            }
        
        ];


        /**
         * Missions réalisées pendant la patrouille.
         */
        this.missions = [];
        
        /**
         * Communications.
         */
        this.communications = [];
        
        /**
         * Date de création
         */
        this.createdAt = new Date();

        /**
         * Départ en patrouille
         */
        this.startedAt = null;

        /**
         * Fin de patrouille
         */
        this.endedAt = null;

        /**
         * Position de départ
         */
        this.startPosition = null;

        /**
         * Position d'arrivée
         */
        this.endPosition = null;

        /**
         * Trace GPS complète.
         *
         * [{
         *      latitude,
         *      longitude,
         *      speed,
         *      heading,
         *      accuracy,
         *      timestamp
         * }]
         */
        this.track = [];

        /**************************************************************
         * Evènements système.
         *
         * Utilisés par le moteur Patrol.
         *
         * Ils ne sont pas destinés à être affichés directement
         * dans l'interface utilisateur.
         *************************************************************/
        this.systemEvents = [];

        /**
         * Journal opérationnel.
         *
         * Timeline officielle de la patrouille.
         *
         * Ce journal regroupe chronologiquement
         * toutes les actions importantes :
         *
         * - départ
         * - escales
         * - communications
         * - observations
         * - missions SAR
         * - changements d'état
         *
         * Il constitue la base des exports
         * (PDF, JSON, etc.).
         */
        this.journal = [];
        
        /**
         * Heures moteur.
         */
        this.engine = {

            startHours: null,

            endHours: null

        };

        /**
         * Carburant.
         */
        this.fuel = {

            departure: null,

            arrival: null,

            consumed: null

        };

        /**
         * Observations libres.
         */
        this.notes = '';

        /**
         * Persistance.
         */
        this.persistence = {
        
            version: 1,
        
            status: 'ACTIVE',
        
            createdAt: new Date(),
        
            savedAt: null,

            lastOpenedAt:null
        
        };

    }

    /**
     * Durée de la patrouille (ms).
     */
    get duration() {

        if (!this.startedAt) {
            return 0;
        }

        const end =
            this.endedAt ??
            new Date();

        return end - this.startedAt;

    }

    /**
     * Patrouille active ?
     */
    isRunning() {

        return this.status === 'UNDERWAY';

    }

    /**
     * En escale ?
     */
    isInPort() {

        return this.status === 'IN_PORT';

    }

    /**
     * Terminée ?
     */
    isCompleted() {

        return this.status === 'COMPLETED';

    }

    /**
     * Ajoute un événement.
     *
     * @param {Object} event
     */
    addEvent(event) {

        this.systemEvents.push({

            id: crypto.randomUUID(),

            timestamp: new Date(),

            ...event

        });

    }

    /**
     * Ajoute un point GPS.
     *
     * @param {Object} position
     */
    addTrackPoint(position) {

        this.track.push({

            latitude: position.latitude,

            longitude: position.longitude,

            altitude: position.altitude,

            speed: position.speed,

            heading: position.heading,

            accuracy: position.accuracy,

            timestamp:
                position.timestamp ??
                new Date()

        });

    }

}

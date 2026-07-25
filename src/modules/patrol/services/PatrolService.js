/**
 * PatrolService.js
 *
 * Service de gestion de la patrouille courante.
 */

import PatrolModel from '../models/PatrolModel.js';
import PatrolEvents from '../constants/PatrolEvents.js';

export default class PatrolService {

    /**
     * Patrouille courante.
     */
    static current = null;

    /**
     * Initialise le service.
     */
    static init() {

        if (!this.current) {

            this.current =
                new PatrolModel();

        }

    }

    /**
     * Retourne la patrouille courante.
     */
    static getCurrent() {

        return this.current;

    }

    /**
     * Une patrouille est-elle en navigation ?
     */
    static isRunning() {

        return (
            this.current &&
            this.current.isRunning()
        );

    }

    /**
     * Démarre une patrouille.
     *
     * @param {Object|null} position
     */
    static start(position = null) {

        if (!this.current) {

            this.current =
                new PatrolModel();

        }

        this.current.status =
            'UNDERWAY';

        this.current.startedAt =
            new Date();

        this.current.startPosition =
            position;

        if (position) {

            this.current.addTrackPoint(
                position
            );

        }

        this.current.addEvent({

            type: PatrolEvents.PATROL_STARTED,

            position

        });

        this.dispatch();

    }

    /**
     * Arrivée dans un port.
     *
     * @param {Object|null} position
     */
    static stopInPort(position = null) {

        if (!this.current) {
            return;
        }

        this.current.status =
            'IN_PORT';

        this.current.addEvent({

            type: PatrolEvents.PATROL_PAUSED,

            position

        });

        this.dispatch();

    }

    /**
     * Reprise de la navigation.
     *
     * @param {Object|null} position
     */
    static resume(position = null) {

        if (!this.current) {
            return;
        }

        this.current.status =
            'UNDERWAY';

        this.current.addEvent({

            type: PatrolEvents.PATROL_RESUMED,

            position

        });

        this.dispatch();

    }

    /**
     * Termine définitivement la patrouille.
     *
     * @param {Object|null} position
     */
    static finish(position = null) {

        if (!this.current) {
            return;
        }

        this.current.status =
            'COMPLETED';

        this.current.endedAt =
            new Date();

        this.current.endPosition =
            position;

        if (position) {

            this.current.addTrackPoint(
                position
            );

        }

        this.current.addEvent({

            type: PatrolEvents.PATROL_COMPLETED,

            position

        });

        this.dispatch();

    }

    /**
     * Ajoute un événement métier.
     *
     * @param {Object} event
     */
    static addEvent(event) {

        if (!this.current) {
            return;
        }

        this.current.addEvent(
            event
        );

        this.dispatch();

    }

    /**
     * Ajoute un point GPS à la trace.
     *
     * @param {Object} position
     */
    static addTrackPoint(position) {

        if (
            !this.current ||
            !this.current.isRunning()
        ) {
            return;
        }

        this.current.addTrackPoint(
            position
        );

        this.current.addEvent({

            type: PatrolEvents.POSITION,

            latitude: position.latitude,

            longitude: position.longitude,

            speed: position.speed,

            heading: position.heading,

            accuracy: position.accuracy

        });

        window.dispatchEvent(

            new CustomEvent(

                'patrol:track',

                {

                    detail: position

                }

            )

        );

    }

    /**
     * Réinitialise le service.
     */
    static reset() {

        this.current =
            new PatrolModel();

        this.dispatch();

    }

    /**
     * Diffuse l'état courant.
     */
    static dispatch() {

        window.dispatchEvent(

            new CustomEvent(

                'patrol:updated',

                {

                    detail: this.current

                }

            )

        );

    }

}

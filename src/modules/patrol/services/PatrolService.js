/**
 * PatrolService.js
 *
 * Service de gestion de la patrouille courante.
 */

import PatrolModel from '../models/PatrolModel.js';

export default class PatrolService {

    static current = null;

    /**
     * Initialisation du service.
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
     * Une patrouille est-elle active ?
     */
    static isRunning() {

        return (
            this.current &&
            this.current.isRunning()
        );

    }

    /**
     * Départ en patrouille.
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

            type: 'PATROL_STARTED',

            position

        });

        this.dispatch();

    }

    /**
     * Escale.
     */
    static stopInPort(position = null) {

        if (!this.current) {
            return;
        }

        this.current.status =
            'IN_PORT';

        this.current.addEvent({

            type: 'PORT_STOP',

            position

        });

        this.dispatch();

    }

    /**
     * Reprise après escale.
     */
    static resume(position = null) {

        if (!this.current) {
            return;
        }

        this.current.status =
            'UNDERWAY';

        this.current.addEvent({

            type: 'PATROL_RESUMED',

            position

        });

        this.dispatch();

    }

    /**
     * Fin définitive.
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

            type: 'PATROL_COMPLETED',

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
     * Ajoute un point GPS.
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

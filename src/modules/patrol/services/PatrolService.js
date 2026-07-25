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

            this.current = new PatrolModel();

        }

    }

    /**
     * Retourne la patrouille courante.
     */
    static getCurrent() {

        return this.current;

    }

    /**
     * Patrouille en navigation ?
     */
    static isRunning() {

        return (
            this.current &&
            this.current.status === 'UNDERWAY'
        );

    }

    /**
     * Change l'état de la patrouille.
     *
     * Etats possibles :
     *  - UNDERWAY
     *  - IN_PORT
     *  - COMPLETED
     *
     * @param {String} status
     * @param {Object|null} position
     */
    static setStatus(status, position = null) {

        if (!this.current) {

            this.current = new PatrolModel();

        }

        const previousStatus =
            this.current.status;

        switch (status) {

            case 'UNDERWAY':

                if (!this.current.startedAt) {

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

                }
                else if (previousStatus === 'IN_PORT') {

                    this.current.addEvent({

                        type: PatrolEvents.PATROL_RESUMED,

                        position

                    });

                }

                this.current.status =
                    'UNDERWAY';

                break;

            case 'IN_PORT':

                this.current.status =
                    'IN_PORT';

                this.current.addEvent({

                    type: PatrolEvents.PATROL_PAUSED,

                    position

                });

                break;

            case 'COMPLETED':

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

                break;

            default:

                console.warn(
                    `Etat de patrouille inconnu : ${status}`
                );

                return;

        }

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

        this.current.addEvent(event);

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
            this.current.status !== 'UNDERWAY'
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
     * Réinitialise la patrouille.
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

/**
 * PatrolService.js
 *
 * Service métier de gestion de la patrouille.
 *
 * Responsabilités :
 *
 *  - gestion de la patrouille courante
 *  - persistance automatique
 *  - diffusion des évènements UI
 *  - point d'entrée unique des cartes Patrol
 */

import PatrolModel from '../models/PatrolModel.js';
import PatrolEvents from '../constants/PatrolEvents.js';

import StorageService
    from '../../../core/services/StorageService.js';

import Collections
    from '../../../core/database/Collections.js';

export default class PatrolService {

    /**
     * Patrouille courante.
     */
    static current = null;

    /**
     * Initialisation.
     *
     * Recharge automatiquement
     * la dernière patrouille active.
     */
    static async init() {

        await this.load();

    }

    /**
     * Retourne la patrouille courante.
     *
     * @returns {PatrolModel}
     */
    static getCurrent() {

        return this.current;

    }

    /**
     * Patrouille active ?
     *
     * @returns {Boolean}
     */
    static isRunning() {

        return (

            this.current &&

            this.current.status ===
                'UNDERWAY'

        );

    }

    /**
     * Recharge la dernière
     * patrouille active.
     */
    static async load() {

        try {

            const patrols =

                await StorageService.getAll(

                    Collections.PATROLS

                );

            const active =

                patrols.find(

                    patrol =>

                        patrol?.persistence?.status ===
                        'ACTIVE'

                );

            if (active) {

                console.log(

                    '📂 Patrouille restaurée.'

                );

                this.current = active;

            }

            else {

                console.log(

                    '🆕 Nouvelle patrouille.'

                );

                this.current =
                    new PatrolModel();

                await this.save();

            }

        }

        catch (error) {

            console.error(

                'Impossible de charger la patrouille.',

                error

            );

            this.current =
                new PatrolModel();

        }

        this.dispatch();

    }

    /**
     * Sauvegarde la patrouille.
     */
    static async save() {

        if (!this.current) {

            return;

        }

        this.current.persistence.savedAt =
            new Date();

        await StorageService.save(

            Collections.PATROLS,

            this.current

        );

    }

    /**
     * Commit.
     *
     * Sauvegarde +
     * rafraîchissement UI.
     */
    static async commit() {

        await this.save();

        this.dispatch();

    }

    /**
     * Efface la patrouille
     * locale.
     */
    static async clear() {

        if (!this.current) {

            return;

        }

        await StorageService.delete(

            Collections.PATROLS,

            this.current.id

        );

        this.current =
            new PatrolModel();

        await this.save();

        this.dispatch();

    }

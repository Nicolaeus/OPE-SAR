/**
 * PatrolService.js
 *
 * Service métier du module Patrol.
 *
 * Toute modification de la patrouille passe
 * obligatoirement par ce service.
 *
 * Responsabilités :
 *
 *  • gestion de la patrouille courante
 *  • persistance automatique
 *  • diffusion des évènements UI
 *  • point d'entrée unique des cartes Patrol
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
     *
     * @type {PatrolModel|null}
     */
    static current = null;

    /**
     * =====================================================
     * Initialisation
     * =====================================================
     */

    static async init() {

        await this.load();

    }

    /**
     * =====================================================
     * Retourne la patrouille courante.
     * =====================================================
     */

    static getCurrent() {

        return this.current;

    }

    /**
     * =====================================================
     * Patrouille en cours ?
     * =====================================================
     */

    static isRunning() {

        return (

            this.current &&

            this.current.status ===
            'UNDERWAY'

        );

    }

    /**
     * =====================================================
     * Chargement
     * =====================================================
     *
     * Recharge la dernière patrouille ACTIVE.
     *
     * Si aucune n'existe,
     * une nouvelle est créée.
     */

    static async load() {

        try {

            const patrols =

                await StorageService.list(

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
            
                this.current =
                    PatrolModel.fromData(
                        active
                    );
            
            }

            else {

                console.log(

                    '🆕 Création d’une nouvelle patrouille.'

                );

                this.current =
                    new PatrolModel();

                await this.save();

            }

        }

        catch (error) {

            console.error(

                'Erreur chargement Patrol.',

                error

            );

            this.current =
                new PatrolModel();

        }

        this.dispatch();

    }

    /**
     * =====================================================
     * Sauvegarde
     * =====================================================
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
     * =====================================================
     * Commit
     * =====================================================
     *
     * Toute modification du modèle
     * passe par cette méthode.
     */

    static async commit() {

        await this.save();

        this.dispatch();

    }

    /**
     * =====================================================
     * Suppression locale
     * =====================================================
     *
     * Appelée après export PDF / JSON.
     */

    static async clear() {

        if (!this.current) {

            return;

        }

        await StorageService.remove(

            Collections.PATROLS,

            this.current.id

        );

        this.current =
            new PatrolModel();

        await this.save();

        this.dispatch();

    }

    /**
     * =====================================================
     * Diffusion UI
     * =====================================================
     */

    static dispatch() {

        window.dispatchEvent(

            new CustomEvent(

                'patrol:updated',

                {

                    detail:
                        this.current

                }

            )

        );

    }

    /**
     * =====================================================
     * Etat de la patrouille
     * =====================================================
     */

    static async setStatus(
        status,
        position = null
    ) {

        if (!this.current) {

            this.current =
                new PatrolModel();

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

                        type:
                            PatrolEvents.PATROL_STARTED,

                        position

                    });

                }

                else if (

                    previousStatus ===
                    'IN_PORT'

                ) {

                    this.current.addEvent({

                        type:
                            PatrolEvents.PATROL_RESUMED,

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

                    type:
                        PatrolEvents.PATROL_PAUSED,

                    position

                });

                break;

            case 'COMPLETED':

                this.current.status =
                    'COMPLETED';

                this.current.persistence.status =
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

                    type:
                        PatrolEvents.PATROL_COMPLETED,

                    position

                });

                break;

            default:

                console.warn(

                    `Etat inconnu : ${status}`

                );

                return;

        }

        await this.commit();

    }

    /**
     * =====================================================
     * Evènements métier
     * =====================================================
     */

    static async addEvent(event) {

        if (!this.current) {

            return;

        }

        this.current.addEvent(event);

        await this.commit();

    }

    /**
     * =====================================================
     * Trace GPS
     * =====================================================
     */

    static async addTrackPoint(position) {

        if (

            !this.current ||

            this.current.status !==
            'UNDERWAY'

        ) {

            return;

        }

        this.current.addTrackPoint(
            position
        );

        this.current.addEvent({

            type:
                PatrolEvents.POSITION,

            latitude:
                position.latitude,

            longitude:
                position.longitude,

            speed:
                position.speed,

            heading:
                position.heading,

            accuracy:
                position.accuracy

        });

        await this.commit();

        window.dispatchEvent(

            new CustomEvent(

                'patrol:track',

                {

                    detail:
                        position

                }

            )

        );

    }

    /**
     * =====================================================
     * Réinitialisation
     * =====================================================
     */

    static async reset() {

        this.current =
            new PatrolModel();

        await this.commit();

    }

    /**
     * =====================================================
     * Equipage
     * =====================================================
     */

    /**
     * Met à jour un membre.
     *
     * @param {Number} index
     * @param {Object} data
     */
    static async updateCrewMember(
        index,
        data
    ) {

        if (!this.current) {

            return;

        }

        Object.assign(

            this.current.crew[index],

            data

        );

        await this.commit();

    }

    /**
     * Ajoute un membre.
     *
     * @param {Object} member
     */
    static async addCrewMember(member) {

        if (!this.current) {

            return;

        }

        this.current.crew.push({

            id: crypto.randomUUID(),

            mandatory: false,

            ...member

        });

        await this.commit();

    }

    /**
     * Supprime un membre.
     *
     * @param {String} id
     */
    static async removeCrewMember(id) {

        if (!this.current) {

            return;

        }

        this.current.crew =

            this.current.crew.filter(

                member =>

                    member.mandatory ||

                    member.id !== id

            );

        await this.commit();

    }

    /**
     * =====================================================
     * Communications
     * =====================================================
     */

    /**
     * Ajoute une communication.
     *
     * @param {Object} communication
     */
    static async addCommunication(
        communication
    ) {

        if (!this.current) {

            return;

        }

        this.current.communications.push({

            id: crypto.randomUUID(),

            timestamp:

                communication.timestamp ??

                new Date().toISOString(),

            ...communication

        });

        await this.commit();

    }

    /**
     * Retourne les communications.
     *
     * @returns {Array}
     */
    static getCommunications() {

        if (!this.current) {

            return [];

        }

        return this.current.communications;

    }

    /**
     * Supprime une communication.
     *
     * @param {String} id
     */
    static async removeCommunication(id) {

        if (!this.current) {

            return;

        }

        this.current.communications =

            this.current.communications.filter(

                communication =>

                    communication.id !== id

            );

        await this.commit();

    }

    /**
     * =====================================================
     * Journal
     * =====================================================
     */

    /**
     * Ajoute une entrée.
     *
     * @param {Object} entry
     */
    static async addJournalEntry(
        entry
    ) {

        if (!this.current) {

            return;

        }

        this.current.journal.push({

            id: crypto.randomUUID(),

            timestamp:

                entry.timestamp ??

                new Date().toISOString(),

            ...entry

        });

        await this.commit();

    }

    /**
     * Retourne le journal.
     *
     * @returns {Array}
     */
    static getJournal() {

        if (!this.current) {

            return [];

        }

        return this.current.journal;

    }

    /**
     * Supprime une entrée.
     *
     * @param {String} id
     */
    static async removeJournalEntry(
        id
    ) {

        if (!this.current) {

            return;

        }

        this.current.journal =

            this.current.journal.filter(

                entry =>

                    entry.id !== id

            );

        await this.commit();

    }

    /**
     * =====================================================
     * Statistiques
     * =====================================================
     */

    /**
     * Retourne un résumé complet
     * de la patrouille.
     *
     * @returns {Object}
     */
    static getStatistics() {

        if (!this.current) {

            return {

                duration: 0,

                crew: 0,

                communications: 0,

                journal: 0,

                systemEvents: 0,

                track: 0

            };

        }

        return {

            duration:
                this.current.duration,

            crew:
                this.current.crew.length,

            communications:
                this.current.communications.length,

            journal:
                this.current.journal.length,

            systemEvents:
                this.current.systemEvents.length,

            track:
                this.current.track.length

        };

    }

    /**
     * =====================================================
     * Export
     * =====================================================
     */

    /**
     * Retourne le modèle complet.
     *
     * Utilisé par ExportService.
     *
     * @returns {PatrolModel}
     */
    static export() {

        return structuredClone(

            this.current

        );

    }

    /**
     * =====================================================
     * Clôture métier
     * =====================================================
     *
     * Complète la patrouille puis
     * déclenche la clôture officielle.
     */
    static async complete(data, position = null) {
    
        if (!this.current) {
    
            return;
    
        }
    
        // Heures moteur
    
        if (data.engine) {
    
            this.current.engine = {
    
                ...this.current.engine,
    
                ...data.engine
    
            };
    
        }
    
        // Carburant
    
        if (data.fuel) {
    
            this.current.fuel = {
    
                ...this.current.fuel,
    
                ...data.fuel
    
            };
    
        }
    
        // Notes
    
        if (data.notes !== undefined) {
    
            this.current.notes = data.notes;
    
        }

        if (data.noIncident !== undefined) {

            this.current.noIncident =
                data.noIncident;

        }
    
        // Fin de patrouille
    
        await this.setStatus(
    
            'COMPLETED',
    
            position
    
        );
    
    }

    
    /**
     * =====================================================
     * Clôture
     * =====================================================
     *
     * Prépare la patrouille avant export.
     *
     * L'ExportService sera responsable
     * du PDF, JSON, GPX et du partage.
     */

    static async close(position = null) {

        await this.setStatus(

            'COMPLETED',

            position

        );

    }

    /**
     * =====================================================
     * Validation
     * =====================================================
     */

    /**
     * Equipage valide ?
     */
    static hasValidCrew() {

        if (!this.current) {

            return false;

        }

        return this.current.crew

            .filter(

                member =>

                    member.mandatory

            )

            .every(

                member =>

                    member.lastname &&
                    member.firstname

            );

    }

    /**
     * Patrouille exportable ?
     */

    static canClose() {

        if (!this.current) {

            return false;

        }

        return (

            this.hasValidCrew()

        );

    }

}

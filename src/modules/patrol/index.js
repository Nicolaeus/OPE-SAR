/**
 * index.js — Module Patrol
 *
 * Gestion de la patrouille :
 *  - ouverture / fermeture de la carte
 *  - bouton flottant de contrôle
 *  - initialisation du service
 *
 * Toute la logique métier est déléguée à PatrolService.
 */

import PatrolCard    from './cards/PatrolCard.js';
import PatrolButton  from './widgets/PatrolButton.js';
import PatrolService from './services/PatrolService.js';

import PatrolCrewCard from './cards/PatrolCrewCard.js';
import PatrolSummaryCard from './cards/PatrolSummaryCard.js';
import PatrolClosingCard from './cards/PatrolClosingCard.js';

export default {

    id: 'patrol',

    name: 'Patrouille',

    icon: '🔄',

    async init() {

        console.log(
            '🔄 Initialisation module Patrouille'
        );

        // -------------------------------------------------------------
        // Initialisation du service
        // -------------------------------------------------------------

        PatrolService.init();

        // -------------------------------------------------------------
        // Création du bouton flottant
        // -------------------------------------------------------------

        PatrolButton.create();

        // -------------------------------------------------------------
        // Ouverture / fermeture de la carte
        // -------------------------------------------------------------

        window.addEventListener(

            'patrol:card:open',

            () => {

                if (
                    PatrolCard.isOpen()
                ) {

                    PatrolCard.instance
                        ?.bringToFront?.();

                    return;

                }

                PatrolCard.create();

            }

        );

        // -------------------------------------------------------------
        // Synchronisation de l'interface
        // -------------------------------------------------------------

        window.addEventListener(

            'patrol:updated',

            () => {

                PatrolButton.refresh();

                if (
                    PatrolCard.isOpen()
                ) {

                    PatrolCard.refresh();

                }

            }

        );

        /* ===========================================================
         * Equipage
         * =========================================================== */
        
        window.addEventListener(
        
            'patrol:crew',
        
            () => {
        
                if (
        
                    PatrolCrewCard.isOpen()
        
                ) {
        
                    PatrolCrewCard.instance
                        ?.bringToFront?.();
        
                    return;
        
                }

                console.log("OUVERTURE CREW");
                PatrolCrewCard.create();
        
            }
        
        );

        // -------------------------------------------------------------
        // Communications
        // -------------------------------------------------------------
        
        window.addEventListener(

        'patrol:communications',
    
        () => {
    
            if (
                PatrolCommunicationsCard.isOpen()
            ) {
    
                PatrolCommunicationsCard.instance
                    ?.bringToFront?.();
    
                return;
    
            }
    
            PatrolCommunicationsCard.create();
    
        }
    
    );
        
        // -------------------------------------------------------------
        // Journal
        // -------------------------------------------------------------
        
        window.addEventListener(
        
            'patrol:journal',
        
            () => {
        
                console.log(
                    '📜 Journal Patrol (à implémenter)'
                );
        
                // PatrolJournalCard.create();
        
            }
        
        );
        
        /* ===========================================================
         * Résumé
         * =========================================================== */
        
        window.addEventListener(
        
            'patrol:summary',
        
            () => {
        
                if (
        
                    PatrolSummaryCard.isOpen()
        
                ) {
        
                    PatrolSummaryCard.instance
                        ?.bringToFront?.();
        
                    return;
        
                }
        
                PatrolSummaryCard.create();
        
            }
        
        );

        // -------------------------------------------------------------
        // Clôture
        // -------------------------------------------------------------
        
        window.addEventListener(
        
            'patrol:closing',
        
            () => {
        
                if (
                    PatrolClosingCard.isOpen()
                ) {
        
                    PatrolClosingCard.instance
                        ?.bringToFront?.();
        
                    return;
        
                }
        
                PatrolClosingCard.create();
        
            }
        
        );

        console.log(
            '✅ Module Patrouille chargé'
        );

    }

};

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

        console.log(
            '✅ Module Patrouille chargé'
        );

    }

};

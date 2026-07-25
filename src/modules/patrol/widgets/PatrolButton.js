/**
 * PatrolButton.js
 *
 * Bouton flottant de gestion de la patrouille.
 */

import PatrolService from '../services/PatrolService.js';

export default class PatrolButton {

    static element = null;

    /**
     * Création du bouton.
     */
    static create() {

        if (this.element) {
            return;
        }

        this.element = document.createElement(
            'button'
        );

        this.element.id =
            'patrol-button';

        this.element.className =
            'patrol-button inactive';

        this.element.addEventListener(
            'click',
            () => this.onClick()
        );

        this.element.addEventListener(
            'dblclick',
            event => {

                event.preventDefault();

                this.onFinish();

            }
        );

        document.body.appendChild(
            this.element
        );

        this.refresh();

    }

    /**
     * Rafraîchit l'affichage.
     */
    static refresh() {

        if (!this.element) {
            return;
        }

        const patrol =
            PatrolService.getCurrent();

        if (!patrol) {

            this.element.innerHTML =
                '🔄 Patrouille';

            this.element.className =
                'patrol-button inactive';

            return;

        }

        switch (patrol.status) {

            case 'UNDERWAY':

                this.element.innerHTML =
                    'Patrouille';

                this.element.className =
                    'patrol-button underway';

                break;

            case 'IN_PORT':

                this.element.innerHTML =
                    'Patrouille';

                this.element.className =
                    'patrol-button in-port';

                break;

            default:

                this.element.innerHTML =
                    'Patrouille';

                this.element.className =
                    'patrol-button inactive';

        }

    }

    /**
     * Gestion du clic.
     */
    static onClick() {

        const patrol =
            PatrolService.getCurrent();

        if (!patrol) {

            PatrolService.init();

            PatrolService.setStatus(
                'UNDERWAY'
            );

            return;

        }

        switch (patrol.status) {

            case 'INACTIVE':

                PatrolService.setStatus(
                    'UNDERWAY'
                );

                break;

            case 'UNDERWAY':

                PatrolService.setStatus(
                    'IN_PORT'
                );

                break;

            case 'IN_PORT':

                PatrolService.setStatus(
                    'UNDERWAY'
                );

                break;

            case 'COMPLETED':

                PatrolService.reset();

                PatrolService.setStatus(
                    'UNDERWAY'
                );

                break;

        }

    }

    /**
     * Demande de fin de patrouille.
     */
    static onFinish() {

        window.dispatchEvent(

            new CustomEvent(

                'patrol:finish'

            )

        );

    }

}

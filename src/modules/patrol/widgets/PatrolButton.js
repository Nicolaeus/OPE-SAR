/**
 * PatrolButton.js
 *
 * Bouton flottant d'accès à la patrouille.
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

        this.element =
            document.createElement(
                'button'
            );

        this.element.id =
            'patrol-button';

        this.element.className =
            'patrol-button inactive';

        this.element.innerHTML =
            '🔄 Patrouille';

        this.element.addEventListener(
            'click',
            () => this.openCard()
        );

        document.body.appendChild(
            this.element
        );

        this.bindEvents();

    }

    /**
     * Ecoute des évènements.
     */
    static bindEvents() {

        window.addEventListener(
            'patrol:updated',
            () => this.refresh()
        );

    }

    /**
     * Ouvre la carte Patrouille.
     */
    static openCard() {

        window.dispatchEvent(

            new CustomEvent(

                'patrol:card:open'

            )

        );

    }

    /**
     * Rafraîchit l'apparence du widget.
     */
    static refresh() {

        if (!this.element) {
            return;
        }
  
        const patrol =
            PatrolService.getCurrent();

        if (!patrol) {

            this.element.className =
                'patrol-button inactive';

            this.element.innerHTML =
                '🔄 Patrouille';

            return;

        }

        switch (patrol.status) {

            case 'UNDERWAY':

                this.element.className =
                    'patrol-button underway';

                this.element.innerHTML =
                    '🟢 Patrouille';

                break;

            case 'IN_PORT':

                this.element.className =
                    'patrol-button in-port';

                this.element.innerHTML =
                    '🟠 Patrouille';

                break;

            case 'COMPLETED':

                this.element.className =
                    'patrol-button completed';

                this.element.innerHTML =
                    '⚫ Patrouille';

                break;

            default:

                this.element.className =
                    'patrol-button inactive';

                this.element.innerHTML =
                    '🔄 Patrouille';

        }

    }

}

import BaseCard from '../../../shared/ui/cards/BaseCard.js';
import CardSection from '../../../shared/ui/cards/CardSection.js';

import GeolocationService
    from '../../../core/services/GeolocationService.js';

export default class GeolocationCard {

    static instance = null;

    static create() {

        if (this.instance) {

            this.instance.element.remove();

            this.instance = null;

        }

        const card = new BaseCard({

            id: 'geolocation-card',

            title: 'Géolocalisation',

            color: 'blue',

            icon: '🛰️'

        });

        // ==========================================
        // Position
        // ==========================================

        const section =
            new CardSection(
                'Position'
            );

        section.element.innerHTML += `

            <table class="opsar-table">

                <tbody>

                    <tr>
                        <th>Latitude</th>
                        <td id="geo-latitude">--</td>
                    </tr>

                    <tr>
                        <th>Longitude</th>
                        <td id="geo-longitude">--</td>
                    </tr>

                    <tr>
                        <th>Altitude</th>
                        <td id="geo-altitude">--</td>
                    </tr>

                    <tr>
                        <th>Précision</th>
                        <td id="geo-accuracy">--</td>
                    </tr>

                    <tr>
                        <th>Cap</th>
                        <td id="geo-heading">--</td>
                    </tr>

                    <tr>
                        <th>Vitesse</th>
                        <td id="geo-speed">--</td>
                    </tr>

                    <tr>
                        <th>Provider</th>
                        <td id="geo-provider">--</td>
                    </tr>

                    <tr>
                        <th>Source</th>
                        <td id="geo-source">--</td>
                    </tr>

                    <tr>
                        <th>Statut</th>
                        <td id="geo-status">Recherche…</td>
                    </tr>

                </tbody>

            </table>

        `;

        card.add(
            section.element
        );

        this.instance =
            card;

        // ==========================================
        // Fermeture
        // ==========================================

        card.element.addEventListener(

            'card:close',

            () => {

                GeolocationCard.close();

            }

        );

        // ==========================================
        // Mise à jour
        // ==========================================

        const current =
            GeolocationService.getCurrent();

        if (current) {

            this.update(
                current
            );

        }

        window.addEventListener(

            'geolocation:updated',

            event => {

                this.update(
                    event.detail
                );

            }

        );

        window.addEventListener(

            'geolocation:error',

            () => {

                const status =
                    document.getElementById(
                        'geo-status'
                    );

                if (status) {

                    status.textContent =
                        'Erreur';

                }

            }

        );

        return card;

    }

    // ==========================================
    // Mise à jour des données
    // ==========================================

    static update(position) {

        if (!position) {

            return;

        }

        document.getElementById(
            'geo-latitude'
        ).textContent =
            position.latitude?.toFixed(6) ?? '--';

        document.getElementById(
            'geo-longitude'
        ).textContent =
            position.longitude?.toFixed(6) ?? '--';

        document.getElementById(
            'geo-altitude'
        ).textContent =
            position.altitude != null
                ? `${position.altitude.toFixed(1)} m`
                : '--';

        document.getElementById(
            'geo-accuracy'
        ).textContent =
            position.accuracy != null
                ? `± ${position.accuracy.toFixed(1)} m`
                : '--';

        document.getElementById(
            'geo-heading'
        ).textContent =
            position.heading != null
                ? `${Math.round(position.heading)}°`
                : '--';

        document.getElementById(
            'geo-speed'
        ).textContent =
            position.speed != null
                ? `${position.speed.toFixed(1)} m/s`
                : '--';

        document.getElementById(
            'geo-provider'
        ).textContent =
            position.provider ?? '--';

        document.getElementById(
            'geo-source'
        ).textContent =
            position.source ?? '--';

        document.getElementById(
            'geo-status'
        ).textContent =
            position.status ?? '--';

    }

    // ==========================================
    // Gestion ouverture / fermeture
    // ==========================================

    static close() {

        if (!this.instance) {

            return;

        }

        this.instance.element.remove();

        this.instance = null;

    }

    static isOpen() {

        return this.instance !== null;

    }

}

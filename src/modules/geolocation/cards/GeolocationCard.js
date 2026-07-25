import BaseCard from '../../../shared/ui/cards/BaseCard.js';
import CardSection from '../../../shared/ui/cards/CardSection.js';
import BaseCardController from '../../../shared/ui/cards/BaseCardController.js';

import GeolocationService
    from '../../../core/services/GeolocationService.js';

export default class GeolocationCard
    extends BaseCardController {

    static _onUpdate = null;

    static _onError = null;

    static create() {

        this.close();

        const card =
            new BaseCard({

                id: 'geolocation-card',

                title: 'Géolocalisation',

                color: 'blue',

                icon: '🛰️'

            });

        const section =
            new CardSection(
                'Position'
            );

        const content =
            document.createElement(
                'div'
            );

        content.innerHTML = `

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

        section.add(
            content
        );

        card.add(
            section.element
        );

        card.render(
            document.getElementById(
                'app'
            )
        );

        this.instance =
            card;

        card.element.addEventListener(

            'card:close',

            () => {

                GeolocationCard.close();

            }

        );

        this.bindEvents();

        const current =
            GeolocationService.getCurrent();

        if (current) {

            this.update(
                current
            );

        }

        return card;

    }

    static bindEvents() {

        this._onUpdate =
            event => {

                this.update(
                    event.detail
                );

            };

        this._onError =
            () => {

                if (!this.instance) {
                    return;
                }

                const status =
                    this.instance.element.querySelector(
                        '#geo-status'
                    );

                if (status) {

                    status.textContent =
                        'Erreur';

                }

            };

        window.addEventListener(

            'geolocation:updated',

            this._onUpdate

        );

        window.addEventListener(

            'geolocation:error',

            this._onError

        );

    }

    static update(position) {

        if (
            !this.instance ||
            !position
        ) {

            return;

        }

        const root =
            this.instance.element;

        root.querySelector(
            '#geo-latitude'
        ).textContent =
            position.latitude?.toFixed(6) ?? '--';

        root.querySelector(
            '#geo-longitude'
        ).textContent =
            position.longitude?.toFixed(6) ?? '--';

        root.querySelector(
            '#geo-altitude'
        ).textContent =
            position.altitude != null
                ? `${position.altitude.toFixed(1)} m`
                : '--';

        root.querySelector(
            '#geo-accuracy'
        ).textContent =
            position.accuracy != null
                ? `± ${position.accuracy.toFixed(1)} m`
                : '--';

        root.querySelector(
            '#geo-heading'
        ).textContent =
            position.heading != null
                ? `${Math.round(position.heading)}°`
                : '--';

        root.querySelector(
            '#geo-speed'
        ).textContent =
            position.speed != null
                ? `${position.speed.toFixed(1)} m/s`
                : '--';

        root.querySelector(
            '#geo-provider'
        ).textContent =
            position.provider ?? '--';

        root.querySelector(
            '#geo-source'
        ).textContent =
            position.source ?? '--';

        root.querySelector(
            '#geo-status'
        ).textContent =
            position.status ?? '--';

    }

    static close() {

        if (this._onUpdate) {

            window.removeEventListener(

                'geolocation:updated',

                this._onUpdate

            );

            this._onUpdate = null;

        }

        if (this._onError) {

            window.removeEventListener(

                'geolocation:error',

                this._onError

            );

            this._onError = null;

        }

        super.close();

    }

}

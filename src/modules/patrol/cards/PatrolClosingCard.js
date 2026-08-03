import BaseCard from '../../../shared/ui/cards/BaseCard.js';
import BaseCardController from '../../../shared/ui/cards/BaseCardController.js';
import CardSection from '../../../shared/ui/cards/CardSection.js';

import PatrolService from '../services/PatrolService.js';

export default class PatrolClosingCard extends BaseCardController {

    static create() {

        this.close();

        const card =
            new BaseCard({

                id: 'patrol-closing-card',

                title: 'FIN DE PATROUILLE',

                icon: '■',

                color: 'orange'

            });

        card.add(
            this.buildSummarySection().element
        );

        card.add(
            this.buildInformationSection().element
        );

        card.add(
            this.buildEngineSection().element
        );

        card.add(
            this.buildFuelSection().element
        );

        card.add(
            this.buildObservationSection().element
        );

        card.add(
            this.buildActionsSection().element
        );

        card.render(

            document.getElementById(
                'app'
            )

        );

        this.instance = card;

        card.element.addEventListener(

            'card:close',

            () => PatrolClosingCard.close()

        );

        this.bindEvents();

        return card;

    }

    /* ======================================================
     * Résumé de mission
     * ====================================================== */

    static buildSummarySection() {

        const section =
            new CardSection(
                'Mission'
            );

        const patrol =
            PatrolService.getCurrent();

        if (!patrol) {

            return section;

        };

        const content =
            document.createElement(
                'div'
            );

        content.className =
            'opsar-summary-grid';

        content.innerHTML = `

            <div><strong>Départ</strong></div>

            <div>

                ${patrol.startedAt

                    ? new Date(

                        patrol.startedAt

                    ).toLocaleString(

                        'fr-FR'

                    )

                    : '-'}

            </div>

            <div><strong>Retour</strong></div>

            <div>

                ${new Date().toLocaleTimeString(

                    [],

                    {

                        hour: '2-digit',

                        minute: '2-digit'

                    }

                )}

            </div>

            <div><strong>Durée</strong></div>

            <div>

                ${this.formatDuration(

                    patrol.duration

                )}

            </div>

            <div><strong>Distance</strong></div>

            <div>

                ${this.formatDistance(

                    patrol.track

                )}

            </div>

            <div><strong>Trace GPS</strong></div>

            <div>

                ${patrol.track.length} point(s)

            </div>

            <div><strong>Évènements</strong></div>

            <div>

                ${patrol.systemEvents.length}

            </div>

        `;

        section.add(
            content
        );

        return section;

    }

    /* ======================================================
     * Confirmation
     * ====================================================== */

    static buildInformationSection() {

        const section =
            new CardSection(
                'Confirmation'
            );

        const content =
            document.createElement(
                'div'
            );

        content.innerHTML = `

            <p>

                Vous êtes sur le point de
                clôturer cette patrouille.

            </p>

            <p>

                Les informations saisies
                ci-dessous seront enregistrées
                dans le rapport final.

            </p>

        `;

        section.add(
            content
        );

        return section;

    }

    /* ======================================================
     * Moteurs
     * ====================================================== */

    static buildEngineSection() {

        const section =
            new CardSection(
                'Moteurs'
            );

        const patrol =
            PatrolService.getCurrent();

        const content =
            document.createElement(
                'div'
            );

        content.innerHTML = `

            <div class="opsar-form-row">

                <div class="opsar-form-group">

                    <label>

                        Heure moteur départ

                    </label>

                    <input
                        id="patrol-engine-start"
                        class="opsar-input"
                        type="number"
                        min="0"
                        step="0.1"
                        value="${patrol?.engine?.startHours ?? ''}">

                </div>

                <div class="opsar-form-group">

                    <label>

                        Heure moteur arrivée

                    </label>

                    <input
                        id="patrol-engine-end"
                        class="opsar-input"
                        type="number"
                        min="0"
                        step="0.1"
                        value="${patrol?.engine?.endHours ?? ''}">

                </div>

            </div>

        `;

        section.add(
            content
        );

        return section;

    }

    /* ======================================================
     * Carburant
     * ====================================================== */

    static buildFuelSection() {

        const section =
            new CardSection(
                'Carburant'
            );

        const patrol =
            PatrolService.getCurrent();

        const content =
            document.createElement(
                'div'
            );

        content.innerHTML = `

            <div class="opsar-form-row">

                <div class="opsar-form-group">

                    <label>

                        Départ (L)

                    </label>

                    <input
                        id="patrol-fuel-departure"
                        class="opsar-input"
                        type="number"
                        min="0"
                        step="0.1"
                        value="${patrol?.fuel?.departure ?? ''}">

                </div>

                <div class="opsar-form-group">

                    <label>

                        Arrivée (L)

                    </label>

                    <input
                        id="patrol-fuel-arrival"
                        class="opsar-input"
                        type="number"
                        min="0"
                        step="0.1"
                        value="${patrol?.fuel?.arrival ?? ''}">

                </div>

            </div>

            <div class="opsar-form-group">

                <label>

                    <input
                        id="patrol-no-incident"
                        type="checkbox">

                    Aucune anomalie signalée

                </label>

            </div>

        `;

        section.add(
            content
        );

        return section;

    }

    /* ======================================================
     * Observations
     * ====================================================== */

    static buildObservationSection() {

        const section =
            new CardSection(
                'Observations'
            );

        const patrol =
            PatrolService.getCurrent();

        const textarea =
            document.createElement(
                'textarea'
            );

        textarea.id =
            'patrol-observations';

        textarea.className =
            'opsar-input';

        textarea.rows = 6;

        textarea.placeholder =
            'Observations de fin de patrouille...';

        textarea.value =
            patrol?.notes ?? '';

        section.add(
            textarea
        );

        return section;

    }

    /* ======================================================
     * Evènements
     * ====================================================== */

    static bindEvents() {

        document
            .getElementById(
                'patrol-closing-cancel'
            )
            ?.addEventListener(
                'click',
                () => PatrolClosingCard.close()
            );

        document
            .getElementById(
                'patrol-closing-validate'
            )
            ?.addEventListener(
                'click',
                () => this.validate()
            );

    }

    /* ======================================================
     * Validation
     * ====================================================== */

    static validate() {

        const engineStart = parseFloat(

            document.getElementById(

                'patrol-engine-start'

            ).value

        );

        const engineEnd = parseFloat(

            document.getElementById(

                'patrol-engine-end'

            ).value

        );

        const fuelDeparture = parseFloat(

            document.getElementById(

                'patrol-fuel-departure'

            ).value

        );

        const fuelArrival = parseFloat(

            document.getElementById(

                'patrol-fuel-arrival'

            ).value

        );

        const notes =

            document.getElementById(

                'patrol-observations'

            )

            .value

            .trim();

        const noIncident =

            document.getElementById(

                'patrol-no-incident'

            ).checked;

        // ================================================
        // Vérifications
        // ================================================

        if (

            !Number.isNaN(engineStart) &&

            !Number.isNaN(engineEnd) &&

            engineEnd < engineStart

        ) {

            alert(

                "Les heures moteur sont incohérentes."

            );

            return;

        }

        if (

            !Number.isNaN(fuelDeparture) &&

            !Number.isNaN(fuelArrival) &&

            fuelArrival > fuelDeparture

        ) {

            alert(

                "Le carburant d'arrivée est supérieur au carburant de départ."

            );

            return;

        }

        // ================================================
        // Calculs
        // ================================================

        const fuelConsumed =

            (

                !Number.isNaN(fuelDeparture) &&

                !Number.isNaN(fuelArrival)

            )

                ?

                fuelDeparture - fuelArrival

                :

                null;

        // ================================================
        // Clôture
        // ================================================

        PatrolService.complete({

            engine: {

                startHours:

                    Number.isNaN(engineStart)

                        ? null

                        : engineStart,

                endHours:

                    Number.isNaN(engineEnd)

                        ? null

                        : engineEnd

            },

            fuel: {

                departure:

                    Number.isNaN(fuelDeparture)

                        ? null

                        : fuelDeparture,

                arrival:

                    Number.isNaN(fuelArrival)

                        ? null

                        : fuelArrival,

                consumed:

                    fuelConsumed

            },

            notes,

            noIncident

        });

        PatrolClosingCard.close();

        window.dispatchEvent(

            new CustomEvent(

                'patrol:completed',

                {

                    detail: PatrolService.getCurrent()

                }

            )

        );

    }

    /* ======================================================
     * Helpers
     * ====================================================== */

    /**
     * Formate une durée.
     *
     * @param {Number} duration
     *
     * @returns {String}
     */
    static formatDuration(duration) {

        if (!duration) {

            return '-';

        }

        const hours =
            Math.floor(
                duration / 3600000
            );

        const minutes =
            Math.floor(
                (duration % 3600000) / 60000
            );

        return `${hours} h ${minutes} min`;

    }

    /**
     * Formate la distance.
     *
     * Pour l'instant on affiche le nombre
     * de points GPS.
     *
     * Le calcul réel sera réalisé
     * par ReportBuilder.
     *
     * @param {Array} track
     *
     * @returns {String}
     */
    static formatDistance(track = []) {

        if (

            !track ||

            track.length === 0

        ) {

            return '-';

        }

        return `${track.length} point(s) GPS`;

    }

}

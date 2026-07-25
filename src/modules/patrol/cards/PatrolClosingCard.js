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
            document.getElementById('app')
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
            PatrolService.getCurrentPatrol?.() ?? {};

        const content =
            document.createElement('div');

        content.className =
            'opsar-summary-grid';

        content.innerHTML = `

            <div><strong>Départ</strong></div>
            <div>${patrol.startTime ?? '-'}</div>

            <div><strong>Retour</strong></div>
            <div>${new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            })}</div>

            <div><strong>Durée</strong></div>
            <div>${patrol.duration ?? '-'}</div>

            <div><strong>Distance</strong></div>
            <div>${patrol.distance ?? '-'}</div>

            <div><strong>Trace GPS</strong></div>
            <div>${patrol.trackPoints ?? '-'}</div>

            <div><strong>Évènements</strong></div>
            <div>${patrol.events ?? 0}</div>

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
            document.createElement('div');

        content.innerHTML = `

            <p>

                Vous êtes sur le point de
                clôturer cette patrouille.

            </p>

            <p>

                Les informations ci-dessous
                seront intégrées au rapport
                de mission.

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

        const content =
            document.createElement('div');

        content.innerHTML = `

            <div class="opsar-form-row">

                <div class="opsar-form-group">

                    <label>

                        Départ

                    </label>

                    <input
                        id="patrol-engine-start"
                        class="opsar-input"
                        type="number"
                        min="0"
                        step="0.1">

                </div>

                <div class="opsar-form-group">

                    <label>

                        Arrivée

                    </label>

                    <input
                        id="patrol-engine-end"
                        class="opsar-input"
                        type="number"
                        min="0"
                        step="0.1">

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

        const content =
            document.createElement('div');

        content.innerHTML = `

            <div class="opsar-form-group">

                <label>

                    Consommation (L)

                </label>

                <input
                    id="patrol-fuel"
                    class="opsar-input"
                    type="number"
                    min="0"
                    step="0.1">

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
                'Observations (optionnel)'
            );

        const textarea =
            document.createElement('textarea');

        textarea.id =
            'patrol-observations';

        textarea.className =
            'opsar-input';

        textarea.rows = 6;

        textarea.placeholder =
            'Observations de fin de patrouille...';

        section.add(
            textarea
        );

        return section;

    }

    /* ======================================================
     * Validation
     * ====================================================== */

    static buildActionsSection() {

        const section =
            new CardSection(
                'Validation'
            );

        const container =
            document.createElement('div');

        container.innerHTML = `

            <div class="opsar-form-row">

                <button
                    id="patrol-closing-cancel"
                    class="opsar-btn opsar-btn-secondary">

                    Annuler

                </button>

                <button
                    id="patrol-closing-validate"
                    class="opsar-btn opsar-btn-warning">

                    ■ Clôturer

                </button>

            </div>

            <p class="opsar-patrol-info">

                Cette action clôt définitivement
                la patrouille en cours.

            </p>

        `;

        section.add(
            container
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

        const engineStart =
            parseFloat(
                document.getElementById(
                    'patrol-engine-start'
                ).value
            );

        const engineEnd =
            parseFloat(
                document.getElementById(
                    'patrol-engine-end'
                ).value
            );

        const fuel =
            parseFloat(
                document.getElementById(
                    'patrol-fuel'
                ).value
            );

        const observations =
            document.getElementById(
                'patrol-observations'
            )
            .value
            .trim();

        const noIncident =
            document.getElementById(
                'patrol-no-incident'
            )
            .checked;

        if (
            !Number.isNaN(engineStart) &&
            !Number.isNaN(engineEnd) &&
            engineEnd < engineStart
        ) {

            alert(
                "L'heure moteur d'arrivée doit être supérieure ou égale à celle du départ."
            );

            return;

        }

        PatrolService.complete({

            engineStart:
                Number.isNaN(engineStart)
                    ? null
                    : engineStart,

            engineEnd:
                Number.isNaN(engineEnd)
                    ? null
                    : engineEnd,

            fuel:
                Number.isNaN(fuel)
                    ? null
                    : fuel,

            observations,

            noIncident

        });

        PatrolClosingCard.close();

        window.dispatchEvent(

            new CustomEvent(

                'patrol:completed',

                {
                    detail: {

                        engineStart:
                            Number.isNaN(engineStart)
                                ? null
                                : engineStart,

                        engineEnd:
                            Number.isNaN(engineEnd)
                                ? null
                                : engineEnd,

                        fuel:
                            Number.isNaN(fuel)
                                ? null
                                : fuel,

                        observations,

                        noIncident

                    }

                }

            )

        );

    }

}
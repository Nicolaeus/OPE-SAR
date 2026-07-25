import BaseCard from '../../../shared/ui/cards/BaseCard.js';
import BaseCardController from '../../../shared/ui/cards/BaseCardController.js';
import CardSection from '../../../shared/ui/cards/CardSection.js';

import PatrolService from '../services/PatrolService.js';

export default class PatrolSummaryCard extends BaseCardController {

    static create() {

        this.close();

        const card =
            new BaseCard({
                id: 'patrol-summary-card',
                title: 'RÉSUMÉ PATROUILLE',
                icon: '📄',
                color: 'green'
            });

        card.add(
            this.buildSummarySection().element
        );

        card.add(
            this.buildStatisticsSection().element
        );

        card.add(
            this.buildActionsSection().element
        );

        card.render(
            document.getElementById('app')
        );

        this.instance =
            card;

        card.element.addEventListener(
            'card:close',
            () => PatrolSummaryCard.close()
        );

        this.refresh();

        this.bindEvents();

        return card;

    }

    static buildSummarySection() {

        const section =
            new CardSection(
                'Résumé'
            );

        const content =
            document.createElement('div');

        content.innerHTML = `

            <div class="opsar-row">

                <span class="opsar-label">
                    Etat
                </span>

                <span
                    id="summary-status"
                    class="opsar-value">
                    —
                </span>

            </div>

            <div class="opsar-row">

                <span class="opsar-label">
                    Départ
                </span>

                <span
                    id="summary-start"
                    class="opsar-value">
                    —
                </span>

            </div>

            <div class="opsar-row">

                <span class="opsar-label">
                    Arrivée
                </span>

                <span
                    id="summary-end"
                    class="opsar-value">
                    —
                </span>

            </div>

            <div class="opsar-row">

                <span class="opsar-label">
                    Durée
                </span>

                <span
                    id="summary-duration"
                    class="opsar-value">
                    —
                </span>

            </div>

        `;

        section.add(
            content
        );

        return section;

    }

    static buildStatisticsSection() {

        const section =
            new CardSection(
                'Statistiques'
            );

        const content =
            document.createElement('div');

        content.innerHTML = `

            <div class="opsar-row">

                <span class="opsar-label">
                    Points GPS
                </span>

                <span
                    id="summary-track"
                    class="opsar-value">
                    0
                </span>

            </div>

            <div class="opsar-row">

                <span class="opsar-label">
                    Evènements
                </span>

                <span
                    id="summary-events"
                    class="opsar-value">
                    0
                </span>

            </div>

            <div class="opsar-row">

                <span class="opsar-label">
                    Carburant
                </span>

                <span
                    id="summary-fuel"
                    class="opsar-value">
                    —
                </span>

            </div>

            <div class="opsar-row">

                <span class="opsar-label">
                    Temps moteur
                </span>

                <span
                    id="summary-engine"
                    class="opsar-value">
                    —
                </span>

            </div>

        `;

        section.add(
            content
        );

        return section;

    }

    static buildActionsSection() {

        const section =
            new CardSection(
                'Actions'
            );

        const container =
            document.createElement('div');

        container.innerHTML = `

            <button
                id="summary-close"
                class="opsar-btn opsar-btn-secondary">

                Fermer

            </button>

        `;

        section.add(
            container
        );

        return section;

    }

    static bindEvents() {

        document
            .getElementById('summary-close')
            ?.addEventListener(
                'click',
                () => PatrolSummaryCard.close()
            );

    }

    static refresh() {

        const patrol =
            PatrolService.getCurrent();

        if (!patrol) {
            return;
        }

        this.update(
            'summary-status',
            patrol.status ?? '—'
        );

        this.update(
            'summary-start',
            patrol.startedAt
                ? new Date(
                    patrol.startedAt
                ).toLocaleString('fr-FR')
                : '—'
        );

        this.update(
            'summary-end',
            patrol.endedAt
                ? new Date(
                    patrol.endedAt
                ).toLocaleString('fr-FR')
                : '—'
        );

        this.update(
            'summary-duration',
            patrol.duration ?? '—'
        );

        this.update(
            'summary-track',
            patrol.track?.length ?? 0
        );

        this.update(
            'summary-events',
            patrol.events?.length ?? 0
        );

        this.update(
            'summary-fuel',
            patrol.fuel ?? '—'
        );

        if (
            patrol.engineStart != null &&
            patrol.engineEnd != null
        ) {

            this.update(
                'summary-engine',
                `${(patrol.engineEnd - patrol.engineStart).toFixed(1)} h`
            );

        } else {

            this.update(
                'summary-engine',
                '—'
            );

        }

    }

    static update(id, value) {

        const element =
            document.getElementById(id);

        if (!element) {
            return;
        }

        element.textContent =
            value;

    }

}

import BaseCard from '../../../shared/ui/cards/BaseCard.js';
import BaseCardController from '../../../shared/ui/cards/BaseCardController.js';
import CardSection from '../../../shared/ui/cards/CardSection.js';

import PatrolService from '../services/PatrolService.js';

export default class PatrolCard extends BaseCardController {

    static create() {

        this.close();

        const card =
            new BaseCard({
                id: 'patrol-card',
                title: 'PATROUILLE',
                icon: '🔄',
                color: 'blue'
            });

        card.add(
            this.buildStatusSection().element
        );

        card.add(
            this.buildNavigationSection().element
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
            () => PatrolCard.close()
        );

        this.bindEvents();

        this.refresh();

        return card;

    }

    static buildStatusSection() {

        const section =
            new CardSection(
                'Patrouille'
            );

        const content =
            document.createElement('div');

        content.innerHTML = `

            <div class="opsar-row">
                <span class="opsar-label">
                    Etat
                </span>

                <span
                    id="patrol-status"
                    class="opsar-value">
                    —
                </span>
            </div>

            <div class="opsar-row">
                <span class="opsar-label">
                    Départ
                </span>

                <span
                    id="patrol-start"
                    class="opsar-value">
                    —
                </span>
            </div>

            <div class="opsar-row">
                <span class="opsar-label">
                    Durée
                </span>

                <span
                    id="patrol-duration"
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

    static buildNavigationSection() {

        const section =
            new CardSection(
                'Navigation'
            );

        const content =
            document.createElement('div');

        content.innerHTML = `

            <div class="opsar-row">

                <span class="opsar-label">
                    Position
                </span>

                <span
                    id="patrol-position"
                    class="opsar-value">
                    —
                </span>

            </div>

            <div class="opsar-row">

                <span class="opsar-label">
                    Vitesse
                </span>

                <span
                    id="patrol-speed"
                    class="opsar-value">
                    —
                </span>

            </div>

            <div class="opsar-row">

                <span class="opsar-label">
                    Cap
                </span>

                <span
                    id="patrol-heading"
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
                    Trace GPS
                </span>

                <span
                    id="patrol-track-count"
                    class="opsar-value">
                    0 point
                </span>

            </div>

            <div class="opsar-row">

                <span class="opsar-label">
                    Evènements
                </span>

                <span
                    id="patrol-events-count"
                    class="opsar-value">
                    0
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
                id="patrol-crew"
                class="opsar-btn opsar-btn-secondary">

                👥 Equipage

            </button>

            <button
                id="patrol-comms"
                class="opsar-btn opsar-btn-secondary">

                📞 Communications

            </button>

            <button
                id="patrol-journal"
                class="opsar-btn opsar-btn-secondary">

                📜 Journal

            </button>

            <button
                id="patrol-summary"
                class="opsar-btn opsar-btn-secondary">

                📄 Résumé

            </button>

            <button
                id="patrol-finish"
                class="opsar-btn opsar-btn-danger">

                ■ Fin de patrouille

            </button>

        `;

        section.add(
            container
        );

        return section;

    }

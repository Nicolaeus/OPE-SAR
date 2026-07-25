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
            this.buildCommandSection().element
        );

        card.add(
            this.buildSituationSection().element
        );

        card.add(
            this.buildActionsSection().element
        );

        card.add(
            this.buildClosingSection().element
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

            () => PatrolCard.close()

        );

        this.bindEvents();

        this.refresh();

        return card;

    }

    static buildCommandSection() {

        const section =
            new CardSection(
                'Commandes'
            );

        const container =
            document.createElement(
                'div'
            );

        container.innerHTML = `

            <button
                id="patrol-main-action"
                class="opsar-btn opsar-btn-primary"
                style="width:100%;">

                ▶ Débuter la patrouille

            </button>

        `;

        section.add(
            container
        );

        return section;

    }

    static buildSituationSection() {

        const section =
            new CardSection(
                'Situation'
            );

        const content =
            document.createElement(
                'div'
            );

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
                'Outils'
            );

        const container =
            document.createElement(
                'div'
            );

        container.innerHTML = `
         <div class="opsar-patrol-tools">
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
          </div>

        `;

        section.add(
            container
        );

        return section;

    }
    static buildClosingSection() {

        const section =
            new CardSection(
                'Fin de mission'
            );

        const container =
            document.createElement(
                'div'
            );

        container.innerHTML = `

            <button
                id="patrol-finish"
                class="opsar-btn opsar-btn-danger"
                style="width:100%;">

                ■ Fin de patrouille

            </button>

        `;

        section.add(
            container
        );

        return section;

    }

    static bindEvents() {

        window.addEventListener(
            'patrol:updated',
            () => this.refresh()
        );

        document
            .getElementById(
                'patrol-main-action'
            )
            ?.addEventListener(
                'click',
                () => this.executeMainAction()
            );

        document
            .getElementById(
                'patrol-crew'
            )
            ?.addEventListener(
                'click',
                () =>
                    window.dispatchEvent(
                        new CustomEvent(
                            'patrol:crew'
                        )
                    )
            );

        document
            .getElementById(
                'patrol-comms'
            )
            ?.addEventListener(
                'click',
                () =>
                    window.dispatchEvent(
                        new CustomEvent(
                            'patrol:communications'
                        )
                    )
            );

        document
            .getElementById(
                'patrol-journal'
            )
            ?.addEventListener(
                'click',
                () =>
                    window.dispatchEvent(
                        new CustomEvent(
                            'patrol:journal'
                        )
                    )
            );

        document
            .getElementById(
                'patrol-summary'
            )
            ?.addEventListener(
                'click',
                () =>
                    window.dispatchEvent(
                        new CustomEvent(
                            'patrol:summary'
                        )
                    )
            );

        document
            .getElementById(
                'patrol-finish'
            )
            ?.addEventListener(
                'click',
                () =>
                    window.dispatchEvent(
                        new CustomEvent(
                            'patrol:finish'
                        )
                    )
            );

    }

    static executeMainAction() {

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

    static refresh() {

        const patrol =
            PatrolService.getCurrent();

        this.updateMainActionButton(
            patrol
        );

        if (!patrol) {

            this.updateValue(
                'patrol-status',
                'Aucune'
            );

            this.updateValue(
                'patrol-start',
                '—'
            );

            this.updateValue(
                'patrol-duration',
                '—'
            );

            this.updateValue(
                'patrol-position',
                '—'
            );

            this.updateValue(
                'patrol-speed',
                '—'
            );

            this.updateValue(
                'patrol-heading',
                '—'
            );

            this.updateValue(
                'patrol-track-count',
                '0 point'
            );

            this.updateValue(
                'patrol-events-count',
                '0'
            );

            return;

        }

        this.updateValue(
            'patrol-status',
            this.formatStatus(
                patrol.status
            )
        );

        this.updateValue(
            'patrol-start',
            patrol.startedAt
                ? new Date(
                    patrol.startedAt
                ).toLocaleString(
                    'fr-FR'
                )
                : '—'
        );

        this.updateValue(
            'patrol-duration',
            this.formatDuration(
                patrol.startedAt
            )
        );

        this.updateValue(
            'patrol-position',
            this.formatPosition(
                patrol
            )
        );

        this.updateValue(
            'patrol-speed',
            patrol.speed !== undefined
                ? `${patrol.speed.toFixed(1)} nd`
                : '—'
        );

        this.updateValue(
            'patrol-heading',
            this.formatHeading(
                patrol.heading
            )
        );

        this.updateValue(
            'patrol-track-count',
            `${patrol.track?.length ?? 0} point(s)`
        );

        this.updateValue(
            'patrol-events-count',
            patrol.events?.length ?? 0
        );

    }

    static updateMainActionButton(
        patrol
    ) {

        const button =
            document.getElementById(
                'patrol-main-action'
            );

        if (!button) {
            return;
        }

        if (!patrol) {

            button.innerHTML =
                '▶ Débuter la patrouille';

            button.className =
                'opsar-btn opsar-btn-success';

            return;

        }

        switch (patrol.status) {

            case 'UNDERWAY':

                button.innerHTML =
                    '⏸ Escale';

                button.className =
                    'opsar-btn opsar-btn-warning';

                break;

            case 'IN_PORT':

                button.innerHTML =
                    '▶ Reprendre la navigation';

                button.className =
                    'opsar-btn opsar-btn-primary';

                break;

            case 'COMPLETED':

                button.innerHTML =
                    '▶ Nouvelle patrouille';

                button.className =
                    'opsar-btn opsar-btn-success';

                break;

            default:

                button.innerHTML =
                    '▶ Débuter la patrouille';

                button.className =
                    'opsar-btn opsar-btn-success';

        }

    }

    static formatStatus(status) {

        switch (status) {

            case 'UNDERWAY':
                return '🟢 En navigation';

            case 'IN_PORT':
                return '🟠 Escale';

            case 'COMPLETED':
                return '⚫ Terminée';

            default:
                return '⚪ Aucune';

        }

    }

    static formatDuration(startedAt) {

        if (!startedAt) {
            return '—';
        }

        const elapsed =
            Date.now() -
            new Date(
                startedAt
            ).getTime();

        const minutes =
            Math.floor(
                elapsed / 60000
            );

        const hours =
            Math.floor(
                minutes / 60
            );

        return `${hours} h ${minutes % 60} min`;

    }

    static formatPosition(patrol) {

        const position =
            patrol.currentPosition ??
            patrol.position ??
            patrol.lastPosition;

        if (!position) {
            return '—';
        }

        return `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`;

    }

    static formatHeading(heading) {

        if (
            heading === undefined ||
            heading === null
        ) {
            return '—';
        }

        return `${Math.round(heading)}°`;

    }

    static updateValue(id, value) {

        const element =
            document.getElementById(
                id
            );

        if (!element) {
            return;
        }

        element.textContent =
            value;

    }

}

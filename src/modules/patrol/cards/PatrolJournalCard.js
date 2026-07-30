/*
** PatrolJournalCard.js
*/

import BaseCard from '../../../shared/ui/cards/BaseCard.js';
import BaseCardController from '../../../shared/ui/cards/BaseCardController.js';
import CardSection from '../../../shared/ui/cards/CardSection.js';

import PatrolService from '../services/PatrolService.js';

/**
 * Types d'observations.
 */
const OBSERVATION_TYPES = [

    'Observation',
    'Navigation',
    'Sécurité',
    'Météo',
    'Avarie',
    'Autre'

];

/**
 * PatrolJournalCard
 *
 * Journal chronologique de la patrouille.
 *
 * Cette carte affiche le journal opérationnel
 * et permet uniquement d'ajouter des observations
 * libres. Toutes les autres entrées sont créées
 * automatiquement par les différents modules.
 */
export default class PatrolJournalCard extends BaseCardController {

    static create() {

        this.close();

        const card =
            new BaseCard({

                id: 'patrol-journal-card',

                title: 'JOURNAL',

                icon: '📜',

                color: 'blue'

            });

        card.add(
            this.buildObservationSection().element
        );

        card.add(
            this.buildJournalSection().element
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

            () => PatrolJournalCard.close()

        );

        this.bindEvents();

        this.refresh();

        return card;

    }

    static buildObservationSection() {

        const section =
            new CardSection(
                'Nouvelle observation'
            );

        const container =
            document.createElement(
                'div'
            );

        container.innerHTML = `

            <div class="opsar-form-group">

                <label>

                    Type

                </label>

                <select
                    id="journal-type"
                    class="opsar-input">

                    ${OBSERVATION_TYPES.map(

                        type => `

                            <option
                                value="${type}">

                                ${type}

                            </option>

                        `

                    ).join('')}

                </select>

            </div>

            <div class="opsar-form-group">

                <label>

                    Titre

                </label>

                <input
                    id="journal-title"
                    class="opsar-input"
                    type="text"
                    placeholder="Titre">

            </div>

            <div class="opsar-form-group">

                <label>

                    Observation

                </label>

                <textarea
                    id="journal-description"
                    class="opsar-input"
                    rows="5"
                    placeholder="Décrire l'observation..."></textarea>

            </div>

            <button
                id="journal-save"
                class="opsar-btn opsar-btn-primary"
                style="width:100%;">

                💾 Ajouter au journal

            </button>

        `;

        section.add(
            container
        );

        return section;

    }

    static buildJournalSection() {

        const section =
            new CardSection(
                'Journal de patrouille'
            );

        const container =
            document.createElement(
                'div'
            );

        container.id =
            'journal-list';

        section.add(
            container
        );

        return section;

    }

    static bindEvents() {

        document
            .getElementById(
                'journal-save'
            )
            ?.addEventListener(

                'click',

                () => this.saveObservation()

            );

        window.addEventListener(

            'patrol:updated',

            () => this.refresh()

        );

    }

    static saveObservation() {

        const type =
            document.getElementById(
                'journal-type'
            )?.value;

        const title =
            document.getElementById(
                'journal-title'
            )?.value
            ?.trim();

        const description =
            document.getElementById(
                'journal-description'
            )?.value
            ?.trim();

        if (!title) {

            alert(
                'Veuillez saisir un titre.'
            );

            return;

        }

        PatrolService.addJournalEntry({

            category:
                type.toLowerCase(),

            icon:
                '📝',

            title,

            description

        });

        this.clearForm();

        this.refresh();

    }

    static clearForm() {

        const title =
            document.getElementById(
                'journal-title'
            );

        if (
            title
        ) {

            title.value = '';

        }

        const description =
            document.getElementById(
                'journal-description'
            );

        if (
            description
        ) {

            description.value = '';

        }

        const type =
            document.getElementById(
                'journal-type'
            );

        if (
            type
        ) {

            type.selectedIndex = 0;

        }

    }

    static refresh() {

        const container =
            document.getElementById(
                'journal-list'
            );

        if (
            !container
        ) {

            return;

        }

        const journal =
            PatrolService
                .getJournal()
                .slice()
                .sort(

                    (a, b) =>

                        new Date(
                            b.timestamp
                        ) -

                        new Date(
                            a.timestamp
                        )

                );

        if (
            journal.length === 0
        ) {

            container.innerHTML = `

                <p
                    class="opsar-muted">

                    Aucune entrée dans le journal.

                </p>

            `;

            return;

        }

        container.innerHTML =
            journal.map(

                entry => `

                    <div
                        class="opsar-card">

                        <div
                            class="opsar-row">

                            <strong>

                                ${entry.icon ?? '📝'}
                                ${entry.title ?? ''}

                            </strong>

                            <span
                                class="opsar-muted">

                                ${this.formatTimestamp(
                                    entry.timestamp
                                )}

                            </span>

                        </div>

                        ${
                            entry.description

                                ?

                                `

                                    <div
                                        style="margin-top:8px;">

                                        ${entry.description}

                                    </div>

                                `

                                :

                                ''

                        }

                    </div>

                `

            ).join('');

    }

    static formatTimestamp(
        timestamp
    ) {

        return new Date(
            timestamp
        ).toLocaleString(

            'fr-FR',

            {

                day: '2-digit',

                month: '2-digit',

                hour: '2-digit',

                minute: '2-digit'

            }

        );

    }

}


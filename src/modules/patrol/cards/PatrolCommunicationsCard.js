/*
**PatrolCommunicationsCard.js
*/
import BaseCard from '../../../shared/ui/cards/BaseCard.js';
import BaseCardController from '../../../shared/ui/cards/BaseCardController.js';
import CardSection from '../../../shared/ui/cards/CardSection.js';

import PatrolService from '../services/PatrolService.js';

const CHANNELS = [

    'VHF',
    'TPH'

];

const RECIPIENTS = [

    'CROSS',
    'SMUR',
    'SDIS',
    'GENDARMERIE'

];

const TYPES = [

    'Information',
    'Demande',
    'Compte-rendu',
    'Alerte',
    'Ordre'

];

/**
 * PatrolCommunicationsCard
 *
 * Saisie d'une communication opérationnelle.
 *
 * Cette carte permet d'enregistrer une communication
 * (radio ou téléphonique). L'historique est consultable
 * dans PatrolJournalCard.
 */
export default class PatrolCommunicationsCard extends BaseCardController {

    static create() {

        this.close();

        const card =
            new BaseCard({

                id: 'patrol-communications-card',

                title: 'COMMUNICATIONS',

                icon: '📞',

                color: 'blue'

            });

        card.add(
            this.buildCommunicationSection().element
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

            () => PatrolCommunicationsCard.close()

        );

        this.bindEvents();

        this.refresh();

        return card;

    }

    static buildCommunicationSection() {

        const section =
            new CardSection(
                'Nouvelle communication'
            );

        const container =
            document.createElement(
                'div'
            );

        container.innerHTML = `

            <div class="opsar-form-group">

                <label>

                    Canal

                </label>

                <select
                    id="communication-channel"
                    class="opsar-input">

                    ${CHANNELS.map(

                        channel => `

                            <option
                                value="${channel}">

                                ${channel}

                            </option>

                        `

                    ).join('')}

                </select>

            </div>

            <div class="opsar-form-group">

                <label>

                    Destinataire

                </label>

                <select
                    id="communication-recipient"
                    class="opsar-input">

                    ${RECIPIENTS.map(

                        recipient => `

                            <option
                                value="${recipient}">

                                ${recipient}

                            </option>

                        `

                    ).join('')}

                </select>

            </div>

            <div class="opsar-form-group">

                <label>

                    Nature

                </label>

                <select
                    id="communication-type"
                    class="opsar-input">

                    ${TYPES.map(

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

                    Message

                </label>

                <textarea
                    id="communication-message"
                    class="opsar-input"
                    rows="5"
                    placeholder="Saisir le contenu de la communication..."></textarea>

            </div>

            <div class="opsar-form-group">

                <label>

                    <input
                        id="communication-add-journal"
                        type="checkbox"
                        checked>

                    Ajouter au journal

                </label>

            </div>

            <button
                id="communication-save"
                class="opsar-btn opsar-btn-primary"
                style="width:100%;">

                💾 Enregistrer

            </button>

        `;

        section.add(
            container
        );

        return section;

    }

    static bindEvents() {

        document
            .getElementById(
                'communication-save'
            )
            ?.addEventListener(

                'click',

                () => this.saveCommunication()

            );

    }

    static saveCommunication() {

        const channel =
            document.getElementById(
                'communication-channel'
            )?.value;

        const recipient =
            document.getElementById(
                'communication-recipient'
            )?.value;

        const type =
            document.getElementById(
                'communication-type'
            )?.value;

        const message =
            document.getElementById(
                'communication-message'
            )?.value
            ?.trim();

        const addToJournal =
            document.getElementById(
                'communication-add-journal'
            )?.checked;

        if (!message) {

            alert(
                'Veuillez saisir un message.'
            );

            return;

        }

        PatrolService.addCommunication({

            id:
                crypto.randomUUID(),

            timestamp:
                new Date().toISOString(),

            channel,

            recipient,

            type,

            message

        });

        if (
            addToJournal
        ) {

            PatrolService.addJournalEntry({

                id:
                    crypto.randomUUID(),

                timestamp:
                    new Date().toISOString(),

                category:
                    'communication',

                icon:
                    '📞',

                title:
                    `${channel} • ${recipient}`,

                description:
                    message

            });

        }

        this.clearForm();

        this.refresh();

    }

    static clearForm() {

        const message =
            document.getElementById(
                'communication-message'
            );

        if (
            message
        ) {

            message.value = '';

        }

        const channel =
            document.getElementById(
                'communication-channel'
            );

        if (
            channel
        ) {

            channel.selectedIndex = 0;

        }

        const recipient =
            document.getElementById(
                'communication-recipient'
            );

        if (
            recipient
        ) {

            recipient.selectedIndex = 0;

        }

        const type =
            document.getElementById(
                'communication-type'
            );

        if (
            type
        ) {

            type.selectedIndex = 0;

        }

        const journal =
            document.getElementById(
                'communication-add-journal'
            );

        if (
            journal
        ) {

            journal.checked = true;

        }

    }

    static refresh() {

        // V1 :
        // Rien à rafraîchir pour le moment.
        // L'historique sera affiché dans
        // PatrolJournalCard.

    }

}


import BaseCard from '../../../shared/ui/cards/BaseCard.js';
import CardSection from '../../../shared/ui/cards/CardSection.js';
import BaseCardController from '../../../shared/ui/cards/BaseCardController.js';

import TimelineService from '../services/TimelineService.js';

export default class TimelineCard extends BaseCardController {

    static create() {

        this.close();

        const card =
            new BaseCard({

                id:
                    'osc-timeline-card',

                title:
                    'TIMELINE',

                icon:
                    '🕒',

                color:
                    'blue'

            });

        const section =
            new CardSection(
                'Journal opérationnel'
            );

        const content =
            document.createElement(
                'div'
            );

        content.innerHTML = `

            <div
                id="osc-timeline-list">

            </div>

            <button
                id="osc-add-event"
                class="opsar-btn opsar-btn-warning"
                style="width:100%;margin-top:10px;">

                ➕ Ajouter événement

            </button>

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

        this.refresh();

        setTimeout(() => {

            document
                .getElementById(
                    'osc-add-event'
                )
                ?.addEventListener(

                    'click',

                    () => {

                        TimelineService.addEvent(

                            'Événement manuel'

                        );

                        this.refresh();

                    }

                );

        }, 50);

        return card;

    }

    static refresh() {

        const container =
            document.getElementById(
                'osc-timeline-list'
            );

        if (!container) {
            return;
        }

        container.innerHTML = '';

        TimelineService
            .getEvents()
            .forEach(event => {

                const time =
                    new Date(
                        event.timestamp
                    )
                    .toLocaleTimeString(
                        'fr-FR',
                        {
                            hour: '2-digit',
                            minute: '2-digit'
                        }
                    );

                const row =
                    document.createElement(
                        'div'
                    );

                row.className =
                    'osc-timeline-row';

                row.innerHTML = `

                    <div
                        class="osc-timeline-time">

                        ${time}

                    </div>

                    <div
                        class="osc-timeline-message">

                        <b>

                            ${event.author}

                        </b>

                        :

                        ${event.message}

                    </div>

                `;

                container.appendChild(
                    row
                );

            });

    }

}
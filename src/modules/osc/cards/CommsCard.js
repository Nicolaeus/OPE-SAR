import BaseCard from '../../../shared/ui/cards/BaseCard.js';
import CardSection from '../../../shared/ui/cards/CardSection.js';
import BaseCardController from '../../../shared/ui/cards/BaseCardController.js';

import CommsService from '../services/CommsService.js';

export default class CommsCard extends BaseCardController {

    static create() {

        this.close();

        const card =
            new BaseCard({

                id:
                    'osc-comms-card',

                title:
                    'COMMUNICATIONS',

                icon:
                    '📡',

                color:
                    'purple'

            });

        const section =
            new CardSection(
                'Journal radio'
            );

        const content =
            document.createElement(
                'div'
            );

        content.innerHTML = `

            <div
                id="osc-comms-log">

            </div>

            <button
                id="osc-add-log"
                class="opsar-btn opsar-btn-warning"
                style="width:100%;margin-top:10px;">

                Ajouter message

            </button>

        `;

        section.add(content);

        card.add(section.element);

        card.render(
            document.getElementById(
                'app'
            )
        );

        this.instance =
            card;

        this._refresh();

        setTimeout(() => {

            document
                .getElementById(
                    'osc-add-log'
                )
                ?.addEventListener(

                    'click',

                    () => {

                        CommsService.addLog(

                            'OSC',

                            'Message radio'

                        );

                        this._refresh();

                    }

                );

        }, 50);

        return card;

    }

    static _refresh() {

        const logs =
            CommsService.getLogs();

        const container =
            document.getElementById(
                'osc-comms-log'
            );

        if (!container) {
            return;
        }

        container.innerHTML = '';

        logs.forEach(
            log => {

                const div =
                    document.createElement(
                        'div'
                    );

                div.className =
                    'osc-log-row';

                div.innerHTML = `

                    <b>

                        ${log.sender}

                    </b>

                    :

                    ${log.message}

                `;

                container.appendChild(
                    div
                );

            }
        );

    }

}
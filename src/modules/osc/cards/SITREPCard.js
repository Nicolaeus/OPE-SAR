import BaseCard from '../../../shared/ui/cards/BaseCard.js';
import CardSection from '../../../shared/ui/cards/CardSection.js';
import BaseCardController from '../../../shared/ui/cards/BaseCardController.js';

import SITREPService from '../services/SITREPService.js';

export default class SITREPCard extends BaseCardController {

    static create() {

        this.close();

        const report =
            SITREPService.generate();

        if (!report) {
            return;
        }

        const card =
            new BaseCard({

                id:
                    'osc-sitrep-card',

                title:
                    'SITREP',

                icon:
                    '📝',

                color:
                    'green'

            });

        const section =
            new CardSection(
                'Situation Report'
            );

        const content =
            document.createElement(
                'div'
            );

        content.innerHTML = `

            <div class="opsar-row">

                <span>
                    Mission
                </span>

                <span>
                    ${report.mission}
                </span>

            </div>

            <div class="opsar-row">

                <span>
                    Moyens
                </span>

                <span>
                    ${report.assets}
                </span>

            </div>

            <div class="opsar-row">

                <span>
                    Secteurs
                </span>

                <span>
                    ${report.sectors}
                </span>

            </div>

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

        return card;

    }

}
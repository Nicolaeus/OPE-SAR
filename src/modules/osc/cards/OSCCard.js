import BaseCard from '../../../shared/ui/cards/BaseCard.js';
import CardSection from '../../../shared/ui/cards/CardSection.js';
import BaseCardController from '../../../shared/ui/cards/BaseCardController.js';

import OSCService from '../services/OSCService.js';
import OSCLayer from '../layers/OSCLayer.js';
import SearchAreaCard from './SearchAreaCard.js';
import SITREPCard from './SITREPCard.js';
import CommsCard from './CommsCard.js';
import TimelineCard from './TimelineCard.js';

export default class OSCCard extends BaseCardController {

    static create() {

        this.close();

        if (
            !OSCService.getMission()
        ) {

            OSCService.createMission({

                name:
                    'Mission SAR'

            });

        }

        const mission =
            OSCService.getMission();

        const card =
            new BaseCard({

                id:
                    'osc-card',

                title:
                    'OSC',

                icon:
                    '🎯',

                color:
                    'orange'

            });

        const missionSection =
            new CardSection(
                '1- Mission'
            );

        const missionContent =
            document.createElement(
                'div'
            );

        missionContent.innerHTML = `

            <div class="opsar-form-group">

                <label>

                    Nom mission

                </label>

                <input
                    id="osc-mission-name"
                    class="opsar-input"
                    value="${mission.name}">

            </div>

        `;

        missionSection.add(
            missionContent
        );

        const assetsSection =
            new CardSection(
                '2- Moyens engagés'
            );

        const assetsContent =
            document.createElement(
                'div'
            );

        assetsContent.innerHTML = `

            <div
                id="osc-assets-list">

            </div>

            <button
                id="osc-add-asset"
                class="opsar-btn opsar-btn-warning"
                style="width:100%;">

                ➕ Ajouter moyen

            </button>

        `;

        assetsSection.add(
            assetsContent
        );

        card.add(
            missionSection.element
        );

        card.add(
            assetsSection.element
        );
		
		const tools =
			document.createElement(
				'div'
			);

		tools.innerHTML = `

			<button
				id="osc-open-search"
				class="opsar-btn"
				style="width:100%;margin-top:8px;">

				🗺 Zones

			</button>

			<button
				id="osc-open-sitrep"
				class="opsar-btn"
				style="width:100%;margin-top:6px;">

				📝 SITREP

			</button>

			<button
				id="osc-open-comms"
				class="opsar-btn"
				style="width:100%;margin-top:6px;">

				📡 COMMS

			</button>
			
			<button
				id="osc-open-timeline"
				class="opsar-btn"
				style="width:100%;margin-top:6px;">

				🕒 TIMELINE

			</button>

		`;

		card.add(
			tools
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
            () => {

                OSCCard.close();

            }
        );

        this._refreshAssets();

        setTimeout(() => {

            document
                .getElementById(
                    'osc-add-asset'
                )
                ?.addEventListener(

                    'click',

                    () => {

                        OSCService.addAsset({

                            name:
                                `Moyen ${
                                    mission.assets.length + 1
                                }`,

                            type:
                                'snsm_canot'

                        });

                        this._refreshAssets();

                    }

                );
		
			document
				.getElementById(
					'osc-open-search'
				)
				?.addEventListener(

					'click',

					() =>
						SearchAreaCard.create()

				);

			document
				.getElementById(
					'osc-open-sitrep'
				)
				?.addEventListener(

					'click',

					() =>
						SITREPCard.create()

				);

			document
				.getElementById(
					'osc-open-comms'
				)
				?.addEventListener(

					'click',

					() =>
						CommsCard.create()

				);
				
			document
				.getElementById(
					'osc-open-timeline'
				)
				?.addEventListener(

					'click',

					() =>
						TimelineCard.create()

				);

        }, 50);

        return card;

    }

    static _refreshAssets() {

        const mission =
            OSCService.getMission();

        const container =
            document.getElementById(
                'osc-assets-list'
            );

        if (
            !container
        ) {
            return;
        }

        container.innerHTML = '';

        mission.assets.forEach(
            asset => {

                const div =
                    document.createElement(
                        'div'
                    );

                div.className =
                    'osc-asset-row';

                div.innerHTML = `

                    <div>

                        <b>
                            ${asset.name}
                        </b>

                    </div>

                    <div>

                        ${asset.type}

                    </div>

                `;

                container.appendChild(
                    div
                );

            }
        );

        OSCLayer.renderMission(
            mission
        );

    }

}

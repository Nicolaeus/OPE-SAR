import BaseCard from '../../../shared/ui/cards/BaseCard.js';
import CardSection from '../../../shared/ui/cards/CardSection.js';
import BaseCardController from '../../../shared/ui/cards/BaseCardController.js';

import OSCService from '../services/OSCService.js';
import SectorService from '../services/SectorService.js';
import SectorGeometryService from '../services/SectorGeometryService.js';
import OSCLayer from '../layers/OSCLayer.js';

export default class SearchAreaCard extends BaseCardController {

    static create() {

        this.close();

        const mission =
            OSCService.getMission();

        if (!mission) {
            return;
        }

        const card =
            new BaseCard({

                id:
                    'osc-search-card',

                title:
                    'ZONES SAR',

                icon:
                    '🗺',

                color:
                    'blue'

            });

        const section =
            new CardSection(
                'Répartition des secteurs'
            );

        const content =
            document.createElement(
                'div'
            );

        content.innerHTML = `

            <div class="opsar-row">

                <span>
                    Moyens
                </span>

                <span>
                    ${mission.assets.length}
                </span>

            </div>

            <button
                id="osc-generate-sectors"
                class="opsar-btn opsar-btn-warning"
                style="width:100%;">

                Générer secteurs

            </button>

            <div
                id="osc-sectors-list"
                style="margin-top:10px;">

            </div>

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

        setTimeout(() => {

            document
                .getElementById(
                    'osc-generate-sectors'
                )
                ?.addEventListener(

                    'click',

                    () => {

						mission.sectors =
							SectorGeometryService
								.generateGrid(

									mission.datum,

									mission.radius ?? 2,

									mission.assets.length

								);

						mission.sectors.forEach(

							(
								sector,
								index
							) => {

								if (
									mission.assets[index]
								) {

									sector.assetId =
										mission.assets[index]
											.name;

								}

							}

						);

						OSCLayer.renderSectors(
							mission.sectors
						);

						this._refresh();

					}

                );

        }, 50);

        return card;

    }

    static _refresh() {

        const mission =
            OSCService.getMission();

        const container =
            document.getElementById(
                'osc-sectors-list'
            );

        if (!container) {
            return;
        }

        container.innerHTML = '';

        mission.sectors.forEach(
            sector => {

                const div =
                    document.createElement(
                        'div'
                    );

                div.className =
                    'osc-sector-row';

                div.innerHTML = `

						<div>

							<b>

								${sector.name}

							</b>

						</div>

						<div>

							${
								sector.assetId
								?? 'Non affecté'
							}

						</div>

					`;


                container.appendChild(
                    div
                );

            }
        );

    }

}
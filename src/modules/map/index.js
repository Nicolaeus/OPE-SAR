import MapService from './services/MapService.js';
import LayerManager from './services/LayerManager.js';
import MapLayersCard from './cards/MapLayersCard.js';

import MapOverlay from '../../shared/ui/panels/MapOverlay.js';
import MapInfoWidget from './widgets/MapInfoWidget.js';
import MapControls from '../../shared/ui/map-controls/MapControls.js'; 

export default {

    async init() {

        console.log('🗺 Initialisation module MAP');
		console.log('🗺 Initialisation widget Map Infos');
        
		MapService.createMap();

		const map = MapService.getMap();

		const controls = MapControls.create(map);
		
		document
		    .getElementById("app")
		    .appendChild(controls);
		
		MapOverlay.init();
		MapInfoWidget.init();
		

        window.OPESAR = window.OPESAR || {};

        window.OPESAR.Map = {

            setBaseLayer: LayerManager.setBaseLayer,

            toggleCoastal: LayerManager.toggleCoastal,

            getMap: MapService.getMap

        };

        // =========================
        // Fonds de carte
        // =========================

        document
            .querySelectorAll(
                'input[name="baselayer"]'
            )
            .forEach(input => {

                input.addEventListener(
                    'change',
                    event => {

                        LayerManager.setBaseLayer(
                            event.target.value
                        );

                    }
                );

            });

        // =========================
        // Limites côtières
        // =========================

        const coastal =
            document.getElementById(
                'toggleCoastal'
            );

        if (coastal) {

            coastal.addEventListener(
                'change',
                async event => {

                    await LayerManager.toggleCoastal(
                        event.target.checked
                    );

                    const options =
                        document.getElementById(
                            'coastalOptions'
                        );

                    if (options) {

                        options.style.display =
                            event.target.checked
                                ? 'block'
                                : 'none';

                    }

                }
            );

        }

		// =========================
        // MapLayersCard
        // =========================

		window.addEventListener(

			'navigation:change',

			event => {

				if (
					event.detail.module !==
					'map'
				) {

					return;

				}

				if (
					MapLayersCard.isOpen()
				) {

					MapLayersCard.close();

					return;

				}

				const card =
					MapLayersCard.create();

				card.render(
					document.getElementById(
						'app'
					)
				);

			}

		);

		// =========================
        // Recentrage position
        // =========================
		
		window.addEventListener(
		    'map:center-vessel',
		    () => {
		
		        MapService.centerOnSelectedVessel();
		
		    }
		);
		
		window.addEventListener(
		    'map:center-station',
		    () => {
		
		        MapService.centerOnSelectedStation();
		
		    }
		);

        console.log('✅ Carte initialisée');

    }

};

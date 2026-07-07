import MapService from './services/MapService.js';
import LayerManager from './services/LayerManager.js';
import MapLayersCard from './cards/MapLayersCard.js';

export default {

    async init() {

        console.log('🗺 Initialisation module Map');

        MapService.createMap();

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
		


        console.log('✅ Carte initialisée');

    }

};
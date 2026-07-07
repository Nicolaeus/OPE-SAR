import MapService from '../map/services/MapService.js';

import StationManager from './services/StationManager.js';

import StationCard from './cards/StationCard.js';

export default {

    async init() {

        console.log(
            '⚓ Initialisation module Stations'
        );

        const map =
            MapService.getMap();

        if (!map) {

            console.error(
                'Carte non disponible'
            );

            return;

        }

        await StationManager.init(
            map
        );

        let currentStation =
            null;

        window.addEventListener(

            'station:selected',

            event => {

                currentStation =
                    event.detail.station;

            }

        );

        window.addEventListener(

            'navigation:change',

            event => {

                if (
                    event.detail.module !==
                    'stations'
                ) {

                    return;

                }

                if (
                    StationCard.isOpen()
                ) {

                    StationCard.close();

                    return;

                }

                if (
                    !currentStation
                ) {

                    return;

                }

                StationCard.create(
                    currentStation
                );

            }

        );
		
		window.addEventListener(

				'station:open',

				event => {

					StationCard.close();

					StationCard.create(
						event.detail.station
					);

				}

			);
		

        console.log(
            '✅ Module Stations chargé'
        );

    }

};
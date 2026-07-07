import TideService from './services/TideService.js';

import TideCard from './cards/TideCard.js';

export default {

    async init() {

        console.log(
            '🌊 Initialisation module Marées'
        );

        let currentTide = null;

        window.addEventListener(

            'station:selected',

            async event => {

                const station =
                    event.detail.station;

                let portKey =
                    station.name;

                if (
                    station.name ===
                    'Port Manec\'h'
                ) {

                    portKey =
                        'PortManec\'h';

                }

                const surge =
                    window.currentSurgeMeters ||
                    0;

                currentTide =
                    await TideService
                        .getCurrentTide(

                            portKey,

                            surge

                        );

            }

        );

        window.addEventListener(

            'tide:updated',

            event => {

                currentTide =
                    event.detail;

            }

        );

        window.addEventListener(

    'navigation:change',

    event => {

        if (
            event.detail.module !==
            'tides'
        ) {
            return;
        }

        if (
            TideCard.isOpen()
        ) {

            TideCard.close();

            return;

        }

        if (!currentTide) {

            console.warn(
                'Aucune donnée marée'
            );

            return;

        }

        TideCard.create(
            currentTide
        );

    }

);

        console.log(
            '✅ Module Marées chargé'
        );

    }

};
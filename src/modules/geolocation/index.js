import GeolocationCard from './cards/GeolocationCard.js';

export default {

    id: 'geolocation',

    name: 'Géolocalisation',

    icon: '🛰️',

    init() {

        console.log(
            '🛰️ Initialisation module Géolocalisation'
        );

        window.addEventListener(

            'navigation:change',

            event => {

                if (
                    event.detail.module !==
                    'geolocation'
                ) {
                    return;
                }

                if (
                    GeolocationCard.isOpen()
                ) {

                    GeolocationCard.close();

                    return;

                }

                GeolocationCard.create();

            }

        );

        console.log(
            '✅ Module Géolocalisation chargé'
        );

    }

};

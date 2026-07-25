import GeolocationCard
    from './cards/GeolocationCard.js';

export default {

    async init() {

        console.log(
            '🛰️ Initialisation module GEOLOCATION'
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

                const card =
                    GeolocationCard.create();

                card.render(
                    document.getElementById(
                        'app'
                    )
                );

            }

        );

    }

};

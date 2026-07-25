import GeolocationCard from './cards/GeolocationCard.js';

let card = null;

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
                    GeolocationCard.isOpen?.()
                ) {

                    GeolocationCard.close?.();

                    return;

                }

                card = new GeolocationCard();

                card.render(

                    document.getElementById(
                        'app'
                    )

                );

            }

        );

    }

};

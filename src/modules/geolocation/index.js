import GeolocationCard from './cards/GeolocationCard.js';

let card = null;

window.addEventListener(

    'geolocation:open',

    () => {

        if (card) {

            card.bringToFront();
            return;

        }

        card = new GeolocationCard();

        card.render(document.body);

        card.element.addEventListener(

            'card:close',

            () => {

                card.element.remove();

                card = null;

            }

        );

    }

);

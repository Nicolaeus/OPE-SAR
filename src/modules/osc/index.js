import OSCCard from './cards/OSCCard.js';

export default {

    id:
        'osc',

    name:
        'OSC',

    icon:
        '🎯',

    init() {

        console.log(
            '🎯 Initialisation module OSC'
        );

        window.addEventListener(
            'navigation:change',
            event => {

                if (
                    event.detail.module !==
                    'osc'
                ) {
                    return;
                }

                if (
                    OSCCard.isOpen()
                ) {

                    OSCCard.close();

                    return;

                }

                OSCCard.create();

            }
        );

        console.log(
            '✅ Module OSC chargé'
        );

    }

};

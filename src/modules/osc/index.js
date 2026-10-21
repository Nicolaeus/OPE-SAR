import OSCCard from './cards/OSCCard.js';
import OSCService from './services/OSCService.js';

export default {

    id:
        'osc',

    name:
        'OSC',

    icon:
        '🎯',

    async init() {

        console.log(
            '🎯 Initialisation module OSC'
        );

        try {
            await OSCService.initialize();
        } catch (error) {
            console.error('Impossible de restaurer la mission OSC.', error);
        }

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

import SettingsCard from './cards/SettingsCard.js';

export default {

    id: 'settings',

    name: 'Config',

    icon: '⚙',

    init() {

        console.log(
            '⚙ Initialisation module Config'
        );

        window.addEventListener(
            'navigation:change',
            event => {

                if (
                    event.detail.module !==
                    'settings'
                ) {
                    return;
                }

                if (
                    SettingsCard.isOpen()
                ) {

                    SettingsCard.close();

                    return;

                }

                SettingsCard.create();

            }
        );

        console.log(
            '✅ Module Config chargé'
        );

    }

};

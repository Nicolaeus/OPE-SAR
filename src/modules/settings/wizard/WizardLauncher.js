/**
 * ==========================================================
 * OPE-SAR
 * ----------------------------------------------------------
 * WizardLauncher.js
 *
 * Lance automatiquement le Setup Wizard lors du
 * premier démarrage de l'application.
 * ==========================================================
 */

import SettingsService
    from '../../../core/services/SettingsService.js';

import Wizard
    from '../../../shared/ui/wizard/Wizard.js';

import WelcomeStep
    from './steps/WelcomeStep.js';

import StationStep
    from './steps/StationStep.js';

import ThemeStep
    from './steps/ThemeStep.js';

import ModeStep
    from './steps/DefaultModeStep.js';

import SummaryStep
    from './steps/FinishStep.js';

export default class WizardLauncher {

    static async launch() {

        const initialized =
            await SettingsService.isInitialized();

        if (initialized) {
            return;
        }

        const wizard = new Wizard({

            title: 'Configuration initiale',

            steps: [

                new WelcomeStep(),

                new StationStep(),

                new ThemeStep(),

                new DefaultModeStep(),

                new FinishStep()

            ],

            onFinish: async () => {

                await SettingsService.setInitialized(
                    true
                );

                console.log(
                    '✅ Configuration terminée'
                );

            }

        });

        wizard.show();

    }

}

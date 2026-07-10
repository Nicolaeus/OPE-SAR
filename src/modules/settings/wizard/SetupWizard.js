import Wizard from '../../../shared/ui/wizard/Wizard.js';

import WelcomeStep from './WelcomeStep.js';
import StationStep from './StationStep.js';
import ThemeStep from './ThemeStep.js';
import DefaultModeStep from './DefaultModeStep.js';
import FinishStep from './FinishStep.js';

export default class SetupWizard {

    static async show() {

        return new Promise(

            resolve => {

                const wizard =
                    new Wizard({

                        title:
                            'Bienvenue à bord',

                        icon:
                            '⚓',

                        steps: [

                            new WelcomeStep(),

                            new StationStep(),

                            new ThemeStep(),

                            new DefaultModeStep(),

                            new FinishStep()

                        ]

                    });

                const close =
                    wizard.close.bind(
                        wizard
                    );

                wizard.close =
                    () => {

                        close();

                        resolve(
                            wizard.data
                        );

                    };

                wizard.show();

            }

        );

    }

}

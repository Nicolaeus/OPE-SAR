import WizardStep from '../../../shared/ui/wizard/WizardStep.js';

export default class WelcomeStep extends WizardStep {

    constructor() {

        super(
            'Bienvenue'
        );

    }

    render() {

        const container =
            document.createElement(
                'div'
            );

        container.className =
            'opsar-welcome-step';

        container.innerHTML = `

            <div
                class="opsar-welcome">

                <img

                    class="opsar-welcome-logo"

                    src="./assets/images/logos/OPESAR_logo.png"

                    alt="OPE-SAR"

                >

                <h1>

                    OPE-SAR

                </h1>

                <h2>

                    Bienvenue

                </h2>

                <p>

                    Merci d'utiliser OPE-SAR.

                </p>

                <p>

                    Cet assistant va configurer
                    votre application en moins
                    d'une minute.

                </p>

                <div
                    class="opsar-welcome-info">

                    <div>

                        ⚓ Station SNSM

                    </div>

                    <div>

                        🌙 Apparence

                    </div>

                    <div>

                        🚨 Mode par défaut

                    </div>

                </div>

            </div>

        `;

        return container;

    }

    save(data) {

        data.firstLaunch = true;

    }

}

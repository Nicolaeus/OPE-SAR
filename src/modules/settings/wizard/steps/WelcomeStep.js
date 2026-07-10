import WizardStep from '../../../../shared/ui/wizard/WizardStep.js';

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
            'opsar-step';

        container.innerHTML = `

            <img

                class="opsar-step-logo"

                src="./assets/images/logos/OPESAR_logo.png"

                alt="OPE-SAR"

            >

            <h1
                class="opsar-step-title">

                OPE-SAR

            </h1>

            <h2
                class="opsar-step-subtitle">

                Bienvenue à bord

            </h2>

            <div
                class="opsar-step-separator">

            </div>

            <p
                class="opsar-step-description">

                Merci d'utiliser OPE-SAR.

                <br><br>

                Cet assistant va configurer
                votre application afin de
                l'adapter à votre utilisation.

            </p>

            <div
                class="opsar-step-group">

                <div
                    class="opsar-step-card">

                    <div
                        class="opsar-step-card-title">

                        ⚓ Station de référence

                    </div>

                    <div
                        class="opsar-step-card-description">

                        Sélection de votre station
                        opérationnelle.

                    </div>

                </div>

                <div
                    class="opsar-step-card">

                    <div
                        class="opsar-step-card-title">

                        🌙 Apparence

                    </div>

                    <div
                        class="opsar-step-card-description">

                        Choix du thème
                        de l'application.

                    </div>

                </div>

                <div
                    class="opsar-step-card">

                    <div
                        class="opsar-step-card-title">

                        🚨 Mode par défaut

                    </div>

                    <div
                        class="opsar-step-card-description">

                        SAR ou OSC
                        au démarrage.

                    </div>

                </div>

            </div>

            <div
                class="opsar-step-footer">

                Étape 1 sur 5

            </div>

        `;

        return container;

    }

    save(data) {

        data.firstLaunch =
            true;

    }

}

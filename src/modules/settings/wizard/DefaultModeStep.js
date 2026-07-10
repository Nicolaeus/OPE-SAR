import WizardStep from '../../../shared/ui/wizard/WizardStep.js';

export default class DefaultModeStep extends WizardStep {

    constructor() {

        super(
            'Mode principal'
        );

        this.selectedMode =
            'sar';

    }

    render(data = {}) {

        this.selectedMode =
            data.defaultMode ??
            'sar';

        const container =
            document.createElement(
                'div'
            );

        container.className =
            'opsar-step';

        container.innerHTML = `

            <div
                class="opsar-step-icon">

                🚨

            </div>

            <h2
                class="opsar-step-title">

                Mode principal

            </h2>

            <p
                class="opsar-step-description">

                Choisissez le module
                qui sera ouvert
                par défaut.

            </p>

            <div
                class="opsar-step-group">

                <label
                    class="opsar-mode-option">

                    <input
                        type="radio"
                        name="default-mode"
                        value="sar"
                        ${this.selectedMode === 'sar' ? 'checked' : ''}>

                    <span>

                        🚨 Recherche & Sauvetage (SAR)

                    </span>

                </label>

                <label
                    class="opsar-mode-option">

                    <input
                        type="radio"
                        name="default-mode"
                        value="osc"
                        ${this.selectedMode === 'osc' ? 'checked' : ''}>

                    <span>

                        🎯 On Scene Coordinator (OSC)

                    </span>

                </label>

            </div>

            <div
                class="opsar-step-footer">

                Vous pourrez modifier
                ce choix à tout moment
                depuis les paramètres.

            </div>

        `;

        container

            .querySelectorAll(
                'input[name="default-mode"]'
            )

            .forEach(

                radio => {

                    radio.addEventListener(

                        'change',

                        event => {

                            this.selectedMode =
                                event.target.value;

                        }

                    );

                }

            );

        return container;

    }

    save(data) {

        data.defaultMode =
            this.selectedMode;

    }

}

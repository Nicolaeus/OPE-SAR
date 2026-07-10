import WizardStep from '../../../shared/ui/wizard/WizardStep.js';

export default class ThemeStep extends WizardStep {

    constructor() {

        super(
            'Apparence'
        );

        this.selectedTheme =
            'auto';

    }

    render(data = {}) {

        this.selectedTheme =
            data.theme ??
            'auto';

        const container =
            document.createElement(
                'div'
            );

        container.className =
            'opsar-step';

        container.innerHTML = `

            <div
                class="opsar-step-icon">

                🎨

            </div>

            <h2
                class="opsar-step-title">

                Apparence

            </h2>

            <p
                class="opsar-step-description">

                Choisissez le thème
                utilisé par OPE-SAR.

            </p>

            <div
                class="opsar-step-group">

                <label
                    class="opsar-theme-option">

                    <input
                        type="radio"
                        name="theme"
                        value="auto"
                        ${this.selectedTheme === 'auto' ? 'checked' : ''}>

                    <span>

                        📱 Automatique

                    </span>

                </label>

                <label
                    class="opsar-theme-option">

                    <input
                        type="radio"
                        name="theme"
                        value="dark"
                        ${this.selectedTheme === 'dark' ? 'checked' : ''}>

                    <span>

                        🌙 Mode sombre

                    </span>

                </label>

                <label
                    class="opsar-theme-option">

                    <input
                        type="radio"
                        name="theme"
                        value="light"
                        ${this.selectedTheme === 'light' ? 'checked' : ''}>

                    <span>

                        ☀ Mode clair

                    </span>

                </label>

            </div>

            <div
                class="opsar-step-footer">

                Ce choix pourra être
                modifié ultérieurement.

            </div>

        `;

        container

            .querySelectorAll(
                'input[name="theme"]'
            )

            .forEach(

                radio => {

                    radio.addEventListener(

                        'change',

                        event => {

                            this.selectedTheme =
                                event.target.value;

                        }

                    );

                }

            );

        return container;

    }

    save(data) {

        data.theme =
            this.selectedTheme;

    }

}

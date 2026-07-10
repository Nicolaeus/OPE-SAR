import WizardStep from '../../../shared/ui/wizard/WizardStep.js';

export default class FinishStep extends WizardStep {

    constructor() {

        super(
            'Configuration terminée'
        );

    }

    render(data = {}) {

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

                Prêt à naviguer

            </h1>

            <h2
                class="opsar-step-subtitle">

                Configuration terminée

            </h2>

            <div
                class="opsar-step-separator">

            </div>

            <p
                class="opsar-step-description">

                Votre application est
                maintenant configurée.

            </p>

            <div
                class="opsar-step-group">

                <div
                    class="opsar-step-card">

                    <div
                        class="opsar-step-card-title">

                        ⚓ Station

                    </div>

                    <div
                        class="opsar-step-card-description">

                        ${data.referenceStation || 'Non définie'}

                    </div>

                </div>

                <div
                    class="opsar-step-card">

                    <div
                        class="opsar-step-card-title">

                        🌙 Thème

                    </div>

                    <div
                        class="opsar-step-card-description">

                        ${this._themeLabel(
                            data.theme
                        )}

                    </div>

                </div>

                <div
                    class="opsar-step-card">

                    <div
                        class="opsar-step-card-title">

                        🚨 Mode

                    </div>

                    <div
                        class="opsar-step-card-description">

                        ${this._modeLabel(
                            data.defaultMode
                        )}

                    </div>

                </div>

            </div>

            <div
                class="opsar-step-footer">

                Appuyez sur
                <strong>Commencer</strong>
                pour ouvrir OPE-SAR.

            </div>

        `;

        return container;

    }

    save(data) {

        data.initialized =
            true;

    }

    _themeLabel(theme) {

        switch(theme){

            case 'dark':
                return 'Mode sombre';

            case 'light':
                return 'Mode clair';

            default:
                return 'Automatique';

        }

    }

    _modeLabel(mode){

        switch(mode){

            case 'osc':
                return 'OSC';

            default:
                return 'SAR';

        }

    }

}

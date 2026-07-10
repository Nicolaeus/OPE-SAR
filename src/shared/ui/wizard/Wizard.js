export default class Wizard {

    static instance = null;

    constructor(config = {}) {

        this.title =
            config.title ?? '';

        this.steps =
            config.steps ?? [];

        this.currentStep = 0;

        this.element = null;

    }

    show() {

        if (this.element) {

            return;

        }

        this.element =
            document.createElement('div');

        this.element.className =
            'opsar-wizard';

        this.element.innerHTML = `

            <div class="opsar-wizard-window">

                <div class="opsar-wizard-header">

                    <h2>

                        ${this.title}

                    </h2>

                </div>

                <div
                    id="wizard-progress"
                    class="opsar-wizard-progress">

                </div>

                <div
                    id="wizard-content"
                    class="opsar-wizard-content">

                </div>

                <div
                    class="opsar-wizard-footer">

                    <button
                        id="wizard-prev"
                        class="opsar-btn-secondary">

                        ← Précédent

                    </button>

                    <button
                        id="wizard-next"
                        class="opsar-btn-primary">

                        Suivant →

                    </button>

                </div>

            </div>

        `;

        document.body.appendChild(
            this.element
        );

        this._bindEvents();

        this.render();

        Wizard.instance =
            this;

    }

    close() {

        if (!this.element) {

            return;

        }

        this.element.remove();

        this.element = null;

        Wizard.instance = null;

    }

    render() {

        this._renderProgress();

        this._renderStep();

    }

    next() {

        if (
            this.currentStep >=
            this.steps.length - 1
        ) {

            this.close();

            return;

        }

        this.currentStep++;

        this.render();

    }

    previous() {

        if (
            this.currentStep === 0
        ) {

            return;

        }

        this.currentStep--;

        this.render();

    }

    _renderProgress() {

        const progress =
            this.element.querySelector(
                '#wizard-progress'
            );

        progress.innerHTML = '';

        this.steps.forEach(

            (step,index) => {

                const dot =
                    document.createElement(
                        'span'
                    );

                dot.className =
                    index === this.currentStep
                        ? 'active'
                        : '';

                progress.appendChild(
                    dot
                );

            }

        );

    }

    _renderStep() {

        const container =
            this.element.querySelector(
                '#wizard-content'
            );

        container.innerHTML = '';

        const step =
            this.steps[
                this.currentStep
            ];

        if (
            step &&
            typeof step.render ===
            'function'
        ) {

            container.appendChild(

                step.render()

            );

        }

        this.element
            .querySelector(
                '#wizard-prev'
            )
            .disabled =
            this.currentStep === 0;

        this.element
            .querySelector(
                '#wizard-next'
            )
            .textContent =
            this.currentStep ===
            this.steps.length - 1
                ? 'Terminer'
                : 'Suivant →';

    }

    _bindEvents() {

        this.element
            .querySelector(
                '#wizard-prev'
            )
            .addEventListener(

                'click',

                () => {

                    this.previous();

                }

            );

        this.element
            .querySelector(
                '#wizard-next'
            )
            .addEventListener(

                'click',

                () => {

                    this.next();

                }

            );

    }

}

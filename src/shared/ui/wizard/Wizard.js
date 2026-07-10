export default class Wizard {

    static instance = null;

    constructor(config = {}) {

        this.title =
            config.title ?? '';

        this.icon =
            config.icon ?? '⚙';

        this.steps =
            config.steps ?? [];

        this.currentStep = 0;

        this.data = {};

        this.element = null;

    }

    show() {

        if (this.element) {

            return;

        }

        this.element =
            document.createElement('div');

        this.element.className =
            'opsar-wizard hidden';

        this.element.innerHTML = `

            <div
                class="opsar-wizard-backdrop">

                <div
                    class="opsar-wizard-window">

                    <div
                        class="opsar-wizard-header">

                        <div
                            class="opsar-wizard-icon">

                            ${this.icon}

                        </div>

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

                            Retour

                        </button>

                        <button
                            id="wizard-next"
                            class="opsar-btn-primary">

                            Continuer

                        </button>

                    </div>

                </div>

            </div>

        `;

        document.body.appendChild(

            this.element

        );

        requestAnimationFrame(

            () => {

                this.element.classList.remove(

                    'hidden'

                );

            }

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

        this.element.classList.add(

            'closing'

        );

        setTimeout(

            () => {

                this.element.remove();

                this.element = null;

                Wizard.instance = null;

            },

            300

        );

    }

    render() {

        this._renderProgress();

        this._renderStep();

    }

    next() {

        const step =
            this.steps[
                this.currentStep
            ];

        if (

            step &&
            typeof step.save ===
            'function'

        ) {

            step.save(

                this.data

            );

        }

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
                    'wizard-dot';

                if (

                    index ===
                    this.currentStep

                ) {

                    dot.classList.add(
                        'active'
                    );

                }

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

        container.classList.remove(
            'slide'
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

                step.render(
                    this.data
                )

            );

        }

        requestAnimationFrame(

            () => {

                container.classList.add(
                    'slide'
                );

            }

        );

        this.element
            .querySelector(
                '#wizard-prev'
            )
            .disabled =
            this.currentStep === 0;

        const nextButton =
            this.element.querySelector(
                '#wizard-next'
            );

        if (

            this.currentStep ===
            this.steps.length - 1

        ) {

            nextButton.textContent =
                'Commencer';

        }

        else {

            nextButton.textContent =
                'Continuer';

        }

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

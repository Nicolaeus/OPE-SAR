export default class WizardStep {

    constructor(title = '') {

        this.title =
            title;

    }

    render(data = {}) {

        const container =
            document.createElement(
                'div'
            );

        container.innerHTML = `

            <h3>

                ${this.title}

            </h3>

        `;

        return container;

    }

    save(data = {}) {

        // À surcharger
        // dans les classes filles.

    }

    validate() {

        return true;

    }

}

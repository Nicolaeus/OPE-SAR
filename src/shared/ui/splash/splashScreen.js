export default class SplashScreen {

    static #element = null;

    static show() {

        if (this.#element) {
            return;
        }

        const splash =
            document.createElement('div');

        splash.id = 'opsar-splash';

        splash.innerHTML = `

            <div class="opsar-splash-content">

                <div class="opsar-splash-title">

                    OPE-SAR

                </div>

                <div class="opsar-splash-subtitle">

                    Operational Planning & Emergency
                    Search And Rescue

                </div>

                <img
                    class="opsar-splash-logo"
                    src="./assets/images/logos/OPESAR_logo.png"
                    alt="OPE-SAR">

                <div class="opsar-loader">

                    <div class="opsar-loader-bar"></div>

                </div>

                <div class="opsar-splash-version">

                    Version 0.22

                </div>

                <div class="opsar-splash-credit">

                    © 2026 Nicolas XXXXX

                </div>

            </div>

        `;

        document.body.appendChild(
            splash
        );

        this.#element = splash;

    }

    static hide() {

        if (!this.#element) {
            return;
        }

        this.#element.classList.add(
            'hide'
        );

        setTimeout(() => {

            this.#element.remove();

            this.#element = null;

        }, 600);

    }

}

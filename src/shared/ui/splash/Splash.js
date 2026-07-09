export default class SplashScreen {
    
    static #element = null;

    static #startTime = 0;

    static show() {

        this.#startTime = performance.now();

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

     static async hide() {
    
            const elapsed =
                performance.now() -
                this.#startTime;
    
            const remaining =
                Math.max(
                    5000 - elapsed,
                    0
                );
    
            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        remaining
                    )
            );
    
            this.#element.classList.add(
                'hide'
            );
    
            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        600
                    )
            );
    
            this.#element.remove();
    
            this.#element = null;
    
        }

}

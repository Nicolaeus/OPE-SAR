export default class SplashScreen {
    
    static #element = null;

    static #startTime = 0;

    static show() {

        console.log("show() appelé");

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

                    © 2026 Nicolas PIRAULT

                </div>

            </div>

        `;

        console.log("Ajout du splash au DOM");
        document.body.appendChild(
            splash
        );

        const info = document.createElement("div");

        info.style.position = "fixed";
        info.style.left = "10px";
        info.style.bottom = "10px";
        info.style.zIndex = "9999999";
        info.style.background = "rgba(0,0,0,.8)";
        info.style.color = "white";
        info.style.padding = "10px";
        info.style.fontSize = "12px";
        info.style.fontFamily = "monospace";
        
        info.innerHTML = `
        innerHeight : ${window.innerHeight}<br>
        outerHeight : ${window.outerHeight}<br>
        visualHeight : ${window.visualViewport?.height}<br>
        offsetTop : ${window.visualViewport?.offsetTop}<br>
        offsetLeft : ${window.visualViewport?.offsetLeft}<br>
        safeBottom : ${getComputedStyle(document.documentElement).getPropertyValue('padding-bottom')}
        `;
        
        document.body.appendChild(info);
        
        this.#element = splash;

    }

     static async hide() {
    
            const elapsed =
                performance.now() -
                this.#startTime;
    
            const remaining =
                Math.max(
                    4000 - elapsed,
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

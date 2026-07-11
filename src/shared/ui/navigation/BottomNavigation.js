export default class BottomNavigation {

    static create() {

        const nav = document.createElement(
            'nav'
        );

        nav.className =
            'opsar-bottom-nav';

        nav.innerHTML = `

            <button
                class="opsar-nav-btn"
                data-module="weather">

                <span class="opsar-nav-icon">
                    🌦
                </span>

                <span class="opsar-nav-label">
                    Météo
                </span>

            </button>

            <button
                class="opsar-nav-btn"
                data-module="tides">

                <span class="opsar-nav-icon">
                    🌊
                </span>

                <span class="opsar-nav-label">
                    Marées
                </span>

            </button>

            <div class="opsar-sar-wrapper">

                <button
                    class="opsar-nav-btn opsar-nav-btn-sar"
                    data-module="sar">

                    <span class="opsar-nav-icon">

                        🚨

                    </span>

                </button>

            </div>

            <button
                class="opsar-nav-btn"
                data-module="more">

                <span class="opsar-nav-icon">
                    ⋯
                </span>

                <span class="opsar-nav-label">
                    Plus
                </span>

            </button>

        `;

        nav
            .querySelectorAll(
                '.opsar-nav-btn'
            )
            .forEach(button => {

                button.addEventListener(

                    'click',

                    () => this.activate(button)

                );

            });

        window.addEventListener(

            'navigation:state',

            event => {

                this.updateState(
                    event.detail.module,
                    event.detail.open
                );

            }

        );

        return nav;

    }

    static activate(button) {

        const module =
            button.dataset.module;

        if (module === 'more') {

            window.dispatchEvent(

                new CustomEvent(
                    'navigation:more'
                )

            );

            return;

        }

        window.dispatchEvent(

            new CustomEvent(

                'navigation:toggle',

                {

                    detail:{
                        module
                    }

                }

            )

        );

    }

    static updateState(module, open) {

        const button =

            document.querySelector(

                `.opsar-nav-btn[data-module="${module}"]`

            );

        if(!button){

            return;

        }

        button.classList.toggle(
            'active',
            open
        );

    }

}

export default class BottomNavigation {

    static create() {

        const nav =
            document.createElement(
                'nav'
            );

        nav.className =
            'opsar-bottom-nav';

        nav.innerHTML = `

            <button
                class="opsar-nav-btn active"
                data-module="weather">

                <span
                    class="opsar-nav-icon">

                    🌦

                </span>

                <span
                    class="opsar-nav-label">

                    Météo

                </span>

            </button>

            <button
                class="opsar-nav-btn"
                data-module="tides">

                <span
                    class="opsar-nav-icon">

                    🌊

                </span>

                <span
                    class="opsar-nav-label">

                    Marées

                </span>

            </button>

            <button
                class="
                    opsar-nav-btn
                    opsar-nav-btn-sar"
                data-module="sar">

                <span
                    class="opsar-nav-icon">

                    🚨

                </span>

            </button>

            <button
                class="opsar-nav-btn"
                data-module="more">

                <span
                    class="opsar-nav-icon">

                    ⋯

                </span>

                <span
                    class="opsar-nav-label">

                    Plus

                </span>

            </button>

        `;

        nav
            .querySelectorAll(
                '.opsar-nav-btn'
            )
            .forEach(

                button => {

                    button.addEventListener(

                        'click',

                        () => {

                            this.activate(
                                button
                            );

                        }

                    );

                }

            );

        return nav;

    }

    static activate(button) {

        const module =
            button.dataset.module;

        // =====================================
        // Bouton Plus
        // =====================================

        if (

            module === 'more'

        ) {

            window.dispatchEvent(

                new CustomEvent(

                    'navigation:more'

                )

            );

            return;

        }

        // =====================================
        // Activation visuelle
        // =====================================

        document
            .querySelectorAll(
                '.opsar-nav-btn'
            )
            .forEach(

                btn => {

                    if (

                        btn.dataset.module !==
                        'more'

                    ) {

                        btn.classList.remove(
                            'active'
                        );

                    }

                }

            );

        button.classList.add(
            'active'
        );

        // =====================================
        // Notification
        // =====================================

        window.dispatchEvent(

            new CustomEvent(

                'navigation:change',

                {

                    detail: {

                        module

                    }

                }

            )

        );

    }

}
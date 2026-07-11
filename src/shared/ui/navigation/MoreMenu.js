export default class MoreMenu {

    static create() {

        const overlay =
            document.createElement(
                'div'
            );

        overlay.className =
            'opsar-more-overlay';

        overlay.innerHTML = `

            <div class="opsar-more-sheet">

                <div class="opsar-more-handle"></div>

                <h2 class="opsar-more-title">
                    Plus
                </h2>

                <div class="opsar-more-grid">
                
                    <button
                        class="opsar-more-item"
                        data-module="map">
                        <span>🗺️</span>
                        <small>Cartes</small>
                    </button>

                    <button class="opsar-more-item"
                        data-module="stations">
                        <span>📍</span>
                        <small>Stations</small>
                    </button>

                    <button class="opsar-more-item"
                        data-module="osc">
                        <span>🚤</span>
                        <small>OSC</small>
                    </button>

                    <button class="opsar-more-item"
                        data-module="settings">
                        <span>⚙️</span>
                        <small>Paramètres</small>
                    </button>

                </div>

            </div>

        `;

        // ---------------------------------------
        // Ouverture
        // ---------------------------------------

        window.addEventListener(

            'navigation:more',

            () => {

                overlay.classList.add(
                    'open'
                );

            }

        );

        // ---------------------------------------
        // Fermeture en cliquant hors du panneau
        // ---------------------------------------

        overlay.addEventListener(

            'click',

            event => {

                if (
                    event.target === overlay
                ) {

                    overlay.classList.remove(
                        'open'
                    );

                }

            }

        );

        // ---------------------------------------
        // Sélection d'un module
        // ---------------------------------------

        overlay
            .querySelectorAll(
                '.opsar-more-item'
            )
            .forEach(

                button => {

                    button.addEventListener(

                        'click',

                        () => {

                            overlay.classList.remove(
                                'open'
                            );

                            window.dispatchEvent(

                                new CustomEvent(

                                    'navigation:change',

                                    {

                                        detail: {

                                            module:
                                                button.dataset.module

                                        }

                                    }

                                )

                            );

                        }

                    );

                }

            );

        return overlay;

    }

}
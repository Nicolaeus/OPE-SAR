export default {

    init() {

        // Évite les doublons
        if (document.getElementById('map-info-widget')) {
            return;
        }

        const widget = document.createElement('div');

        widget.id = 'map-info-widget';

        widget.innerHTML = `

            <button
                id="map-info-button"
                class="map-info-button">

                🗺️ Infos carte

            </button>

            <div
                id="map-info-panel"
                class="map-info-panel">

                <div class="map-info-header">

                    <span>🗺️ Informations cartographiques</span>

                    <button id="map-info-close">
                        ✕
                    </button>

                </div>

                <div class="map-info-content">

                    <div class="map-info-section">

                        <strong>Carte de base</strong>

                        <div>
                            © OpenStreetMap contributors
                        </div>

                    </div>

                    <div class="map-info-section">

                        <strong>Informations nautiques</strong>

                        <div>
                            © OpenSeaMap contributors
                        </div>

                    </div>

                </div>

            </div>

        `;

        document.body.appendChild(widget);

        const panel =
            document.getElementById(
                'map-info-panel'
            );

        document
            .getElementById(
                'map-info-button'
            )
            .addEventListener(
                'click',
                () => {

                    panel.classList.toggle('open');

                }
            );

        document
            .getElementById(
                'map-info-close'
            )
            .addEventListener(
                'click',
                () => {

                    panel.classList.remove('open');

                }
            );

    }

};

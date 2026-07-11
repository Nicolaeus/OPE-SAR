import MapOverlay from '../../../shared/ui/panels/MapOverlay.js';

export default {

    init() {

        if (document.getElementById('map-info-widget')) {
            return;
        }

        const overlay = MapOverlay.get();

        if (!overlay) {
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

        overlay.appendChild(widget);

        const panel =
            widget.querySelector(
                '#map-info-panel'
            );

        const button =
            widget.querySelector(
                '#map-info-button'
            );

        const closeButton =
            widget.querySelector(
                '#map-info-close'
            );

        button.addEventListener(

            'click',
        
            () => {
        
                panel.classList.toggle(
                    'open'
                );
        
                button.classList.toggle(
        
                    'active',
        
                    panel.classList.contains(
                        'open'
                    )
        
                );
        
            }
        
        );

        closeButton.addEventListener(
        
            'click',
        
            () => {
        
                panel.classList.remove(
                    'open'
                );
        
                button.classList.remove(
                    'active'
                );
        
            }
        
        );

    }

};

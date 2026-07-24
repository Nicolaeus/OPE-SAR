export default class AppHeader {

    static create() {

        const header =
            document.createElement('header');

        header.className =
            'opsar-header';

        header.innerHTML = `

                <div class="opsar-header-top">
            
                    <div class="opsar-header-left">
            
                        <img
                            src="./assets/images/logos/OPESAR_logo_sf.png"
                            class="opsar-logo"
                            alt="OPE-SAR">
            
                        <div class="opsar-title">
                            OPE-SAR
                        </div>
            
                    </div>
            
                    <div
                        id="currentStation"
                        class="opsar-subtitle">
            
                        📍 Aucune station
            
                    </div>
            
                </div>
            
                <div
                    id="weatherWidget"
                    class="opsar-weather-widget">
            
                    <span>☀️18°</span>
                    <span>🌬8 kt</span>
                    <span>🌊0.6 m</span>
                    <span>👁12 km</span>
                    <span>1018 hPa</span>
            
                </div>
        
        `;

        const widget =
            header.querySelector(
                '#weatherWidget'
            );

        widget.addEventListener(
            'click',
            () => {

                window.dispatchEvent(
                    new CustomEvent(
                        'weather:open'
                    )
                );

            }
        );

        return header;

    }

}

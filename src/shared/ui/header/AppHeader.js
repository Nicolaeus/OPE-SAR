export default class AppHeader {

    static create() {

        const header =
            document.createElement('header');

        header.className =
            'opsar-header';

        header.innerHTML = `

            <div class="opsar-header-left">

                <img
                    src="./assets/images/logos/OPESAR_logo_sf.png"
                    class="opsar-logo"
                    alt="OPE-SAR">

                <div class="opsar-title-group">

                    <div class="opsar-title">
                        OPE-SAR
                    </div>

                    <div
                        id="currentStation"
                        class="opsar-subtitle">

                        Aucune station

                    </div>

                </div>

            </div>

            <div
                id="weatherWidget"
                class="opsar-weather-widget">

                <div class="weather-line">
                    🌬 8 kts
                </div>

                <div class="weather-line">
                    🌊 0.6 m
                </div>

                <div class="weather-line">
                    🌡 18°
                </div>

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

export default class AppHeader {

    static create() {

        const header =
            document.createElement('header');

        header.className =
            'opsar-header';

        header.innerHTML = `

            <div class="opsar-header-top">

                <div class="opsar-brand">

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

            <button
                id="weatherWidget"
                class="opsar-weather-widget"
                type="button">

                <span class="weather-item">
                    ☀️
                    <span>18°</span>
                </span>

                <span class="weather-item">
                    🌬
                    <span>8 kt</span>
                </span>

                <span class="weather-item">
                    🌊
                    <span>0.6 m</span>
                </span>

                <span class="weather-item">
                    👁
                    <span>12 km</span>
                </span>

                <span class="weather-item weather-pressure">
                    1018 hPa
                </span>

            </button>

        `;

        header
            .querySelector("#weatherWidget")
            .addEventListener(
                "click",
                () => {

                    window.dispatchEvent(
                        new CustomEvent(
                            "weather:open"
                        )
                    );

                }
            );

        return header;

    }

}

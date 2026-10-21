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
                        <span class="app-title-ope">OPE</span><span class="app-title--">-</span><span class="app-title-sar">SAR</span>
                    </div>

                </div>

                <div class="opsar-station-picker">
                    <button
                        id="currentStation"
                        class="opsar-subtitle opsar-station-selector"
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded="false">
                        <span class="opsar-station-name">📍 Aucune station</span>
                        <span class="opsar-station-chevron" aria-hidden="true">▾</span>
                    </button>
                    <div id="stationSelector" class="opsar-station-menu" role="listbox" aria-label="Stations proches" hidden></div>
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

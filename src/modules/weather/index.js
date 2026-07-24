import WeatherService from './services/WeatherService.js';
import WeatherCard from './cards/WeatherCard.js';

export default {

    async init() {

        console.log(
            '🌦 Initialisation module Météo'
        );

        let currentStation = null;

        // Station sélectionnée
        window.addEventListener(

            'station:selected',

            async event => {

                currentStation =
                    event.detail.station;

                await WeatherService.load(

                    currentStation.lat,

                    currentStation.lng

                );

            }

        );

        // Météo mise à jour
        window.addEventListener(

    'weather:updated',

    event => {

        const weather =
            event.detail;

        const widget =
            document.getElementById(
                'weatherWidget'
            );

        if (!widget) {
            return;
        }

        const cloudIcon =
            WeatherService.getCloudIcon(
                weather.cloudCover || 0
            );
		
		const weatherIcon =
			WeatherService.getWeatherIcon(
				weather.weatherCode
			);

        widget.innerHTML = `

    <div class="weather-line">

        ${weatherIcon}

        <span class="weather-separator">|</span>

        🌡️ ${Math.round(
            weather.airTemperature || 0
        )}°

        <span class="weather-separator">|</span>

        💨 ${Math.round(
            weather.windSpeed || 0
        )} kt

        <span class="weather-separator">|</span>

        🌊 ${(
            weather.waveHeight || 0
        ).toFixed(1)} m

        <span class="weather-separator">|</span>

        👁 ${WeatherService.getVisibilityText(
            weather.visibility
        )}

        <span class="weather-separator">|</span>

        🌡 ${Math.round(
            weather.pressure || 0
        )} hPa

    </div>

`;

    }

);

        // Bouton météo du menu bas
        window.addEventListener(

			'navigation:change',

			event => {

				if (
					event.detail.module !==
					'weather'
				) {
					return;
				}

				if (
					WeatherCard.isOpen()
				) {

					WeatherCard.close();

					return;

				}

				const weather =
					WeatherService.getCurrent();

				if (!weather) {
					return;
				}

				WeatherCard.create(
					weather,
					currentStation
				);

			}

		);		
		
		window.addEventListener(

			'weather:open',

			() => {

				if (
					WeatherCard.isOpen()
				) {

					WeatherCard.close();

					return;

				}

				const weather =
					WeatherService.getCurrent();

				if (!weather) {
					return;
				}

				WeatherCard.create(
					weather,
					currentStation
				);

			}

		);

        console.log(
            '✅ Module Météo chargé'
        );

    }

};

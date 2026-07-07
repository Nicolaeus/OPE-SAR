import BaseCard from '../../../shared/ui/cards/BaseCard.js';
import CardSection from '../../../shared/ui/cards/CardSection.js';
import WeatherService from '../services/WeatherService.js';
import DirectionUtils from '../../../shared/utils/DirectionUtils.js';
import BaseCardController from '../../../shared/ui/cards/BaseCardController.js';

export default class WeatherCard extends BaseCardController{

    static create(weather,station = null) {

        if (!weather) {
            return;
        }

		const weatherIcon =
			WeatherService.getWeatherIcon(
				weather.weatherCode
			);

		const cloudIcon =
			WeatherService.getCloudIcon(
				weather.cloudCover
			);
			
		const windArrow = `
			<span
				class="opsar-direction-arrow"
				style="
					transform:rotate(${(weather.windDirection + 180) % 360}deg);
				">
				↑
			</span>
		`;
		
		const windCardinal =
			DirectionUtils
				.degreesToCardinal(
					weather.windDirection
				);

		const swellArrow = `
			<span
				class="opsar-direction-arrow"
				style="
					transform:rotate(${(weather.waveDirection + 180) % 360}deg);
				">
				↑
			</span>
		`;
		
		const swellCardinal =
			DirectionUtils
				.degreesToCardinal(
					weather.waveDirection
				);

        if (this.instance) {

            this.instance.element.remove();

        }

        const card =
            new BaseCard({

                id: 'weather-card',

                title: 'MÉTÉO',

                color: 'blue',

                icon: '🌦'

            });

        // =================================
        // CONDITIONS GENERALES
        // =================================

        const conditions =
            new CardSection(
                'Conditions générales'
            );

        const conditionsContent =
            document.createElement('div');

        conditionsContent.innerHTML = `
		
			<div class="opsar-row">
                <span class="opsar-label">
                    Situation générale
                </span>
                <span class="opsar-value">
                    ${weatherIcon}
                </span>
            </div>

            <div class="opsar-row">
                <span class="opsar-label">
                    Couverture nuageuse
                </span>
                <span class="opsar-value">
					${cloudIcon}
                    ${weather.cloudCover ?? '--'} %
                </span>
            </div>

	`;

        conditions.add(
            conditionsContent
        );


		// =================================
        // VENT
        // =================================

		const wind =
            new CardSection(
                'Vent'
            );

        const windContent =
            document.createElement('div');

        windContent.innerHTML = `

            <div class="opsar-row">
                <span class="opsar-label">
                    Vent
                </span>
                <span class="opsar-value">
                    ${weather.windSpeed ?? '--'} kts
                </span>
            </div>

            <div class="opsar-row">

				<span class="opsar-label">
					Direction
				</span>

				<span class="opsar-value">
					
					${windCardinal}
					
					${windArrow}

					${weather.windDirection ?? '--'}°

				</span>

			</div>

        `;

        wind.add(
            windContent
        );

        // =================================
        // MER
        // =================================

        const sea =
            new CardSection(
                'Mer'
            );

        const seaContent =
            document.createElement('div');

        seaContent.innerHTML = `

            <div class="opsar-row">
                <span class="opsar-label">
                    Houle
                </span>
                <span class="opsar-value">
                    ${weather.waveHeight ?? '--'} m
                </span>
            </div>

            <div class="opsar-row">

				<span class="opsar-label">
					Direction houle
				</span>

				<span class="opsar-value">
				
					${swellCardinal}
					
					${swellArrow}
					
					${weather.waveDirection ?? '--'}°

				</span>

			</div>

        `;

        sea.add(
            seaContent
        );

        // =================================
        // TEMPÉRATURES
        // =================================

        const temperatures =
            new CardSection(
                'Températures'
            );

        const tempContent =
            document.createElement('div');

        tempContent.innerHTML = `

            <div class="opsar-row">
                <span class="opsar-label">
                    Air
                </span>
                <span class="opsar-value">
                    ${weather.airTemperature ?? '--'} °C
                </span>
            </div>

            <div class="opsar-row">
                <span class="opsar-label">
                    Eau
                </span>
                <span class="opsar-value">
                    ${weather.waterTemperature ?? '--'} °C
                </span>
            </div>

        `;

        temperatures.add(
            tempContent
        );

        // =================================
        // PRESSION
        // =================================

        const pressure =
            new CardSection(
                'Pression'
            );

        const pressureContent =
            document.createElement('div');

        pressureContent.innerHTML = `

            <div class="opsar-row">

                <span class="opsar-label">
                    Pression
                </span>

                <span class="opsar-value">
                    ${weather.pressure ?? '--'} hPa
                </span>

            </div>

            <div class="opsar-row">

                <span class="opsar-label">
                    Surcote
                </span>

                <span class="opsar-value">
                    ${weather.surge?.toFixed(2) ?? '--'} m
                </span>

            </div>

        `;

        pressure.add(
            pressureContent
        );

		// =================================
		// WEBCAM
		// =================================

		const webcam =
			new CardSection(
				'Webcam'
			);

		const webcamContent =
			document.createElement('div');

		const webcamInfo =
			station?.webcams?.[0];

		if (webcamInfo) {

			webcamContent.innerHTML = `

				<iframe

					src="${webcamInfo.url}"

					style="
						width:100%;
						height:280px;
						border:none;
						border-radius:10px;
						background:#111827;
					"

					loading="lazy">

				</iframe>

			`;

		}
		else {

			webcamContent.innerHTML = `

				<div>

					Aucune webcam renseignée

				</div>

			`;

		}

		webcam.add(
			webcamContent
		);

        // =================================
        // ASSEMBLAGE
        // =================================

        card.add(
            conditions.element
        );
		
		card.add(
			wind.element
		);

        card.add(
            sea.element
        );

        card.add(
            temperatures.element
        );

        card.add(
            pressure.element
        );

        card.add(
            webcam.element
        );

        card.render(
            document.getElementById(
                'app'
            )
        );

        this.instance =
            card;

		card.element.addEventListener(

			'card:close',

			() => {

				WeatherCard.close();

			}

		);

        return card;

    }
	
	
}
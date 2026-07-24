import WeatherModel
from '../models/WeatherModel.js';

export default class WeatherService {

    static current = null;

    static async load(lat, lng) {

        const offLat =
            lat - 0.02;

        try {

            const [
                resLand,
                resMarine
            ] = await Promise.all([

                fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,cloud_cover,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,wind_speed_unit=kn&timezone=auto`
                ),

                fetch(
                    `https://marine-api.open-meteo.com/v1/marine?latitude=${offLat}&longitude=${lng}&current=sea_surface_temperature,wave_height,wave_direction&timezone=auto`
                )

            ]);

            const land =
                await resLand.json();

            const marine =
                await resMarine.json();

            const weather =
                new WeatherModel({

                    airTemperature:
                        land.current?.temperature_2m,

                    windSpeed:
                        land.current?.wind_speed_10m,

                    windDirection:
                        land.current?.wind_direction_10m,

                    pressure:
                        land.current?.surface_pressure,

                    cloudCover:
                        land.current?.cloud_cover,
						
					weatherCode:
						land.current?.weather_code,

                    waterTemperature:
                        marine.current?.sea_surface_temperature,

                    waveHeight:
                        marine.current?.wave_height,

                    waveDirection:
                        marine.current?.wave_direction,

                    surge:
                        (
                            1013.25 -
                            (land.current?.surface_pressure || 1013.25)
                        ) / 100,

                    visibility:
                        this.computeVisibility(
                            land.current?.cloud_cover || 0
                        )

                });

            this.current =
                weather;

            window.dispatchEvent(
                new CustomEvent(
                    'weather:updated',
                    {
                        detail: weather
                    }
                )
            );

            return weather;

        }
        catch(error) {

            console.error(
                'Erreur météo',
                error
            );

            return null;

        }

    }

    static computeVisibility(cloudCover) {

        const hour =
            new Date().getHours();

        const isNight =
            hour < 7 ||
            hour > 21;

        if (isNight) {

            return 'night';

        }

        if (cloudCover > 70) {

            return 'cloudy';

        }

        return 'day';

    }

    static getCurrent() {

        return this.current;

    }
	
	static getCloudIcon(cloudCover) {

    if (cloudCover < 15) {

        return '☀️';

    }

    if (cloudCover < 50) {

        return '🌤️';

    }

    if (cloudCover < 85) {

        return '⛅';

    }

    return '☁️';

}

static getWeatherIcon(code) {

    if (code === 0) {

        return '☀️';

    }

    if (
        code === 1 ||
        code === 2
    ) {

        return '🌤️';

    }

    if (code === 3) {

        return '☁️';

    }

	if (
	    code === 45 ||
	    code === 48
	) {
	
	    return '🌫️';
	
	}
	
    if (
        code >= 51 &&
        code <= 67
    ) {

        return '🌧️';

    }

    if (
        code >= 71 &&
        code <= 77
    ) {

        return '❄️';

    }

    if (
        code >= 80 &&
        code <= 82
    ) {

        return '🌦️';

    }

    if (code >= 95) {

        return '⛈️';

    }

    return '🌤️';

}

static getVisibilityText(state) {

    switch (state) {

        case 'day':
            return '12 km';

        case 'cloudy':
            return '8 km';

        case 'night':
            return '5 km';

        default:
            return '--';

    }

}
	
}

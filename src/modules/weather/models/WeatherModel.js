export default class WeatherModel {

    constructor(data = {}) {

        this.airTemperature =
            data.airTemperature || null;

        this.waterTemperature =
            data.waterTemperature || null;

        this.windSpeed =
            data.windSpeed || null;

        this.windDirection =
            data.windDirection || null;

        this.waveHeight =
            data.waveHeight || null;

        this.waveDirection =
            data.waveDirection || null;

        this.pressure =
            data.pressure || null;

        this.cloudCover =
            data.cloudCover || null;

        this.surge =
            data.surge || null;

        this.visibility =
            data.visibility || 'day';

        this.timestamp =
            new Date();

    }

}
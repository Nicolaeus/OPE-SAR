export default class DirectionUtils {

    static directions = [

        'N',
        'NNE',
        'NE',
        'ENE',

        'E',
        'ESE',
        'SE',
        'SSE',

        'S',
        'SSW',
        'SW',
        'WSW',

        'W',
        'WNW',
        'NW',
        'NNW'

    ];

    static degreesToCardinal(degrees) {

        if (
            degrees === null ||
            degrees === undefined
        ) {

            return '--';

        }

        const index =
            Math.round(
                degrees / 22.5
            ) % 16;

        return this.directions[index];

    }

    static cardinalToDegrees(cardinal) {

        if (!cardinal) {

            return null;

        }

        const index =
            this.directions.indexOf(
                cardinal.toUpperCase()
            );

        if (index === -1) {

            return null;

        }

        return index * 22.5;

    }

}
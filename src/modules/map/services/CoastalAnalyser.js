import CoastalLayers from '../layers/CoastalLayers.js';

export default class CoastalAnalyzer {

    static analyze(point) {

        const zones = [

            '300m',
            '2MN',
            '6MN',
            '12MN'

        ];

        for (const zone of zones) {

            const layerGroup =
                CoastalLayers.limitLayers[zone];

            let inside = false;

            layerGroup.eachLayer(layer => {

                if (inside) {
                    return;
                }

                try {

                    if (
                        turf.booleanPointInPolygon(
                            point,
                            layer.feature
                        )
                    ) {

                        inside = true;

                    }

                }
                catch(error) {

                    console.warn(error);

                }

            });

            if (inside) {

                return this.buildResult(zone);

            }

        }

        return {

            zone: '>12MN',

            regulation:
                'Au-delà des limites côtières'

        };

    }

    static buildResult(zone) {

        switch(zone) {

            case '300m':

                return {
                    zone: '300m',
                    regulation: 'Bande littorale',
                    distanceNM: 0.16,
                    distanceKM: 0.30
                };

            case '2MN':

                return {
                    zone: '2MN',
                    regulation: 'Navigation côtière',
                    distanceNM: 2,
                    distanceKM: 3.704
                };

            case '6MN':

                return {
                    zone: '6MN',
                    regulation: 'Semi-hauturier',
                    distanceNM: 6,
                    distanceKM: 11.112
                };

            case '12MN':

                return {
                    zone: '12MN',
                    regulation: 'Hauturier',
                    distanceNM: 12,
                    distanceKM: 22.224
                };

        }

    }

}
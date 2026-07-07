export default class SectorGeometryService {

    static generateGrid(
        center,
        radiusNm,
        sectorCount
    ) {

        if (
            !center ||
            sectorCount < 1
        ) {
            return [];
        }

        const sectors = [];

        const sideNm =
            radiusNm * 2;

        const cols =
            Math.ceil(
                Math.sqrt(
                    sectorCount
                )
            );

        const rows =
            Math.ceil(
                sectorCount / cols
            );

        const latStep =
            sideNm / rows / 60;

        const lngStep =
            sideNm /
            cols /
            (
                60 *
                Math.cos(
                    center.lat *
                    Math.PI /
                    180
                )
            );

        let index = 0;

        for (
            let r = 0;
            r < rows;
            r++
        ) {

            for (
                let c = 0;
                c < cols;
                c++
            ) {

                if (
                    index >= sectorCount
                ) {
                    break;
                }

                const lat =
                    center.lat -
                    (rows * latStep) / 2 +
                    r * latStep;

                const lng =
                    center.lng -
                    (cols * lngStep) / 2 +
                    c * lngStep;

                sectors.push({

                    id:
                        crypto.randomUUID(),

                    name:
                        String.fromCharCode(
                            65 + index
                        ),

                    center: {

                        lat:
                            lat +
                            latStep / 2,

                        lng:
                            lng +
                            lngStep / 2

                    },

                    polygon: [

                        [lat, lng],

                        [
                            lat + latStep,
                            lng
                        ],

                        [
                            lat + latStep,
                            lng + lngStep
                        ],

                        [
                            lat,
                            lng + lngStep
                        ]

                    ],

                    assetId:
                        null

                });

                index++;

            }

        }

        return sectors;

    }

}
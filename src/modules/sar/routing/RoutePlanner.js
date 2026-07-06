export default class RoutePlanner {

    static direct({
        start,
        destination,
        speedKts = 10,
        source = 'station',
        label = 'Route directe'
    }) {

        if (
            !start ||
            !destination
        ) {
            return null;
        }

        const distanceNm =
            this.distanceNm(
                start,
                destination
            );

        const bearingDeg =
            this.bearing(
                start,
                destination
            );

        const durationMin =
            speedKts > 0
                ? Math.round(
                    distanceNm /
                    speedKts *
                    60
                )
                : null;

        return {
            type: 'direct',
            source,
            label,
            start,
            destination,
            points: [
                start,
                destination
            ],
            distanceNm,
            bearingDeg,
            speedKts,
            durationMin
        };

    }

    static bearing(from, to) {

        const rad =
            value =>
                value *
                Math.PI /
                180;

        const dLng =
            rad(
                to.lng -
                from.lng
            );

        const y =
            Math.sin(dLng) *
            Math.cos(
                rad(to.lat)
            );

        const x =
            Math.cos(rad(from.lat)) *
            Math.sin(rad(to.lat)) -
            Math.sin(rad(from.lat)) *
            Math.cos(rad(to.lat)) *
            Math.cos(dLng);

        return (
            (
                Math.atan2(y, x) *
                180 /
                Math.PI
            ) +
            360
        ) % 360;

    }

    static distanceNm(from, to) {

        const earthRadiusMeters =
            6371e3;

        const rad =
            value =>
                value *
                Math.PI /
                180;

        const dLat =
            rad(
                to.lat -
                from.lat
            );

        const dLng =
            rad(
                to.lng -
                from.lng
            );

        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(rad(from.lat)) *
            Math.cos(rad(to.lat)) *
            Math.sin(dLng / 2) ** 2;

        return (
            2 *
            earthRadiusMeters *
            Math.atan2(
                Math.sqrt(a),
                Math.sqrt(1 - a)
            )
        ) / 1852;

    }

}

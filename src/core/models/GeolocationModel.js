export default class GeolocationModel {

    constructor(data = {}) {

        // --------------------------------------------------
        // Position
        // --------------------------------------------------

        this.latitude =
            data.latitude ?? null;

        this.longitude =
            data.longitude ?? null;

        this.altitude =
            data.altitude ?? null;

        // --------------------------------------------------
        // Accuracy
        // --------------------------------------------------

        this.accuracy =
            data.accuracy ?? null;

        this.altitudeAccuracy =
            data.altitudeAccuracy ?? null;

        this.hdop =
            data.hdop ?? null;

        this.vdop =
            data.vdop ?? null;

        this.pdop =
            data.pdop ?? null;

        // --------------------------------------------------
        // Navigation
        // --------------------------------------------------

        this.heading =
            data.heading ?? null;

        this.course =
            data.course ?? data.heading ?? null;

        this.speed =
            data.speed ?? null;

        this.sog =
            data.sog ?? data.speed ?? null;

        this.cog =
            data.cog ?? data.heading ?? null;

        // --------------------------------------------------
        // GNSS
        // --------------------------------------------------

        this.provider =
            data.provider ?? 'browser';

        this.source =
            data.source ?? 'unknown';

        this.fixQuality =
            data.fixQuality ?? null;

        this.satellites =
            data.satellites ?? null;

        this.status =
            data.status ?? 'searching';

        // --------------------------------------------------
        // Time
        // --------------------------------------------------

        this.timestamp =
            data.timestamp ?? Date.now();

    }

    hasFix() {

        return (

            this.latitude !== null &&
            this.longitude !== null

        );

    }

    hasHeading() {

        return this.heading !== null;

    }

    hasAltitude() {

        return this.altitude !== null;

    }

    hasSpeed() {

        return this.speed !== null;

    }

    toLatLng() {

        return [

            this.latitude,
            this.longitude

        ];

    }

    toJSON() {

        return {

            latitude:
                this.latitude,

            longitude:
                this.longitude,

            altitude:
                this.altitude,

            accuracy:
                this.accuracy,

            altitudeAccuracy:
                this.altitudeAccuracy,

            hdop:
                this.hdop,

            vdop:
                this.vdop,

            pdop:
                this.pdop,

            heading:
                this.heading,

            course:
                this.course,

            speed:
                this.speed,

            sog:
                this.sog,

            cog:
                this.cog,

            provider:
                this.provider,

            source:
                this.source,

            fixQuality:
                this.fixQuality,

            satellites:
                this.satellites,

            status:
                this.status,

            timestamp:
                this.timestamp

        };

    }

}

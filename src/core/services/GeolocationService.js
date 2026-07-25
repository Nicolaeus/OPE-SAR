import GeolocationModel from '../models/GeolocationModel.js';

export default class GeolocationService {

    static watchId = null;

    static current = null;

    static running = false;

    static start() {

        if (this.running) {
            return;
        }

        if (!navigator.geolocation) {

            window.dispatchEvent(

                new CustomEvent(

                    'geolocation:error',

                    {
                        detail: {
                            message: 'Geolocation API not available.'
                        }
                    }

                )

            );

            return;

        }

        this.watchId =

            navigator.geolocation.watchPosition(

                position => {

                    this.current =

                        new GeolocationModel({

                            latitude:
                                position.coords.latitude,

                            longitude:
                                position.coords.longitude,

                            altitude:
                                position.coords.altitude,

                            accuracy:
                                position.coords.accuracy,

                            altitudeAccuracy:
                                position.coords.altitudeAccuracy,

                            heading:
                                position.coords.heading,

                            speed:
                                position.coords.speed,

                            timestamp:
                                position.timestamp,

                            provider:
                                'browser',

                            source:
                                'multi-gnss',

                            status:
                                'fixed'

                        });

                    window.dispatchEvent(

                        new CustomEvent(

                            'geolocation:updated',

                            {
                                detail:
                                    this.current
                            }

                        )

                    );

                },

                error => {

                    window.dispatchEvent(

                        new CustomEvent(

                            'geolocation:error',

                            {
                                detail: error
                            }

                        )

                    );

                },

                {

                    enableHighAccuracy: true,

                    timeout: 10000,

                    maximumAge: 1000

                }

            );

        this.running = true;

    }

    static stop() {

        if (this.watchId !== null) {

            navigator.geolocation.clearWatch(

                this.watchId

            );

            this.watchId = null;

        }

        this.running = false;

    }

    static getCurrent() {

        return this.current;

    }

    static hasFix() {

        return (

            this.current !== null &&
            this.current.hasFix()

        );

    }

    static isAvailable() {

        return !!navigator.geolocation;

    }

}

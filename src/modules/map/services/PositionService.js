/**
 * PositionService
 *
 * Service responsable de fournir les positions géographiques
 * utilisées par l'application.
 */
export default class PositionService {

    /**
     * Retourne la position GPS actuelle de l'appareil.
     *
     * @returns {Promise<{latitude:number, longitude:number}|null>}
     */
    static async getCurrentPosition() {

        if (!navigator.geolocation) {
            return null;
        }

        return new Promise(resolve => {

            navigator.geolocation.getCurrentPosition(

                position => {

                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });

                },

                () => {

                    resolve(null);

                },

                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }

            );

        });

    }

    /**
     * Retourne la position d'une station.
     *
     * @param {Object} station
     * @returns {{latitude:number, longitude:number}|null}
     */
    static getStationPosition(station) {

        if (!station) {
            return null;
        }

        return {

            latitude: station.latitude,
            longitude: station.longitude

        };

    }

}

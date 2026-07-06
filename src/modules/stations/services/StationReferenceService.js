export default class StationReferenceService {

    static STORAGE_KEY =
        'opesar_home_station';

    static save(stationId) {

        localStorage.setItem(
            this.STORAGE_KEY,
            stationId
        );

    }

    static get() {

        return localStorage.getItem(
            this.STORAGE_KEY
        );

    }

    static clear() {

        localStorage.removeItem(
            this.STORAGE_KEY
        );

    }

}
import Station from '../models/Station.js';

export default class StationService {

    static stations = [];

    static async load() {

        const response =
            await fetch(
                './data/stations/stations.json'
            );

        if (!response.ok) {

            throw new Error(
                'Impossible de charger stations.json'
            );

        }

        const json =
            await response.json();

        this.stations =
            json.map(
                station =>
                    new Station(
                        station
                    )
            );

        return this.stations;

    }

    static getAll() {

        return this.stations;

    }

    static getById(id) {

        return this.stations.find(
            station =>
                station.id === id
        );

    }

}
export default class Station {

    constructor(data = {}) {

        this.id =
            data.id || '';

        this.stationNumber =
            data.stationNumber || '';

        this.name =
            data.name || '';

        this.lat =
            data.lat || 0;

        this.lng =
            data.lng || 0;

        this.department =
            data.department || null;

        this.region =
            data.region || null;

        this.address =
            data.address || null;

        this.postcode =
            data.postcode || null;

        this.city =
            data.city || null;

        this.phone =
            data.phone || null;

        this.email =
            data.email || null;

        this.website =
            data.website || null;

        this.partoo =
            data.partoo || null;

        this.cross =
            data.cross || null;

        this.operational =
            data.operational || {

                cross: null,

                srr: null,

                zone: null,

                homePort: null

            };

        this.assets =
            data.assets || {

                boats: [],

                vehicles: [],

                drones: []

            };

        this.crew =
            data.crew || {

                active: null,

                reserve: null

            };

        this.contacts =
            data.contacts || [];

        this.webcams =
            data.webcams || [];

        this.weatherStation =
            data.weatherStation || null;

        this.tideReference =
            data.tideReference || null;

        this.createdAt =
            data.createdAt || null;

        this.updatedAt =
            data.updatedAt || null;

    }

}
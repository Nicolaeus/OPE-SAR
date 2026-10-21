export default class OSCAsset {

    constructor(data = {}) {

        this.id =
            data.id ??
            crypto.randomUUID();

        this.name =
            data.name ??
            '';

        this.type =
            data.type ??
            'snsm_canot';

        this.callsign =
            data.callsign ??
            '';

        this.mmsi =
            data.mmsi ??
            '';

        this.registration =
            data.registration ??
            '';

        this.position =
            data.position ??
            null;

        this.speed =
            data.speed ??
            0;

        this.heading =
            data.heading ??
            0;

        this.status =
            data.status ??
            'available';

        this.assignment =
            data.assignment ??
            null;

        this.notes =
            data.notes ??
            '';

        this.capabilities =
            data.capabilities ??
            '';

        this.enduranceHours =
            data.enduranceHours ??
            null;

        this.arrivedOnSceneAt =
            data.arrivedOnSceneAt ??
            null;

        this.departedSceneAt =
            data.departedSceneAt ??
            null;

        this.releasedAt =
            data.releasedAt ??
            null;

        this.lastPositionAt =
            data.lastPositionAt ??
            null;

        this.positionSource =
            data.positionSource ??
            '';

        this.createdAt =
            new Date();

    }

}

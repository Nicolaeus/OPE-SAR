export default class MissionEvent {

    constructor(data = {}) {

        this.id =
            data.id ??
            crypto.randomUUID();

        this.timestamp =
            data.timestamp ??
            new Date();

        this.type =
            data.type ??
            'info';

        this.author =
            data.author ??
            'OSC';

        this.message =
            data.message ??
            '';

    }

}
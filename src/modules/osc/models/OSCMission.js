export default class OSCMission {

    constructor(data = {}) {

        this.id =
            data.id ??
            crypto.randomUUID();

        this.name =
            data.name ??
            'Mission SAR';

        this.type =
            data.type ??
            'sar';

        this.priority =
            data.priority ??
            'normal';

        this.datum =
            data.datum ??
            null;

        this.radius =
            data.radius ??
            1;

        this.assets =
            data.assets ??
            [];

        this.sectors =
            data.sectors ??
            [];

        this.tasks =
            data.tasks ??
            [];

        this.createdAt =
            new Date();
			
		this.timeline = [];

		this.searchArea = null;

		this.datum = null;

		this.radius = null;

    }

}
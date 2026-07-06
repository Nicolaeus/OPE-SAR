export default class SARModel {

    constructor(data = {}) {

        this.targetType =
            data.targetType;

        this.lkp =
            data.lkp;

        this.datum =
            data.datum;

        this.lkpTime =
            data.lkpTime;

        this.departTime =
            data.departTime;

        this.windSpeed =
            data.windSpeed;

        this.windDirection =
            data.windDirection;

        this.currentSpeed =
            data.currentSpeed;

        this.currentDirection =
            data.currentDirection;

        this.waveDirection =
            data.waveDirection;

        this.driftSpeed =
            data.driftSpeed;

        this.driftDirection =
            data.driftDirection;

        this.driftDistance =
            data.driftDistance;

        this.searchRadius =
            data.searchRadius;

        this.pattern =
            data.pattern;

        this.patternReason =
            data.patternReason;

		this.shipPosition =
			data.shipPosition;

		this.shipSpeed =
			data.shipSpeed;

		this.eta =
			data.eta;

        this.timestamp =
            new Date();
			
    }

}

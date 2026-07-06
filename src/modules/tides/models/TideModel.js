export default class TideModel {

    constructor(data = {}) {

        this.port =
            data.port || null;

        this.currentHeight =
            data.currentHeight || 0;

        this.surge =
            data.surge || 0;

        this.chartData =
            data.chartData || [];

        this.timestamp =
            data.timestamp || new Date();
		
		this.lowTides =
			data.lowTides || [];

		this.highTides =
			data.highTides || [];

		this.coefficient =
			data.coefficient || null;
		
		this.coefficientMorning =
			data.coefficientMorning || '--';

		this.coefficientEvening =
			data.coefficientEvening || '--';

    }

}
import TideModel from '../models/TideModel.js';

export default class TideService {

    static J2000 =
        new Date(
            '2000-01-01T12:00:00Z'
        );

    static ports = null;

    static current = null;

    static async loadPorts() {

        if (this.ports) {

            return this.ports;

        }

        const response =
            await fetch(
                './src/modules/tides/data/tidal_ports.json'
            );

        this.ports =
            await response.json();

        return this.ports;

    }

    static tideAt(
        date,
        portKey,
        surge = 0
    ) {

        if (
            !this.ports ||
            !this.ports[portKey]
        ) {

            return 0;

        }

        const port =
            this.ports[portKey];

        const t =
            (
                date -
                this.J2000
            ) / 3600000;

        let h =
            port.datum;

        for (
            const constituent
            of port.constituents
        ) {

            h +=
                constituent.amp *
                Math.cos(

                    (
                        constituent.freq *
                        t -

                        constituent.phase

                    ) *

                    Math.PI /
                    180

                );

        }

        return h + surge;

    }

    static async getCurrentTide(
        portKey,
        surge = 0
    ) {

        await this.loadPorts();

        const now =
            new Date();

        const currentHeight =
            this.tideAt(
                now,
                portKey,
                surge
            );

        const points = [];

        const start =
            new Date(
                now.getTime() -
                6 * 3600000
            );

        for (
            let i = 0;
            i <= 24;
            i++
        ) {

            const date =
                new Date(
                    start.getTime() +
                    i * 3600000
                );

            points.push(

                this.tideAt(
                    date,
                    portKey,
                    surge
                )

            );

        }

        const tideEvents =
			this.detectHighLowTides(
				portKey,
				surge
			);

		const lowTides =
			tideEvents.filter(
				e => e.type === 'BM'
			);

		const highTides =
			tideEvents.filter(
				e => e.type === 'PM'
			);
			
		const coefficientMorning =
			this.calculateCoefficient(
				lowTides[0],
				highTides[0]
			);

		const coefficientEvening =
			this.calculateCoefficient(
				lowTides[1],
				highTides[1]
			);	

		this.current =
			new TideModel({

				port:
					portKey,

				currentHeight,

				surge,

				lowTides,

				highTides,
				
				coefficientMorning,

				coefficientEvening,

				chartData:
					points,

				timestamp:
					now

			});

        window.dispatchEvent(

            new CustomEvent(

                'tide:updated',

                {
                    detail:
                        this.current
                }

            )

        );

        return this.current;

    }

    static getCurrent() {

        return this.current;

    }

		static detectHighLowTides(
			portKey,
			surge = 0
		) {

			const events = [];

			const start =
				new Date();

			start.setHours(
				0,
				0,
				0,
				0
			);

			const points = [];

			for (
				let i = 0;
				i <= 24 * 12;
				i++
			) {

				const date =
					new Date(
						start.getTime() +
						i * 5 * 60000
					);

				points.push({

					date,

					height:
						this.tideAt(
							date,
							portKey,
							surge
						)

				});

			}

			for (
				let i = 1;
				i < points.length - 1;
				i++
			) {

				const prev =
					points[i - 1];

				const current =
					points[i];

				const next =
					points[i + 1];

				// PM

				if (

					current.height >
					prev.height &&

					current.height >
					next.height

				) {

					events.push({

						type:
							'PM',

						time:
							current.date,

						height:
							current.height

					});

				}

				// BM

				if (

					current.height <
					prev.height &&

					current.height <
					next.height

				) {

					events.push({

						type:
							'BM',

						time:
							current.date,

						height:
							current.height

					});

				}

			}

			return events;

		}

static calculateCoefficient(
    lowTide,
    highTide
) {

    if (
        !lowTide ||
        !highTide
    ) {

        return '--';

    }

    const marnage =
        highTide.height -
        lowTide.height;

    return Math.round(

        (
            marnage /
            6.1
        ) * 100

    );

}

}
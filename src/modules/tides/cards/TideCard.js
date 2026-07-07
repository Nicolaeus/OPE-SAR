import BaseCard from '../../../shared/ui/cards/BaseCard.js';
import CardSection from '../../../shared/ui/cards/CardSection.js';
import BaseCardController from '../../../shared/ui/cards/BaseCardController.js';

export default class TideCard extends BaseCardController{

    static chart = null;

    static create(tide) {

        if (!tide) {
            return;
        }

        if (this.instance) {

            this.instance.element.remove();

            this.instance = null;

        }

        const card =
            new BaseCard({

                id: 'tide-card',

                title: 'MARÉES',

                color: 'cyan',

                icon: '🌊'

            });

        // ============================
        // INFORMATIONS
        // ============================

        const info =
            new CardSection(
                'Informations'
            );

        const infoContent =
            document.createElement('div');

        infoContent.innerHTML = `

            <div class="opsar-row">

                <span class="opsar-label">
                    Port
                </span>

                <span class="opsar-value">
                    ${tide.port ?? '--'}
                </span>

            </div>

            <div class="opsar-row">

                <span class="opsar-label">
                    Hauteur actuelle
                </span>

                <span class="opsar-value">
                    ${Number(
                        tide.currentHeight
                    ).toFixed(2)} m
                </span>

            </div>

            <div class="opsar-row">

                <span class="opsar-label">
                    Surcote météo
                </span>

                <span class="opsar-value">
                    ${Number(
                        tide.surge || 0
                    ).toFixed(2)} m
                </span>

            </div>

        `;

        info.add(
            infoContent
        );
		
		// ============================
        // TABLEAU
        // ============================
		
		console.log(
    'LOW',
    tide.lowTides
);

console.log(
    'HIGH',
    tide.highTides
);
		
		const timetable =
			new CardSection(
				'BM / PM'
			);

		const bmMorning =
			tide.lowTides?.[0];

		const pmMorning =
			tide.highTides?.[0];

		const bmEvening =
			tide.lowTides?.[1];

		const pmEvening =
			tide.highTides?.[1];

		const timetableContent =
			document.createElement(
				'div'
			);

		timetableContent.innerHTML = `

		<table class="opsar-tide-table">

			<thead>

				<tr>

					<th></th>

					<th>BM</th>

					<th>PM</th>

					<th>Coef.</th>

				</tr>

			</thead>

			<tbody>

				<tr>

					<td>Matin</td>

					<td>
						${this.formatHour(
							bmMorning?.time
						)}
					</td>

					<td>
						${this.formatHour(
							pmMorning?.time
						)}
					</td>

					<td>
						${tide.coefficientMorning ?? '--'}
					</td>

				</tr>

				<tr>

					<td>Après-midi</td>

					<td>
						${this.formatHour(
							bmEvening?.time
						)}
					</td>

					<td>
						${this.formatHour(
							pmEvening?.time
						)}
					</td>

					<td>
						${tide.coefficientEvening ?? '--'}
					</td>

				</tr>

			</tbody>

		</table>

		`;
		
		timetable.add(
			timetableContent
		);

        // ============================
        // COURBE
        // ============================

        const chartSection =
            new CardSection(
                'Courbe de marée'
            );

        const chartContainer =
            document.createElement(
                'div'
            );

        chartContainer.innerHTML = `

            <div
                style="
                    height:260px;
                    width:100%;
                ">

                <canvas
                    id="opsar-tide-chart">
                </canvas>

            </div>

        `;

        chartSection.add(
            chartContainer
        );

        // ============================
        // ASSEMBLAGE
        // ============================

        card.add(
            info.element
        );
		
		card.add(
			timetable.element
		);

        card.add(
            chartSection.element
        );

        card.render(
            document.getElementById(
                'app'
            )
        );

        this.instance =
            card;
			
		card.element.addEventListener(
			'card:close',
				() => {
					TideCard.close();
				}
		);

        setTimeout(
            () => {

                this.renderChart(
                    tide.chartData
                );

            },
            50
        );

        return card;

    }

	static formatHour(date) {

		if (!date) {
			return '--';
		}

		const d =
			new Date(date);

		const h =
			String(
				d.getHours()
			).padStart(2,'0');

		const m =
			String(
				d.getMinutes()
			).padStart(2,'0');

		return `${h}<sup>H</sup>${m}`;

	}


    static renderChart(points) {

        const canvas =
            document.getElementById(
                'opsar-tide-chart'
            );

        if (
            !canvas ||
            typeof Chart ===
            'undefined'
        ) {

            console.warn(
                'Chart.js absent'
            );

            return;

        }

        if (this.chart) {

            this.chart.destroy();

        }

        const labels = [];

        for (
            let i = -6;
            i <= 18;
            i++
        ) {

            labels.push(
                `${i}h`
            );

        }

        this.chart =
            new Chart(

                canvas,

                {

                    type: 'line',

                    data: {

                        labels,

                        datasets: [

                            {

                                label:
                                    'Hauteur (m)',

                                data:
                                    points,

                                borderColor:
                                    '#38bdf8',

                                backgroundColor:
                                    'rgba(56,189,248,.15)',

                                borderWidth:
                                    3,

                                pointRadius:
                                    0,

                                fill:
                                    true,

                                tension:
                                    0.35

                            }

                        ]

                    },

                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,

                        plugins: {

                            legend: {

                                display:
                                    false

                            }

                        },

                        scales: {

                            y: {

                                beginAtZero:
                                    false

                            }

                        }

                    }

                }

            );

    }

}
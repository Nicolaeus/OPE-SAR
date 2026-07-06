import StationService from './StationService.js';
import StationReferenceService from './StationReferenceService.js';
import StationCard from '../cards/StationCard.js';
import LayerManager from '../../map/services/LayerManager.js';

export default class StationManager {

    static stations = [];

    static async init(map) {

    this.stations =
        await StationService.load();

    this.createMarkers(
        map
    );

    window.addEventListener(

        'app:ready',

        () => {

            this.restoreReference(
                map
            );

        },

        { once: true }

    );

}

    static createMarkers(map) {

		const stationIcon = L.icon({

    iconUrl:
        './assets/images/icons/station/icon_station_128.png',

    iconRetinaUrl:
        './assets/images/icons/station/icon_station_256.png',

    iconSize:
        [32,44],

    iconAnchor:
        [16,44],

    popupAnchor:
        [0,-18]

});

        this.stations.forEach(
            station => {

                const marker =
                    L.marker([
                        station.lat,
                        station.lng
                    ],
					{
						icon:
							stationIcon
					}
					
					);

                marker.addTo(
					LayerManager.stationLayer
				);

                marker.on(
                    'click',
                    () => {

                        this.select(
                            station,
                            map
                        );

                    }
                );

                marker.bindTooltip(
                    this.buildStationTooltip(
                        station
                    ),
                    {
                        className:
                            'opsar-station-tooltip',

                        direction:
                            'top',

                        offset:
                            [0, -18],

                        opacity:
                            1
                    }
                );

            }
        );
		
		LayerManager.stationLayer.addTo(
			map
		);

    }

    static buildStationTooltip(station) {

        const boats =
            station.assets?.boats || [];

        const primaryBoat =
            boats[0] || null;

        const stationNumber =
            this.escapeHtml(
                station.stationNumber ||
                'SNSM'
            );

        const stationName =
            this.escapeHtml(
                station.name ||
                'Station'
            );

        const boatName =
            this.escapeHtml(
                primaryBoat?.name ||
                primaryBoat?.registration ||
                'Non renseigné'
            );

        const boatType =
            this.escapeHtml(
                [
                    primaryBoat?.type,
                    primaryBoat?.class
                ]
                    .filter(Boolean)
                    .join(' - ') ||
                'Non renseigné'
            );

        const crew =
            this.escapeHtml(
                this.formatCrew(
                    station,
                    primaryBoat
                )
            );

        const towing =
            this.escapeHtml(
                this.formatTowingPower(
                    primaryBoat
                )
            );

        return `
            <div class="opsar-station-tip">
                <div class="opsar-station-tip-header">
                    <span class="opsar-station-tip-number">
                        ${stationNumber}
                    </span>
                    <span class="opsar-station-tip-name">
                        ${stationName}
                    </span>
                </div>
                <div class="opsar-station-tip-body">
                    <div class="opsar-station-tip-row">
                        <span>Bateau</span>
                        <strong>${boatName}</strong>
                    </div>
                    <div class="opsar-station-tip-row">
                        <span>Type</span>
                        <strong>${boatType}</strong>
                    </div>
                    <div class="opsar-station-tip-row">
                        <span>Équipage</span>
                        <strong>${crew}</strong>
                    </div>
                    <div class="opsar-station-tip-row">
                        <span>Remorquage</span>
                        <strong>${towing}</strong>
                    </div>
                </div>
            </div>
        `;

    }

    static formatCrew(station, boat) {

        const onboard =
            boat?.crewOnBoard ??
            boat?.crewOnboard ??
            boat?.crew ??
            boat?.capacity?.crew ??
            null;

        if (onboard) {
            return `${onboard} à bord`;
        }

        const active =
            station.crew?.active;

        if (active) {
            return `${active} actifs station`;
        }

        return 'Non renseigné';

    }

    static formatTowingPower(boat) {

        const towing =
            boat?.towingPower ??
            boat?.towing ??
            boat?.towPower ??
            boat?.bollardPull ??
            null;

        if (!towing) {
            return 'Non renseigné';
        }

        if (typeof towing === 'number') {
            return `${towing} t`;
        }

        return String(
            towing
        );

    }

    static escapeHtml(value) {

        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');

    }

    static select(station, map) {

    map.setView(
        [
            station.lat,
            station.lng
        ],
        11
    );

    const label =
        document.getElementById(
            'currentStation'
        );

    if (label) {

        label.textContent =
            `${station.stationNumber} ${station.name}`;

    }

    window.dispatchEvent(
        new CustomEvent(
            'station:selected',
            {
                detail: {
                    station
                }
            }
        )
    );
	
	window.dispatchEvent(
		new CustomEvent(
			'station:open',
			{
				detail:{
					station
				}
			}
		)
	);
	

    console.log(
        '⚓ Station sélectionnée',
        station.name
    );

}

    static restoreReference(map) {

        const stationId =
            StationReferenceService.get();

        if (!stationId) {
            return;
        }

        const station =
            StationService.getById(
                stationId
            );

        if (!station) {
            return;
        }

        this.select(
			station,
			map
		);

    }

}

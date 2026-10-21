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

    this.initHeaderStationSelector(map);

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

    static initHeaderStationSelector(map) {
        const selector = document.getElementById('currentStation');
        const menu = document.getElementById('stationSelector');
        if (!selector || !menu) return;

        const closeMenu = () => {
            menu.hidden = true;
            selector.setAttribute('aria-expanded', 'false');
        };

        const renderNearbyStations = () => {
            const center = map.getCenter();
            const nearby = this.stations
                .map(station => ({
                    station,
                    distance: center.distanceTo([station.lat, station.lng])
                }))
                .sort((a, b) => a.distance - b.distance)
                .slice(0, 8);

            menu.replaceChildren();
            const heading = document.createElement('div');
            heading.className = 'opsar-station-menu-heading';
            heading.textContent = 'Stations proches de la zone affichée';
            menu.appendChild(heading);

            nearby.forEach(({ station, distance }) => {
                const option = document.createElement('button');
                option.type = 'button';
                option.className = 'opsar-station-option';
                option.setAttribute('role', 'option');

                const details = document.createElement('span');
                details.className = 'opsar-station-option-details';
                const name = document.createElement('strong');
                name.textContent = station.name;
                const location = document.createElement('small');
                location.textContent = [station.city, station.department].filter(Boolean).join(' · ') || 'Station SNSM';
                details.append(name, location);

                const distanceLabel = document.createElement('small');
                distanceLabel.className = 'opsar-station-distance';
                distanceLabel.textContent = `${(distance / 1852).toFixed(1)} NM`;
                option.append(details, distanceLabel);
                option.addEventListener('click', () => {
                    closeMenu();
                    this.select(station, map, { centerMap: false, openCard: false });
                });
                menu.appendChild(option);
            });
        };

        selector.addEventListener('click', event => {
            event.stopPropagation();
            if (!menu.hidden) {
                closeMenu();
                return;
            }
            renderNearbyStations();
            menu.hidden = false;
            selector.setAttribute('aria-expanded', 'true');
        });

        document.addEventListener('click', event => {
            if (!menu.contains(event.target) && !selector.contains(event.target)) closeMenu();
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') closeMenu();
        });
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

    static select(station, map, { centerMap = true, openCard = true } = {}) {

    if (centerMap) {
        map.setView(
            [
                station.lat,
                station.lng
            ],
            11
        );
    }

    const label =
        document.getElementById(
            'currentStation'
        );

    if (label) {
        const name = label.querySelector('.opsar-station-name');
        if (name) name.textContent = `📍 ${station.name}`;
        else label.textContent = station.name;

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
	
	if (openCard) {
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
	}
	

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

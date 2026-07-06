export default class OSCLayer {

    static group =
        L.layerGroup();

    static assetMarkers =
        [];
		
	static sectorLayer =
    null;


    static clear() {

        this.group.clearLayers();

        this.assetMarkers = [];

    }

    static renderMission(
        mission
    ) {

        if (!mission) {
            return;
        }

        const map =
            window.OPESAR
                ?.Map
                ?.getMap?.();

        if (!map) {
            return;
        }

        this.group.addTo(
            map
        );

        this.clear();

        mission.assets.forEach(
            asset => {

                if (
                    !asset.position
                ) {
                    return;
                }

                const marker =
                    L.marker([

                        asset.position.lat,

                        asset.position.lng

                    ])

                    .bindPopup(`

                        <b>
                            ${asset.name}
                        </b>

                        <br>

                        ${asset.type}

                        <br>

                        ${asset.status}

                    `);

                this.assetMarkers.push(
                    marker
                );

                this.group.addLayer(
                    marker
                );

            }
        );

    }
	
	static renderSectors(
    sectors
) {

    const map =
        window.OPESAR
            ?.Map
            ?.getMap?.();

    if (
        !map ||
        !sectors
    ) {
        return;
    }

    if (
        this.sectorLayer
    ) {

        this.group.removeLayer(
            this.sectorLayer
        );

    }

    this.sectorLayer =
        L.layerGroup();

    sectors.forEach(
        sector => {

            const polygon =
                L.polygon(

                    sector.polygon,

                    {

                        color:
                            '#38bdf8',

                        weight:
                            2,

                        fillOpacity:
                            0.08

                    }

                );

            polygon.bindTooltip(

                `Secteur ${sector.name}`,

                {

                    permanent:
                        true,

                    direction:
                        'center'

                }

            );

            this.sectorLayer
                .addLayer(
                    polygon
                );

        }
    );

    this.group.addLayer(
        this.sectorLayer
    );

}

}
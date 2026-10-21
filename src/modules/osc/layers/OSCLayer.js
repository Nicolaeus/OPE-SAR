const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const sectorStatusLabels = {
    pending: 'À commencer', assigned: 'Affecté', searching: 'En cours',
    completed: 'Terminé', suspended: 'Suspendu'
};

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
                            ${escapeHtml(asset.name)}
                        </b>

                        <br>

                        ${escapeHtml(asset.type)}

                        <br>

                        ${escapeHtml(asset.status)}

                    `);

                this.assetMarkers.push(
                    marker
                );

                this.group.addLayer(
                    marker
                );

            }
        );

        if (mission.sectors?.length) this.renderSectors(mission.sectors, mission.assets);

    }
	
	static renderSectors(
    sectors,
    assets = []
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
                            sector.status === 'completed' ? '#22c55e' : sector.status === 'suspended' ? '#ef4444' : '#38bdf8',

                        weight:
                            2,

                        fillOpacity:
                            0.08

                    }

                );

            polygon.bindTooltip(

                `Secteur ${escapeHtml(sector.name)}<br>${escapeHtml(assets.find(asset => asset.id === sector.assetId)?.name ?? 'Non affecté')}<br>${escapeHtml(sectorStatusLabels[sector.status] ?? sector.status ?? 'À commencer')}`,

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

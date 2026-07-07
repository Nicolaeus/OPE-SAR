export function createBaseLayers() {

    const osm = L.layerGroup([
        L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                attribution: '&copy; OpenStreetMap contributors',
                maxZoom: 19
            }
        )
    ]);

    const satellite = L.layerGroup([
        L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
                attribution: 'Tiles © Esri'
            }
        )
    ]);

    const dark = L.tileLayer(
    'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
    {
        maxZoom: 20,
        attribution: '&copy; Stadia Maps'
    }
);

    const osmMarine = L.layerGroup([
        L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                attribution: '&copy; OpenStreetMap contributors'
            }
        ),
        L.tileLayer(
            'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
            {
                attribution: '&copy; OpenSeaMap'
            }
        )
    ]);

    return {
        osm,
        satellite,
        dark,
        osmMarine
    };
}
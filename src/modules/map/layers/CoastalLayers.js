export default class CoastalLayers {

    static files = [
        './data/coastline/zones_nord.json',
        './data/coastline/zones_normandie.json',
        './data/coastline/zones_manche.json',
        './data/coastline/zones_bretagne_ne.json',
        './data/coastline/zones_bretagne_no.json',
        './data/coastline/zones_bretagne_se.json',
        './data/coastline/zones_bretagne_so.json',
        './data/coastline/zones_atlantique_nord.json',
        './data/coastline/zones_atlantique_sud.json',
        './data/coastline/zones_med_ouest.json',
        './data/coastline/zones_med_centre.json',
        './data/coastline/zones_med_est.json'
    ];

    static group = L.layerGroup();

    static limitLayers = {

        "300m": L.layerGroup(),

        "2MN": L.layerGroup(),

        "6MN": L.layerGroup(),

        "12MN": L.layerGroup()

    };

    static loaded = false;

    static getStyle(limit) {

        switch(limit) {

            case '300m':
                return {
                    color: '#ef4444',
                    weight: 2,
                    opacity: 0.9
                };

            case '2MN':
                return {
                    color: '#f59e0b',
                    weight: 2
                };

            case '6MN':
                return {
                    color: '#10b981',
                    weight: 2
                };

            case '12MN':
                return {
                    color: '#3b82f6',
                    weight: 2
                };

            default:
                return {
                    color: '#ffffff',
                    weight: 1
                };

        }

    }

    static async load() {

        if (this.loaded) {
            return;
        }

        for (const file of this.files) {

            try {

                const response = await fetch(file);

                if (!response.ok) {
                    continue;
                }

                const geojson = await response.json();

                const layer = L.geoJSON(
                    geojson,
                    {
                        style: feature =>
                            this.getStyle(
                                feature.properties?.limite
                            )
                    }
                );

                layer.eachLayer(featureLayer => {

                    const limit =
                        featureLayer.feature?.properties?.limite;

                    if (
                        limit &&
                        this.limitLayers[limit]
                    ) {

                        this.limitLayers[limit]
                            .addLayer(featureLayer);

                    }

                });

                this.group.addLayer(layer);

            }
            catch(error) {

                console.error(
                    'Erreur chargement',
                    file,
                    error
                );

            }

        }

        this.loaded = true;

    }

    static showLimit(limit, map) {

        if (
            this.limitLayers[limit] &&
            !map.hasLayer(
                this.limitLayers[limit]
            )
        ) {

            this.limitLayers[limit]
                .addTo(map);

        }

    }

    static hideLimit(limit, map) {

        if (
            this.limitLayers[limit] &&
            map.hasLayer(
                this.limitLayers[limit]
            )
        ) {

            map.removeLayer(
                this.limitLayers[limit]
            );

        }

    }
}
window.debugCoastalLayers =
    CoastalLayers;

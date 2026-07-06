import CoastalLimitsService from './CoastalLimitsService.js';

export default class CoastalLimitsController {

    constructor(map) {

        this.map = map;

        this.layerGroup = L.layerGroup();

        this.filters = {
            '300m': true,
            '2MN': true,
            '6MN': true,
            '12MN': true
        };

    }

    async load() {

        const files = CoastalLimitsService.getFiles();

        for(const file of files) {

            try {

                const response = await fetch(file);

                const geojson = await response.json();

                this.addGeoJson(geojson);

            }
            catch(error) {

                console.error('Erreur chargement', file, error);

            }

        }

    }

    addGeoJson(geojson) {

        const layer = L.geoJSON(geojson, {

            style: feature => this.getStyle(feature),

            onEachFeature: (feature, layer) => {

                const limit = feature.properties?.limite || 'Inconnue';

                layer.bindPopup(this.buildPopup(limit));

            }

        });

        this.layerGroup.addLayer(layer);

    }

    buildPopup(limit) {

        const data = {

            '300m': {
                distance: '300 mètres',
                regulation: 'Bande littorale'
            },

            '2MN': {
                distance: '3.704 km',
                regulation: 'Navigation côtière'
            },

            '6MN': {
                distance: '11.112 km',
                regulation: 'Semi-hauturier'
            },

            '12MN': {
                distance: '22.224 km',
                regulation: 'Eaux territoriales'
            }

        };

        const info = data[limit] || {};

        return `
            <div class="opsar-popup">

                <h4>${limit}</h4>

                <table>

                    <tr>
                        <td>Distance</td>
                        <td>${info.distance || '-'}</td>
                    </tr>

                    <tr>
                        <td>Type</td>
                        <td>${info.regulation || '-'}</td>
                    </tr>

                </table>

            </div>
        `;

    }

    getStyle(feature) {

        const limit = feature.properties?.limite;

        switch(limit) {

            case '300m':
                return {
                    color: '#ef4444',
                    weight: 3
                };

            case '2MN':
                return {
                    color: '#f59e0b',
                    weight: 3
                };

            case '6MN':
                return {
                    color: '#10b981',
                    weight: 3
                };

            case '12MN':
                return {
                    color: '#3b82f6',
                    weight: 3
                };

            default:
                return {
                    color: '#ffffff',
                    weight: 2
                };

        }

    }

    addToMap() {

        this.layerGroup.addTo(this.map);

    }

    removeFromMap() {

        this.map.removeLayer(this.layerGroup);

    }

}
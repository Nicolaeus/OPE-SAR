import Store from '../../../core/store/Store.js';
import CoastalLayers from '../layers/CoastalLayers.js';

export default class LayerManager {

	static stationLayer = L.layerGroup();

	static portLayer = L.layerGroup();

	static lighthouseLayer = L.layerGroup();

	static buoyLayer = L.layerGroup();

	static restrictedLayer = L.layerGroup();
	
	static incidentLayer = L.layerGroup();

	static aisLayer = L.layerGroup();

	static sarLayer = L.layerGroup();

	static routeLayer = L.layerGroup();
	
	static toggleLayer(
			layer,
			enabled
		) {

			const map =
				Store.state.map.instance;

			if (!map) {
				return;
			}

			if (enabled) {

				map.addLayer(
					layer
				);

			} else {

				map.removeLayer(
					layer
				);

			}

		}

    static setBaseLayer(layerName) {

        const map = Store.state.map.instance;

        if (!map) {
            return;
        }

        const layers = Store.state.map.baseLayers;

        Object.values(layers).forEach(layer => {
            if (map.hasLayer(layer)) {
                map.removeLayer(layer);
            }
        });

        if (layers[layerName]) {
            layers[layerName].addTo(map);
            Store.state.map.currentBaseLayer = layerName;
        }

    }
	
	static async toggleCoastal(enabled) {

		const map = Store.state.map.instance;

		await CoastalLayers.load();

		if (enabled) {

			CoastalLayers.group.addTo(map);

		}
		else {

			map.removeLayer(
				CoastalLayers.group
			);

		}

	}
	
	static toggleStations(enabled) {

		this.toggleLayer(
			this.stationLayer,
			enabled
		);

	}
	
	static togglePorts(enabled) {

		this.toggleLayer(
			this.portLayer,
			enabled
		);

	}

	static toggleLighthouses(enabled) {

		this.toggleLayer(
				this.lighthouseLayer,
				enabled
			);
	}

	static toggleBuoys(enabled) {

		this.toggleLayer(
			this.buoyLayer,
			enabled
		);    
	 }
    

	static toggleRestricted(enabled) {

		this.toggleLayer(
			this.restrictedLayer,
			enabled
		);

	}

}
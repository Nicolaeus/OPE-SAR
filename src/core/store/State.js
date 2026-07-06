const State = {

    map: {

        instance: null,

        currentBaseLayer: null,

        baseLayers: {},

        overlays: {},

        markers: {},

        layers: {}

    },
	
	coastal: {

		enabled: false,

		show300m: true,

		show2MN: true,

		show6MN: true,

		show12MN: true

	}

};

export default State;
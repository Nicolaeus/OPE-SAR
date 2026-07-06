window.OPESAR_CoastalLimits = {

    controller: null,

    async init(map) {

        this.controller = new CoastalLimitsController(map);

        await this.controller.load();

        this.controller.addToMap();

    }

};
export default class App {

    constructor() {

        this.modules = [];

    }

    register(module) {

        this.modules.push(module);

    }

    async start() {

        for (const module of this.modules) {

            if (module.init) {
                await module.init();
            }

        }

    }

}
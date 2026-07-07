export default class Registry {

    static modules = new Map();

    static register(name, module) {

        this.modules.set(name, module);

    }

    static get(name) {

        return this.modules.get(name);

    }

}
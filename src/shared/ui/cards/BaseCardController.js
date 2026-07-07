export default class BaseCardController {

    static instance = null;

    static close() {

        if (!this.instance) {
            return;
        }

        this.instance.element.remove();

        this.instance = null;

    }

    static isOpen() {

        return this.instance !== null;

    }

}
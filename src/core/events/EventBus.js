export default class EventBus {

    static events = {};

    static on(event, callback) {

        if (!this.events[event]) {
            this.events[event] = [];
        }

        this.events[event].push(callback);

    }

    static emit(event, data = null) {

        if (!this.events[event]) {
            return;
        }

        this.events[event].forEach(callback => callback(data));

    }

}
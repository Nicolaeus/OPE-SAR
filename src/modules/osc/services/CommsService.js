export default class CommsService {

    static logs = [];

    static addLog(
        sender,
        message
    ) {

        this.logs.push({

            timestamp:
                new Date(),

            sender,

            message

        });

    }

    static getLogs() {

        return this.logs;

    }

    static clear() {

        this.logs = [];

    }

}
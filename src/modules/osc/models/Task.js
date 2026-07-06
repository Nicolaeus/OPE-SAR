export default class Task {

    constructor(data = {}) {

        this.id =
            data.id ??
            crypto.randomUUID();

        this.title =
            data.title ??
            '';

        this.assetId =
            data.assetId ??
            null;

        this.status =
            data.status ??
            'pending';

        this.startedAt =
            data.startedAt ??
            null;

        this.completedAt =
            data.completedAt ??
            null;

    }

}
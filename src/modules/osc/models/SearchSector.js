export default class SearchSector {

    constructor(data = {}) {

        this.id =
            data.id ??
            crypto.randomUUID();

        this.name =
            data.name ??
            '';

        this.center =
            data.center ??
            null;

        this.polygon =
            data.polygon ??
            [];

        this.assetId =
            data.assetId ??
            null;

        this.status =
            data.status ??
            'pending';

    }

}
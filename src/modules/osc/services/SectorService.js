import SearchSector from '../models/SearchSector.js';

export default class SectorService {

    static generateSectors(
        assetCount = 1
    ) {

        const sectors = [];

        const alphabet =
            'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
                .split('');

        for (
            let i = 0;
            i < assetCount;
            i++
        ) {

            sectors.push(

                new SearchSector({

                    name:
                        alphabet[i]

                })

            );

        }

        return sectors;

    }

}
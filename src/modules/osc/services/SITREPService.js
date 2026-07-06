import OSCService from './OSCService.js';

export default class SITREPService {

    static generate() {

        const mission =
            OSCService.getMission();

        if (!mission) {

            return null;

        }

        return {

            mission:
                mission.name,

            assets:
                mission.assets.length,

            sectors:
                mission.sectors.length,

            generatedAt:
                new Date()

        };

    }

}
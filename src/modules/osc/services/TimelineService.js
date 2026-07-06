import OSCService from './OSCService.js';
import MissionEvent from '../models/MissionEvent.js';

export default class TimelineService {

    static addEvent(
        message,
        author = 'OSC',
        type = 'info'
    ) {

        const mission =
            OSCService.getMission();

        if (!mission) {
            return;
        }

        if (!mission.timeline) {
            mission.timeline = [];
        }

        mission.timeline.unshift(

            new MissionEvent({

                author,
                type,
                message

            })

        );

    }

    static getEvents() {

        const mission =
            OSCService.getMission();

        if (!mission) {
            return [];
        }

        return mission.timeline ?? [];

    }

    static clear() {

        const mission =
            OSCService.getMission();

        if (!mission) {
            return;
        }

        mission.timeline = [];

    }

}
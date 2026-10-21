import OSCService from './OSCService.js';
import TimelineService from './TimelineService.js';

export default class CommsService {
    static addLog(data = {}) {
        const mission = OSCService.getMission();
        if (!mission) return null;
        const log = {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            sender: '',
            recipient: '',
            channel: '',
            message: '',
            acknowledged: false,
            ...data
        };
        mission.comms.unshift(log);
        TimelineService.addEvent(`Communication consignée${log.channel ? ` sur ${log.channel}` : ''}${log.recipient ? ` vers ${log.recipient}` : ''}`);
        OSCService.persist();
        return log;
    }

    static getLogs() {
        return OSCService.getMission()?.comms ?? [];
    }

    static updateLog(id, values = {}) {
        const log = this.getLogs().find(item => item.id === id);
        if (!log) return;
        Object.assign(log, values);
        OSCService.persist();
    }

    static clear() {
        const mission = OSCService.getMission();
        if (!mission) return;
        mission.comms = [];
        OSCService.persist();
    }
}

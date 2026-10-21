export default class OSCMission {

    constructor(data = {}) {
        this.id = data.id ?? crypto.randomUUID();
        this.name = data.name ?? 'Mission SAR';
        this.type = data.type ?? 'sar';
        this.priority = data.priority ?? 'normal';
        this.status = data.status ?? 'active';
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : this.createdAt;

        this.datum = data.datum ?? null;
        this.radius = Number.isFinite(Number(data.radius)) && Number(data.radius) > 0 ? Number(data.radius) : 1;
        this.incident = {
            distressDescription: '',
            incidentTime: '',
            personsInDistress: null,
            missingCraftDescription: '',
            survivalEquipment: '',
            ...data.incident
        };
        this.plan = {
            source: 'smc',
            reference: '',
            pattern: '',
            orientation: '',
            trackSpacingNm: null,
            searchSpeedKnots: null,
            plannedStart: '',
            plannedEnd: '',
            instructions: '',
            ...data.plan
        };
        this.plan.changes = Array.isArray(this.plan.changes) ? this.plan.changes : [];

        this.coordination = {
            oscName: '',
            oscCallsign: '',
            designatedBy: '',
            smcName: '',
            smcContact: '',
            acoName: '',
            acoCallsign: '',
            controlChannel: '',
            onSceneChannel: '',
            ...data.coordination
        };
        this.environment = { weather: '', sea: '', visibility: '', wind: '', ...data.environment };
        this.safety = {
            hazards: '',
            separationInstructions: '',
            safetyNotes: '',
            reinforcementsNeeded: '',
            ...data.safety
        };

        this.assets = Array.isArray(data.assets) ? data.assets : [];
        this.sectors = Array.isArray(data.sectors) ? data.sectors : [];
        this.tasks = Array.isArray(data.tasks) ? data.tasks : [];
        this.timeline = Array.isArray(data.timeline) ? data.timeline : [];
        this.comms = Array.isArray(data.comms) ? data.comms : [];
        this.observations = Array.isArray(data.observations) ? data.observations : [];
        this.alerts = Array.isArray(data.alerts) ? data.alerts : [];
        this.survivors = Array.isArray(data.survivors) ? data.survivors : [];
        this.sitreps = Array.isArray(data.sitreps) ? data.sitreps : [];
        this.results = {
            searchRescue: '',
            planChanges: '',
            nextActions: '',
            recommendations: '',
            ...data.results
        };
    }

}

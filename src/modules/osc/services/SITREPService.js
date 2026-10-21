import OSCService from './OSCService.js';
import TimelineService from './TimelineService.js';

const clone = value => typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

export default class SITREPService {

    static generate(data = {}) {
        const mission = OSCService.getMission();
        if (!mission) return null;
        const reports = mission.sitreps ?? (mission.sitreps = []);
        const report = {
            id: crypto.randomUUID(),
            number: reports.length + 1,
            createdAt: new Date(),
            kind: data.kind ?? 'periodic',
            status: data.status ?? mission.status,
            mission: mission.name,
            priority: mission.priority,
            incident: clone(mission.incident),
            datum: clone(mission.datum),
            coordination: clone(mission.coordination),
            environment: clone(mission.environment),
            safety: clone(mission.safety),
            plan: clone(mission.plan),
            summary: data.summary ?? '',
            searchResults: data.searchResults ?? '',
            rescueActions: data.rescueActions ?? '',
            planChanges: data.planChanges ?? '',
            nextActions: data.nextActions ?? '',
            recommendations: data.recommendations ?? '',
            areasSearched: mission.sectors.filter(sector => sector.status === 'completed').map(sector => ({
                name: sector.name,
                asset: mission.assets.find(asset => asset.id === sector.assetId)?.name ?? null,
                trackSpacingNm: sector.actualTrackSpacingNm ?? sector.trackSpacingNm ?? mission.plan.trackSpacingNm,
                startedAt: sector.startedAt ?? null,
                endedAt: sector.endedAt ?? null,
                sightings: sector.sightings ?? '',
                results: sector.results ?? ''
            })),
            activeSectors: mission.sectors.filter(sector => sector.status !== 'completed').map(sector => ({
                name: sector.name,
                status: sector.status,
                asset: mission.assets.find(asset => asset.id === sector.assetId)?.name ?? null,
                startedAt: sector.startedAt ?? null,
                sightings: sector.sightings ?? ''
            })),
            trackSpacingNm: mission.plan.trackSpacingNm,
            facilities: mission.assets.map(asset => ({
                id: asset.id,
                name: asset.name,
                callsign: asset.callsign,
                mmsi: asset.mmsi,
                type: asset.type,
                capabilities: asset.capabilities,
                enduranceHours: asset.enduranceHours,
                status: asset.status,
                assignment: asset.assignment,
                arrivedOnSceneAt: asset.arrivedOnSceneAt,
                departedSceneAt: asset.departedSceneAt,
                releasedAt: asset.releasedAt,
                position: asset.position,
                lastPositionAt: asset.lastPositionAt,
                positionSource: asset.positionSource
            })),
            survivors: clone(mission.survivors),
            observations: clone(mission.observations),
            alerts: clone(mission.alerts),
            communications: clone(mission.comms),
            timeline: clone(mission.timeline)
        };
        reports.unshift(report);
        TimelineService.addEvent(`SITREP ${report.number} enregistré (${report.kind === 'final' ? 'final' : 'périodique'})`);
        OSCService.persist();
        return report;
    }

    static getReports() {
        return OSCService.getMission()?.sitreps ?? [];
    }

}

import OSCMission from '../models/OSCMission.js';
import OSCAsset from '../models/OSCAsset.js';
import StorageService from '../../../core/services/StorageService.js';
import Collections from '../../../core/database/Collections.js';
import TimelineService from './TimelineService.js';
import NotificationService from '../../../core/services/NotificationService.js';

const clone = value => typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

export default class OSCService {

    static currentMission = null;
    static persistence = Promise.resolve();
    static persistenceErrorShown = false;

    static async initialize() {
        if (this.currentMission) return this.currentMission;

        const missions = await StorageService.list(Collections.OSC);
        const saved = missions
            .filter(item => item.status === 'active')
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0]
            ?? missions.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];

        if (saved) this.currentMission = new OSCMission(saved);
        return this.currentMission;
    }

    static createMission(data = {}) {
        this.currentMission = new OSCMission(data);
        TimelineService.addEvent('Mission OSC créée');
        this.persist();
        return this.currentMission;
    }

    static getMission() {
        return this.currentMission;
    }

    static async listMissions() {
        const missions = await StorageService.list(Collections.OSC);
        return missions.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    static async selectMission(id) {
        const savedCurrent = await this.persist();
        if (this.currentMission && !savedCurrent) return null;
        const saved = await StorageService.load(Collections.OSC, id);
        if (!saved) return null;
        this.currentMission = new OSCMission(saved);
        return this.currentMission;
    }

    static persist() {
        if (!this.currentMission) return Promise.resolve(null);
        const mission = this.currentMission;
        mission.updatedAt = new Date();
        this.persistence = this.persistence
            .catch(() => {})
            .then(() => StorageService.save(Collections.OSC, clone(mission)))
            .then(record => {
                this.persistenceErrorShown = false;
                return record;
            })
            .catch(error => {
                console.error('Échec de sauvegarde de la mission OSC.', error);
                if (!this.persistenceErrorShown) {
                    NotificationService.warning('La mission OSC n’a pas pu être sauvegardée sur cet appareil. Exportez une copie JSON dès que possible.');
                    this.persistenceErrorShown = true;
                }
                return null;
            });
        return this.persistence;
    }

    static addAsset(data = {}) {
        if (!this.currentMission) return null;
        const asset = new OSCAsset(data);
        this.currentMission.assets.push(asset);
        TimelineService.addEvent(`${asset.name || 'Moyen'} ajouté à la mission`);
        this.persist();
        return asset;
    }

    static updateAsset(assetId, values = {}) {
        const asset = this.currentMission?.assets.find(item => item.id === assetId);
        if (!asset) return null;
        Object.assign(asset, values);
        asset.updatedAt = new Date();
        this.persist();
        return asset;
    }

    static removeAsset(assetId) {
        if (!this.currentMission) return;
        const asset = this.currentMission.assets.find(item => item.id === assetId);
        this.currentMission.assets = this.currentMission.assets.filter(item => item.id !== assetId);
        this.currentMission.sectors.forEach(sector => {
            if (sector.assetId === assetId) sector.assetId = null;
        });
        TimelineService.addEvent(`${asset?.name ?? 'Moyen'} retiré de la mission`);
        this.persist();
    }

    static assignAsset(assetId, task) {
        return this.updateAsset(assetId, { assignment: task, status: 'assigned' });
    }

    static updateAssetPosition(assetId, position) {
        return this.updateAsset(assetId, {
            position: { lat: position.lat, lng: position.lng },
            lastPositionAt: new Date(),
            positionSource: position.source ?? 'GPS de cet appareil'
        });
    }

    static addObservation(data = {}) {
        if (!this.currentMission) return null;
        const observation = { id: crypto.randomUUID(), timestamp: new Date(), ...data };
        this.currentMission.observations.unshift(observation);
        TimelineService.addEvent(`Observation : ${observation.description || 'nouvelle observation'}`);
        this.persist();
        return observation;
    }

    static addSurvivor(data = {}) {
        if (!this.currentMission) return null;
        const survivor = { id: crypto.randomUUID(), status: 'à évaluer', ...data };
        this.currentMission.survivors.push(survivor);
        TimelineService.addEvent(`Personne secourue enregistrée${survivor.name ? ` : ${survivor.name}` : ''}`);
        this.persist();
        return survivor;
    }

    static reset() {
        this.currentMission = null;
    }

}

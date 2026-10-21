import BaseCard from '../../../shared/ui/cards/BaseCard.js';
import CardSection from '../../../shared/ui/cards/CardSection.js';
import BaseCardController from '../../../shared/ui/cards/BaseCardController.js';
import NotificationService from '../../../core/services/NotificationService.js';
import ExportService from '../../../core/services/ExportService.js';
import OSCService from '../services/OSCService.js';
import OSCLayer from '../layers/OSCLayer.js';
import SearchAreaCard from './SearchAreaCard.js';
import SITREPCard from './SITREPCard.js';
import CommsCard from './CommsCard.js';
import TimelineCard from './TimelineCard.js';
import CoordinationCard from './CoordinationCard.js';
import SafetyCard from './SafetyCard.js';
import SurvivorsCard from './SurvivorsCard.js';
import PositionService from '../../map/services/PositionService.js';
import AssetTypes from '../models/AssetTypes.js';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

export default class OSCCard extends BaseCardController {

    static create() {
        this.close();
        if (!OSCService.getMission()) OSCService.createMission({ name: 'Mission SAR' });

        const mission = OSCService.getMission();
        const card = new BaseCard({ id: 'osc-card', title: 'OSC', icon: '🎯', color: 'orange' });

        const missionSection = new CardSection('Mission et situation');
        const missionContent = document.createElement('div');
        missionContent.innerHTML = `
            <label class="osc-field">Nom de mission
                <input id="osc-mission-name" class="opsar-input" value="${escapeHtml(mission.name)}">
            </label>
            <label class="osc-field">Mission enregistrée sur cet appareil
                <select id="osc-mission-select" class="opsar-input"><option value="${escapeHtml(mission.id)}">${escapeHtml(mission.name)} · mission active</option></select>
            </label>
            <button id="osc-new-mission" type="button" class="opsar-btn">Créer une nouvelle mission</button>
            <label class="osc-field">État
                <select id="osc-mission-status" class="opsar-input">
                    ${[['active','En cours'],['suspended','Suspendue'],['completed','Terminée']].map(([v,l])=>`<option value="${v}" ${mission.status===v?'selected':''}>${l}</option>`).join('')}
                </select>
            </label>
            <div class="osc-muted">Les missions sont enregistrées localement dans ce navigateur. Elles ne sont pas synchronisées avec les autres appareils.</div>`;
        missionSection.add(missionContent);
        card.add(missionSection.element);

        const coordination = document.createElement('div');
        coordination.className = 'osc-tools-grid';
        coordination.innerHTML = `
            <button id="osc-open-coordination" class="opsar-btn">Coordination OSC / SMC / ACO</button>
            <button id="osc-open-search" class="opsar-btn">Plan et zones de recherche</button>
            <button id="osc-open-safety" class="opsar-btn">Situation et sécurité</button>
            <button id="osc-open-survivors" class="opsar-btn">Personnes secourues</button>
            <button id="osc-open-sitrep" class="opsar-btn opsar-btn-warning">Créer un SITREP</button>
            <button id="osc-open-comms" class="opsar-btn">Journal communications</button>
            <button id="osc-open-timeline" class="opsar-btn">Journal opérationnel</button>
            <button id="osc-export" class="opsar-btn">Exporter la mission (JSON)</button>`;
        card.add(coordination);

        const assetsSection = new CardSection('Moyens engagés');
        const assetsContent = document.createElement('div');
        assetsContent.innerHTML = `
            <div id="osc-assets-list"></div>
            <button id="osc-add-asset" class="opsar-btn opsar-btn-warning" style="width:100%;">➕ Ajouter un moyen</button>`;
        assetsSection.add(assetsContent);
        card.add(assetsSection.element);

        card.render(document.getElementById('app'));
        this.instance = card;
        card.element.addEventListener('card:close', () => OSCCard.close());

        const saveInput = event => {
            const { id, value } = event.target;
            if (id === 'osc-mission-name') mission.name = value.trim();
            if (id === 'osc-mission-status') {
                mission.status = value;
                TimelineCard.record(`État de mission : ${event.target.selectedOptions[0].text}`);
            }
            OSCService.persist();
        };
        missionContent.addEventListener('change', saveInput);
        const missionSelect = missionContent.querySelector('#osc-mission-select');
        OSCService.listMissions().then(missions => {
            if (!missionSelect.isConnected) return;
            missionSelect.innerHTML = missions.map(item => `<option value="${escapeHtml(item.id)}" ${item.id === mission.id ? 'selected' : ''}>${escapeHtml(item.name)} · ${escapeHtml(item.status || 'active')} · ${escapeHtml(this.formatDate(item.updatedAt))}</option>`).join('');
        }).catch(error => console.error('Impossible de charger l’historique des missions OSC.', error));
        missionSelect.addEventListener('change', async () => {
            const selected = await OSCService.selectMission(missionSelect.value);
            if (selected) OSCCard.create();
            else missionSelect.value = mission.id;
        });
        missionContent.querySelector('#osc-new-mission').addEventListener('click', () => {
            const name = `Mission SAR — ${new Date().toLocaleString('fr-FR')}`;
            OSCService.createMission({ name });
            OSCCard.create();
        });

        card.element.querySelector('#osc-add-asset').addEventListener('click', () => {
            OSCService.addAsset({ name: `Moyen ${mission.assets.length + 1}`, type: 'snsm_canot' });
            this._refreshAssets();
        });
        coordination.querySelector('#osc-open-coordination').addEventListener('click', () => CoordinationCard.create());
        coordination.querySelector('#osc-open-search').addEventListener('click', () => SearchAreaCard.create());
        coordination.querySelector('#osc-open-safety').addEventListener('click', () => SafetyCard.create());
        coordination.querySelector('#osc-open-survivors').addEventListener('click', () => SurvivorsCard.create());
        coordination.querySelector('#osc-open-sitrep').addEventListener('click', () => SITREPCard.create());
        coordination.querySelector('#osc-open-comms').addEventListener('click', () => CommsCard.create());
        coordination.querySelector('#osc-open-timeline').addEventListener('click', () => TimelineCard.create());
        coordination.querySelector('#osc-export').addEventListener('click', () => this.exportMission());
        this._refreshAssets();
        return card;
    }

    static _refreshAssets() {
        const mission = OSCService.getMission();
        const container = document.getElementById('osc-assets-list');
        if (!container || !mission) return;
        container.innerHTML = '';

        mission.assets.forEach(asset => {
            const row = document.createElement('details');
            row.className = 'osc-asset-row';
            row.innerHTML = `
                <summary><b>${escapeHtml(asset.name || 'Moyen sans nom')}</b><span>${escapeHtml(asset.status)}</span></summary>
                <div class="osc-asset-fields">
                    <label class="osc-field">Nom<input data-field="name" class="opsar-input" value="${escapeHtml(asset.name)}"></label>
                    <label class="osc-field">Indicatif radio<input data-field="callsign" class="opsar-input" value="${escapeHtml(asset.callsign)}"></label>
                    <label class="osc-field">MMSI<input data-field="mmsi" inputmode="numeric" class="opsar-input" value="${escapeHtml(asset.mmsi)}"></label>
                    <label class="osc-field">Immatriculation<input data-field="registration" class="opsar-input" value="${escapeHtml(asset.registration)}"></label>
                    <label class="osc-field">Type / catégorie<select data-field="type" class="opsar-input">${asset.type in AssetTypes ? '' : `<option value="${escapeHtml(asset.type)}" selected>${escapeHtml(asset.type)}</option>`}${Object.entries(AssetTypes).map(([key,label])=>`<option value="${escapeHtml(key)}" ${asset.type===key?'selected':''}>${escapeHtml(label)}</option>`).join('')}</select></label>
                    <label class="osc-field">État<select data-field="status" class="opsar-input">${[['available','Disponible'],['assigned','Affecté'],['on_scene','Sur zone'],['searching','En recherche'],['rescuing','Sauvetage'],['returning','Retour'],['released','Libéré'],['unavailable','Indisponible']].map(([v,l])=>`<option value="${v}" ${asset.status===v?'selected':''}>${l}</option>`).join('')}</select></label>
                    <label class="osc-field">Capacités / limites<textarea data-field="capabilities" class="opsar-input" rows="2">${escapeHtml(asset.capabilities)}</textarea></label>
                    <label class="osc-field">Tâche affectée<input data-field="assignment" class="opsar-input" value="${escapeHtml(asset.assignment)}" placeholder="Secteur, recherche, relais…"></label>
                    <div class="osc-coordinate-grid">
                        <label class="osc-field">Latitude<input data-field="lat" type="number" step="any" class="opsar-input" value="${asset.position?.lat ?? ''}"></label>
                        <label class="osc-field">Longitude<input data-field="lng" type="number" step="any" class="opsar-input" value="${asset.position?.lng ?? ''}"></label>
                    </div>
                    <button type="button" data-action="gps" class="opsar-btn">Utiliser le GPS de cet appareil pour ce moyen</button>
                    <label class="osc-field">Endurance (h)<input data-field="enduranceHours" type="number" min="0" step="0.5" class="opsar-input" value="${asset.enduranceHours ?? ''}"></label>
                    <div class="osc-coordinate-grid">
                        <label class="osc-field">Vitesse (kt)<input data-field="speed" type="number" min="0" step="0.1" class="opsar-input" value="${asset.speed ?? 0}"></label>
                        <label class="osc-field">Cap (°)<input data-field="heading" type="number" min="0" max="359" step="1" class="opsar-input" value="${asset.heading ?? 0}"></label>
                    </div>
                    <div class="osc-coordinate-grid">
                        <button type="button" data-action="arrived" class="opsar-btn">Arrivée sur zone : ${escapeHtml(this.formatDate(asset.arrivedOnSceneAt) || '—')}</button>
                        <button type="button" data-action="departed" class="opsar-btn">Départ de zone : ${escapeHtml(this.formatDate(asset.departedSceneAt) || '—')}</button>
                    </div>
                    <button type="button" data-action="release" class="opsar-btn">Libérer ce moyen (à signaler au SMC)</button>
                    <div class="osc-muted">Libéré le : ${escapeHtml(this.formatDate(asset.releasedAt) || '—')}</div>
                    <div class="osc-muted">Position actualisée : ${escapeHtml(this.formatDate(asset.lastPositionAt) || 'non renseignée')} · source : ${escapeHtml(asset.positionSource || 'saisie manuelle')}</div>
                    <button type="button" data-action="remove" class="opsar-btn opsar-btn-danger">Retirer ce moyen</button>
                </div>`;

            row.addEventListener('change', event => {
                const input = event.target.closest('[data-field]');
                if (!input) return;
                let value = input.value;
                if (input.dataset.field === 'lat' || input.dataset.field === 'lng') {
                    const other = row.querySelector(`[data-field="${input.dataset.field === 'lat' ? 'lng' : 'lat'}"]`).value;
                    const lat = input.dataset.field === 'lat' ? value : other;
                    const lng = input.dataset.field === 'lng' ? value : other;
                    if (lat === '' || lng === '') value = null;
                    else {
                        const coordinates = { lat: Number(lat), lng: Number(lng) };
                        if (!Number.isFinite(coordinates.lat) || !Number.isFinite(coordinates.lng) || Math.abs(coordinates.lat) > 90 || Math.abs(coordinates.lng) > 180) {
                            NotificationService.warning('Coordonnées invalides. Vérifiez latitude et longitude.');
                            return;
                        }
                    OSCService.updateAsset(asset.id, { position: coordinates, lastPositionAt: new Date(), positionSource: 'Saisie manuelle' });
                        TimelineCard.record(`Position de ${asset.name} mise à jour manuellement : ${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`);
                        this._refreshAssets();
                        OSCLayer.renderMission(mission);
                        return;
                    }
                    OSCService.updateAsset(asset.id, { position: value ? { lat: Number(lat), lng: Number(lng) } : null, lastPositionAt: value ? new Date() : null, positionSource: value ? 'Saisie manuelle' : '' });
                } else if (['enduranceHours', 'speed', 'heading'].includes(input.dataset.field)) {
                    const numeric = value === '' ? null : Number(value);
                    if (numeric !== null && (!Number.isFinite(numeric) || numeric < 0 || (input.dataset.field === 'heading' && numeric > 359))) {
                        NotificationService.warning('Valeur numérique invalide.');
                        return;
                    }
                    OSCService.updateAsset(asset.id, { [input.dataset.field]: numeric });
                } else {
                    const previous = asset[input.dataset.field];
                    OSCService.updateAsset(asset.id, { [input.dataset.field]: value });
                    if (previous !== value && ['status', 'assignment', 'callsign'].includes(input.dataset.field)) {
                        TimelineCard.record(`${asset.name || 'Moyen'} — ${input.dataset.field} : ${value || 'non renseigné'}`);
                    }
                }
                OSCLayer.renderMission(mission);
            });
            row.addEventListener('click', event => {
                const button = event.target.closest('[data-action]');
                if (!button) return;
                if (button.dataset.action === 'gps') {
                    PositionService.getCurrentPosition().then(position => {
                        if (!position) {
                            NotificationService.warning('Position GPS indisponible. Vérifiez l’autorisation de localisation et le GPS de l’appareil.');
                            return;
                        }
                        OSCService.updateAssetPosition(asset.id, { lat: position.latitude, lng: position.longitude, source: 'GPS de cet appareil' });
                        TimelineCard.record(`Position GPS de ${asset.name} mise à jour : ${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}`);
                        this._refreshAssets();
                    });
                    return;
                }
                if (button.dataset.action === 'remove') {
                    OSCService.removeAsset(asset.id);
                    this._refreshAssets();
                    OSCLayer.renderMission(mission);
                    return;
                }
                if (button.dataset.action === 'release') {
                    const timestamp = new Date();
                    OSCService.updateAsset(asset.id, { status: 'released', releasedAt: timestamp, assignment: '' });
                    mission.sectors.forEach(sector => {
                        if (sector.assetId !== asset.id || sector.status === 'completed') return;
                        sector.assetId = null;
                        sector.status = 'suspended';
                    });
                    TimelineCard.record(`${asset.name} libéré — notifier le SMC selon les procédures`);
                    this._refreshAssets();
                    OSCLayer.renderMission(mission);
                    return;
                }
                const field = button.dataset.action === 'arrived' ? 'arrivedOnSceneAt' : 'departedSceneAt';
                const timestamp = new Date();
                OSCService.updateAsset(asset.id, {
                    [field]: timestamp,
                    ...(field === 'arrivedOnSceneAt' ? { status: 'on_scene', releasedAt: null } : { status: 'returning' })
                });
                TimelineCard.record(`${asset.name} ${field === 'arrivedOnSceneAt' ? 'arrivé sur zone' : 'quitte la zone'}`);
                this._refreshAssets();
            });
            container.appendChild(row);
        });
        OSCLayer.renderMission(mission);
    }

    static formatDate(value) {
        if (!value) return '';
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('fr-FR');
    }

    static async exportMission() {
        const mission = OSCService.getMission();
        if (!mission) return;
        await OSCService.persist();
        const filename = ExportService.createFilename(`Mission_OSC_${mission.name.replace(/[^a-z0-9_-]/gi, '_')}`);
        const file = new File([JSON.stringify(mission, null, 2)], `${filename}.json`, { type: 'application/json' });
        ExportService.save(file);
        NotificationService.success('Export JSON de la mission téléchargé.');
    }

}

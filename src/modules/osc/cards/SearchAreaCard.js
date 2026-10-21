import BaseCard from '../../../shared/ui/cards/BaseCard.js';
import CardSection from '../../../shared/ui/cards/CardSection.js';
import BaseCardController from '../../../shared/ui/cards/BaseCardController.js';
import NotificationService from '../../../core/services/NotificationService.js';
import OSCService from '../services/OSCService.js';
import SectorGeometryService from '../services/SectorGeometryService.js';
import OSCLayer from '../layers/OSCLayer.js';
import TimelineService from '../services/TimelineService.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const patterns = [['','À préciser'],['parallel','Parallèle / en lignes'],['sector','Recherche en secteur'],['expanding_square','Carré croissant'],['creeping_line','Lignes décalées'],['trackline','Recherche sur route'],['other','Autre / selon plan SMC']];

export default class SearchAreaCard extends BaseCardController {
    static create() {
        this.close();
        const mission = OSCService.getMission();
        if (!mission) return;
        const card = new BaseCard({ id: 'osc-search-card', title: 'PLAN & ZONES DE RECHERCHE', icon: '🗺', color: 'blue' });
        const section = new CardSection('Instructions et paramètres reçus');
        const content = document.createElement('div');
        const plan = mission.plan;
        const datum = mission.datum ?? {};
        content.innerHTML = `
            <div class="osc-muted">Enregistrer en priorité le plan reçu du SMC. La grille générée ici ne constitue qu’une proposition de partage des zones, à confirmer par l’OSC/SMC.</div>
            <label class="osc-field">Origine du plan<select data-plan="source" class="opsar-input"><option value="smc" ${plan.source==='smc'?'selected':''}>Plan / instructions du SMC</option><option value="osc" ${plan.source==='osc'?'selected':''}>Plan établi localement par l’OSC</option></select></label>
            <label class="osc-field">Référence / résumé du plan reçu<textarea data-plan="reference" class="opsar-input" rows="2">${esc(plan.reference)}</textarea></label>
            <label class="osc-field">Type de recherche<select data-plan="pattern" class="opsar-input">${patterns.map(([v,l])=>`<option value="${v}" ${plan.pattern===v?'selected':''}>${l}</option>`).join('')}</select></label>
            <label class="osc-field">Consignes du SMC / OSC<textarea data-plan="instructions" class="opsar-input" rows="3">${esc(plan.instructions)}</textarea></label>
            <hr><b>Modification / écart au plan</b>
            <label class="osc-field">Modification, raison et actions<textarea id="osc-plan-change-reason" class="opsar-input" rows="2"></textarea></label>
            <label class="osc-field">Décision / autorité<select id="osc-plan-change-authority" class="opsar-input"><option>SMC</option><option>OSC — SMC informé</option><option>OSC — liaison SMC impossible, à notifier</option></select></label>
            <button id="osc-plan-change-save" class="opsar-btn">Consigner la modification</button>
            <div id="osc-plan-change-list" class="osc-record-list"></div>
            <div class="osc-coordinate-grid">
                <label class="osc-field">Datum — latitude<input id="osc-datum-lat" type="number" step="any" class="opsar-input" value="${datum.lat ?? ''}"></label>
                <label class="osc-field">Datum — longitude<input id="osc-datum-lng" type="number" step="any" class="opsar-input" value="${datum.lng ?? ''}"></label>
            </div>
            <button id="osc-pick-datum" class="opsar-btn" type="button">Choisir le datum sur la carte</button>
            <div class="osc-coordinate-grid">
                <label class="osc-field">Orientation (°)<input data-plan="orientation" type="number" min="0" max="359" class="opsar-input" value="${esc(plan.orientation)}"></label>
                <label class="osc-field">Espacement des routes (NM)<input data-plan="trackSpacingNm" type="number" min="0" step="0.1" class="opsar-input" value="${plan.trackSpacingNm ?? ''}"></label>
                <label class="osc-field">Vitesse recherche (kt)<input data-plan="searchSpeedKnots" type="number" min="0" step="0.1" class="opsar-input" value="${plan.searchSpeedKnots ?? ''}"></label>
                <label class="osc-field">Rayon de grille indicative (NM)<input id="osc-search-radius" type="number" min="0.1" step="0.1" class="opsar-input" value="${mission.radius ?? 1}"></label>
            </div>
            <div class="osc-coordinate-grid">
                <label class="osc-field">Début prévu<input data-plan="plannedStart" type="datetime-local" class="opsar-input" value="${esc(plan.plannedStart)}"></label>
                <label class="osc-field">Fin prévue<input data-plan="plannedEnd" type="datetime-local" class="opsar-input" value="${esc(plan.plannedEnd)}"></label>
            </div>
            <button id="osc-generate-sectors" class="opsar-btn opsar-btn-warning" style="width:100%;">Générer une grille d’affectation indicative</button>
            <div id="osc-sectors-list" class="osc-record-list"></div>`;
        section.add(content); card.add(section.element); card.render(document.getElementById('app')); this.instance = card;
        let stopDatumPick = () => {};
        card.element.addEventListener('card:close', () => { stopDatumPick(); this.close(); });

        content.addEventListener('change', event => {
            const key = event.target.dataset.plan;
            if (key) {
                const raw = event.target.value;
                const previous = plan[key];
                const value = ['trackSpacingNm','searchSpeedKnots'].includes(key) ? (raw === '' ? null : Number(raw)) : raw;
                if (['trackSpacingNm','searchSpeedKnots'].includes(key) && value !== null && (!Number.isFinite(value) || value < 0)) {
                    NotificationService.warning('Valeur de plan invalide.');
                    return;
                }
                plan[key] = value;
                if (previous !== plan[key]) TimelineService.addEvent(`Plan de recherche modifié : ${key}`);
                OSCService.persist();
            }
            if (event.target.id === 'osc-search-radius') {
                const radius = Number(event.target.value);
                if (!Number.isFinite(radius) || radius <= 0) return;
                mission.radius = radius;
                OSCService.persist();
            }
            if (event.target.id === 'osc-datum-lat' || event.target.id === 'osc-datum-lng') this.updateDatumFromFields(content, mission);
            if (event.target.dataset.sectorField) {
                const sector = mission.sectors.find(item => item.id === event.target.dataset.sectorId);
                if (!sector) return;
                if (event.target.dataset.sectorField === 'assetId') {
                    const previousAsset = mission.assets.find(asset => asset.id === sector.assetId);
                    if (previousAsset?.assignment === `Secteur ${sector.name}`) {
                        previousAsset.assignment = '';
                        if (previousAsset.status === 'assigned') previousAsset.status = 'available';
                    }
                }
                const field = event.target.dataset.sectorField;
                const oldValue = sector[field];
                let value = event.target.value || null;
                if (field === 'actualTrackSpacingNm') {
                    value = value === null ? null : Number(value);
                    if (value !== null && (!Number.isFinite(value) || value < 0)) {
                        NotificationService.warning('Espacement réellement utilisé invalide.');
                        return;
                    }
                }
                sector[field] = value;
                if (field === 'status' && oldValue !== value) {
                    if (value === 'searching' && !sector.startedAt) sector.startedAt = new Date();
                    if (value === 'completed') sector.endedAt = new Date();
                    if (value !== 'completed' && oldValue === 'completed') sector.endedAt = null;
                    TimelineService.addEvent(`Secteur ${sector.name} : état ${value}`);
                    const assignedAsset = mission.assets.find(item => item.id === sector.assetId);
                    if (assignedAsset) {
                        const anotherSearchIsActive = mission.sectors.some(item => item.id !== sector.id && item.assetId === assignedAsset.id && item.status === 'searching');
                        if (value === 'searching') assignedAsset.status = 'searching';
                        else if (!anotherSearchIsActive && assignedAsset.status === 'searching') assignedAsset.status = 'on_scene';
                    }
                }
                if (event.target.dataset.sectorField === 'assetId' && sector.assetId) {
                    const asset = mission.assets.find(item => item.id === sector.assetId);
                    if (asset) {
                        asset.assignment = `Secteur ${sector.name}`;
                        if (asset.status === 'available') asset.status = 'assigned';
                    }
                }
                OSCService.persist();
                OSCLayer.renderSectors(mission.sectors, mission.assets);
                this._refresh(content, mission);
            }
        });

        content.querySelector('#osc-pick-datum').addEventListener('click', () => {
            const map = window.OPESAR?.Map?.getMap?.();
            if (!map) return;
            stopDatumPick();
            NotificationService.info('Cliquez sur la carte pour positionner le datum.');
            const choose = event => {
                stopDatumPick();
                mission.datum = { lat: event.latlng.lat, lng: event.latlng.lng };
                content.querySelector('#osc-datum-lat').value = mission.datum.lat.toFixed(6);
                content.querySelector('#osc-datum-lng').value = mission.datum.lng.toFixed(6);
                map.off('click', choose);
                OSCService.persist();
                TimelineService.addEvent(`Datum défini à ${mission.datum.lat.toFixed(4)}, ${mission.datum.lng.toFixed(4)}`);
            };
            stopDatumPick = () => map.off('click', choose);
            map.once('click', choose);
        });
        content.querySelector('#osc-plan-change-save').addEventListener('click', () => {
            const reason = content.querySelector('#osc-plan-change-reason').value.trim();
            if (!reason) return;
            const authority = content.querySelector('#osc-plan-change-authority').value;
            const change = { id: crypto.randomUUID(), timestamp: new Date(), reason, authority };
            plan.changes.unshift(change);
            TimelineService.addEvent(`Modification du plan : ${reason} (${authority})`);
            OSCService.persist();
            content.querySelector('#osc-plan-change-reason').value = '';
            this._refreshPlanChanges(content, mission);
        });
        content.querySelector('#osc-generate-sectors').addEventListener('click', () => {
            const { lat, lng } = mission.datum ?? {};
            const count = mission.assets.length;
            if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
                NotificationService.warning('Définissez le datum avant de générer la grille.'); return;
            }
            if (count < 1) { NotificationService.warning('Ajoutez au moins un moyen avant de répartir les secteurs.'); return; }
            mission.sectors.forEach(sector => {
                const previousAsset = mission.assets.find(asset => asset.id === sector.assetId);
                if (previousAsset?.assignment === `Secteur ${sector.name}`) previousAsset.assignment = '';
            });
            mission.sectors = SectorGeometryService.generateGrid(mission.datum, mission.radius, count).map((sector, index) => ({
                ...sector,
                assetId: mission.assets[index]?.id ?? null,
                status: 'pending',
                pattern: plan.pattern,
                orientation: plan.orientation,
                trackSpacingNm: plan.trackSpacingNm,
                actualTrackSpacingNm: null,
                startedAt: null,
                endedAt: null,
                sightings: '',
                results: ''
            }));
            mission.sectors.forEach(sector => {
                const asset = mission.assets.find(item => item.id === sector.assetId);
                if (asset) {
                    asset.assignment = `Secteur ${sector.name}`;
                    if (asset.status === 'available') asset.status = 'assigned';
                }
            });
            TimelineService.addEvent(`${mission.sectors.length} secteur(s) indicatif(s) généré(s) et affecté(s)`);
            OSCService.persist();
            OSCLayer.renderSectors(mission.sectors, mission.assets);
            this._refresh(content, mission);
        });
        this._refresh(content, mission);
        this._refreshPlanChanges(content, mission);
        OSCLayer.renderSectors(mission.sectors, mission.assets);
        return card;
    }

    static updateDatumFromFields(content, mission) {
        const latRaw = content.querySelector('#osc-datum-lat').value;
        const lngRaw = content.querySelector('#osc-datum-lng').value;
        if (latRaw === '' || lngRaw === '') {
            mission.datum = null;
            OSCService.persist();
            return;
        }
        const lat = Number(latRaw); const lng = Number(lngRaw);
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
            NotificationService.warning('Coordonnées du datum invalides.'); return;
        }
        mission.datum = { lat, lng };
        OSCService.persist();
    }

    static _refresh(content, mission) {
        const container = content.querySelector('#osc-sectors-list');
        container.innerHTML = mission.sectors.map(sector => `<details class="osc-record-row">
            <summary><b>Secteur ${esc(sector.name)}</b> · ${esc(sector.status || 'pending')}</summary>
            <label class="osc-field">Moyen affecté<select data-sector-field="assetId" data-sector-id="${esc(sector.id)}" class="opsar-input"><option value="">Non affecté</option>${mission.assets.map(asset=>`<option value="${esc(asset.id)}" ${sector.assetId===asset.id?'selected':''}>${esc(asset.name)}${asset.callsign?` (${esc(asset.callsign)})`:''}</option>`).join('')}</select></label>
            <label class="osc-field">État<select data-sector-field="status" data-sector-id="${esc(sector.id)}" class="opsar-input">${[['pending','À commencer'],['assigned','Affecté'],['searching','En cours'],['completed','Terminé'],['suspended','Suspendu']].map(([v,l])=>`<option value="${v}" ${sector.status===v?'selected':''}>${l}</option>`).join('')}</select></label>
            <label class="osc-field">Espacement réellement utilisé (NM)<input data-sector-field="actualTrackSpacingNm" data-sector-id="${esc(sector.id)}" type="number" min="0" step="0.1" value="${sector.actualTrackSpacingNm ?? ''}" class="opsar-input"></label>
            <div class="osc-muted">Planifié : ${sector.trackSpacingNm ? `${esc(sector.trackSpacingNm)} NM` : 'espacement non renseigné'} · Début : ${esc(sector.startedAt ? new Date(sector.startedAt).toLocaleString('fr-FR') : '—')} · Fin : ${esc(sector.endedAt ? new Date(sector.endedAt).toLocaleString('fr-FR') : '—')}</div>
            <label class="osc-field">Observations / contacts<input data-sector-field="sightings" data-sector-id="${esc(sector.id)}" value="${esc(sector.sightings)}" class="opsar-input"></label>
            <label class="osc-field">Résultat / zone effectivement couverte<textarea data-sector-field="results" data-sector-id="${esc(sector.id)}" class="opsar-input">${esc(sector.results)}</textarea></label>
            <div class="osc-muted">${sector.pattern ? `Type : ${esc(patterns.find(([value])=>value===sector.pattern)?.[1] ?? sector.pattern)}` : 'Type à préciser'}${sector.orientation ? ` · orientation ${esc(sector.orientation)}°` : ''}</div>
        </details>`).join('') || '<div class="osc-muted">Aucun secteur. La grille indicative nécessite un datum et un moyen.</div>';
    }

    static _refreshPlanChanges(content, mission) {
        const container = content.querySelector('#osc-plan-change-list');
        container.innerHTML = mission.plan.changes.map(change => `<div class="osc-record-row">
            <b>${esc(change.authority)}</b><div>${esc(change.reason)}</div>
            <div class="osc-muted">${esc(new Date(change.timestamp).toLocaleString('fr-FR'))}</div>
        </div>`).join('') || '<div class="osc-muted">Aucune modification consignée.</div>';
    }
}

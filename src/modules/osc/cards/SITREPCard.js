import BaseCard from '../../../shared/ui/cards/BaseCard.js';
import CardSection from '../../../shared/ui/cards/CardSection.js';
import BaseCardController from '../../../shared/ui/cards/BaseCardController.js';
import ExportService from '../../../core/services/ExportService.js';
import NotificationService from '../../../core/services/NotificationService.js';
import OSCService from '../services/OSCService.js';
import SITREPService from '../services/SITREPService.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

export default class SITREPCard extends BaseCardController {
    static create() {
        this.close();
        const mission = OSCService.getMission();
        if (!mission) return;
        const card = new BaseCard({ id: 'osc-sitrep-card', title: 'SITREP', icon: '📝', color: 'green' });
        const section = new CardSection('Situation Report — saisie et historique');
        const content = document.createElement('div');
        content.innerHTML = `
            <div class="osc-muted">Les informations enregistrées dans la mission sont reprises dans le rapport. Relisez et complétez avant export et transmission selon les consignes du SMC.</div>
            <label class="osc-field">Type de rapport<select id="osc-sitrep-kind" class="opsar-input"><option value="periodic">Périodique</option><option value="final">Final / clôture</option></select></label>
            <label class="osc-field">Situation / résumé<textarea id="osc-sitrep-summary" class="opsar-input" rows="3">${esc(mission.results.searchRescue)}</textarea></label>
            <label class="osc-field">Résultats de recherche<textarea id="osc-sitrep-search" class="opsar-input" rows="2">${esc(mission.results.searchRescue)}</textarea></label>
            <label class="osc-field">Actions de sauvetage<textarea id="osc-sitrep-rescue" class="opsar-input" rows="2"></textarea></label>
            <label class="osc-field">Modifications du plan<textarea id="osc-sitrep-changes" class="opsar-input" rows="2">${esc(mission.results.planChanges)}</textarea></label>
            <label class="osc-field">Actions prévues<textarea id="osc-sitrep-next" class="opsar-input" rows="2">${esc(mission.results.nextActions)}</textarea></label>
            <label class="osc-field">Recommandations / assistance demandée<textarea id="osc-sitrep-recommendations" class="opsar-input" rows="2">${esc(mission.results.recommendations || mission.safety.reinforcementsNeeded)}</textarea></label>
            <button id="osc-sitrep-save" class="opsar-btn opsar-btn-warning" style="width:100%;">Enregistrer le SITREP</button>
            <div id="osc-sitrep-latest" class="osc-record-list"></div>
            <hr><b>Rapports précédents</b><div id="osc-sitrep-history" class="osc-record-list"></div>`;
        section.add(content); card.add(section.element); card.render(document.getElementById('app')); this.instance = card;
        card.element.addEventListener('card:close', () => this.close());
        content.querySelector('#osc-sitrep-save').addEventListener('click', () => {
            const values = {
                kind: content.querySelector('#osc-sitrep-kind').value,
                summary: content.querySelector('#osc-sitrep-summary').value.trim(),
                searchResults: content.querySelector('#osc-sitrep-search').value.trim(),
                rescueActions: content.querySelector('#osc-sitrep-rescue').value.trim(),
                planChanges: content.querySelector('#osc-sitrep-changes').value.trim(),
                nextActions: content.querySelector('#osc-sitrep-next').value.trim(),
                recommendations: content.querySelector('#osc-sitrep-recommendations').value.trim()
            };
            mission.results.searchRescue = values.searchResults;
            mission.results.planChanges = values.planChanges;
            mission.results.nextActions = values.nextActions;
            mission.results.recommendations = values.recommendations;
            const report = SITREPService.generate(values);
            this.renderLatest(content, report);
            this.renderHistory(content);
        });
        content.addEventListener('click', event => {
            const id = event.target.dataset.exportSitrep;
            if (!id) return;
            const report = mission.sitreps.find(item => item.id === id);
            if (report) this.exportReport(report);
        });
        this.renderHistory(content);
        if (mission.sitreps.length) this.renderLatest(content, mission.sitreps[0]);
        return card;
    }

    static renderLatest(content, report) {
        const container = content.querySelector('#osc-sitrep-latest');
        container.innerHTML = `<div class="osc-record-row"><b>SITREP ${report.number} enregistré</b>
            <div class="osc-muted">${esc(new Date(report.createdAt).toLocaleString('fr-FR'))} · ${report.kind === 'final' ? 'Final' : 'Périodique'}</div>
            <button class="opsar-btn" data-export-sitrep="${esc(report.id)}">Exporter ce SITREP (JSON)</button>
            <button class="opsar-btn" data-export-text="${esc(report.id)}">Exporter en texte</button></div>`;
        container.querySelector('[data-export-text]')?.addEventListener('click', () => this.exportReport(report, 'text'));
    }

    static renderHistory(content) {
        const container = content.querySelector('#osc-sitrep-history');
        container.innerHTML = SITREPService.getReports().map(report => `<div class="osc-record-row">
            <b>SITREP ${report.number} — ${report.kind === 'final' ? 'Final' : 'Périodique'}</b>
            <div class="osc-muted">${esc(new Date(report.createdAt).toLocaleString('fr-FR'))} · ${esc(report.mission)}</div>
            <button class="opsar-btn" data-export-sitrep="${esc(report.id)}">Exporter JSON</button>
            <button class="opsar-btn" data-export-text="${esc(report.id)}">Exporter texte</button>
        </div>`).join('') || '<div class="osc-muted">Aucun rapport enregistré.</div>';
        container.querySelectorAll('[data-export-text]').forEach(button => button.addEventListener('click', () => {
            const report = SITREPService.getReports().find(item => item.id === button.dataset.exportText);
            if (report) this.exportReport(report, 'text');
        }));
    }

    static exportReport(report, format = 'json') {
        const filename = `${ExportService.createFilename(`SITREP_${report.number}`)}.${format === 'text' ? 'txt' : 'json'}`;
        const body = format === 'text' ? this.toText(report) : JSON.stringify(report, null, 2);
        const file = new File([body], filename, { type: format === 'text' ? 'text/plain;charset=utf-8' : 'application/json' });
        ExportService.save(file);
        NotificationService.success('Export du SITREP téléchargé.');
    }

    static toText(report) {
        const lines = [
            `SITREP ${report.number} — ${report.kind === 'final' ? 'FINAL' : 'PÉRIODIQUE'}`,
            `Mission : ${report.mission}`,
            `Priorité : ${report.priority || 'À préciser'}`,
            `Date/heure : ${new Date(report.createdAt).toISOString()}`,
            `OSC : ${report.coordination?.oscName || 'À préciser'} (${report.coordination?.oscCallsign || 'indicatif à préciser'})`,
            `SMC : ${report.coordination?.smcName || 'À préciser'} (${report.coordination?.smcContact || 'contact à préciser'})`,
            `Canal contrôle : ${report.coordination?.controlChannel || 'À préciser'} · canal sur zone : ${report.coordination?.onSceneChannel || 'À préciser'}`,
            `Incident : ${report.incident?.distressDescription || 'À préciser'}`,
            `Heure incident : ${report.incident?.incidentTime || 'À préciser'}`,
            `Personnes en détresse : ${report.incident?.personsInDistress ?? 'À préciser'}`,
            `Embarcation / aéronef : ${report.incident?.missingCraftDescription || 'À préciser'}`,
            `Équipements de survie : ${report.incident?.survivalEquipment || 'À préciser'}`,
            `Datum : ${report.datum ? `${report.datum.lat}, ${report.datum.lng}` : 'À préciser'}`,
            `Plan : ${report.plan?.source === 'smc' ? 'instructions du SMC' : 'établi localement'}${report.plan?.reference ? ` — ${report.plan.reference}` : ''}`,
            `Type de recherche : ${report.plan?.pattern || 'À préciser'} · orientation ${report.plan?.orientation || 'À préciser'}`,
            `Horaire prévu : ${report.plan?.plannedStart || 'À préciser'} → ${report.plan?.plannedEnd || 'À préciser'}`,
            `Instructions : ${report.plan?.instructions || '—'}`,
            'Modifications de plan consignées :',
            ...(report.plan?.changes ?? []).map(item => `- ${new Date(item.timestamp).toISOString()} | ${item.authority} | ${item.reason}`),
            `Météo : ${report.environment?.weather || 'À préciser'}`,
            `Mer : ${report.environment?.sea || 'À préciser'}`,
            `Visibilité : ${report.environment?.visibility || 'À préciser'}`,
            `Vent : ${report.environment?.wind || 'À préciser'}`,
            `Dangers : ${report.safety?.hazards || 'Aucun renseigné'}`,
            `Séparation / consignes sécurité : ${report.safety?.separationInstructions || 'À préciser'}`,
            `Assistance demandée : ${report.safety?.reinforcementsNeeded || 'Aucune renseignée'}`,
            'Alertes opérationnelles :',
            ...report.alerts.map(item => `- ${item.severity?.toUpperCase()} | ${item.category} | ${item.message} | ${item.resolvedAt ? `traitée ${item.resolvedAt}` : 'ACTIVE'}`),
            `Situation : ${report.summary || '—'}`,
            `Résultats de recherche : ${report.searchResults || '—'}`,
            `Actions de sauvetage : ${report.rescueActions || '—'}`,
            `Modifications du plan : ${report.planChanges || '—'}`,
            `Actions prévues : ${report.nextActions || '—'}`,
            `Recommandations : ${report.recommendations || '—'}`,
            `Espacement des routes : ${report.trackSpacingNm ?? 'À préciser'} NM`,
            'Moyens :',
            ...report.facilities.map(item => `- ${item.name || 'Sans nom'} ${item.callsign ? `(${item.callsign})` : ''} | ${item.type || 'type à préciser'} | MMSI ${item.mmsi || '—'} · immat. ${item.registration || '—'} | ${item.status} | tâche : ${item.assignment || '—'} | position : ${item.position ? `${item.position.lat}, ${item.position.lng} (${item.positionSource || 'source à préciser'}, actualisée ${item.lastPositionAt || 'date inconnue'})` : 'non renseignée'} | vitesse ${item.speed ?? '—'} kt / cap ${item.heading ?? '—'}° | arrivée : ${item.arrivedOnSceneAt || '—'} | départ : ${item.departedSceneAt || '—'} | libéré : ${item.releasedAt || '—'} | endurance : ${item.enduranceHours ?? '—'} h | capacité : ${item.capabilities || '—'}`),
            `Zones recherchées : ${report.areasSearched.map(area => `${area.name}${area.asset ? ` (${area.asset})` : ''} · espacement ${area.trackSpacingNm ?? '—'} NM · début ${area.startedAt || '—'} · fin ${area.endedAt || '—'} · observations ${area.sightings || '—'} · résultat ${area.results || '—'}`).join('\n') || 'Aucune zone marquée terminée'}`,
            `Zones encore ouvertes : ${report.activeSectors.map(area => `${area.name} (${area.status}${area.asset ? ` · ${area.asset}` : ''})`).join(', ') || 'Aucune'}`,
            `Nombre de personnes secourues : ${report.survivors.reduce((total, item) => total + Number(item.count ?? 1), 0)}`,
            'Personnes secourues :',
            ...report.survivors.map(item => `- ${item.count ?? 1} personne(s) ${item.name || '(identité inconnue)'} | ${item.status || 'état à préciser'} | moyen : ${report.facilities.find(f=>f.id===item.assetId)?.name || item.assetId || '—'} | destination : ${item.destination || '—'} | remise à terre : ${item.disembarkedAt || '—'} | état/besoins : ${item.condition || '—'}`),
            'Observations :',
            ...report.observations.map(item => `- ${new Date(item.timestamp).toISOString()} | ${item.type} | ${item.description}${item.position ? ` (${item.position.lat}, ${item.position.lng})` : ''} | source : ${item.source || '—'} | action / résultat : ${item.action || '—'}`),
            'Communications récentes consignées :',
            ...report.communications.slice(0, 20).map(item => `- ${new Date(item.timestamp).toISOString()} | ${item.channel || 'canal à préciser'} | ${item.sender || 'émetteur à préciser'} → ${item.recipient || 'destinataire à préciser'} | ${item.message} | AR : ${item.acknowledged ? 'oui' : 'non renseigné'}`),
            'Journal des événements :',
            ...report.timeline.map(item => `- ${new Date(item.timestamp).toISOString()} | ${item.author} | ${item.message}`)
        ];
        return lines.join('\n');
    }
}

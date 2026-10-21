import BaseCard from '../../../shared/ui/cards/BaseCard.js';
import CardSection from '../../../shared/ui/cards/CardSection.js';
import BaseCardController from '../../../shared/ui/cards/BaseCardController.js';
import OSCService from '../services/OSCService.js';
import TimelineService from '../services/TimelineService.js';
import NotificationService from '../../../core/services/NotificationService.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

export default class SafetyCard extends BaseCardController {
    static create() {
        this.close();
        const mission = OSCService.getMission();
        if (!mission) return;
        const card = new BaseCard({ id: 'osc-safety-card', title: 'SITUATION & SÉCURITÉ', icon: '⚠️', color: 'orange' });
        const section = new CardSection('Conditions observées sur zone');
        const content = document.createElement('div');
        content.innerHTML = `
            <label class="osc-field">Nature de l’urgence<textarea data-group="incident" data-key="distressDescription" class="opsar-input" rows="2">${esc(mission.incident.distressDescription)}</textarea></label>
            <div class="osc-coordinate-grid">
                <label class="osc-field">Heure de l’incident (UTC recommandé)<input data-group="incident" data-key="incidentTime" class="opsar-input" value="${esc(mission.incident.incidentTime)}" placeholder="AAAA-MM-JJ HH:MMZ"></label>
                <label class="osc-field">Personnes en détresse<input data-group="incident" data-key="personsInDistress" type="number" min="0" step="1" class="opsar-input" value="${mission.incident.personsInDistress ?? ''}"></label>
            </div>
            <label class="osc-field">Embarcation / aéronef recherché<textarea data-group="incident" data-key="missingCraftDescription" class="opsar-input" rows="2">${esc(mission.incident.missingCraftDescription)}</textarea></label>
            <label class="osc-field">Équipements de survie / moyens de détection<textarea data-group="incident" data-key="survivalEquipment" class="opsar-input" rows="2">${esc(mission.incident.survivalEquipment)}</textarea></label>
            <hr><b>Conditions observées sur zone</b>
            <label class="osc-field">Météo<textarea data-group="environment" data-key="weather" class="opsar-input" rows="2">${esc(mission.environment.weather)}</textarea></label>
            <label class="osc-field">État de la mer<textarea data-group="environment" data-key="sea" class="opsar-input" rows="2">${esc(mission.environment.sea)}</textarea></label>
            <label class="osc-field">Visibilité<input data-group="environment" data-key="visibility" class="opsar-input" value="${esc(mission.environment.visibility)}"></label>
            <label class="osc-field">Vent<input data-group="environment" data-key="wind" class="opsar-input" value="${esc(mission.environment.wind)}"></label>
            <label class="osc-field">Dangers / obstacles<textarea data-group="safety" data-key="hazards" class="opsar-input" rows="3">${esc(mission.safety.hazards)}</textarea></label>
            <label class="osc-field">Consignes de séparation surface / aéronefs<textarea data-group="safety" data-key="separationInstructions" class="opsar-input" rows="3">${esc(mission.safety.separationInstructions)}</textarea></label>
            <label class="osc-field">Consignes et remarques de sécurité<textarea data-group="safety" data-key="safetyNotes" class="opsar-input" rows="3">${esc(mission.safety.safetyNotes)}</textarea></label>
            <label class="osc-field">Renforts / assistance demandés<textarea data-group="safety" data-key="reinforcementsNeeded" class="opsar-input" rows="2">${esc(mission.safety.reinforcementsNeeded)}</textarea></label>
            <hr><b>Nouvelle alerte opérationnelle</b>
            <label class="osc-field">Catégorie<select id="osc-alert-category" class="opsar-input"><option>Sécurité</option><option>Météo / mer</option><option>Aéronef / séparation</option><option>Personne en détresse</option><option>Moyen indisponible</option><option>Plan de recherche</option><option>Autre</option></select></label>
            <label class="osc-field">Niveau<select id="osc-alert-severity" class="opsar-input"><option value="info">Information</option><option value="warning">Vigilance</option><option value="urgent">Urgent</option></select></label>
            <label class="osc-field">Description<textarea id="osc-alert-message" class="opsar-input" rows="2"></textarea></label>
            <button id="osc-alert-add" class="opsar-btn opsar-btn-warning" style="width:100%;">Enregistrer l’alerte</button>
            <div id="osc-alert-list" class="osc-record-list"></div>
            <div class="osc-muted">Consigner les observations et consignes reçues. Cette fiche ne remplace pas les communications ni les décisions du SMC/OSC.</div>`;
        section.add(content); card.add(section.element); card.render(document.getElementById('app')); this.instance = card;
        card.element.addEventListener('card:close', () => this.close());
        content.addEventListener('change', event => {
            const { group, key } = event.target.dataset;
            if (!group || !key) return;
            const previous = mission[group][key];
            const value = event.target.value.trim();
            if (group === 'incident' && key === 'personsInDistress' && value !== '' && (!Number.isInteger(Number(value)) || Number(value) < 0)) {
                NotificationService.warning('Le nombre de personnes doit être un entier positif ou nul.');
                return;
            }
            mission[group][key] = group === 'incident' && key === 'personsInDistress'
                ? (value === '' ? null : Number(value))
                : value;
            if (previous !== mission[group][key]) TimelineService.addEvent(`${group === 'environment' ? 'Conditions' : group === 'incident' ? 'Incident' : 'Sécurité'} — ${key} mis à jour`);
            OSCService.persist();
        });
        const renderAlerts = () => {
            const list = content.querySelector('#osc-alert-list');
            list.innerHTML = mission.alerts.map(alert => `<div class="osc-record-row osc-alert-${esc(alert.severity)}">
                <b>${esc(alert.category)} · ${esc(alert.severity).toUpperCase()}</b>
                <div>${esc(alert.message)}</div>
                <div class="osc-muted">${esc(new Date(alert.createdAt).toLocaleString('fr-FR'))} · ${alert.resolvedAt ? `Clôturée ${esc(new Date(alert.resolvedAt).toLocaleString('fr-FR'))}` : 'ACTIVE'}</div>
                ${alert.resolvedAt ? '' : `<button type="button" data-resolve-alert="${esc(alert.id)}" class="opsar-btn">Marquer comme traitée</button>`}
            </div>`).join('') || '<div class="osc-muted">Aucune alerte enregistrée.</div>';
        };
        content.querySelector('#osc-alert-add').addEventListener('click', () => {
            const message = content.querySelector('#osc-alert-message').value.trim();
            if (!message) return;
            const alert = {
                id: crypto.randomUUID(),
                category: content.querySelector('#osc-alert-category').value,
                severity: content.querySelector('#osc-alert-severity').value,
                message,
                createdAt: new Date(),
                resolvedAt: null
            };
            mission.alerts.unshift(alert);
            TimelineService.addEvent(`Alerte ${alert.severity} — ${alert.category} : ${message}`, 'OSC', alert.severity);
            if (alert.severity === 'urgent') NotificationService.error(`ALERTE URGENTE — ${message}`, { timeout: 0 });
            content.querySelector('#osc-alert-message').value = '';
            OSCService.persist();
            renderAlerts();
        });
        content.addEventListener('click', event => {
            const id = event.target.dataset.resolveAlert;
            if (!id) return;
            const alert = mission.alerts.find(item => item.id === id);
            if (!alert || alert.resolvedAt) return;
            alert.resolvedAt = new Date();
            TimelineService.addEvent(`Alerte traitée — ${alert.category} : ${alert.message}`);
            OSCService.persist();
            renderAlerts();
        });
        renderAlerts();
        return card;
    }
}

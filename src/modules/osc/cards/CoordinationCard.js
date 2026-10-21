import BaseCard from '../../../shared/ui/cards/BaseCard.js';
import CardSection from '../../../shared/ui/cards/CardSection.js';
import BaseCardController from '../../../shared/ui/cards/BaseCardController.js';
import OSCService from '../services/OSCService.js';
import TimelineService from '../services/TimelineService.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

export default class CoordinationCard extends BaseCardController {
    static create() {
        this.close();
        const mission = OSCService.getMission();
        if (!mission) return;
        const card = new BaseCard({ id: 'osc-coordination-card', title: 'COORDINATION', icon: '🧭', color: 'blue' });
        const roles = new CardSection('Responsables et liaison');
        const content = document.createElement('div');
        const c = mission.coordination;
        content.innerHTML = `
            <label class="osc-field">OSC — nom<input data-role="oscName" class="opsar-input" value="${esc(c.oscName)}"></label>
            <label class="osc-field">OSC — indicatif<input data-role="oscCallsign" class="opsar-input" value="${esc(c.oscCallsign)}"></label>
            <label class="osc-field">Désigné par<input data-role="designatedBy" class="opsar-input" value="${esc(c.designatedBy)}" placeholder="SMC / centre de coordination"></label>
            <label class="osc-field">SMC — nom ou fonction<input data-role="smcName" class="opsar-input" value="${esc(c.smcName)}"></label>
            <label class="osc-field">SMC — contact / indicatif<input data-role="smcContact" class="opsar-input" value="${esc(c.smcContact)}"></label>
            <label class="osc-field">ACO — nom ou fonction<input data-role="acoName" class="opsar-input" value="${esc(c.acoName)}"></label>
            <label class="osc-field">ACO — indicatif<input data-role="acoCallsign" class="opsar-input" value="${esc(c.acoCallsign)}"></label>
            <label class="osc-field">Canal de coordination / contrôle<input data-role="controlChannel" class="opsar-input" value="${esc(c.controlChannel)}"></label>
            <label class="osc-field">Canal sur zone<input data-role="onSceneChannel" class="opsar-input" value="${esc(c.onSceneChannel)}"></label>
            <div class="osc-muted">En l’absence de désignation préalable, le responsable du premier moyen arrivé assume normalement la fonction OSC jusqu’à sa relève organisée par le SMC. Consignez la désignation et toute relève selon les procédures applicables.</div>
            <hr>
            <label class="osc-field">Enregistrer une désignation ou une relève sur zone
                <select id="osc-role-change" class="opsar-input"><option value="osc">OSC</option><option value="aco">ACO</option></select>
            </label>
            <label class="osc-field">Nouvelle personne / fonction<input id="osc-role-name" class="opsar-input"></label>
            <label class="osc-field">Indicatif / contact<input id="osc-role-callsign" class="opsar-input"></label>
            <label class="osc-field">Désignation / confirmation par<input id="osc-role-authority" class="opsar-input" placeholder="SMC, centre…"></label>
            <button id="osc-role-confirm" class="opsar-btn opsar-btn-warning" style="width:100%;">Enregistrer la désignation / relève</button>`;
        roles.add(content);
        card.add(roles.element);
        card.render(document.getElementById('app'));
        this.instance = card;
        card.element.addEventListener('card:close', () => this.close());
        content.addEventListener('change', event => {
            const key = event.target.dataset.role;
            if (!key) return;
            const previous = c[key];
            c[key] = event.target.value.trim();
            if (previous !== c[key] && ['oscName','oscCallsign','smcName','smcContact','acoName','acoCallsign','controlChannel','onSceneChannel'].includes(key)) {
                TimelineService.addEvent(`Coordination mise à jour : ${key} — ${c[key] || 'non renseigné'}`);
            }
            OSCService.persist();
        });
        content.querySelector('#osc-role-confirm').addEventListener('click', () => {
            const role = content.querySelector('#osc-role-change').value;
            const value = content.querySelector('#osc-role-name').value.trim();
            const callsign = content.querySelector('#osc-role-callsign').value.trim();
            const authority = content.querySelector('#osc-role-authority').value.trim();
            if (!value) return;
            const roleName = role.toUpperCase();
            const nameKey = role === 'osc' ? 'oscName' : `${role}Name`;
            const signKey = role === 'osc' ? 'oscCallsign' : role === 'aco' ? 'acoCallsign' : 'smcContact';
            const previous = c[nameKey];
            c[nameKey] = value;
            if (callsign) c[signKey] = callsign;
            if (role === 'osc' && authority) c.designatedBy = authority;
            TimelineService.addEvent(`${roleName} ${previous ? `relevé par ${value}` : `désigné : ${value}`}${callsign ? ` (${callsign})` : ''}${authority ? ` — confirmé par ${authority}` : ''}`);
            OSCService.persist();
            content.querySelector('#osc-role-name').value = '';
            content.querySelector('#osc-role-callsign').value = '';
            content.querySelector('#osc-role-authority').value = '';
            content.querySelector(`[data-role="${nameKey}"]`).value = value;
            content.querySelector(`[data-role="${signKey}"]`).value = c[signKey] ?? '';
        });
        return card;
    }
}

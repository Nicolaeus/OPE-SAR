import BaseCard from '../../../shared/ui/cards/BaseCard.js';
import CardSection from '../../../shared/ui/cards/CardSection.js';
import BaseCardController from '../../../shared/ui/cards/BaseCardController.js';
import OSCService from '../services/OSCService.js';
import TimelineService from '../services/TimelineService.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

export default class SurvivorsCard extends BaseCardController {
    static create() {
        this.close();
        const mission = OSCService.getMission();
        if (!mission) return;
        const card = new BaseCard({ id: 'osc-survivors-card', title: 'PERSONNES SECOURUES', icon: '🛟', color: 'green' });
        const section = new CardSection('Enregistrement et répartition');
        const content = document.createElement('div');
        content.innerHTML = `
            <label class="osc-field">Nom / identifiant (laisser vide si inconnu)<input id="osc-survivor-name" class="opsar-input"></label>
            <div class="osc-coordinate-grid">
                <label class="osc-field">Nombre de personnes<input id="osc-survivor-count" type="number" min="1" step="1" value="1" class="opsar-input"></label>
                <label class="osc-field">Moyen transporteur<select id="osc-survivor-asset" class="opsar-input"><option value="">À préciser</option>${mission.assets.map(a=>`<option value="${esc(a.id)}">${esc(a.name)}${a.callsign ? ` (${esc(a.callsign)})` : ''}</option>`).join('')}</select></label>
            </div>
            <label class="osc-field">État / besoins médicaux<textarea id="osc-survivor-condition" class="opsar-input" rows="2"></textarea></label>
            <label class="osc-field">Destination / remise à terre<input id="osc-survivor-destination" class="opsar-input"></label>
            <button id="osc-survivor-add" class="opsar-btn opsar-btn-warning" style="width:100%;">Enregistrer les personnes secourues</button>
            <div id="osc-survivor-list" class="osc-record-list"></div>`;
        section.add(content); card.add(section.element); card.render(document.getElementById('app')); this.instance = card;
        card.element.addEventListener('card:close', () => this.close());
        const refresh = () => {
            const list = content.querySelector('#osc-survivor-list');
            list.innerHTML = mission.survivors.map(person => {
                const asset = mission.assets.find(item => item.id === person.assetId);
                return `<details class="osc-record-row"><summary>${person.count ?? 1} personne(s)${person.name ? ` — ${esc(person.name)}` : ' — identité inconnue'}</summary>
                    <label class="osc-field">État<select data-id="${esc(person.id)}" data-key="status" class="opsar-input">${['à évaluer','stable','blessé','urgence médicale','décédé','remis à terre'].map(s=>`<option ${person.status===s?'selected':''}>${s}</option>`).join('')}</select></label>
                    <label class="osc-field">Moyen transporteur<select data-id="${esc(person.id)}" data-key="assetId" class="opsar-input"><option value="">À préciser</option>${mission.assets.map(a=>`<option value="${esc(a.id)}" ${person.assetId===a.id?'selected':''}>${esc(a.name)}</option>`).join('')}</select></label>
                    <label class="osc-field">État / besoins<textarea data-id="${esc(person.id)}" data-key="condition" class="opsar-input">${esc(person.condition)}</textarea></label>
                    <label class="osc-field">Destination<input data-id="${esc(person.id)}" data-key="destination" class="opsar-input" value="${esc(person.destination)}"></label>
                    <div class="osc-muted">Pris en charge : ${esc(new Date(person.timestamp).toLocaleString('fr-FR'))}${asset ? ` · ${esc(asset.name)}` : ''}</div>
                    <button type="button" data-remove="${esc(person.id)}" class="opsar-btn opsar-btn-danger">Supprimer l’entrée</button></details>`;
            }).join('') || '<div class="osc-muted">Aucune personne enregistrée.</div>';
        };
        content.querySelector('#osc-survivor-add').addEventListener('click', () => {
            const count = Number(content.querySelector('#osc-survivor-count').value);
            if (!Number.isInteger(count) || count < 1) return;
            OSCService.addSurvivor({
                name: content.querySelector('#osc-survivor-name').value.trim(),
                count,
                assetId: content.querySelector('#osc-survivor-asset').value || null,
                condition: content.querySelector('#osc-survivor-condition').value.trim(),
                destination: content.querySelector('#osc-survivor-destination').value.trim(),
                timestamp: new Date()
            });
            content.querySelector('#osc-survivor-name').value = '';
            content.querySelector('#osc-survivor-count').value = 1;
            content.querySelector('#osc-survivor-condition').value = '';
            content.querySelector('#osc-survivor-destination').value = '';
            refresh();
        });
        content.addEventListener('change', event => {
            const { id, key } = event.target.dataset;
            if (!id || !key) return;
            const person = mission.survivors.find(item => item.id === id);
            if (!person) return;
            person[key] = event.target.value;
            if (key === 'status' && event.target.value === 'remis à terre') person.disembarkedAt = new Date();
            TimelineService.addEvent(`Prise en charge — ${person.name || 'identité inconnue'} : ${key} mis à jour`);
            OSCService.persist();
        });
        content.addEventListener('click', event => {
            const id = event.target.dataset.remove;
            if (!id) return;
            mission.survivors = mission.survivors.filter(item => item.id !== id);
            TimelineService.addEvent('Entrée de personne secourue supprimée');
            OSCService.persist(); refresh();
        });
        refresh();
        return card;
    }
}

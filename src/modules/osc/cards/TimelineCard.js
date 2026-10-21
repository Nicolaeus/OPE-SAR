import BaseCard from '../../../shared/ui/cards/BaseCard.js';
import CardSection from '../../../shared/ui/cards/CardSection.js';
import BaseCardController from '../../../shared/ui/cards/BaseCardController.js';
import OSCService from '../services/OSCService.js';
import TimelineService from '../services/TimelineService.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

export default class TimelineCard extends BaseCardController {
    static record(message, author = 'OSC', type = 'info') {
        TimelineService.addEvent(message, author, type);
        if (this.isOpen()) this.refresh();
    }

    static create() {
        this.close();
        const mission = OSCService.getMission();
        if (!mission) return;
        const card = new BaseCard({ id: 'osc-timeline-card', title: 'JOURNAL OPÉRATIONNEL', icon: '🕒', color: 'blue' });
        const section = new CardSection('Événements et observations');
        const content = document.createElement('div');
        content.innerHTML = `
            <label class="osc-field">Nouvel événement<textarea id="osc-timeline-message" class="opsar-input" rows="2" placeholder="Action, décision, changement de plan…"></textarea></label>
            <label class="osc-field">Auteur / fonction<input id="osc-timeline-author" class="opsar-input" value="OSC"></label>
            <button id="osc-add-event" class="opsar-btn" style="width:100%;">Ajouter au journal</button>
            <hr><b>Observation / résultat sur zone</b>
            <label class="osc-field">Type<select id="osc-observation-type" class="opsar-input"><option>Observation</option><option>Contact visuel</option><option>Signal / indice</option><option>Fausse alerte</option><option>Personne / objet localisé</option><option>Résultat de recherche</option></select></label>
            <label class="osc-field">Description<textarea id="osc-observation-description" class="opsar-input" rows="2"></textarea></label>
            <div class="osc-coordinate-grid"><label class="osc-field">Latitude<input id="osc-observation-lat" class="opsar-input" type="number" step="any"></label><label class="osc-field">Longitude<input id="osc-observation-lng" class="opsar-input" type="number" step="any"></label></div>
            <label class="osc-field">Moyen / source<input id="osc-observation-source" class="opsar-input"></label>
            <label class="osc-field">Action et résultat<textarea id="osc-observation-action" class="opsar-input" rows="2"></textarea></label>
            <button id="osc-add-observation" class="opsar-btn opsar-btn-warning" style="width:100%;">Enregistrer l’observation</button>
            <div id="osc-observations-list" class="osc-record-list"></div>
            <hr><b>Chronologie</b><div id="osc-timeline-list" class="osc-record-list"></div>`;
        section.add(content); card.add(section.element); card.render(document.getElementById('app')); this.instance = card;
        card.element.addEventListener('card:close', () => this.close());
        content.querySelector('#osc-add-event').addEventListener('click', () => {
            const message = content.querySelector('#osc-timeline-message').value.trim();
            if (!message) return;
            TimelineService.addEvent(message, content.querySelector('#osc-timeline-author').value.trim() || 'OSC');
            content.querySelector('#osc-timeline-message').value = '';
            this.refresh();
        });
        content.querySelector('#osc-add-observation').addEventListener('click', () => {
            const description = content.querySelector('#osc-observation-description').value.trim();
            if (!description) return;
            const lat = content.querySelector('#osc-observation-lat').value;
            const lng = content.querySelector('#osc-observation-lng').value;
            if ((lat === '') !== (lng === '')) return;
            const position = lat === '' ? null : { lat: Number(lat), lng: Number(lng) };
            if (position && (!Number.isFinite(position.lat) || !Number.isFinite(position.lng) || Math.abs(position.lat) > 90 || Math.abs(position.lng) > 180)) return;
            OSCService.addObservation({
                type: content.querySelector('#osc-observation-type').value,
                description,
                position,
                source: content.querySelector('#osc-observation-source').value.trim(),
                action: content.querySelector('#osc-observation-action').value.trim()
            });
            content.querySelector('#osc-observation-description').value = '';
            content.querySelector('#osc-observation-lat').value = '';
            content.querySelector('#osc-observation-lng').value = '';
            content.querySelector('#osc-observation-source').value = '';
            content.querySelector('#osc-observation-action').value = '';
            this.refresh();
        });
        this.refresh();
        return card;
    }

    static refresh() {
        const events = document.getElementById('osc-timeline-list');
        const observations = document.getElementById('osc-observations-list');
        if (!events) return;
        events.innerHTML = TimelineService.getEvents().map(event => `<div class="osc-timeline-row">
            <div class="osc-timeline-time">${esc(new Date(event.timestamp).toLocaleString('fr-FR'))}</div>
            <div class="osc-timeline-message"><b>${esc(event.author)}</b> : ${esc(event.message)}</div></div>`).join('') || '<div class="osc-muted">Aucun événement consigné.</div>';
        if (observations) observations.innerHTML = (OSCService.getMission()?.observations ?? []).map(item => `<div class="osc-record-row">
            <div class="osc-timeline-time">${esc(new Date(item.timestamp).toLocaleString('fr-FR'))} · ${esc(item.type)}</div>
            <b>${esc(item.source || 'Source à préciser')}</b><div>${esc(item.description)}</div>
            ${item.position ? `<div class="osc-muted">${Number(item.position.lat).toFixed(5)}, ${Number(item.position.lng).toFixed(5)}</div>` : ''}
            ${item.action ? `<div>Action / résultat : ${esc(item.action)}</div>` : ''}</div>`).join('') || '<div class="osc-muted">Aucune observation enregistrée.</div>';
    }
}

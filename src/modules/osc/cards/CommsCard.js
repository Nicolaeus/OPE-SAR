import BaseCard from '../../../shared/ui/cards/BaseCard.js';
import CardSection from '../../../shared/ui/cards/CardSection.js';
import BaseCardController from '../../../shared/ui/cards/BaseCardController.js';
import CommsService from '../services/CommsService.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

export default class CommsCard extends BaseCardController {
    static create() {
        this.close();
        const card = new BaseCard({ id: 'osc-comms-card', title: 'COMMUNICATIONS', icon: '📡', color: 'purple' });
        const section = new CardSection('Journal radio — saisie manuelle');
        const content = document.createElement('div');
        content.innerHTML = `
            <div class="osc-muted">Ce journal consigne les échanges saisis par l’opérateur. Il ne se connecte pas à la VHF et ne remplace pas les procédures radio.</div>
            <label class="osc-field">Canal / fréquence<input id="osc-comms-channel" class="opsar-input" placeholder="Canal 16, canal opérationnel…"></label>
            <div class="osc-coordinate-grid">
                <label class="osc-field">Émetteur / indicatif<input id="osc-comms-sender" class="opsar-input"></label>
                <label class="osc-field">Destinataire<input id="osc-comms-recipient" class="opsar-input"></label>
            </div>
            <label class="osc-field">Message / compte rendu<textarea id="osc-comms-message" class="opsar-input" rows="3"></textarea></label>
            <label class="osc-field osc-checkbox"><input id="osc-comms-ack" type="checkbox"> Accusé de réception reçu</label>
            <button id="osc-add-log" class="opsar-btn opsar-btn-warning" style="width:100%;">Enregistrer l’échange</button>
            <div id="osc-comms-log" class="osc-record-list"></div>`;
        section.add(content); card.add(section.element); card.render(document.getElementById('app')); this.instance = card;
        card.element.addEventListener('card:close', () => this.close());
        content.querySelector('#osc-add-log').addEventListener('click', () => {
            const message = content.querySelector('#osc-comms-message').value.trim();
            if (!message) return;
            CommsService.addLog({
                channel: content.querySelector('#osc-comms-channel').value.trim(),
                sender: content.querySelector('#osc-comms-sender').value.trim(),
                recipient: content.querySelector('#osc-comms-recipient').value.trim(),
                message,
                acknowledged: content.querySelector('#osc-comms-ack').checked
            });
            content.querySelector('#osc-comms-message').value = '';
            content.querySelector('#osc-comms-ack').checked = false;
            this._refresh();
        });
        this._refresh();
        return card;
    }

    static _refresh() {
        const container = document.getElementById('osc-comms-log');
        if (!container) return;
        container.innerHTML = CommsService.getLogs().map(log => `<div class="osc-record-row">
            <div class="osc-timeline-time">${esc(new Date(log.timestamp).toLocaleString('fr-FR'))} · ${esc(log.channel || 'Canal non précisé')}</div>
            <b>${esc(log.sender || 'Émetteur à préciser')}</b> → <b>${esc(log.recipient || 'Destinataire à préciser')}</b>
            <div>${esc(log.message)}</div><div class="osc-muted">Accusé de réception : ${log.acknowledged ? 'oui' : 'non renseigné'}</div>
        </div>`).join('') || '<div class="osc-muted">Aucun échange consigné.</div>';
    }
}

/**
 * PatternCard.js
 * Card de configuration et génération des patterns de recherche SAR.
 * Affichée automatiquement après le calcul du DATUM.
 */
import BaseCard           from '../../../shared/ui/cards/BaseCard.js';
import CardSection        from '../../../shared/ui/cards/CardSection.js';
import BaseCardController from '../../../shared/ui/cards/BaseCardController.js';

import NotificationService from '../../../core/services/NotificationService.js';
import PatternGenerator from '../search_patterns/PatternGenerator.js';

export default class PatternCard extends BaseCardController {

    static currentSar = null;

    // Labels lisibles pour les types
    static _labels = {
        square:   'Carré',
        sector:   'Secteur',
        parallel: 'Parallèles',
        creeping: 'Raquette'
    };

    static create(sar) {

        if (!sar) return;

        // On ferme l'instance précédente s'il en existe une
        if (this.instance) {
            this.instance.element.remove();
            this.instance = null;
        }

        this.currentSar = sar;

        const card = new BaseCard({
            id:    'pattern-card',
            title: 'PATTERN DE RECHERCHE',
            color: 'orange',
            icon:  '🔍'
        });

        // Section paramètres
        const section = new CardSection('Paramètres — basé sur le DATUM');

        const content = document.createElement('div');
        content.innerHTML = `

            <div class="opsar-form-group">
                <label>Type de pattern</label>
                <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px;" id="pattern-type-group">
                    ${Object.entries(PatternCard._labels).map(([k, v]) => `
                        <button class="opsar-btn pattern-type-btn ${k === (sar.pattern ?? 'square') ? 'active' : ''}"
                                data-type="${k}"
                                style="flex:1;min-width:80px;font-size:0.7rem;">
                            ${v}
                        </button>`).join('')}
                </div>
                <input type="hidden" id="pattern-type" value="${sar.pattern ?? 'square'}">
            </div>

            <div class="opsar-row" style="margin-top:8px;">
                <span>Espacement (S)</span>
                <div style="display:flex;align-items:center;gap:4px;">
                    <input id="pattern-spacing" type="number" class="opsar-input"
                           value="0.3" step="0.1" min="0.1" style="width:60px;">
                    <span class="opsar-unit">MN</span>
                </div>
            </div>

            <div class="opsar-row">
                <span>Nombre de passes</span>
                <input id="pattern-passes" type="number" class="opsar-input"
                       value="4" min="2" max="12" style="width:60px;">
            </div>

            <div class="opsar-row" id="row-orientation" style="display:none;">
                <span>Orientation</span>
                <div style="display:flex;align-items:center;gap:4px;">
                    <input id="pattern-orientation" type="number" class="opsar-input"
                           value="0" min="0" max="360" style="width:60px;">
                    <span class="opsar-unit">°</span>
                </div>
            </div>

            <div class="opsar-row" id="row-sector-angle" style="display:none;">
                <span>Angle secteur</span>
                <div style="display:flex;align-items:center;gap:4px;">
                    <input id="pattern-sector-angle" type="number" class="opsar-input"
                           value="120" min="30" max="300" style="width:60px;">
                    <span class="opsar-unit">°</span>
                </div>
            </div>

            <div class="opsar-row">
                <span>Rayon incertitude</span>
                <div style="display:flex;align-items:center;gap:4px;">
                    <input id="pattern-radius" type="number" class="opsar-input"
                           value="${sar.searchRadius.toFixed(2)}" step="0.1" min="0.1" style="width:60px;">
                    <span class="opsar-unit">MN</span>
                </div>
            </div>

            <!-- Statistiques -->
            <div id="pattern-stats" style="display:none;margin-top:10px;
                 background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);
                 border-radius:6px;padding:8px;font-size:0.75rem;color:#fbbf24;">
            </div>

            <button id="generate-pattern-btn" class="opsar-btn opsar-btn-warning"
                    style="width:100%;margin-top:10px;">
                🔍 Générer le pattern
            </button>
            <button id="clear-pattern-btn" class="opsar-btn opsar-btn-secondary"
                    style="width:100%;margin-top:6px;font-size:0.72rem;">
                🗑 Effacer le pattern
            </button>
        `;

        section.add(content);
        card.add(section.element);
        card.render(document.getElementById('app'));
        this.instance = card;

        card.element.addEventListener('card:close', () => PatternCard.close());

        // Bind events après rendu
        setTimeout(() => PatternCard._bindEvents(), 50);

        return card;
    }

    // ------------------------------------------------------------------
    // Événements
    // ------------------------------------------------------------------
    static _bindEvents() {

        // Sélection du type par bouton
        document.getElementById('pattern-type-group')
            ?.addEventListener('click', e => {
                const btn = e.target.closest('.pattern-type-btn');
                if (!btn) return;

                document.querySelectorAll('.pattern-type-btn')
                    .forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const type = btn.dataset.type;
                document.getElementById('pattern-type').value = type;

                // Affichage conditionnel des options
                const showOrientation = ['parallel', 'creeping'].includes(type);
                const showSector      = type === 'sector';
                document.getElementById('row-orientation')?.style.setProperty(
                    'display', showOrientation ? 'flex' : 'none');
                document.getElementById('row-sector-angle')?.style.setProperty(
                    'display', showSector ? 'flex' : 'none');
            });

        // Générer
        document.getElementById('generate-pattern-btn')
            ?.addEventListener('click', () => PatternCard._generate());

        // Effacer
        document.getElementById('clear-pattern-btn')
            ?.addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('sar:pattern:clear'));
                document.getElementById('pattern-stats').style.display = 'none';
            });
    }

    static _generate() {
        const sar = this.currentSar;
        if (!sar?.datum) {
            NotificationService.warning(
                'Aucun DATUM disponible. Calculez d\'abord la derive SAR.'
            );
            return;
        }

        const type        = document.getElementById('pattern-type').value;
        const spacing     = parseFloat(document.getElementById('pattern-spacing').value)     || 0.3;
        const passes      = parseInt(document.getElementById('pattern-passes').value)        || 4;
        const orientation = parseFloat(document.getElementById('pattern-orientation').value) || 0;
        const sectorAngle = parseFloat(document.getElementById('pattern-sector-angle').value)|| 120;
        const radius      = parseFloat(document.getElementById('pattern-radius').value)
                            || sar.searchRadius;

        // Vitesse navire depuis le service global
        const shipSpeed = parseFloat(window.OPESAR?.Fleet?.getCurrentSpeed?.()) || 10;

        let result;
        try {
            result = PatternGenerator.generate({
                type,
                center: sar.datum,
                radius,
                spacing,
                passes,
                orientation,
                sectorAngle,
                shipSpeed
            });
        } catch (err) {
            console.error('PatternGenerator error:', err);
            NotificationService.error(
                `Erreur lors de la generation du pattern : ${err.message}`
            );
            return;
        }

        // Affichage des stats
        const statsEl = document.getElementById('pattern-stats');
        if (statsEl && result.stats) {
            statsEl.innerHTML =
                `Distance totale : <b>${result.stats.totalNm} MN</b> &nbsp;|&nbsp;
                 Durée estimée : <b>${result.stats.durationMin} min</b>`;
            statsEl.style.display = 'block';
        }

        // Diffusion vers SARLayer et index.js
        window.dispatchEvent(new CustomEvent('sar:pattern:generated', { detail: result }));
    }

    static isOpen() {
        return !!this.instance;
    }
}

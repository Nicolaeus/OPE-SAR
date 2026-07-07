/**
 * SARCard.js
 * Card principale du module SAR.
 * Gère l'UI, la saisie DMS, les temps et orchestre les calculs via SARService.
 */
import BaseCard           from '../../../shared/ui/cards/BaseCard.js';
import CardSection        from '../../../shared/ui/cards/CardSection.js';
import BaseCardController from '../../../shared/ui/cards/BaseCardController.js';

import NotificationService from '../../../core/services/NotificationService.js';
import StationReferenceService from '../../stations/services/StationReferenceService.js';
import StationService from '../../stations/services/StationService.js';
import SARService from '../services/SARService.js';
import SARLayer   from '../layers/SARLayer.js';
import RoutePlanner from '../routing/RoutePlanner.js';

export default class SARCard extends BaseCardController {

    // ------------------------------------------------------------------
    // État local
    // ------------------------------------------------------------------
    static _wind    = { speed: 0, direction: 0 };   // mis à jour par weather:updated
    static _lkp     = null;                          // { lat, lng } validé
    static _unsubWx = null;                          // listener météo à nettoyer

    // ------------------------------------------------------------------
    // Création de la card
    // ------------------------------------------------------------------
    static create() {

        if (this.instance) {
            this.instance.element.remove();
            this.instance = null;
        }

        const now = new Date().toTimeString().substring(0, 5);

        const card = new BaseCard({
            id:    'sar-card',
            title: 'MISSION SAR',
            color: 'red',
            icon:  '🚨'
        });

        // ① CIBLE
        const targetSection = new CardSection('1- Cible');
        targetSection.add(this._buildTarget());
				
        // ② POSITION LKP
        const lkpSection = new CardSection('2- Position LKP');
        lkpSection.add(this._buildLKP());

        // ③ HEURES
        const timeSection = new CardSection('3- Heures');
        timeSection.add(this._buildTime(now));

        // ④ COURANT
        const currentSection = new CardSection('4- Courant');
        currentSection.add(this._buildCurrent());

        // ⑤ HOULE
        const swellSection = new CardSection('5- Houle');
        swellSection.add(this._buildSwell());

        // ⑥ DÉRIVE
        const driftSection = new CardSection('6- Dérive calculée');
        driftSection.add(this._buildDrift());

        // ⑦ INTERCEPTION
        const etaSection = new CardSection('7- Interception');
        etaSection.add(this._buildETA());

        // ⑧ PATTERN
        const patternSection = new CardSection('8- Pattern recommandé');
        patternSection.add(this._buildPattern());

        // Assemblage
        [targetSection, lkpSection, timeSection, currentSection,
         swellSection, driftSection, etaSection, patternSection
        ].forEach(s => card.add(s.element));

        card.render(document.getElementById('app'));
        this.instance = card;

        // Bouton RAZ dans le header si BaseCard le supporte, sinon on l'injecte
        this._injectResetButton(card);

        // Branchement événements après rendu
        setTimeout(() => this._bindEvents(), 50);

        // Écoute les mises à jour météo pour récupérer vent en temps réel
        this._unsubWx = e => {
            if (e.detail?.windSpeed    !== undefined) this._wind.speed     = e.detail.windSpeed;
            if (e.detail?.windDirection !== undefined) this._wind.direction = e.detail.windDirection;
        };
        window.addEventListener('weather:updated', this._unsubWx);

        card.element.addEventListener('card:close', () => SARCard.close());

        return card;
    }

    // ------------------------------------------------------------------
    // Constructeurs HTML des sections
    // ------------------------------------------------------------------
    static _buildTarget() {
        const el = document.createElement('div');

el.innerHTML = `

    <div class="opsar-form-group">

        <label>

            Type de cible

        </label>

        <div
            style="
                display:flex;
                align-items:center;
                gap:10px;
            ">

            <select
                id="sar-target-type"
                class="opsar-input"
                style="flex:1;">

                <option value="mob">
                    Homme à la mer
                </option>

                <option value="liferaft">
                    Canot de survie
                </option>

                <option value="kayak">
                    Kayak
                </option>

                <option value="paddle">
                    Paddle
                </option>

                <option value="sailboat">
                    Voilier (mât debout)
                </option>

                <option
                    value="motorboat"
                    selected>

                    Plaisance (moteur)

                </option>

            </select>

            <div
                id="sar-eta-banner"
                style="
                    min-width:90px;
                    text-align:right;
                    font-weight:700;
                    color:#4ade80;
                    white-space:nowrap;
                ">

                ETA : --

            </div>

        </div>

    </div>

`;
        return el;
    }

    static _buildLKP() {
        const el = document.createElement('div');
        el.innerHTML = `
            <div class="opsar-sar-dms">
                <label>LAT</label>
                <input id="sar-lat-deg" class="opsar-input" type="number" min="0" max="90"  placeholder="47">
                <span class="opsar-dms-sep">°</span>
                <input id="sar-lat-min" class="opsar-input" type="number" min="0" max="59"  placeholder="48">
                <span class="opsar-dms-sep">'</span>
                <input id="sar-lat-sec" class="opsar-input" type="number" min="0" max="59"  placeholder="04">
                <span class="opsar-dms-sep">"</span>
                <select id="sar-lat-hem" class="opsar-input"><option>N</option><option>S</option></select>
            </div>
            <div class="opsar-sar-dms">
                <label>LON</label>
                <input id="sar-lon-deg" class="opsar-input" type="number" min="0" max="180" placeholder="003">
                <span class="opsar-dms-sep">°</span>
                <input id="sar-lon-min" class="opsar-input" type="number" min="0" max="59"  placeholder="44">
                <span class="opsar-dms-sep">'</span>
                <input id="sar-lon-sec" class="opsar-input" type="number" min="0" max="59"  placeholder="34">
                <span class="opsar-dms-sep">"</span>
                <select id="sar-lon-hem" class="opsar-input"><option>W</option><option>E</option></select>
            </div>
            <div id="sar-lkp-status" style="font-size:0.7rem;margin-top:6px;color:#64748b;">
                En attente de position…
            </div>
            <div id="sar-decimal-position" style="font-size:0.7rem;margin-top:4px;color:#64748b;">
                -- , --
            </div>
            <div class="opsar-lkp-paste">
                <input
                    id="sar-lkp-paste-input"
                    class="opsar-input"
                    type="text"
                    placeholder="Coller coordonnées GPS">
                <button
                    id="sar-lkp-paste-btn"
                    class="opsar-btn opsar-btn-secondary"
                    type="button">
                    Coller
                </button>
            </div>
            <div class="opsar-sar-actions" style="margin-top:8px;">
                <button id="sar-validate-lkp" class="opsar-btn opsar-btn-danger">🎯 Valider</button>
                <button id="sar-map-btn"       class="opsar-btn opsar-btn-secondary">📍 POS. CARTE</button>
            </div>
            `;
        return el;
    }

    static _buildTime(now) {
        const el = document.createElement('div');
        el.innerHTML = `
            <div class="opsar-row">
                <span>Heure LKP</span>
                <input id="sar-lkp-time" type="time" class="opsar-input" value="${now}">
            </div>
            <div class="opsar-row" style="margin-top:6px;">
                <span>Départ</span>
                <div style="display:flex;gap:4px;align-items:center;">
                    <button id="sar-plus15" class="opsar-btn" style="padding:0 8px;height:30px;">+15</button>
                    <button id="sar-now"    class="opsar-btn" style="padding:0 8px;height:30px;background:#2e7d32;color:#fff;">NOW</button>
                    <input  id="sar-depart-time" type="time" class="opsar-input" value="${now}">
                </div>
            </div>`;
        return el;
    }

    static _buildCurrent() {
        const el = document.createElement('div');
        el.innerHTML = `
            <div class="opsar-row">
                <span>Portant au (direction)</span>
                <div style="display:flex;align-items:center;gap:4px;">
                    <input id="sar-current-dir"   type="number" class="opsar-input" value="270" style="width:60px;">
                    <span class="opsar-unit">°</span>
                </div>
            </div>
            <div class="opsar-row">
                <span>Vitesse</span>
                <div style="display:flex;align-items:center;gap:4px;">
                    <input id="sar-current-speed" type="number" class="opsar-input" value="1.0" step="0.1" style="width:60px;">
                    <span class="opsar-unit">kts</span>
                </div>
            </div>`;
        return el;
    }

    static _buildSwell() {
        const el = document.createElement('div');
        el.innerHTML = `
            <div class="opsar-row">
                <span>Venant du</span>
                <div style="display:flex;align-items:center;gap:4px;">
                    <input id="sar-wave-dir" type="number" class="opsar-input" placeholder="---" style="width:60px;">
                    <span class="opsar-unit">°</span>
                </div>
            </div>
            <div id="sar-swell-label" class="opsar-sar-info">↑ Auto météo — éditable</div>`;
        return el;
    }

    static _buildDrift() {
        const el = document.createElement('div');
        el.innerHTML = `
            <div id="sar-result" class="opsar-sar-result" style="margin-bottom:10px;">
                -- nds @ --°
            </div>
            <button id="sar-compute-btn" class="opsar-btn opsar-btn-danger" style="width:100%;">
                🚨 MAJ DÉRIVE
            </button>
            `;
        return el;
    }

    static _buildETA() {
        const el = document.createElement('div');
        el.innerHTML = `
            <div class="opsar-sar-grid">
                <div>
                    <small>Temps</small>
                    <strong id="sar-eta-time">-- min</strong>
                </div>
                <div>
                    <small>Distance</small>
                    <strong id="sar-eta-dist">-- MN</strong>
                </div>
                <div>
                    <small>Cap direct</small>
                    <strong id="sar-eta-cap">--°</strong>
                </div>
                <div>
                    <small>Route</small>
                    <strong id="sar-eta-route" style="color:#4ade80;">DIRECTE</strong>
                </div>
            </div>
            <div id="sar-swell-warning" style="display:none;margin-top:8px;padding:7px;border-radius:5px;
                 background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.4);
                 font-size:0.75rem;color:#fbbf24;">
            </div>`;
        return el;
    }

    static _buildPattern() {
        const el = document.createElement('div');
        el.className = 'opsar-sar-pattern-block';
        el.innerHTML = `
            <div class="opsar-sar-pattern">
                <span id="sar-pattern-name">En attente</span>
                <button id="sar-generate-pattern" class="opsar-btn opsar-btn-warning opsar-sar-pattern-open" type="button">
                    OUVRIR
                </button>
            </div>

            <div id="sar-pattern-reason" class="opsar-sar-info">
                En attente du calcul SAR
            </div>
            `;
        return el;
    }

static _buildraz(){
const el = document.createElement('div');
el.innerHTML = `
<button id="sar-reset-btn" class="opsar-btn opsar-btn-secondary" style="width:100%;margin-top:6px;">
                🔄 Réinitialiser la mission
            </button>
			`;
        return el;
    }

    // ------------------------------------------------------------------
    // Injection du bouton RAZ dans le header
    // ------------------------------------------------------------------
    static _injectResetButton(card) {
        const header = card.element?.querySelector('.card-header, h4');
        if (!header) return;
        const raz = document.createElement('button');
        raz.id        = 'sar-header-raz';
        raz.textContent = 'RAZ';
        raz.style.cssText = 'background:#ef4444;color:#fff;border:none;padding:2px 10px;border-radius:4px;font-size:0.65rem;font-weight:bold;cursor:pointer;margin-left:auto;';
        raz.addEventListener('click', e => { e.stopPropagation(); SARCard._resetMission(); });
        header.appendChild(raz);
    }

    // ------------------------------------------------------------------
    // Branchement de tous les événements
    // ------------------------------------------------------------------
    static _bindEvents() {

        // DMS → aperçu décimal en direct
        ['sar-lat-deg','sar-lat-min','sar-lat-sec','sar-lat-hem',
         'sar-lon-deg','sar-lon-min','sar-lon-sec','sar-lon-hem'
        ].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => this._previewDMS());
            document.getElementById(id)?.addEventListener('change', () => this._previewDMS());
        });

        // Valider LKP via DMS
        document.getElementById('sar-validate-lkp')?.addEventListener('click', () => {
            this._validateLKPFromDMS();
        });

        const pasteInput =
            document.getElementById('sar-lkp-paste-input');

        pasteInput?.addEventListener(
            'paste',
            event => {

                window.setTimeout(
                    () => this._applyPastedCoordinates(
                        event.target.value
                    ),
                    0
                );

            }
        );

        pasteInput?.addEventListener(
            'keydown',
            event => {

                if (event.key !== 'Enter') {
                    return;
                }

                event.preventDefault();

                this._applyPastedCoordinates(
                    event.target.value
                );

            }
        );

        document.getElementById('sar-lkp-paste-btn')?.addEventListener('click', async () => {

            let value =
                pasteInput?.value || '';

            if (
                !value &&
                navigator.clipboard?.readText
            ) {

                try {

                    value =
                        await navigator.clipboard.readText();

                    if (pasteInput) {
                        pasteInput.value =
                            value;
                    }

                } catch(error) {

                    NotificationService.warning(
                        'Collage automatique indisponible. Collez les coordonnées dans le champ.'
                    );

                    return;

                }

            }

            this._applyPastedCoordinates(
                value
            );

        });

        // Placer LKP via clic carte
        document.getElementById('sar-map-btn')?.addEventListener('click', () => {
            SARLayer.startLKPPlacement();
            document.getElementById('sar-lkp-status').textContent = 'Cliquez sur la carte pour placer le LKP…';
        });

        window.addEventListener('sar:lkp:selected', e => {

			this._lkp = e.detail;

			this._updateDMSFromLatLng(
				e.detail.lat,
				e.detail.lng
			);

			this._previewDMS();

			this._updateLkpStatus(
				true
			);

			setTimeout(
				() => this._compute(),
				100
			);

		});

        // +15 min
        document.getElementById('sar-plus15')?.addEventListener('click', () => {
            const lkpVal = document.getElementById('sar-lkp-time').value;
            if (!lkpVal) return;
            const [h, m] = lkpVal.split(':').map(Number);
            const d = new Date(); d.setHours(h, m + 15);
            document.getElementById('sar-depart-time').value =
                d.getHours().toString().padStart(2,'0') + ':' +
                d.getMinutes().toString().padStart(2,'0');
        });

        // NOW
        document.getElementById('sar-now')?.addEventListener('click', () => {
            const now = new Date();
            document.getElementById('sar-depart-time').value =
                now.getHours().toString().padStart(2,'0') + ':' +
                now.getMinutes().toString().padStart(2,'0');
        });

        // Houle : détecter édition manuelle
        document.getElementById('sar-wave-dir')?.addEventListener('input', () => {
            const label = document.getElementById('sar-swell-label');
            if (label) { label.textContent = '✏ Saisie manuelle'; label.style.color = '#fbbf24'; }
        });

        // Bouton CALCULER
        document.getElementById('sar-compute-btn')?.addEventListener('click', () => {
            this._compute();
        });

        // Bouton RESET
        document.getElementById('sar-reset-btn')?.addEventListener('click', () => {
            this._resetMission();
        });

        // Bouton GÉNÉRER LE PATTERN
        document.getElementById('sar-generate-pattern')?.addEventListener('click', () => {
            const sar = SARService.getCurrent();
            if (!sar) {
                NotificationService.warning(
                    'Calculez d\'abord la derive.'
                );
                return;
            }
            window.dispatchEvent(new CustomEvent('sar:pattern', { detail: sar }));
        });
    }

    // ------------------------------------------------------------------
    // Aperçu DMS → décimal
    // ------------------------------------------------------------------
    static _dmsToDecimal(deg, min, sec, hem) {
        const d = parseFloat(deg) + (parseFloat(min) || 0) / 60 + (parseFloat(sec) || 0) / 3600;
        return (hem === 'S' || hem === 'W') ? -d : d;
    }

    static _applyPastedCoordinates(value) {

        const parsed =
            this._parseCoordinates(
                value
            );

        if (!parsed) {

            NotificationService.warning(
                'Coordonnées non reconnues. Exemple : 47.8006, -3.7376 ou 47°48\'04"N 003°44\'34"W.'
            );

            return;

        }

        this._lkp =
            parsed;

        this._updateDMSFromLatLng(
            parsed.lat,
            parsed.lng
        );

        this._previewDMS();

        SARLayer.setLKP(
            parsed.lat,
            parsed.lng
        );

        this._updateLkpStatus(
            true
        );

        NotificationService.success(
            'Position LKP importée.'
        );

    }

    static _parseCoordinates(value) {

        if (!value) {
            return null;
        }

        const rawText =
            String(value)
                .trim()
                .replace(/[−–—]/g, '-')
                .replace(/\s+/g, ' ');

        const decimalText =
            rawText.replace(
                /(\d),(\d)/g,
                '$1.$2'
            );

        const dms =
            this._parseDmsCoordinates(
                decimalText
            );

        if (dms) {
            return dms;
        }

        const numbers =
            decimalText.match(
                /[-+]?\d+(?:\.\d+)?/g
            ) || [];

        if (numbers.length < 2) {
            return null;
        }

        return this._normalizeParsedCoordinates(
            parseFloat(numbers[0]),
            parseFloat(numbers[1]),
            decimalText
        );

    }

    static _parseDmsCoordinates(text) {

        const pattern =
            /([NSWE])?\s*(\d{1,3})(?:[°º\s]+(\d{1,2}(?:\.\d+)?))?(?:['’′\s]+(\d{1,2}(?:\.\d+)?))?(?:"|”|″)?\s*([NSWE])?/gi;

        const coords = [];

        let match;

        while (
            (match = pattern.exec(text))
        ) {

            const hem =
                (
                    match[1] ||
                    match[5] ||
                    ''
                ).toUpperCase();

            if (!hem) {
                continue;
            }

            const deg =
                parseFloat(match[2]);

            const min =
                parseFloat(match[3] || 0);

            const sec =
                parseFloat(match[4] || 0);

            let decimal =
                deg +
                min / 60 +
                sec / 3600;

            if (
                hem === 'S' ||
                hem === 'W'
            ) {
                decimal *= -1;
            }

            coords.push({
                hem,
                value:
                    decimal
            });

        }

        const lat =
            coords.find(coord =>
                coord.hem === 'N' ||
                coord.hem === 'S'
            )?.value;

        const lng =
            coords.find(coord =>
                coord.hem === 'E' ||
                coord.hem === 'W'
            )?.value;

        if (
            lat === undefined ||
            lng === undefined
        ) {
            return null;
        }

        return this._normalizeParsedCoordinates(
            lat,
            lng,
            text
        );

    }

    static _normalizeParsedCoordinates(lat, lng, sourceText = '') {

        if (
            Number.isNaN(lat) ||
            Number.isNaN(lng)
        ) {
            return null;
        }

        const text =
            sourceText.toUpperCase();

        if (
            text.includes('S') &&
            lat > 0
        ) {
            lat *= -1;
        }

        if (
            text.includes('W') &&
            lng > 0
        ) {
            lng *= -1;
        }

        if (
            lat < -90 ||
            lat > 90 ||
            lng < -180 ||
            lng > 180
        ) {
            return null;
        }

        return {
            lat,
            lng
        };

    }

    static _previewDMS() {
        const latDeg = document.getElementById('sar-lat-deg').value;
        const lonDeg = document.getElementById('sar-lon-deg').value;
        const display = document.getElementById('sar-decimal-position');
        if (!display) {
            return;
        }

        if (!latDeg || !lonDeg) { display.textContent = '-- , --'; return; }

        const lat = this._dmsToDecimal(
            latDeg,
            document.getElementById('sar-lat-min').value,
            document.getElementById('sar-lat-sec').value,
            document.getElementById('sar-lat-hem').value
        );
        const lng = this._dmsToDecimal(
            lonDeg,
            document.getElementById('sar-lon-min').value,
            document.getElementById('sar-lon-sec').value,
            document.getElementById('sar-lon-hem').value
        );

        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            display.textContent   = '⚠ Coordonnées invalides';
            display.style.color   = '#ef4444';
        } else {
            display.textContent   = `${lat.toFixed(5)}° , ${lng.toFixed(5)}°`;
            display.style.color   = '#4ade80';
        }
    }

    // ------------------------------------------------------------------
    // Validation LKP depuis les champs DMS
    // ------------------------------------------------------------------
    static _validateLKPFromDMS() {
        const latDeg = document.getElementById('sar-lat-deg').value;
        const lonDeg = document.getElementById('sar-lon-deg').value;

        if (!latDeg || !lonDeg) {
            NotificationService.warning(
                'Veuillez saisir au minimum les degres de latitude et longitude.'
            );
            return;
        }

        const lat = this._dmsToDecimal(
            latDeg,
            document.getElementById('sar-lat-min').value,
            document.getElementById('sar-lat-sec').value,
            document.getElementById('sar-lat-hem').value
        );
        const lng = this._dmsToDecimal(
            lonDeg,
            document.getElementById('sar-lon-min').value,
            document.getElementById('sar-lon-sec').value,
            document.getElementById('sar-lon-hem').value
        );

        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            NotificationService.error(
                'Coordonnees hors limites. Verifiez la saisie.'
            );
            return;
        }

        this._lkp = { lat, lng };
        SARLayer.setLKP(lat, lng);
        this._updateLkpStatus(true);
    }

    // ------------------------------------------------------------------
    // Remplir les champs DMS depuis lat/lng décimal
    // ------------------------------------------------------------------
    static _updateDMSFromLatLng(lat, lng) {
        const toD = v => {
            const abs = Math.abs(v);
            const deg = Math.floor(abs);
            const mf  = (abs - deg) * 60;
            const min = Math.floor(mf);
            const sec = Math.round((mf - min) * 60);
            return { deg, min, sec };
        };
        const latD = toD(lat), lngD = toD(lng);

        document.getElementById('sar-lat-deg').value = latD.deg;
        document.getElementById('sar-lat-min').value = latD.min;
        document.getElementById('sar-lat-sec').value = latD.sec;
        document.getElementById('sar-lat-hem').value = lat >= 0 ? 'N' : 'S';

        document.getElementById('sar-lon-deg').value = lngD.deg;
        document.getElementById('sar-lon-min').value = lngD.min;
        document.getElementById('sar-lon-sec').value = lngD.sec;
        document.getElementById('sar-lon-hem').value = lng >= 0 ? 'E' : 'W';
    }

    static _updateLkpStatus(ok) {
        const el = document.getElementById('sar-lkp-status');
        if (!el) return;
        if (ok) {
            el.textContent  = `✅ LKP validé — ${this._lkp.lat.toFixed(4)}° / ${this._lkp.lng.toFixed(4)}°`;
            el.style.color  = '#4ade80';
        } else {
            el.textContent  = 'En attente de position…';
            el.style.color  = '#64748b';
        }
    }

    // ------------------------------------------------------------------
    // Calcul principal
    // ------------------------------------------------------------------
    static _compute() {

        if (!this._lkp) {
            NotificationService.warning(
                'Placez d\'abord le LKP (Derniere Position Connue).'
            );
            return;
        }

        // Récupération des inputs
        const targetType       = document.getElementById('sar-target-type').value;
        const lkpTime          = document.getElementById('sar-lkp-time').value;
        const departTime       = document.getElementById('sar-depart-time').value;
        const currentDir       = parseFloat(document.getElementById('sar-current-dir').value)   || 0;
        const currentSpeed     = parseFloat(document.getElementById('sar-current-speed').value) || 0;
        const waveDirInput     = document.getElementById('sar-wave-dir').value;
        const waveDirection    = waveDirInput !== '' ? parseFloat(waveDirInput) : 0;

        // Vent : depuis le cache météo ou valeur de secours
        const windSpeed     = this._wind.speed     || 0;
        const windDirection = this._wind.direction || 0;

        // V1 : départ depuis la station de référence.
        const departure =
            this._getReferenceDeparture();

        const shipPosition =
            departure?.position ?? null;

        const shipSpeed    = parseFloat(window.OPESAR?.Fleet?.getCurrentSpeed?.()) || 10;

        const model = SARService.compute({
            lkp:              this._lkp,
            lkpTime,
            departTime,
            targetType,
            windSpeed,
            windDirection,
            currentSpeed,
            currentDirection: currentDir,
            waveDirection,
            shipPosition,
            shipSpeed
        });

        // --- Affichage dérive ---
        document.getElementById('sar-result').innerHTML =
            `${model.driftSpeed.toFixed(2)} nds @ ${Math.round(model.driftDirection)}°
             <br><small style="color:#94a3b8;">${model.driftDistance.toFixed(2)} MN en
             ${this._driftHoursLabel(lkpTime, departTime)}</small>`;

        // --- Pattern recommandé ---
        const patternLabels = {
            square:   'Carré expansif',
            sector:   'Secteur',
            parallel: 'Pistes parallèles',
            creeping: 'Raquette'
        };
        document.getElementById('sar-pattern-name').textContent =
            patternLabels[model.pattern] ?? model.pattern;

        const patternReason =
            document.getElementById('sar-pattern-reason');

        if (patternReason) {
            patternReason.textContent =
                model.patternReason ||
                'Suggestion basée sur la dérive et la zone estimée';
        }

        // --- Interception ---
        if (model.eta) {
            document.getElementById('sar-eta-time').textContent = model.eta.timeMin + ' min';
            document.getElementById('sar-eta-dist').textContent = model.eta.distNm.toFixed(1) + ' MN';
            document.getElementById('sar-eta-cap').textContent  = model.eta.capDeg + '°';
			
			const hours =
				Math.floor(
					model.eta.timeMin / 60
				);

			const minutes =
				model.eta.timeMin % 60;

			document.getElementById(
				'sar-eta-banner'
			).innerHTML =

				`ETA : ${hours}h${minutes
					.toString()
					.padStart(2,'0')}`;
        } else {
            document.getElementById('sar-eta-time').textContent = '-- min';
            document.getElementById('sar-eta-dist').textContent = '-- MN';
            document.getElementById('sar-eta-cap').textContent  = '--°';
            document.getElementById('sar-eta-banner').innerHTML = 'ETA : --';
        }

        // --- Avertissement houle ---
        this._checkSwellWarning(waveDirection, model);

        // --- Carte ---
        SARLayer.renderDatum(model);

        const route =
            this._buildDirectRoute(
                model,
                departure,
                shipSpeed
            );

        if (route) {

            model.route =
                route;

            SARLayer.renderRoute(
                route
            );

        } else if (!departure) {

            SARLayer.clearRoute();

            NotificationService.warning(
                'Aucune station de référence définie : route non tracée.'
            );

        }

        // --- Event global ---
        window.dispatchEvent(new CustomEvent('sar:computed', { detail: model }));
    }

    static _getReferenceDeparture() {

        const stationId =
            StationReferenceService.get();

        if (!stationId) {
            return null;
        }

        const station =
            StationService.getById(
                stationId
            );

        if (!station) {
            return null;
        }

        return {
            source: 'station',
            station,
            position: {
                lat:
                    station.lat,

                lng:
                    station.lng
            }
        };

    }

    static _buildDirectRoute(
        model,
        departure,
        shipSpeed
    ) {

        if (
            !model?.datum ||
            !departure?.position
        ) {
            return null;
        }

        const destination =
            model.lkp;

        return RoutePlanner.direct({
            start:
                departure.position,

            destination,

            speedKts:
                shipSpeed,

            source:
                departure.source,

            label:
                departure.station
                    ? `Route ${departure.station.stationNumber || 'SNSM'}`
                    : 'Route directe'
        });

    }

    static _driftHoursLabel(lkpTime, departTime) {
        const toMin = t => { if (!t) return 0; const [h,m] = t.split(':').map(Number); return h*60+m; };
        let d = toMin(departTime) - toMin(lkpTime);
        if (d < 0) d += 1440;
        const h = Math.floor(d / 60), m = d % 60;
        return h > 0 ? `${h}h${m.toString().padStart(2,'0')}` : `${m} min`;
    }

    static _checkSwellWarning(waveDirection, model) {
        const el = document.getElementById('sar-swell-warning');
        if (!el) return;
        if (!model.eta || isNaN(waveDirection)) { el.style.display = 'none'; return; }

        const capDirect = model.eta.capDeg;
        let diff = Math.abs(capDirect - waveDirection) % 360;
        if (diff > 180) diff = 360 - diff;

        if (diff < 30 || diff > 150) {
            const situation = diff < 30 ? 'face à la houle' : 'houle de travers arrière';
            const cap1 = (waveDirection + 45)  % 360;
            const cap2 = (waveDirection + 315) % 360;
            el.innerHTML = `⚠ Cap direct ${situation} (${Math.round(diff)}°).<br>
                Route zigzag recommandée :
                cap A <b>${Math.round(cap1)}°</b> / cap B <b>${Math.round(cap2)}°</b>`;
            el.style.display = 'block';
            document.getElementById('sar-eta-route').textContent = 'ZIGZAG ±45°';
            document.getElementById('sar-eta-route').style.color = '#fbbf24';
        } else {
            el.style.display = 'none';
            document.getElementById('sar-eta-route').textContent = 'DIRECTE';
            document.getElementById('sar-eta-route').style.color = '#4ade80';
        }
    }

    // ------------------------------------------------------------------
    // Réinitialisation
    // ------------------------------------------------------------------
    static _resetMission() {
        this._lkp = null;
        SARService.reset();
        SARLayer.clear();
		
		document.getElementById('sar-eta-banner').innerHTML =    'ETA : --';
        document.getElementById('sar-result').textContent   = '-- nds @ --°';
        document.getElementById('sar-eta-time').textContent = '-- min';
        document.getElementById('sar-eta-dist').textContent = '-- MN';
        document.getElementById('sar-eta-cap').textContent  = '--°';
        document.getElementById('sar-eta-route').textContent = 'DIRECTE';
        document.getElementById('sar-eta-route').style.color = '#4ade80';
        document.getElementById('sar-decimal-position').textContent = '-- , --';
        document.getElementById('sar-swell-warning').style.display  = 'none';

        ['sar-lat-deg','sar-lat-min','sar-lat-sec',
         'sar-lon-deg','sar-lon-min','sar-lon-sec'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

        this._updateLkpStatus(false);
        window.dispatchEvent(new CustomEvent('sar:reset'));
    }

    // ------------------------------------------------------------------
    // Fermeture propre
    // ------------------------------------------------------------------
    static close() {
        if (this._unsubWx) {
            window.removeEventListener('weather:updated', this._unsubWx);
            this._unsubWx = null;
        }
        super.close?.();
    }

    static isOpen() {
        return !!this.instance;
    }
}

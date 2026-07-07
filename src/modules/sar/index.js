/**
 * index.js — Module SAR
 * Chef d'orchestre : écoute les événements et coordonne SARCard, PatternCard, SARLayer.
 */
import SARCard     from './cards/SARCard.js';
import PatternCard from './cards/PatternCard.js';
import SARLayer    from './layers/SARLayer.js';
import SARService  from './services/SARService.js';

export default {

    async init() {
        console.log('🚨 Initialisation module SAR');

        // ---------------------------------------------------------------
        // Ouverture / fermeture depuis la navigation principale
        // ---------------------------------------------------------------
        window.addEventListener('navigation:change', event => {
            if (event.detail?.module !== 'sar') return;

            if (SARCard.isOpen()) {
                SARCard.close();
            } else {
                SARCard.create();
            }
        });

        window.addEventListener('sar:card:open', () => {
            if (!SARCard.isOpen()) {
                SARCard.create();
            } else {
                SARCard.instance?.bringToFront?.();
            }
        });

        // ---------------------------------------------------------------
        // LKP sélectionné (depuis carte ou validation DMS)
        // ---------------------------------------------------------------
        window.addEventListener('sar:lkp:selected', event => {
            const { lat, lng } = event.detail;
            console.log(`📍 LKP sélectionné : ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
            // SARCard._lkp est déjà mis à jour directement depuis SARCard._bindEvents
            // SARLayer.setLKP est appelé depuis SARCard ou SARLayer.startLKPPlacement
        });

        // ---------------------------------------------------------------
        // Calcul SAR terminé
        // ---------------------------------------------------------------
        window.addEventListener('sar:computed', event => {
            const model = event.detail;
            console.log('🚨 SAR calculé :', model);

            // SARLayer.renderDatum est déjà appelé depuis SARCard._compute().
            // PatternCard reste ouvrable depuis le bouton de SARCard.
        });

        // ---------------------------------------------------------------
        // Génération d'un pattern → rendu sur la carte
        // ---------------------------------------------------------------
        window.addEventListener('sar:pattern:generated', event => {
            console.log('🔍 Pattern généré :', event.detail.type, event.detail.stats);
            SARLayer.renderPattern(event.detail);
        });

        // ---------------------------------------------------------------
        // Demande d'ouverture de PatternCard depuis SARCard (bouton rapide)
        // ---------------------------------------------------------------
        window.addEventListener('sar:pattern', () => {
            const sar = SARService.getCurrent();
            if (!sar) {
                console.warn('sar:pattern — aucun calcul SAR disponible');
                return;
            }
            if (PatternCard.isOpen()) {
                PatternCard.close();
            } else {
                PatternCard.create(sar);
            }
        });

        // ---------------------------------------------------------------
        // Effacement du pattern (depuis PatternCard)
        // ---------------------------------------------------------------
        window.addEventListener('sar:pattern:clear', () => {
            SARLayer.clearPattern();
        });

        // ---------------------------------------------------------------
        // Réinitialisation complète
        // ---------------------------------------------------------------
        window.addEventListener('sar:reset', () => {
            console.log('🔄 Réinitialisation mission SAR');
            SARLayer.clear();
            if (PatternCard.isOpen()) PatternCard.close();
        });

        // ---------------------------------------------------------------
        // Météo mise à jour → on stocke le vent pour le calcul de dérive
        // (SARCard écoute aussi cet événement pour son cache local _wind)
        // ---------------------------------------------------------------
        window.addEventListener('weather:updated', event => {
            if (event.detail?.waveDirection !== undefined) {
                // Pré-remplir le champ houle si non édité manuellement
                const el = document.getElementById('sar-wave-dir');
                if (el && !el.dataset.manualEdit) {
                    el.value = Math.round(event.detail.waveDirection);
                }
            }
        });

        console.log('✅ Module SAR chargé');
    }
};

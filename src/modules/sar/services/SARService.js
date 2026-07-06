/**
 * SARService.js
 * Orchestrateur du calcul SAR : appelle DriftCalculator,
 * calcule le DATUM avec la formule sphérique exacte,
 * et renvoie un SARModel complet.
 */
import SARModel         from '../models/SARModel.js';
import DriftCalculator  from '../drift/DriftCalculator.js';
import PatternSuggestion from '../search_patterns/PatternSuggestion.js';

export default class SARService {

    static current = null;

    // --------------------------------------------------------
    // Géodésie : destination à partir d'un point, cap, distance
    // --------------------------------------------------------
    static _destination(lkp, bearingDeg, distNm) {
        const R    = 6371e3;                       // Rayon terrestre en mètres
        const dist = distNm * 1852 / R;            // Distance en radians
        const brng = bearingDeg * Math.PI / 180;
        const φ1   = lkp.lat * Math.PI / 180;
        const λ1   = lkp.lng * Math.PI / 180;

        const φ2 = Math.asin(
            Math.sin(φ1) * Math.cos(dist) +
            Math.cos(φ1) * Math.sin(dist) * Math.cos(brng)
        );
        const λ2 = λ1 + Math.atan2(
            Math.sin(brng) * Math.sin(dist) * Math.cos(φ1),
            Math.cos(dist) - Math.sin(φ1) * Math.sin(φ2)
        );

        return {
            lat: φ2 * 180 / Math.PI,
            lng: ((λ2 * 180 / Math.PI) + 540) % 360 - 180   // normalise entre -180 et +180
        };
    }

    // --------------------------------------------------------
    // Calcul du cap et de la distance entre deux points
    // --------------------------------------------------------
    static _bearing(from, to) {
        const rad = d => d * Math.PI / 180;
        const dLng = rad(to.lng - from.lng);
        const y = Math.sin(dLng) * Math.cos(rad(to.lat));
        const x = Math.cos(rad(from.lat)) * Math.sin(rad(to.lat)) -
                  Math.sin(rad(from.lat)) * Math.cos(rad(to.lat)) * Math.cos(dLng);
        return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
    }

    static _distNm(from, to) {
        const R   = 6371e3;
        const rad = d => d * Math.PI / 180;
        const dφ  = rad(to.lat - from.lat);
        const dλ  = rad(to.lng - from.lng);
        const a   = Math.sin(dφ / 2) ** 2 +
                    Math.cos(rad(from.lat)) * Math.cos(rad(to.lat)) * Math.sin(dλ / 2) ** 2;
        return (2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) / 1852;
    }

    // --------------------------------------------------------
    // Calcul du temps de dérive en heures
    // --------------------------------------------------------
    static _driftHours(lkpTime, departTime) {
        const toMinutes = t => {
            if (!t) return 0;
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };
        let delta = toMinutes(departTime) - toMinutes(lkpTime);
        if (delta < 0) delta += 24 * 60; // passage minuit
        return delta / 60;
    }

    // --------------------------------------------------------
    // Point d'entrée principal
    // --------------------------------------------------------
    /**
     * @param {object} data
     * @param {{ lat, lng }} data.lkp           Dernière position connue
     * @param {string}        data.lkpTime       Heure LKP  "HH:MM"
     * @param {string}        data.departTime    Heure de départ "HH:MM"
     * @param {string}        data.targetType    Type de cible
     * @param {number}        data.windSpeed     Vitesse vent (kts)
     * @param {number}        data.windDirection Direction vent (° venant de)
     * @param {number}        data.currentSpeed  Vitesse courant (kts)
     * @param {number}        data.currentDirection Direction courant (° vers)
     * @param {number}        data.waveDirection Direction houle (° venant de)
     * @param {{ lat, lng }}  data.shipPosition  Position du navire SAR
     * @param {number}        data.shipSpeed     Vitesse navire SAR (kts)
     */
    static compute(data) {

        const driftHours = this._driftHours(data.lkpTime, data.departTime);

        // 1. Calcul vectoriel de la dérive
        const drift = DriftCalculator.compute({
            windSpeed:         data.windSpeed,
            windDirection:     data.windDirection,
            currentSpeed:      data.currentSpeed,
            currentDirection:  data.currentDirection,
            targetType:        data.targetType,
            driftHours
        });

        // 2. Calcul du DATUM (position estimée après dérive)
        const datum = this._destination(
            data.lkp,
            drift.driftDirection,
            drift.driftDistance
        );

        // 3. Rayon de recherche = demi-distance de dérive minimum 0.5 MN
        const searchRadius = Math.max(0.5, drift.driftDistance * 0.4);

        // 4. Pattern recommandé
        const patternSuggestion =
            PatternSuggestion.suggest({
                targetType:
                    data.targetType,

                searchRadius,

                driftSpeed:
                    drift.driftSpeed,

                driftDistance:
                    drift.driftDistance,

                currentSpeed:
                    data.currentSpeed,

                waveHeight:
                    data.waveHeight
            });

        // 5. Calcul de l'interception depuis le navire SAR vers le DATUM
        let eta = null;
        if (data.shipPosition && data.shipSpeed > 0) {
            const distToLkp   = this._distNm(data.shipPosition, data.lkp);
            const transitTimeMin = (distToLkp / data.shipSpeed) * 60;

            // Le DATUM au moment de l'arrivée tient compte de la dérive pendant le transit
            const totalDriftHours = driftHours + transitTimeMin / 60;
            const totalDrift      = DriftCalculator.compute({
                ...data,
                driftHours: totalDriftHours
            });
            const finalDatum = this._destination(
                data.lkp,
                totalDrift.driftDirection,
                totalDrift.driftDistance
            );

            eta = {
                distNm:     this._distNm(data.shipPosition, finalDatum),
                timeMin:    Math.round((this._distNm(data.shipPosition, finalDatum) / data.shipSpeed) * 60),
                capDeg:     Math.round(this._bearing(data.shipPosition, finalDatum)),
                finalDatum
            };
        }

        this.current = new SARModel({
            ...data,
            driftSpeed:     drift.driftSpeed,
            driftDirection: drift.driftDirection,
            driftDistance:  drift.driftDistance,
            datum,
            searchRadius,
            pattern:        patternSuggestion.type,
            patternReason:  patternSuggestion.reason,
            eta
        });

        return this.current;
    }

    static getCurrent() {
        return this.current;
    }

    static reset() {
        this.current = null;
    }
}

/**
 * DriftCalculator.js
 * Calcul vectoriel de la dérive SAR.
 *
 * Convention :
 *   - windDirection  = direction d'où vient le vent (ex: 180 = vent du sud → pousse vers le nord)
 *   - currentDirection = direction vers laquelle va le courant (ex: 90 = courant allant vers l'est)
 *   - driftHours = temps de dérive en heures (décimal)
 */
export default class DriftCalculator {

    // Facteur de dérive (leeway) par type de cible
    // Fraction de la vitesse du vent qui se traduit en dérive propre
    static targets = {
        motorboat: 0.05,  // Plaisance moteur
        sailboat:  0.07,  // Voilier (mât debout = plus de prise au vent)
        liferaft:  0.02,  // Canot de survie
        mob:       0.01,  // Homme à la mer (faible freeBoard)
        kayak:     0.015,
        paddle:    0.012
    };

    /**
     * @param {object} params
     * @param {number} params.windSpeed        Vitesse du vent en nœuds
     * @param {number} params.windDirection    Direction d'où vient le vent (°, 0=N, 90=E…)
     * @param {number} params.currentSpeed     Vitesse du courant en nœuds
     * @param {number} params.currentDirection Direction vers où va le courant (°)
     * @param {string} params.targetType       Clé dans DriftCalculator.targets
     * @param {number} params.driftHours       Durée de dérive en heures
     * @returns {{ driftSpeed, driftDirection, driftDistance }}
     */
    static compute({
        windSpeed,
        windDirection,
        currentSpeed,
        currentDirection,
        targetType,
        driftHours
    }) {

        const leewayFactor = this.targets[targetType] ?? 0.02;
        const leeway       = windSpeed * leewayFactor;

        // Le vent vient DE windDirection → pousse l'objet VERS (windDirection + 180) % 360
        const pushDir = (windDirection + 180) % 360;
        const rad     = d => d * Math.PI / 180;

        // Composantes vectorielles (axe X = Est, axe Y = Nord)
        const windX    = leeway       * Math.sin(rad(pushDir));
        const windY    = leeway       * Math.cos(rad(pushDir));

        // Le courant va VERS currentDirection
        const currentX = currentSpeed * Math.sin(rad(currentDirection));
        const currentY = currentSpeed * Math.cos(rad(currentDirection));

        const totalX = windX + currentX;
        const totalY = windY + currentY;

        const driftSpeed = Math.sqrt(totalX ** 2 + totalY ** 2);

        // atan2(X, Y) donne un cap géographique (0=N dans le sens horaire)
        const driftDirection =
            ((Math.atan2(totalX, totalY) * 180 / Math.PI) + 360) % 360;

        return {
            driftSpeed,
            driftDirection,
            driftDistance: driftSpeed * driftHours   // en milles nautiques
        };
    }
}
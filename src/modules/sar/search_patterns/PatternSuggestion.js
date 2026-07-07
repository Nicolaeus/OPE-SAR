export default class PatternSuggestion {

    static suggest({
        targetType,
        searchRadius,
        driftSpeed = 0,
        driftDistance = 0,
        currentSpeed = 0,
        waveHeight = 0
    }) {

        if (
            targetType === 'mob' ||
            searchRadius < 0.5
        ) {
            return {
                type: 'sector',
                reason: 'Cible ponctuelle ou zone réduite'
            };
        }

        if (
            targetType === 'liferaft' &&
            searchRadius < 2
        ) {
            return {
                type: 'square',
                reason: 'Canot de survie, recherche concentrée'
            };
        }

        if (
            driftSpeed > 1.5 ||
            driftDistance > 2 ||
            currentSpeed > 1.2 ||
            waveHeight > 1
        ) {
            return {
                type: 'parallel',
                reason: 'Dérive ou conditions météo significatives'
            };
        }

        if (searchRadius < 2) {
            return {
                type: 'square',
                reason: 'Zone de recherche modérée'
            };
        }

        return {
            type: 'parallel',
            reason: 'Grande zone de recherche'
        };

    }

}

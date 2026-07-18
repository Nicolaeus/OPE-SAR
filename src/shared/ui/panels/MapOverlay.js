export default class MapOverlay {

    static init() {

        let overlay = document.getElementById('map-overlay');

        if (overlay) {
            return overlay;
        }

        const map = document.getElementById('map');

        if (!map) {

            console.error('❌ MapOverlay : #map introuvable');

            return null;

        }

        overlay = document.createElement('div');

        overlay.id = 'map-overlay';

        map.appendChild(overlay);

        return overlay;

    }

    static get() {

        return document.getElementById('map-overlay');

    }

}

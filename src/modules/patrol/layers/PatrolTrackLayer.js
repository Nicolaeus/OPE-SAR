import PatrolService from '../services/PatrolService.js';

export default class PatrolTrackLayer {

    static map = null;

    static polyline = null;

    static lastMarker = null;

    static visible = true;

    static onTrack =
        () => PatrolTrackLayer.refresh();

    static onUpdated =
        () => PatrolTrackLayer.refresh();

    static init(map) {

        this.destroy();

        this.map =
            map;

        window.addEventListener(
            'patrol:track',
            this.onTrack
        );
        
        window.addEventListener(
            'patrol:updated',
            this.onUpdated
        );

        this.refresh();

    }

    static refresh() {

        if (!this.map) {
            return;
        }

        if (!this.visible) {
            return;
        }

        const patrol =
            PatrolService.getCurrent();

        if (!patrol) {

            this.clear();

            return;

        }

        const track =
            patrol.track ?? [];

        if (track.length === 0) {

            this.clear();

            return;

        }

        const latlngs =
            track
                .filter(point =>
                    point &&
                    point.latitude !== undefined &&
                    point.longitude !== undefined
                )
                .map(point => [
                    point.latitude,
                    point.longitude
                ]);

        if (latlngs.length === 0) {

            this.clear();

            return;

        }

        if (!this.polyline) {

            this.polyline =
                L.polyline(
                    latlngs,
                    {
                        color: '#1976d2',
                        weight: 3,
                        opacity: 0.9
                    }
                );

            this.polyline.addTo(
                this.map
            );

        }
        else {

            this.polyline.setLatLngs(
                latlngs
            );

        }

        this.updateLastMarker(
            latlngs[
                latlngs.length - 1
            ]
        );

    }

    static updateLastMarker(position) {

        if (!position) {
            return;
        }

        if (!this.lastMarker) {

            this.lastMarker =
                L.circleMarker(
                    position,
                    {
                        radius: 6,
                        color: '#ffffff',
                        weight: 2,
                        fillColor: '#1976d2',
                        fillOpacity: 1
                    }
                );

            this.lastMarker.addTo(
                this.map
            );

            return;

        }

        this.lastMarker.setLatLng(
            position
        );

    }
    static clear() {

        if (this.polyline) {

            this.map.removeLayer(
                this.polyline
            );

            this.polyline = null;

        }

        if (this.lastMarker) {

            this.map.removeLayer(
                this.lastMarker
            );

            this.lastMarker = null;

        }

    }

    static show() {

        this.visible = true;

        this.refresh();

    }

    static hide() {

        this.visible = false;

        this.clear();

    }

    static fitBounds(padding = [40, 40]) {

        if (
            !this.map ||
            !this.polyline
        ) {
            return;
        }

        const bounds =
            this.polyline.getBounds();

        if (
            !bounds ||
            !bounds.isValid()
        ) {
            return;
        }

        this.map.fitBounds(
            bounds,
            {
                padding
            }
        );

    }

    static setStyle(style = {}) {

        if (!this.polyline) {
            return;
        }

        this.polyline.setStyle(
            style
        );

    }

    static destroy() {

        window.removeEventListener(
            'patrol:track',
            this.onTrack
        );
        
        window.removeEventListener(
            'patrol:updated',
            this.onUpdated
        );

        this.clear();

        this.map = null;

        this.visible = true;

    }

}

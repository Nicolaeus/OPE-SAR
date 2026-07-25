import PatrolService from '../services/PatrolService.js';

export default class PatrolTrackLayer {

    static map = null;

    static polyline = null;

    static lastMarker = null;

    static visible = true;

    static init(map) {

        this.map =
            map;

        window.addEventListener(
            'patrol:track',
            () => this.refresh()
        );

        window.addEventListener(
            'patrol:updated',
            () => this.refresh()
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
                    point.lat !== undefined &&
                    point.lng !== undefined
                )
                .map(point => [
                    point.lat,
                    point.lng
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

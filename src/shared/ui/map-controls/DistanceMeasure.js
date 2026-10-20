export default class DistanceMeasure {
    constructor(map, button) {
        this.map = map;
        this.button = button;
        this.points = [];
        this.markers = [];
        this.active = false;
        this.layer = L.layerGroup().addTo(map);
        this.panel = this.createPanel();
        this.preview = null;
        this.dragState = null;
    }

    init() {
        document.getElementById('app').appendChild(this.panel);
        this.button.addEventListener('click', () => this.toggle());
        this.map.on('click', event => this.addPoint(event.latlng));
        this.map.on('mousemove', event => this.updatePreview(event.latlng));
        this.dragMoveHandler = event => this.moveWaypoint(event);
        this.dragEndHandler = event => this.endWaypointDrag(event);
        this.pendingTouchMoveHandler = event => this.moveWaypoint(event);
        this.panel.addEventListener('click', event => {
            const action = event.target.closest('[data-measure-action]')?.dataset.measureAction;
            if (action === 'finish') this.setActive(false);
            if (action === 'clear') this.clear();
            if (action === 'close') this.closePanel();
            if (action === 'delete-waypoint') {
                const index = Number(event.target.closest('[data-waypoint-index]')?.dataset.waypointIndex);
                this.removeWaypoint(index);
            }
        });
    }

    createPanel() {
        const panel = document.createElement('section');
        panel.className = 'opsar-measure-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', 'Mesure de distance');
        panel.innerHTML = `
            <header class="opsar-measure-header">
                <div><strong>Mesure de distance</strong><span class="opsar-measure-status"></span></div>
                <button type="button" data-measure-action="close" aria-label="Fermer">×</button>
            </header>
            <div class="opsar-measure-total">0 m</div>
            <div class="opsar-measure-hint">Activez l’outil, puis cliquez sur la carte pour ajouter des waypoints.</div>
            <ol class="opsar-measure-points"></ol>
            <ol class="opsar-measure-segments"></ol>
            <footer>
                <button type="button" data-measure-action="clear">Effacer</button>
                <button type="button" data-measure-action="finish">Terminer</button>
            </footer>`;
        return panel;
    }

    toggle() {
        this.setActive(!this.active);
    }

    setActive(active) {
        this.active = active;
        this.button.classList.toggle('is-active', active);
        this.button.setAttribute('aria-pressed', String(active));
        this.map.getContainer().classList.toggle('opsar-measure-cursor', active);
        this.panel.classList.add('is-visible');
        this.panel.querySelector('.opsar-measure-status').textContent = active ? 'Cliquez sur la carte pour ajouter un point' : 'Mesure en pause';
        this.updateHint();
        if (!active && this.preview) {
            this.layer.removeLayer(this.preview);
            this.preview = null;
        }
    }

    addPoint(latlng) {
        if (!this.active) return;
        const point = L.latLng(latlng.lat, latlng.lng);
        this.points.push(point);
        const marker = L.marker(point, {
            icon: this.createWaypointIcon(this.points.length),
            interactive: true,
            bubblingMouseEvents: false,
            keyboard: false
        });
        marker.addTo(this.layer);
        this.markers.push(marker);
        this.enableWaypointEditing(marker);
        marker.on('contextmenu', event => {
            L.DomEvent.preventDefault(event.originalEvent);
            this.removeWaypoint(this.markers.indexOf(marker));
        });
        this.renderWaypoints();
        this.renderLine();
        this.renderSegments();
    }

    createWaypointIcon(number) {
        return L.divIcon({
            className: 'opsar-measure-marker',
            html: `<span>${number}</span>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        });
    }

    enableWaypointEditing(marker) {
        const element = marker.getElement();
        if (!element) return;
        if (marker._measurePointerElement && marker._measurePointerHandler) {
            marker._measurePointerElement.removeEventListener('pointerdown', marker._measurePointerHandler);
        }
        element.title = 'Déplacer le waypoint';
        element.style.cursor = 'grab';
        marker._measurePointerElement = element;
        marker._measurePointerHandler = event => {
            if (event.button !== undefined && event.button !== 0) return;
            event.preventDefault();
            event.stopPropagation();
            const index = this.markers.indexOf(marker);
            if (index < 0) return;
            if (event.pointerType === 'touch') {
                const timer = setTimeout(() => this.beginWaypointDrag(marker, event.pointerId), 450);
                this.dragState = { marker, index, pointerId: event.pointerId, timer, started: false, startX: event.clientX, startY: event.clientY };
                window.addEventListener('pointermove', this.pendingTouchMoveHandler);
                window.addEventListener('pointerup', this.dragEndHandler);
                window.addEventListener('pointercancel', this.dragEndHandler);
                return;
            }
            this.beginWaypointDrag(marker, event.pointerId);
        };
        element.addEventListener('pointerdown', marker._measurePointerHandler);
    }

    beginWaypointDrag(marker, pointerId) {
        const prior = this.dragState;
        if (prior?.timer) clearTimeout(prior.timer);
        const index = this.markers.indexOf(marker);
        if (index < 0) return;
        this.dragState = { marker, index, pointerId, started: true, mapWasDragging: this.map.dragging.enabled() };
        marker.getElement()?.classList.add('is-dragging');
        this.map.dragging.disable();
        window.removeEventListener('pointermove', this.pendingTouchMoveHandler);
        window.addEventListener('pointermove', this.dragMoveHandler);
        window.addEventListener('pointerup', this.dragEndHandler);
        window.addEventListener('pointercancel', this.dragEndHandler);
    }

    moveWaypoint(event) {
        const drag = this.dragState;
        if (!drag || (event.pointerId !== undefined && event.pointerId !== drag.pointerId)) return;
        if (!drag.started) {
            const dx = event.clientX - drag.startX;
            const dy = event.clientY - drag.startY;
            if (Math.hypot(dx, dy) > 12) clearTimeout(drag.timer);
            return;
        }
        const rect = this.map.getContainer().getBoundingClientRect();
        const point = this.map.containerPointToLatLng(L.point(event.clientX - rect.left, event.clientY - rect.top));
        this.points[drag.index] = point;
        drag.marker.setLatLng(point);
        this.renderLine();
        this.renderSegments();
        event.preventDefault();
    }

    endWaypointDrag(event) {
        const drag = this.dragState;
        if (!drag || (event.pointerId !== undefined && event.pointerId !== drag.pointerId)) return;
        if (drag.timer) clearTimeout(drag.timer);
        if (drag.started) {
            drag.marker.getElement()?.classList.remove('is-dragging');
            if (drag.mapWasDragging) this.map.dragging.enable();
        }
        this.dragState = null;
        window.removeEventListener('pointermove', this.dragMoveHandler);
        window.removeEventListener('pointermove', this.pendingTouchMoveHandler);
        window.removeEventListener('pointerup', this.dragEndHandler);
        window.removeEventListener('pointercancel', this.dragEndHandler);
    }

    updatePreview(latlng) {
        if (!this.active || this.points.length === 0) return;
        if (!this.preview) {
            this.preview = L.polyline([], { color: '#f4b942', weight: 3, dashArray: '6 7', interactive: false }).addTo(this.layer);
        }
        this.preview.setLatLngs([this.points[this.points.length - 1], latlng]);
        const current = this.getTotal() + this.points[this.points.length - 1].distanceTo(latlng);
        this.panel.querySelector('.opsar-measure-total').textContent = this.formatDistance(current) + ' (aperçu)';
    }

    renderLine() {
        this.layer.eachLayer(layer => {
            if (layer instanceof L.Polyline && layer !== this.preview) this.layer.removeLayer(layer);
        });
        if (this.points.length > 1) {
            L.polyline(this.points, { color: '#f4b942', weight: 3, interactive: false }).addTo(this.layer);
        }
        if (this.preview) {
            this.layer.removeLayer(this.preview);
            this.preview = null;
        }
        this.panel.querySelector('.opsar-measure-total').textContent = this.formatDistance(this.getTotal());
        this.updateButtonReadout();
        this.updateHint();
    }

    renderSegments() {
        const list = this.panel.querySelector('.opsar-measure-segments');
        list.innerHTML = this.points.slice(1).map((point, index) => {
            const distance = this.points[index].distanceTo(point);
            return `<li><span>Waypoint ${index + 1} → ${index + 2}</span><strong>${this.formatDistance(distance)}</strong></li>`;
        }).join('');
        this.updateHint();
    }

    renderWaypoints() {
        const list = this.panel.querySelector('.opsar-measure-points');
        list.innerHTML = this.points.map((_, index) => `
            <li>
                <span>Waypoint ${index + 1}</span>
                <button type="button" data-measure-action="delete-waypoint" data-waypoint-index="${index}" aria-label="Supprimer le waypoint ${index + 1}">Supprimer</button>
            </li>`).join('');
        this.markers.forEach((marker, index) => {
            marker.setIcon(this.createWaypointIcon(index + 1));
            this.enableWaypointEditing(marker);
        });
    }

    removeWaypoint(index) {
        if (!Number.isInteger(index) || index < 0 || index >= this.points.length) return;
        const [marker] = this.markers.splice(index, 1);
        this.points.splice(index, 1);
        this.layer.removeLayer(marker);
        this.renderWaypoints();
        this.renderLine();
        this.renderSegments();
    }

    getTotal() {
        return this.points.slice(1).reduce((total, point, index) => total + this.points[index].distanceTo(point), 0);
    }

    formatDistance(meters) {
        const nauticalMiles = meters / 1852;
        const kilometers = meters / 1000;
        return `${nauticalMiles.toFixed(2)} NM (${kilometers.toFixed(2)} km)`;
    }

    updateButtonReadout() {
        const icon = this.button.querySelector('.opsar-measure-icon');
        const readout = this.button.querySelector('.opsar-measure-readout');
        const hasRoute = this.points.length > 1;
        this.button.classList.toggle('has-route', hasRoute);
        icon.hidden = hasRoute;
        readout.hidden = !hasRoute;
        if (hasRoute) {
            const nauticalMiles = this.getTotal() / 1852;
            readout.textContent = `${nauticalMiles.toFixed(2)} NM`;
            const accessibleLabel = `Mesure de ${this.formatDistance(this.getTotal())}`;
            this.button.setAttribute('aria-label', accessibleLabel);
            this.button.title = accessibleLabel;
        } else {
            this.button.setAttribute('aria-label', 'Mesurer une distance');
            this.button.title = 'Mesurer une distance';
        }
    }

    updateHint() {
        const hint = this.panel.querySelector('.opsar-measure-hint');
        if (this.points.length === 0) hint.textContent = this.active ? 'Cliquez sur la carte pour placer le waypoint 1.' : 'Activez l’outil, puis cliquez sur la carte pour ajouter des waypoints.';
        else if (this.active) hint.textContent = `Waypoint ${this.points.length} placé · cliquez pour ajouter le suivant. Glissez un point pour le déplacer (maintien sur mobile).`;
        else hint.textContent = `${this.points.length} waypoint${this.points.length > 1 ? 's' : ''} placé${this.points.length > 1 ? 's' : ''} · glissez un point pour le déplacer (maintien sur mobile).`;
    }

    clear() {
        this.points = [];
        this.layer.clearLayers();
        this.preview = null;
        this.panel.querySelector('.opsar-measure-segments').innerHTML = '';
        this.panel.querySelector('.opsar-measure-total').textContent = '0 m';
        this.markers = [];
        this.renderWaypoints();
        this.updateButtonReadout();
        this.updateHint();
    }

    closePanel() {
        this.setActive(false);
        this.panel.classList.remove('is-visible');
    }
}

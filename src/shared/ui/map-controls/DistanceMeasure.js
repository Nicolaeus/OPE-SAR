import BaseCard from '../cards/BaseCard.js';

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
        this.bringPanelToFront();
        this.makePanelDraggable();
        this.button.addEventListener('click', () => this.toggle());
        this.map.on('click', event => this.addPoint(event.latlng));
        this.map.on('mousemove', event => this.updatePreview(event.latlng));
        this.dragMoveHandler = event => this.moveWaypoint(event);
        this.dragEndHandler = event => this.endWaypointDrag(event);
        this.pendingTouchMoveHandler = event => this.moveWaypoint(event);
        this.panel.addEventListener('click', event => {
            const action = event.target.closest('[data-measure-action]')?.dataset.measureAction;
            if (action === 'finish') this.setActive(false);
            if (action === 'toggle') this.setActive(!this.active);
            if (action === 'clear') this.clear();
            if (action === 'close') this.closePanel();
            if (action === 'collapse') this.togglePanelCollapse();
            if (action === 'delete-waypoint') {
                const index = Number(event.target.closest('[data-waypoint-index]')?.dataset.waypointIndex);
                this.removeWaypoint(index);
            }
        });
    }

    makePanelDraggable() {
        const header = this.panel.querySelector('.opsar-measure-header');
        let drag = null;
        header.addEventListener('pointerdown', event => {
            if (event.button !== 0 || event.target.closest('button')) return;
            const bounds = this.panel.getBoundingClientRect();
            drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, left: bounds.left, top: bounds.top };
            this.panel.style.setProperty('position', 'fixed', 'important');
            this.panel.style.setProperty('left', `${bounds.left}px`, 'important');
            this.panel.style.setProperty('top', `${bounds.top}px`, 'important');
            this.panel.style.setProperty('right', 'auto', 'important');
            this.panel.style.setProperty('bottom', 'auto', 'important');
            this.bringPanelToFront();
            header.classList.add('is-dragging');
            header.setPointerCapture(event.pointerId);
            event.preventDefault();
        });
        header.addEventListener('pointermove', event => {
            if (!drag || event.pointerId !== drag.pointerId) return;
            const maxLeft = Math.max(8, window.innerWidth - this.panel.offsetWidth - 8);
            const maxTop = Math.max(8, window.innerHeight - this.panel.offsetHeight - 8);
            const left = Math.min(maxLeft, Math.max(8, drag.left + event.clientX - drag.x));
            const top = Math.min(maxTop, Math.max(8, drag.top + event.clientY - drag.y));
            this.panel.style.setProperty('left', `${left}px`, 'important');
            this.panel.style.setProperty('top', `${top}px`, 'important');
        });
        const stopDragging = event => {
            if (!drag || event.pointerId !== drag.pointerId) return;
            drag = null;
            header.classList.remove('is-dragging');
            if (header.hasPointerCapture(event.pointerId)) header.releasePointerCapture(event.pointerId);
        };
        header.addEventListener('pointerup', stopDragging);
        header.addEventListener('pointercancel', stopDragging);
        this.panel.addEventListener('pointerdown', () => {
            this.bringPanelToFront();
        }, { passive: true });
    }

    bringPanelToFront() {
        BaseCard.zIndex += 1;
        this.panel.style.zIndex = String(BaseCard.zIndex);
    }

    togglePanelCollapse(forceExpanded = null) {
        const collapsed = forceExpanded === null
            ? !this.panel.classList.contains('opsar-card-collapsed')
            : !forceExpanded;
        const body = this.panel.querySelector('.opsar-measure-body');
        const button = this.panel.querySelector('.opsar-card-collapse');
        this.panel.classList.toggle('opsar-card-collapsed', collapsed);
        body.style.display = collapsed ? 'none' : 'block';
        button.textContent = collapsed ? '+' : '−';
        button.setAttribute('aria-expanded', String(!collapsed));
        button.setAttribute('aria-label', collapsed ? 'Agrandir la fenêtre' : 'Réduire la fenêtre');
        this.bringPanelToFront();
    }

    createPanel() {
        const panel = document.createElement('section');
        panel.className = 'opsar-card opsar-card-yellow opsar-measure-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', 'Mesure de distance');
        panel.innerHTML = `
            <header class="opsar-card-header opsar-measure-header">
                <div class="opsar-card-title opsar-measure-title">
                    <span class="opsar-card-icon"><img src="./assets/images/compass/compass-48.png" alt=""></span>
                    <span class="opsar-measure-heading-text"><strong>Mesure de distance</strong><small class="opsar-measure-status"></small></span>
                </div>
                <div class="opsar-card-actions">
                    <button class="opsar-card-collapse" type="button" data-measure-action="collapse" aria-label="Réduire la fenêtre" aria-expanded="true">−</button>
                    <button class="opsar-card-close" type="button" data-measure-action="close" aria-label="Fermer">×</button>
                </div>
            </header>
            <div class="opsar-card-body opsar-measure-body">
              <div class="opsar-measure-summary">
                <span>Distance totale</span>
                <strong class="opsar-measure-total">0.00 NM <small>(0.00 km)</small></strong>
              </div>
              <div class="opsar-measure-hint">Activez l’outil, puis cliquez sur la carte pour ajouter des waypoints.</div>
              <div class="opsar-measure-list-heading"><span>Waypoints</span><span class="opsar-measure-count">0</span></div>
              <ol class="opsar-measure-points"></ol>
              <footer>
                <button class="opsar-measure-clear" type="button" data-measure-action="clear">Effacer</button>
                <button class="opsar-measure-continue" type="button" data-measure-action="toggle">Démarrer</button>
              </footer>
            </div>`;
        return panel;
    }

    toggle() {
        this.setActive(!this.active);
    }

    setActive(active) {
        this.active = active;
        if (active && this.panel.classList.contains('opsar-card-collapsed')) {
            this.togglePanelCollapse(true);
        }
        this.button.classList.toggle('is-active', active);
        this.button.setAttribute('aria-pressed', String(active));
        this.map.getContainer().classList.toggle('opsar-measure-cursor', active);
        this.panel.classList.add('is-visible');
        this.panel.querySelector('.opsar-measure-status').textContent = active ? 'Route en cours' : (this.points.length ? 'Mesure en pause' : 'Prête à mesurer');
        const continueButton = this.panel.querySelector('.opsar-measure-continue');
        continueButton.textContent = active ? 'Terminer' : (this.points.length ? 'Continuer la route' : 'Démarrer');
        continueButton.classList.toggle('is-finish', active);
        this.panel.classList.toggle('is-measuring', active);
        this.updateHint();
        if (!active && this.preview) {
            this.layer.removeLayer(this.preview);
            this.preview = null;
            this.panel.querySelector('.opsar-measure-total').innerHTML = this.formatDistanceMarkup(this.getTotal());
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
        this.panel.querySelector('.opsar-measure-total').innerHTML = `${this.formatDistanceMarkup(current)} <em class="opsar-measure-preview-label">Aperçu</em>`;
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
        this.panel.querySelector('.opsar-measure-total').innerHTML = this.formatDistanceMarkup(this.getTotal());
        this.updateButtonReadout();
        this.updateHint();
    }

    renderSegments() {
        this.renderWaypoints();
        this.updateHint();
    }

    renderWaypoints() {
        const list = this.panel.querySelector('.opsar-measure-points');
        this.panel.querySelector('.opsar-measure-count').textContent = this.points.length;
        list.innerHTML = this.points.map((_, index) => `
            <li>
                <span class="opsar-measure-point-number">${String(index + 1).padStart(2, '0')}</span>
                <span class="opsar-measure-point-info">
                    <strong>Waypoint ${index + 1}</strong>
                    <small>${index === 0 ? 'Départ' : this.formatDistance(this.points[index - 1].distanceTo(this.points[index]))}</small>
                </span>
                <button type="button" data-measure-action="delete-waypoint" data-waypoint-index="${index}" aria-label="Supprimer le waypoint ${index + 1}" title="Supprimer le waypoint ${index + 1}">×</button>
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

    formatDistanceMarkup(meters) {
        const nauticalMiles = (meters / 1852).toFixed(2);
        const kilometers = (meters / 1000).toFixed(2);
        return `${nauticalMiles} NM <small>(${kilometers} km)</small>`;
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
        if (this.points.length === 0) hint.textContent = this.active ? 'Cliquez sur la carte pour placer le premier waypoint.' : 'Démarrez une mesure, puis cliquez sur la carte pour poser le premier waypoint.';
        else if (this.active) hint.textContent = `Cliquez sur la carte pour prolonger la route après le waypoint ${this.points.length}. Glissez un point pour le déplacer.`;
        else hint.textContent = `${this.points.length} waypoint${this.points.length > 1 ? 's' : ''} · choisissez « Continuer la route » pour reprendre, puis cliquez sur la carte. Sur mobile, maintenez un point pour le déplacer.`;
    }

    clear() {
        this.points = [];
        this.layer.clearLayers();
        this.preview = null;
        this.panel.querySelector('.opsar-measure-total').innerHTML = this.formatDistanceMarkup(0);
        this.markers = [];
        this.renderWaypoints();
        this.updateButtonReadout();
        this.panel.querySelector('.opsar-measure-status').textContent = this.active ? 'Route en cours' : 'Prête à mesurer';
        this.panel.querySelector('.opsar-measure-continue').textContent = this.active ? 'Terminer' : 'Démarrer';
        this.updateHint();
    }

    closePanel() {
        this.setActive(false);
        this.panel.classList.remove('is-visible');
    }
}

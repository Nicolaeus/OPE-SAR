export default class DistanceMeasure {
    constructor(map, button) {
        this.map = map;
        this.button = button;
        this.points = [];
        this.active = false;
        this.layer = L.layerGroup().addTo(map);
        this.panel = this.createPanel();
        this.preview = null;
    }

    init() {
        document.getElementById('app').appendChild(this.panel);
        this.button.addEventListener('click', () => this.toggle());
        this.map.on('click', event => this.addPoint(event.latlng));
        this.map.on('mousemove', event => this.updatePreview(event.latlng));
        this.panel.addEventListener('click', event => {
            const action = event.target.closest('[data-measure-action]')?.dataset.measureAction;
            if (action === 'finish') this.setActive(false);
            if (action === 'clear') this.clear();
            if (action === 'close') this.closePanel();
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
            icon: L.divIcon({
                className: 'opsar-measure-marker',
                html: `<span>${this.points.length}</span>`,
                iconSize: [28, 28],
                iconAnchor: [14, 14]
            }),
            interactive: false
        });
        marker.addTo(this.layer);
        this.renderLine();
        this.renderSegments();
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

    getTotal() {
        return this.points.slice(1).reduce((total, point, index) => total + this.points[index].distanceTo(point), 0);
    }

    formatDistance(meters) {
        const nauticalMiles = meters / 1852;
        const kilometers = meters / 1000;
        return `${nauticalMiles.toFixed(2)} NM (${kilometers.toFixed(2)} km)`;
    }

    updateHint() {
        const hint = this.panel.querySelector('.opsar-measure-hint');
        if (this.points.length === 0) hint.textContent = this.active ? 'Cliquez sur la carte pour placer le waypoint 1.' : 'Activez l’outil, puis cliquez sur la carte pour ajouter des waypoints.';
        else if (this.active) hint.textContent = `Waypoint ${this.points.length} placé · cliquez pour ajouter le suivant.`;
        else hint.textContent = `${this.points.length} waypoint${this.points.length > 1 ? 's' : ''} placé${this.points.length > 1 ? 's' : ''}.`;
    }

    clear() {
        this.points = [];
        this.layer.clearLayers();
        this.preview = null;
        this.panel.querySelector('.opsar-measure-segments').innerHTML = '';
        this.panel.querySelector('.opsar-measure-total').textContent = '0 m';
        this.updateHint();
    }

    closePanel() {
        this.setActive(false);
        this.panel.classList.remove('is-visible');
    }
}

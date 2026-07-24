export default class MapControls {
    static create(map) {
        const wrapper = document.createElement('div');
        wrapper.className = 'opsar-map-controls';

        wrapper.innerHTML = `
            <div class="opsar-map-controls-group opsar-zoom-group">
                <button class="opsar-map-btn" data-action="zoom-in" aria-label="Zoomer">
                    <span class="opsar-map-icon">+</span>
                </button>
                <div class="opsar-map-controls-divider"></div>
                <button class="opsar-map-btn" data-action="zoom-out" aria-label="Dézoomer">
                    <span class="opsar-map-icon">−</span>
                </button>
            </div>

            <button class="opsar-map-btn opsar-map-btn-standalone" data-action="recenter" aria-label="Recentrer">
                <span class="opsar-map-icon">🎯</span>
            </button>

            <button class="opsar-map-btn opsar-map-btn-standalone" data-action="reset-north" aria-label="Nord">
                <span class="opsar-map-icon">🧭</span>
            </button>
        `;

        wrapper.querySelector('[data-action="zoom-in"]')
            .addEventListener('click', () => map.zoomIn());

        wrapper.querySelector('[data-action="zoom-out"]')
            .addEventListener('click', () => map.zoomOut());

        wrapper.querySelector('[data-action="recenter"]')
            .addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('map:recenter'));
            });

        wrapper.querySelector('[data-action="reset-north"]')
            .addEventListener('click', (e) => {
                this.pulseNorth(e.currentTarget);
                window.dispatchEvent(new CustomEvent('map:reset-north'));
            });

        return wrapper;
    }

    static pulseNorth(button) {
        button.classList.add('opsar-map-btn-pulse');
        setTimeout(() => button.classList.remove('opsar-map-btn-pulse'), 300);
    }
}

import MapService from '../../../modules/map/services/MapService.js';
import RecenterMenu from './RecenterMenu.js';

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

            <button class="opsar-map-btn opsar-map-btn-standalone" data-action="reset-view" aria-label="Vue par défaut">
                <span class="opsar-map-icon">🧭</span>
            </button>
        `;


        const recenterMenu = RecenterMenu.create();
        document.body.appendChild(recenterMenu);
        
        wrapper.querySelector('[data-action="zoom-in"]')
            .addEventListener('click', () => map.zoomIn());

        wrapper.querySelector('[data-action="zoom-out"]')
            .addEventListener('click', () => map.zoomOut());

        wrapper.querySelector('[data-action="recenter"]')
            .addEventListener('click', (event) => {
        
                event.stopPropagation();
        
                RecenterMenu.toggle(
                    recenterMenu,
                    event.currentTarget
                );
        
            });

        wrapper.querySelector('[data-action="reset-view"]')
            .addEventListener('click', ()=> {
               MapService.resetView();
            });

        return wrapper;
    }

    static pulseNorth(button) {
        button.classList.add('opsar-map-btn-pulse');
        setTimeout(() => button.classList.remove('opsar-map-btn-pulse'), 300);
    }
}

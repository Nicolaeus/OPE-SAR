import Store from '../../../core/store/Store.js';
import mapConfig from '../../../core/config/map.config.js';
import { createBaseLayers } from '../layers/BaseLayers.js';

export default class MapService {

    static createMap() {

        const map = L.map('map', {
            zoomControl: true
        });

        map.setView(
            mapConfig.center,
            mapConfig.zoom
        );

        const baseLayers = createBaseLayers();

        baseLayers.osmMarine.addTo(map);

        Store.state.map.instance = map;

        Store.state.map.baseLayers = baseLayers;

        Store.state.map.currentBaseLayer = 'osmMarine';

        // =====================================
        // Force le recalcul de la carte
        // =====================================

        setTimeout(
            () => map.invalidateSize(),
            300
        );

        window.addEventListener(
            'resize',
            () => map.invalidateSize()
        );

        window.visualViewport?.addEventListener(
            'resize',
            () => map.invalidateSize()
        );

        window.addEventListener(
            "load",
            () => {
        
                setTimeout(() => {
        
                    map.invalidateSize(true);
        
                }, 500);
        
            }
        );
        
        return map;

    }

    static getMap() {

        return Store.state.map.instance;

    }

}

import Store from '../../../core/store/Store.js';
import mapConfig from '../../../core/config/map.config.js';
import { createBaseLayers } from '../layers/BaseLayers.js';
import PositionService from './PositionService.js';
import StationService from '../../stations/services/StationService.js';
import StationReferenceService from '../../stations/services/StationReferenceService.js';
import NotificationService from '../../../core/services/NotificationService.js';

export default class MapService {

    static createMap() {
               
        const map = L.map('map', {
            zoomControl: false
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

    static resetView() {
    
        const map = this.getMap();
    
        if (!map) {
            return;
        }
    
        map.flyTo(
            mapConfig.center,
            mapConfig.zoom,
            {
                animate: true,
                duration: 1.2
            }
        );
    
    }

    static async centerOnCurrentPosition() {

        const position =
            await PositionService.getCurrentPosition();
    
        if (!position) {
            NotificationService.warning(
                'Position navire indisponible. Vérifiez l’autorisation de localisation et le GPS de l’appareil.'
            );
            return;
        }

        const map = this.getMap();
        if (!map) return;

        map.flyTo(
            [position.latitude, position.longitude],
            16,
            { animate: true, duration: 1.2 }
        );

    }

    static centerOnSelectedVessel() {

        return this.centerOnCurrentPosition();

    }

    static centerOnSelectedStation() {

        const stationId = StationReferenceService.get();
        const station = stationId
            ? StationService.getById(stationId)
            : null;

        if (!station) {
            NotificationService.warning(
                'Aucune station de référence n’est définie.'
            );
            return;
        }

        this.centerOnStation(station);
    
    }
    
    static centerOnStation(station) {
    
        const position =
            PositionService.getStationPosition(station);
    
        if (!position) {
            return;
        }
    
        const map = this.getMap();
        if (!map) return;

        map.flyTo(
            [position.latitude, position.longitude],
            16,
            { animate: true, duration: 1.2 }
        );
    
    }

}

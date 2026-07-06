import BaseCard from '../../../shared/ui/cards/BaseCard.js';
import CardSection from '../../../shared/ui/cards/CardSection.js';
import CardToggle from '../../../shared/ui/cards/CardToggle.js';
import CardRadioGroup from '../../../shared/ui/cards/CardRadioGroup.js';
import CardCheckboxGroup from '../../../shared/ui/cards/CardCheckboxGroup.js';

import LayerManager from '../services/LayerManager.js';

export default class MapLayersCard {

    static instance = null;

    static create() {

        if (this.instance) {

            this.instance.element.remove();

            this.instance = null;

        }

        const card = new BaseCard({

            id: 'map-layers-card',

            title: 'Carte',

            color: 'cyan',

            icon: '🗺'

        });

        // ==========================================
        // FOND DE CARTE
        // ==========================================

        const baseLayerSection =
            new CardSection(
                'Fond'
            );

        const baseLayers =
            new CardRadioGroup({

                name: 'baselayer',

                options: [

                    {
                        value: 'osmMarine',
                        label: 'OSM Marine',
                        checked: true
                    },

                    {
                        value: 'osm',
                        label: 'OSM'
                    },

                    {
                        value: 'satellite',
                        label: 'Satellite'
                    },

                    {
                        value: 'dark',
                        label: 'Mode Nuit'
                    }

                ],

                onChange: value => {

                    LayerManager.setBaseLayer(
                        value
                    );

                }

            });

        baseLayerSection.add(
            baseLayers.element
        );

        // ==========================================
        // OBJETS
        // ==========================================

        const objectsSection =
            new CardSection(
                'Objets'
            );

        const stationsToggle =
            new CardToggle({

                label:
                    'Stations SNSM',

                checked:
                    true,

                onChange:
                    enabled => {

                        LayerManager
                            .toggleStations(
                                enabled
                            );

                    }

            });

        objectsSection.add(
            stationsToggle.element
        );

        const portsToggle =
            new CardToggle({

                label:
                    'Ports',

                checked:
                    true,

                onChange:
                    enabled => {

                        LayerManager
                            .togglePorts(
                                enabled
                            );

                    }

            });

        objectsSection.add(
            portsToggle.element
        );

        const lighthouseToggle =
            new CardToggle({

                label:
                    'Phares',

                checked:
                    false,

                onChange:
                    enabled => {

                        LayerManager
                            .toggleLighthouses(
                                enabled
                            );

                    }

            });

        objectsSection.add(
            lighthouseToggle.element
        );

        const buoyToggle =
            new CardToggle({

                label:
                    'Balises',

                checked:
                    false,

                onChange:
                    enabled => {

                        LayerManager
                            .toggleBuoys(
                                enabled
                            );

                    }

            });

        objectsSection.add(
            buoyToggle.element
        );

        // ==========================================
        // RÉGLEMENTAIRE
        // ==========================================

        const regulatorySection =
            new CardSection(
                'Réglementaire'
            );

        const restrictedToggle =
            new CardToggle({

                label:
                    'Zones interdites',

                checked:
                    false,

                onChange:
                    enabled => {

                        LayerManager
                            .toggleRestricted(
                                enabled
                            );

                    }

            });

        regulatorySection.add(
            restrictedToggle.element
        );

        const coastalToggle =
            new CardToggle({

                label:
                    'Limites côtières',

                checked:
                    false,

                onChange:
                    async enabled => {

                        await LayerManager
                            .toggleCoastal(
                                enabled
                            );

                        limitsSection.element.style.display =
                            enabled
                                ? 'block'
                                : 'none';

                    }

            });

        regulatorySection.add(
            coastalToggle.element
        );

        // ==========================================
        // LIMITES RÉGLEMENTAIRES
        // ==========================================

        const limitsSection =
            new CardSection(
                'Limites réglementaires'
            );

        limitsSection.element.style.display =
            'none';

        const limits =
            new CardCheckboxGroup({

                options: [

                    {
                        value: '300m',
                        label: '300 m',
                        checked: true
                    },

                    {
                        value: '2MN',
                        label: '2 NM',
                        checked: true
                    },

                    {
                        value: '6MN',
                        label: '6 NM',
                        checked: true
                    },

                    {
                        value: '12MN',
                        label: '12 NM',
                        checked: true
                    },

                    {
                        value: '60MN',
                        label: '60 NM',
                        checked: false
                    }

                ],

                onChange: (
                    limit,
                    checked
                ) => {

                    const map =
                        window.OPESAR.Map.getMap();

                    if (checked) {

                        window.debugCoastalLayers
                            ?.showLimit(
                                limit,
                                map
                            );

                    }
                    else {

                        window.debugCoastalLayers
                            ?.hideLimit(
                                limit,
                                map
                            );

                    }

                }

            });

        limitsSection.add(
            limits.element
        );

        // ==========================================
        // ASSEMBLAGE
        // ==========================================

        card.add(
            baseLayerSection.element
        );

        card.add(
            objectsSection.element
        );

        card.add(
            regulatorySection.element
        );

        card.add(
            limitsSection.element
        );

        this.instance =
            card;

        card.element.addEventListener(

            'card:close',

            () => {

                MapLayersCard.close();

            }

        );

        return card;

    }

    // ==========================================
    // Gestion ouverture / fermeture
    // ==========================================

    static close() {

        if (!this.instance) {
            return;
        }

        this.instance.element.remove();

        this.instance = null;

    }

    static isOpen() {

        return this.instance !== null;

    }

}
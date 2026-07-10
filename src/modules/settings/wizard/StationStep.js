import WizardStep from '../../../shared/ui/wizard/WizardStep.js';

import StationManager from '../../stations/services/StationManager.js';

export default class StationStep extends WizardStep {

    constructor() {

        super(
            'Station de référence'
        );

        this.select = null;

    }

    render(data = {}) {

        const container =
            document.createElement(
                'div'
            );

        container.className =
            'opsar-step';

        const stations =
            StationManager.getStations?.() ??
            [];

        const options =
            stations.map(

                station => `

                    <option
                        value="${station.id}">

                        ${station.stationNumber}
                        -
                        ${station.name}

                    </option>

                `

            ).join('');

        container.innerHTML = `

            <div
                class="opsar-step-icon">

                ⚓

            </div>

            <h2
                class="opsar-step-title">

                Station SNSM

            </h2>

            <p
                class="opsar-step-description">

                Choisissez la station
                qui sera utilisée
                par défaut dans OPE-SAR.

            </p>

            <div
                class="opsar-step-group">

                <div
                    class="opsar-step-card">

                    <select
                        id="wizard-station"
                        class="opsar-step-select">

                        <option value="">

                            -- Sélectionner --

                        </option>

                        ${options}

                    </select>

                </div>

            </div>

            <div
                class="opsar-step-footer">

                Vous pourrez modifier
                ce choix plus tard
                dans les paramètres.

            </div>

        `;

        this.select =
            container.querySelector(
                '#wizard-station'
            );

        if (

            data.referenceStation

        ) {

            this.select.value =
                data.referenceStation;

        }

        return container;

    }

    save(data) {

        data.referenceStation =
            this.select?.value ??
            null;

    }

}

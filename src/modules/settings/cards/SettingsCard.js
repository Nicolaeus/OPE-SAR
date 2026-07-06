import BaseCard from '../../../shared/ui/cards/BaseCard.js';
import CardSection from '../../../shared/ui/cards/CardSection.js';
import BaseCardController from '../../../shared/ui/cards/BaseCardController.js';

import appConfig from '../../../core/config/app.config.js';
import NotificationService from '../../../core/services/NotificationService.js';
import StationReferenceService from '../../stations/services/StationReferenceService.js';
import StationService from '../../stations/services/StationService.js';

export default class SettingsCard extends BaseCardController {

    static create() {

        this.close();

        const card =
            new BaseCard({
                id: 'settings-card',
                title: 'CONFIG',
                icon: '⚙',
                color: 'purple'
            });

        card.add(
            this.buildAppSection().element
        );

        card.add(
            this.buildStationSection().element
        );

        card.add(
            this.buildLocalSection().element
        );

        card.add(
            this.buildMaintenanceSection().element
        );

        card.render(
            document.getElementById('app')
        );

        this.instance =
            card;

        card.element.addEventListener(
            'card:close',
            () => SettingsCard.close()
        );

        this.bindEvents();

        return card;

    }

    static buildAppSection() {

        const section =
            new CardSection(
                'Application'
            );

        const content =
            document.createElement('div');

        content.innerHTML = `
            <div class="opsar-row">
                <span class="opsar-label">Nom</span>
                <span class="opsar-value">${appConfig.appName}</span>
            </div>
            <div class="opsar-row">
                <span class="opsar-label">Version</span>
                <span class="opsar-value">${appConfig.version}</span>
            </div>
            <div class="opsar-row">
                <span class="opsar-label">Mode</span>
                <span class="opsar-value">${this.getRuntimeLabel()}</span>
            </div>
        `;

        section.add(
            content
        );

        return section;

    }

    static buildStationSection() {

        const section =
            new CardSection(
                'Station de référence'
            );

        const stationId =
            StationReferenceService.get();

        const station =
            stationId
                ? StationService.getById(stationId)
                : null;

        const content =
            document.createElement('div');

        content.innerHTML = `
            <div class="opsar-row">
                <span class="opsar-label">Station</span>
                <span class="opsar-value">
                    ${station ? `${station.stationNumber} ${station.name}` : 'Aucune'}
                </span>
            </div>
            <button
                id="settings-clear-station"
                class="opsar-btn opsar-btn-secondary"
                style="width:100%;margin-top:8px;"
                ${stationId ? '' : 'disabled'}>
                Effacer la référence
            </button>
        `;

        section.add(
            content
        );

        return section;

    }

    static buildLocalSection() {

        const section =
            new CardSection(
                'Données locales'
            );

        const content =
            document.createElement('div');

        content.innerHTML = `
            <div class="opsar-row">
                <span class="opsar-label">Service worker</span>
                <span class="opsar-value">${this.getServiceWorkerLabel()}</span>
            </div>
            <div class="opsar-row">
                <span class="opsar-label">Manifest PWA</span>
                <span class="opsar-value">Désactivé</span>
            </div>
        `;

        section.add(
            content
        );

        return section;

    }

    static buildMaintenanceSection() {

        const section =
            new CardSection(
                'Maintenance'
            );

        const content =
            document.createElement('div');

        content.innerHTML = `
            <button
                id="settings-clear-cache"
                class="opsar-btn opsar-btn-warning"
                style="width:100%;">
                Nettoyer caches OPE-SAR
            </button>
            <button
                id="settings-reload"
                class="opsar-btn opsar-btn-secondary"
                style="width:100%;margin-top:8px;">
                Recharger l'application
            </button>
        `;

        section.add(
            content
        );

        return section;

    }

    static bindEvents() {

        document
            .getElementById('settings-clear-station')
            ?.addEventListener(
                'click',
                () => {

                    StationReferenceService.clear();

                    NotificationService.success(
                        'Station de référence effacée.'
                    );

                    this.create();

                }
            );

        document
            .getElementById('settings-clear-cache')
            ?.addEventListener(
                'click',
                async () => {

                    await this.clearAppCaches();

                    NotificationService.success(
                        'Caches OPE-SAR nettoyés.'
                    );

                }
            );

        document
            .getElementById('settings-reload')
            ?.addEventListener(
                'click',
                () => {
                    window.location.reload();
                }
            );

    }

    static async clearAppCaches() {

        if (!('caches' in window)) {
            return;
        }

        const keys =
            await caches.keys();

        await Promise.all(
            keys
                .filter(key =>
                    key.startsWith('opesar-')
                )
                .map(key =>
                    caches.delete(key)
                )
        );

    }

    static getRuntimeLabel() {

        return window.location.hostname === 'localhost'
            ? 'Local'
            : 'Navigateur';

    }

    static getServiceWorkerLabel() {

        if (!('serviceWorker' in navigator)) {
            return 'Non supporté';
        }

        return 'Désactivé';

    }

}

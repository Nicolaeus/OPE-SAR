/**
 * ==========================================================
 * OPE-SAR Core
 * ----------------------------------------------------------
 * SettingsService.js
 *
 * Gestion centralisée des paramètres utilisateur.
 *
 * Toute lecture / écriture passe par ce service.
 * ==========================================================
 */

import StorageService
    from './StorageService.js';

import Collections
    from '../database/Collections.js';

export default class SettingsService {

    static SETTINGS_ID =
        'user';

    static DEFAULT_SETTINGS = {

        id:
            this.SETTINGS_ID,

        initialized:
            false,

        referenceStation:
            null,

        theme:
            'auto',

        defaultMode:
            'sar'

    };

    // =====================================================
    // Initialisation
    // =====================================================

    static async initialize() {

        const exists =

            await StorageService.exists(

                Collections.SETTINGS,

                this.SETTINGS_ID

            );

        if (

            exists

        ) {

            return;

        }

        await StorageService.save(

            Collections.SETTINGS,

            {

                ...this.DEFAULT_SETTINGS

            }

        );

    }

    // =====================================================
    // Lecture complète
    // =====================================================

    static async load() {

        const settings =

            await StorageService.load(

                Collections.SETTINGS,

                this.SETTINGS_ID

            );

        if (

            !settings

        ) {

            return {

                ...this.DEFAULT_SETTINGS

            };

        }

        return {

            ...this.DEFAULT_SETTINGS,

            ...settings

        };

    }

    // =====================================================
    // Sauvegarde complète
    // =====================================================

    static async save(

        settings

    ) {

        return StorageService.save(

            Collections.SETTINGS,

            {

                id:
                    this.SETTINGS_ID,

                ...settings

            }

        );

    }

    // =====================================================
    // Mise à jour partielle
    // =====================================================

    static async update(

        values

    ) {

        const settings =

            await this.load();

        return this.save(

            {

                ...settings,

                ...values

            }

        );

    }

    // =====================================================
    // Premier lancement
    // =====================================================

    static async isInitialized() {

        const settings =

            await this.load();

        return settings.initialized;

    }

    static async setInitialized(

        value = true

    ) {

        return this.update(

            {

                initialized:
                    value

            }

        );

    }

    // =====================================================
    // Station
    // =====================================================

    static async getReferenceStation() {

        const settings =

            await this.load();

        return settings.referenceStation;

    }

    static async setReferenceStation(

        stationId

    ) {

        return this.update(

            {

                referenceStation:
                    stationId

            }

        );

    }

    // =====================================================
    // Thème
    // =====================================================

    static async getTheme() {

        const settings =

            await this.load();

        return settings.theme;

    }

    static async setTheme(

        theme

    ) {

        return this.update(

            {

                theme

            }

        );

    }

    // =====================================================
    // Mode
    // =====================================================

    static async getDefaultMode() {

        const settings =

            await this.load();

        return settings.defaultMode;

    }

    static async setDefaultMode(

        mode

    ) {

        return this.update(

            {

                defaultMode:
                    mode

            }

        );

    }

    // =====================================================
    // Reset
    // =====================================================

    static async reset() {

        await StorageService.remove(

            Collections.SETTINGS,

            this.SETTINGS_ID

        );

        await this.initialize();

    }

}

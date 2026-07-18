import StorageService
    from '../../../core/services/StorageService.js';

export default class SettingsService {

    static STORAGE_KEY =
        'opsar-settings';

    static DEFAULT_SETTINGS = {

        initialized: false,

        referenceStation: null,

        theme: 'auto',

        defaultMode: 'sar'

    };

    // =================================
    // Chargement
    // =================================

    static load() {

        const settings =

            StorageService.get(

                this.STORAGE_KEY

            );

        if (!settings) {

            return {

                ...this.DEFAULT_SETTINGS

            };

        }

        return {

            ...this.DEFAULT_SETTINGS,

            ...settings

        };

    }

    // =================================
    // Sauvegarde complète
    // =================================

    static save(settings) {

        StorageService.set(

            this.STORAGE_KEY,

            settings

        );

    }

    // =================================
    // Mise à jour partielle
    // =================================

    static update(values) {

        const settings =

            this.load();

        const updated = {

            ...settings,

            ...values

        };

        this.save(updated);

    }

    // =================================
    // Reset
    // =================================

    static reset() {

        StorageService.remove(

            this.STORAGE_KEY

        );

    }

    // =================================
    // Premier lancement ?
    // =================================

    static isInitialized() {

        return this.load()

            .initialized;

    }

    // =================================
    // Helpers
    // =================================

    static getTheme() {

        return this.load()

            .theme;

    }

    static getDefaultMode() {

        return this.load()

            .defaultMode;

    }

    static getReferenceStation() {

        return this.load()

            .referenceStation;

    }

}

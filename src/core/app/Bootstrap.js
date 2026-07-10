import App from './App.js';

import Registry from './Registry.js';

import Database
    from '../database/Database.js';

import SettingsService
    from '../services/SettingsService.js';

import CacheManager from '../cache/CacheManager.js';

import SplashScreen from '../../shared/ui/splash/Splash.js';

import AppHeader from '../../shared/ui/header/AppHeader.js';

import BottomNavigation from '../../shared/ui/navigation/BottomNavigation.js';

// import WizardLauncher from '../../modules/settings/wizard/WizardLauncher.js';

import MapModule from '../../modules/map/index.js';

import StationsModule from '../../modules/stations/index.js';

import WeatherModule from '../../modules/weather/index.js';

import TidesModule from '../../modules/tides/index.js';

import SARModule from '../../modules/sar/index.js';

import OSCModule from '../../modules/osc/index.js';

import SettingsModule from '../../modules/settings/index.js';

export default class Bootstrap {

    static async start() {

        // =============================================
        // Splash
        // =============================================

        SplashScreen.show();

        console.log(
            '🚀 Démarrage OPE-SAR'
        );

        // =============================================
        // Initialisation du Core
        // =============================================

        await Database.open();

        await SettingsService.initialize();

        // await ThemeService.apply();

        // ThemeService.listen();

        await CacheManager.cleanExpired();

        console.log(
            '✅ Core initialisé'
        );

        // =============================================
        // Interface principale
        // =============================================

        const appContainer =
            document.getElementById(
                'app'
            );

        appContainer.appendChild(
            AppHeader.create()
        );

        appContainer.appendChild(
            BottomNavigation.create()
        );

        // =============================================
        // Application
        // =============================================

        const app =
            new App();

        Registry.register(
            'map',
            MapModule
        );

        Registry.register(
            'stations',
            StationsModule
        );

        Registry.register(
            'weather',
            WeatherModule
        );

        Registry.register(
            'tides',
            TidesModule
        );

        Registry.register(
            'sar',
            SARModule
        );

        Registry.register(
            'osc',
            OSCModule
        );

        Registry.register(
            'settings',
            SettingsModule
        );

        app.register(
            MapModule
        );

        app.register(
            StationsModule
        );

        app.register(
            WeatherModule
        );

        app.register(
            TidesModule
        );

        app.register(
            SARModule
        );

        app.register(
            OSCModule
        );

        app.register(
            SettingsModule
        );

        await app.start();

        // =============================================
        // Application prête
        // =============================================

        window.dispatchEvent(

            new CustomEvent(

                'app:ready'

            )

        );

        // =============================================
        // Premier lancement
        // =============================================

       // await WizardLauncher.launch();

        // =============================================
        // Fin du splash
        // =============================================

        await SplashScreen.hide();

        console.log(
            '✅ OPE-SAR prêt'
        );

    }

}

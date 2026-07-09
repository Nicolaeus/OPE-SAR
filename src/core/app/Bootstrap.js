import App from './App.js';

import Registry from './Registry.js';

import SplashScreen from '../../shared/ui/splash/Splash.js';

import AppHeader from '../../shared/ui/header/AppHeader.js';

import BottomNavigation from '../../shared/ui/navigation/BottomNavigation.js';

import MapModule from '../../modules/map/index.js';

import StationsModule from '../../modules/stations/index.js';

import WeatherModule from '../../modules/weather/index.js';

import TidesModule from '../../modules/tides/index.js';

import SARModule from '../../modules/sar/index.js';

import OSCModule from '../../modules/osc/index.js';

import SettingsModule from '../../modules/settings/index.js';

export default class Bootstrap {

    static async start() {

		SplashScreen.show();

		console.log("Splash demandé");

		await new Promise(
		    resolve =>
		        requestAnimationFrame(resolve)
		);
		
		await new Promise(
		    resolve =>
		        requestAnimationFrame(resolve)
		);

		await new Promise(
		    resolve =>
		        setTimeout(resolve, 10000)
		);

        console.log('⚓ OPE-SAR V21');
		
		const header = AppHeader.create();

		document
			.getElementById('app')
			.appendChild(header);
			
		const bottomNav = BottomNavigation.create();

		document
			.getElementById('app')
			.appendChild(
				bottomNav
			);
			
			

        const app = new App();

        Registry.register('map', MapModule);
		Registry.register('stations',StationsModule);
        Registry.register('weather',WeatherModule);
		Registry.register('tides',TidesModule);
		Registry.register('sar',SARModule);
		Registry.register('osc',OSCModule);
		Registry.register('settings',SettingsModule);
		

		app.register(MapModule);
		app.register(StationsModule);
		app.register(WeatherModule);
		app.register(TidesModule);
		app.register(SARModule);
		app.register(OSCModule);
		app.register(SettingsModule);
		
		await app.start();

		window.dispatchEvent(
			new CustomEvent(
				'app:ready'
			)
		);


		await SplashScreen.hide();
		
		console.log(
			'✅ Application démarrée'
		);

    }

}

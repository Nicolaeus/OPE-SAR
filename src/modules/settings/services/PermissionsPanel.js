import GeolocationService from '../../../core/services/GeolocationService.js';

const FIRST_RUN_KEY = 'opesar_permissions_intro_seen';

const PERMISSIONS = [
    {
        group: 'Données personnelles et capteurs',
        id: 'camera',
        name: 'Appareil photo / caméra',
        description: 'Autorisation demandée lorsque vous activez une fonction photo ou vidéo.',
        permission: 'camera',
        requestable: true
    },
    {
        group: 'Données personnelles et capteurs',
        id: 'microphone',
        name: 'Microphone',
        description: 'Autorisation nécessaire pour la dictée ou la capture audio. La liaison audio VHF dépendra du matériel et d’une intégration compatible.',
        permission: 'microphone',
        requestable: true
    },
    {
        group: 'Données personnelles et capteurs',
        id: 'geolocation',
        name: 'Position / GPS',
        description: 'Position précise gérée par le navigateur et le système. OPE-SAR l’utilise pour le suivi GPS.',
        permission: 'geolocation',
        requestable: true
    },
    {
        group: 'Données personnelles et capteurs',
        id: 'contacts',
        name: 'Contacts',
        description: 'Le navigateur ne donne accès qu’aux contacts choisis par l’utilisateur, si cette fonction est prise en charge.',
        availability: () => navigator.contacts?.select ? 'Choix ponctuel, si pris en charge' : 'Non pris en charge par ce navigateur'
    },
    {
        group: 'Données personnelles et capteurs',
        id: 'calendar',
        name: 'Calendrier / agenda',
        description: 'Les PWA ne disposent pas d’un accès standard au calendrier du téléphone.',
        availability: () => 'Non disponible dans cette PWA'
    },
    {
        group: 'Fichiers et matériel',
        id: 'photos',
        name: 'Photos et vidéos (galerie)',
        description: 'Le sélecteur système demandera de choisir les fichiers au moment où une fonction d’import sera utilisée.',
        availability: () => 'Accès ponctuel lors du choix'
    },
    {
        group: 'Fichiers et matériel',
        id: 'files',
        name: 'Fichiers et documents',
        description: 'Les fichiers sont choisis explicitement dans le sélecteur système ; aucun accès général au stockage n’est accordé.',
        availability: () => 'Accès ponctuel lors du choix'
    },
    {
        group: 'Fichiers et matériel',
        id: 'bluetooth',
        name: 'Appareils à proximité — Bluetooth',
        description: navigator.bluetooth?.requestDevice
            ? 'Web Bluetooth est disponible pour certains appareils ; aucune liaison VHF n’est intégrée pour le moment.'
            : 'Bluetooth n’est pas exposé par ce navigateur. La liaison VHF n’est pas encore intégrée.',
        availability: () => navigator.bluetooth?.requestDevice ? 'Disponible, intégration spécifique requise' : 'Non pris en charge par ce navigateur'
    },
    {
        group: 'Fichiers et matériel',
        id: 'wifi',
        name: 'Appareils à proximité — Wi-Fi',
        description: 'Une PWA ne peut pas parcourir les réseaux Wi-Fi ou détecter les appareils à proximité via Wi-Fi.',
        availability: () => 'Non disponible dans cette PWA'
    },
    {
        group: 'Activités et notifications',
        id: 'notifications',
        name: 'Notifications',
        description: 'Autorise les alertes système. Le navigateur ou le système peut exiger que la PWA soit installée.',
        permission: 'notifications',
        requestable: true
    }
];

export default class PermissionsPanel {
    static introSeenInSession = false;

    static async showFirstRun() {
        if (this.hasSeenIntro()) return;

        const overlay = document.createElement('div');
        overlay.className = 'opsar-permissions-overlay';
        overlay.setAttribute('role', 'presentation');
        overlay.innerHTML = `
            <section class="opsar-permissions-dialog" role="dialog" aria-modal="true" aria-labelledby="opsar-permissions-title">
                <header>
                    <span class="opsar-permissions-icon" aria-hidden="true">🔐</span>
                    <div>
                        <h2 id="opsar-permissions-title">Données personnelles et capteurs</h2>
                        <p>Choisissez les accès utiles à OPE-SAR. Chaque demande est faite séparément par le navigateur.</p>
                    </div>
                </header>
                <div class="opsar-permissions-content"></div>
                <p class="opsar-permissions-footnote">Les autorisations accordées ou refusées se gèrent dans les réglages du navigateur ou du système. Vous retrouverez cet état dans Paramètres.</p>
                <footer><button type="button" class="opsar-permissions-dismiss">Continuer</button></footer>
            </section>`;

        const content = overlay.querySelector('.opsar-permissions-content');
        this.renderRows(content);
        document.body.appendChild(overlay);
        this.bindRows(content);
        overlay.querySelector('.opsar-permissions-dismiss').addEventListener('click', () => {
            this.markIntroSeen();
            overlay.remove();
        });
        await this.refreshRows(content);
    }

    static createSettingsSection() {
        const container = document.createElement('div');
        container.className = 'opsar-permissions-settings';
        const intro = document.createElement('p');
        intro.className = 'opsar-permissions-footnote';
        intro.textContent = 'Les demandes sont déclenchées au moment où vous les activez. Pour révoquer un accès, utilisez les réglages du navigateur ou du système.';
        container.appendChild(intro);
        this.renderRows(container);
        return container;
    }

    static bindSettings(container) {
        if (!container) return;
        this.bindRows(container);
        this.refreshRows(container);
    }

    static renderRows(container) {
        let currentGroup = '';
        PERMISSIONS.forEach(item => {
            if (item.group !== currentGroup) {
                currentGroup = item.group;
                const heading = document.createElement('h3');
                heading.className = 'opsar-permissions-group';
                heading.textContent = currentGroup;
                container.appendChild(heading);
            }

            const row = document.createElement('div');
            row.className = 'opsar-permission-row';
            row.dataset.permissionId = item.id;
            row.innerHTML = `
                <div class="opsar-permission-copy">
                    <strong class="opsar-permission-name"></strong>
                    <small class="opsar-permission-description"></small>
                    <small class="opsar-permission-status" aria-live="polite"></small>
                </div>
                <button class="opsar-btn opsar-btn-secondary opsar-permission-action" type="button"></button>`;
            row.querySelector('.opsar-permission-name').textContent = item.name;
            row.querySelector('.opsar-permission-description').textContent = item.description;
            container.appendChild(row);
        });
    }

    static bindRows(container) {
        container.querySelectorAll('.opsar-permission-action').forEach(button => {
            button.addEventListener('click', async () => {
                const row = button.closest('.opsar-permission-row');
                const item = PERMISSIONS.find(permission => permission.id === row.dataset.permissionId);
                let requestError = null;
                button.disabled = true;
                row.querySelector('.opsar-permission-status').textContent = 'Demande en cours…';
                try {
                    await this.request(item);
                } catch (error) {
                    requestError = this.getErrorMessage(error);
                }
                await this.refreshRow(row, item);
                if (requestError && row.querySelector('.opsar-permission-status').textContent === 'Pas encore autorisé') {
                    row.querySelector('.opsar-permission-status').textContent = requestError;
                }
            });
        });
    }

    static async refreshRows(container) {
        await Promise.all([...container.querySelectorAll('.opsar-permission-row')].map(row => {
            const item = PERMISSIONS.find(permission => permission.id === row.dataset.permissionId);
            return this.refreshRow(row, item);
        }));
    }

    static async refreshRow(row, item) {
        const status = row.querySelector('.opsar-permission-status');
        const button = row.querySelector('.opsar-permission-action');
        if (!item.requestable) {
            status.textContent = item.availability();
            button.hidden = true;
            return;
        }

        const permissionState = await this.getPermissionState(item);
        const granted = permissionState === 'granted'
            || (item.id === 'geolocation' && GeolocationService.running && permissionState !== 'denied');
        const supported = this.isSupported(item);
        button.hidden = !supported || granted || permissionState === 'denied';
        button.disabled = false;
        button.textContent = item.id === 'geolocation' ? 'Activer le GPS' : 'Autoriser';

        if (!supported) status.textContent = 'Non pris en charge dans cet environnement';
        else if (granted) status.textContent = 'Autorisé';
        else if (permissionState === 'denied') status.textContent = 'Refusé — à modifier dans les réglages système ou navigateur';
        else status.textContent = 'Pas encore autorisé';
    }

    static isSupported(item) {
        if (item.id === 'camera' || item.id === 'microphone') return !!navigator.mediaDevices?.getUserMedia;
        if (item.id === 'geolocation') return !!navigator.geolocation;
        if (item.id === 'notifications') return 'Notification' in window && !!Notification.requestPermission;
        return false;
    }

    static async getPermissionState(item) {
        if (item.id === 'notifications' && 'Notification' in window) {
            if (Notification.permission === 'granted') return 'granted';
            if (Notification.permission === 'denied') return 'denied';
        }
        try {
            return (await navigator.permissions?.query({ name: item.permission }))?.state ?? 'prompt';
        } catch {
            return 'prompt';
        }
    }

    static async request(item) {
        if (item.id === 'geolocation') {
            await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    () => {
                        GeolocationService.start();
                        resolve();
                    },
                    reject,
                    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
                );
            });
            return;
        }
        if (item.id === 'notifications') {
            await Notification.requestPermission();
            return;
        }

        const constraints = item.id === 'camera'
            ? { video: true }
            : { audio: true };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        stream.getTracks().forEach(track => track.stop());
    }

    static getErrorMessage(error) {
        if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError' || error?.code === 1) {
            return 'Accès refusé — modifiable dans les réglages du navigateur ou du système';
        }
        if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
            return 'Aucun appareil compatible détecté';
        }
        return 'Impossible de demander cet accès dans cet environnement';
    }

    static async afterAppLoaded() {
        const state = await this.getPermissionState({ id: 'geolocation', permission: 'geolocation' });
        if (state === 'granted') GeolocationService.start();
        await this.showFirstRun();
    }

    static hasSeenIntro() {
        if (this.introSeenInSession) return true;
        try {
            return localStorage.getItem(FIRST_RUN_KEY) === 'true';
        } catch {
            return false;
        }
    }

    static markIntroSeen() {
        this.introSeenInSession = true;
        try {
            localStorage.setItem(FIRST_RUN_KEY, 'true');
        } catch {
            // The intro still closes for this session if persistent storage is unavailable.
        }
    }
}

export default class NotificationService {

    static container = null;

    static show(
        message,
        options = {}
    ) {

        const type =
            options.type ||
            'info';

        const timeout =
            options.timeout ??
            4200;

        const notification =
            document.createElement('div');

        notification.className =
            `opsar-notification opsar-notification-${type}`;

        notification.setAttribute(
            'role',
            type === 'error'
                ? 'alert'
                : 'status'
        );

        notification.innerHTML = `
            <div class="opsar-notification-message">
                ${message}
            </div>
            <button
                class="opsar-notification-close"
                type="button"
                aria-label="Fermer">
                x
            </button>
        `;

        const close = () => {
            notification.classList.add(
                'opsar-notification-closing'
            );

            window.setTimeout(
                () => notification.remove(),
                180
            );
        };

        notification
            .querySelector(
                '.opsar-notification-close'
            )
            .addEventListener(
                'click',
                close
            );

        this.getContainer()
            .appendChild(
                notification
            );

        if (timeout > 0) {
            window.setTimeout(
                close,
                timeout
            );
        }

        return notification;

    }

    static info(message, options = {}) {
        return this.show(
            message,
            {
                ...options,
                type: 'info'
            }
        );
    }

    static success(message, options = {}) {
        return this.show(
            message,
            {
                ...options,
                type: 'success'
            }
        );
    }

    static warning(message, options = {}) {
        return this.show(
            message,
            {
                ...options,
                type: 'warning'
            }
        );
    }

    static error(message, options = {}) {
        return this.show(
            message,
            {
                ...options,
                type: 'error'
            }
        );
    }

    static getContainer() {

        if (this.container?.isConnected) {
            return this.container;
        }

        this.container =
            document.createElement('div');

        this.container.className =
            'opsar-notification-container';

        document.body.appendChild(
            this.container
        );

        return this.container;

    }

}

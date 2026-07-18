export default class PanelManager {

    static panels = new Map();

    // =====================================
    // Etat
    // =====================================

    static isOpen(name) {

        return this.panels.get(name) === true;

    }

    // =====================================
    // Ouvrir
    // =====================================

    static open(name) {

        if (this.isOpen(name)) {

            return;

        }

        this.panels.set(

            name,

            true

        );

        this.notify(

            name,

            true

        );

    }

    // =====================================
    // Fermer
    // =====================================

    static close(name) {

        if (!this.isOpen(name)) {

            return;

        }

        this.panels.set(

            name,

            false

        );

        this.notify(

            name,

            false

        );

    }

    // =====================================
    // Toggle
    // =====================================

    static toggle(name) {

        if (

            this.isOpen(name)

        ) {

            this.close(name);

            return false;

        }

        this.open(name);

        return true;

    }

    // =====================================
    // Tout fermer
    // =====================================

    static closeAll() {

        this.panels.forEach(

            (open, name) => {

                if (open) {

                    this.close(name);

                }

            }

        );

    }

    // =====================================
    // Notification
    // =====================================

    static notify(name, open) {

        window.dispatchEvent(

            new CustomEvent(

                'navigation:state',

                {

                    detail: {

                        module: name,

                        open

                    }

                }

            )

        );

    }

}

export default class RecenterMenu {

    static create() {

        const menu = document.createElement('div');

        menu.className = 'opsar-recenter-menu';

        menu.innerHTML = `
            <button
                class="opsar-recenter-item"
                data-action="vessel">

                <span class="opsar-recenter-icon">🚤</span>
                <span>Position navire</span>

            </button>

            <button
                class="opsar-recenter-item"
                data-action="station">

                <span class="opsar-recenter-icon">🛟</span>
                <span>Position station</span>

            </button>
        `;

        menu.querySelector('[data-action="vessel"]')
            .addEventListener('click', () => {

                window.dispatchEvent(
                    new CustomEvent('map:center-vessel')
                );

                this.close(menu);

            });

        menu.querySelector('[data-action="station"]')
            .addEventListener('click', () => {

                window.dispatchEvent(
                    new CustomEvent('map:center-station')
                );

                this.close(menu);

            });

        document.addEventListener(
            'click',
            (event) => {

                if (!menu.contains(event.target)) {

                    this.close(menu);

                }

            }
        );

        return menu;

    }

    static open(menu, anchor) {

        const rect = anchor.getBoundingClientRect();
    
        // On affiche d'abord le menu pour connaître sa largeur réelle
        menu.classList.add('visible');
    
        const width = menu.offsetWidth;
    
        // Si le menu ne rentre pas à droite, on l'ouvre à gauche
        if (rect.right + width + 12 < window.innerWidth) {
    
            menu.style.left = `${rect.right + 12}px`;
    
        } else {
    
            menu.style.left = `${rect.left - width - 12}px`;
    
        }
    
        menu.style.top = `${rect.top}px`;
    
    }

    static close(menu) {

        menu.classList.remove('visible');

    }

    static toggle(menu, anchor) {

        if (menu.classList.contains('visible')) {

            this.close(menu);

        } else {

            this.open(menu, anchor);

        }

    }

}

/**
 * Timeline
 *
 * Conteneur d'une chronologie.
 *
 * Utilisé par :
 *
 * - Patrol
 * - SAR
 * - Incidents
 * - Maintenance
 * - AIS
 * - etc.
 */
export default class Timeline {

    constructor() {

        this.items = [];

        this.element =
            document.createElement(
                'div'
            );

        this.element.className =
            'opsar-timeline';

    }

    /**
     * Ajoute un élément.
     *
     * @param {TimelineItem} item
     */
    add(
        item
    ) {

        if (
            !item
        ) {

            return;

        }

        this.items.push(
            item
        );

    }

    /**
     * Supprime tous les éléments.
     */
    clear() {

        this.items = [];

        this.element.innerHTML =
            '';

    }

    /**
     * Trie chronologiquement.
     *
     * @param {Boolean} descending
     */
    sort(
        descending = true
    ) {

        this.items.sort(

            (
                a,
                b
            ) => {

                const ta =
                    new Date(
                        a.timestamp
                    ).getTime();

                const tb =
                    new Date(
                        b.timestamp
                    ).getTime();

                return descending

                    ? tb - ta

                    : ta - tb;

            }

        );

    }

    /**
     * Construit le DOM.
     */
    build() {

        this.element.innerHTML =
            '';

        this.items.forEach(

            item => {

                this.element.appendChild(

                    item.render()

                );

            }

        );

    }

    /**
     * Retourne le DOM.
     *
     * @returns {HTMLElement}
     */
    render() {

        this.sort();

        this.build();

        return this.element;

    }

}

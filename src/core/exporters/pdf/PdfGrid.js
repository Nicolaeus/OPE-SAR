/**
 * ==========================================================
 * OPE-SAR
 * ----------------------------------------------------------
 * PdfGrid.js
 *
 * Gestionnaire de disposition en grille.
 *
 * Permet de placer plusieurs composants
 * côte à côte.
 * ==========================================================
 */

export default class PdfGrid {

    constructor(layout) {

        this.layout = layout;

        this.columns = [];

        this.spacing =
            layout.theme.SPACING.MD;

    }

    /**
     * Ajoute une colonne.
     *
     * @param {Number} width
     * @param {Function} render
     */
    add(width, render) {

        this.columns.push({

            width,

            render

        });

        return this;

    }

    /**
     * Dessine la ligne.
     */
    draw() {

        const startX =
            this.layout.x;

        const startY =
            this.layout.y;

        let x =
            startX;

        let maxHeight = 0;

        for (const column of this.columns) {

            const childLayout =
                Object.create(this.layout);

            childLayout.cursorX = x;
            childLayout.cursorY = startY;

            column.render(childLayout);

            const usedHeight =
                startY - childLayout.cursorY;

            maxHeight = Math.max(
                maxHeight,
                usedHeight
            );

            x +=
                column.width +
                this.spacing;

        }

        this.layout.cursorY =
            startY - maxHeight;

    }

}

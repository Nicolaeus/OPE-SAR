/**
 * ==========================================================
 * OPE-SAR
 * ----------------------------------------------------------
 * PdfTable.js
 *
 * Tableau générique pour les rapports PDF.
 *
 * Utilisé par :
 *
 *  - Equipage
 *  - Journal
 *  - Communications
 *  - Statistiques
 *  - Missions SAR
 * ==========================================================
 */

export default class PdfTable {

    constructor(layout) {

        this.layout =
            layout;

        this.columns = [];

        this.rows = [];

    }

    // =====================================================
    // Colonnes
    // =====================================================

    addColumn(

        title,

        width,

        align = 'left'

    ) {

        this.columns.push({

            title,

            width,

            align

        });

        return this;

    }

    // =====================================================
    // Ligne
    // =====================================================

    addRow(...cells) {

        this.rows.push(cells);

        return this;

    }

    // =====================================================
    // Rendu
    // =====================================================

    render() {

        this.drawHeader();

        this.rows.forEach(

            row =>

                this.drawRow(row)

        );

    }

    // =====================================================
    // Header
    // =====================================================

    drawHeader() {

        this.layout.beginBlock(

            this.layout.theme.TABLE.HEADER_HEIGHT

        );

        let x =

            this.layout.x;

        this.columns.forEach(

            column => {

                this.layout.drawRectangle(

                    column.width,

                    this.layout.theme.TABLE.HEADER_HEIGHT,

                    {

                        x,

                        fillColor:

                            this.layout.theme.COLOR.LIGHT

                    }

                );

                this.layout.drawText(

                    column.title,

                    {

                        x:

                            x +

                            this.layout.theme.TABLE.CELL_PADDING,

                        y:

                            this.layout.y - 14,

                        size:

                            this.layout.theme.FONT.TABLE_HEADER,

                        font:

                            this.layout.context.bold

                    }

                );

                x +=

                    column.width;

            }

        );

        this.layout.moveDown(

            this.layout.theme.TABLE.HEADER_HEIGHT

        );

    }

    // =====================================================
    // Ligne
    // =====================================================

    drawRow(cells) {

        this.layout.ensureSpace(

            this.layout.theme.TABLE.ROW_HEIGHT

        );

        let x =

            this.layout.x;

        cells.forEach(

            (cell, index) => {

                const column =

                    this.columns[index];

                this.layout.drawRectangle(

                    column.width,

                    this.layout.theme.TABLE.ROW_HEIGHT,

                    {

                        x

                    }

                );

                this.layout.drawText(

                    String(

                        cell ?? ''

                    ),

                    {

                        x:

                            x +

                            this.layout.theme.TABLE.CELL_PADDING,

                        y:

                            this.layout.y - 13

                    }

                );

                x +=

                    column.width;

            }

        );

        this.layout.moveDown(

            this.layout.theme.TABLE.ROW_HEIGHT

        );

    }

}

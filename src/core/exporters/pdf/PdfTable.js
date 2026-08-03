/**
 * ==========================================================
 * OPE-SAR
 * ----------------------------------------------------------
 * PdfTable.js
 *
 * Tableau générique PDF.
 *
 * Fonctionnalités :
 *
 *  • pagination automatique
 *  • retour à la ligne
 *  • colspan
 *  • alignement
 *  • styles
 *  • répétition de l'en-tête
 *  • hauteur automatique
 *
 * Utilisé dans tous les rapports OPE-SAR.
 * ==========================================================
 */

export default class PdfTable {

    constructor(layout) {

        this.layout = layout;

        this.columns = [];

        this.rows = [];

        this.options = {

            repeatHeader: true,

            drawBorders: true,

            header: true,

            zebra: false,

            compact: false

        };

    }

    // =====================================================
    // Configuration
    // =====================================================

    setOptions(options = {}) {

        Object.assign(

            this.options,

            options

        );

        return this;

    }

    // =====================================================
    // Colonnes
    // =====================================================

    addColumn(column) {

        this.columns.push({

            title:

                column.title ?? "",

            width:

                column.width ?? 100,

            align:

                column.align ?? "left",

            valign:

                column.valign ?? "middle",

            headerAlign:

                column.headerAlign ??

                column.align ??

                "left"

        });

        return this;

    }

    addColumns(columns = []) {

        columns.forEach(

            column =>

                this.addColumn(column)

        );

        return this;

    }

    clearColumns() {

        this.columns = [];

        return this;

    }

    // =====================================================
    // Lignes
    // =====================================================

    addRow(cells = []) {

        this.rows.push(

            cells.map(

                cell =>

                    this.normalizeCell(cell)

            )

        );

        return this;

    }

    addRows(rows = []) {

        rows.forEach(

            row =>

                this.addRow(row)

        );

        return this;

    }

    clearRows() {

        this.rows = [];

        return this;

    }

    // =====================================================
    // Cellules
    // =====================================================

    normalizeCell(cell) {

        if (

            typeof cell === "string" ||

            typeof cell === "number"

        ) {

            return {

                text:

                    String(cell)

            };

        }

        return {

            text:

                cell.text ?? "",

            colspan:

                cell.colspan ?? 1,

            align:

                cell.align,

            valign:

                cell.valign,

            bold:

                cell.bold ?? false,

            color:

                cell.color,

            background:

                cell.background,

            padding:

                cell.padding,

            font:

                cell.font

        };

    }

    // =====================================================
    // Helpers
    // =====================================================

    get totalWidth() {

        return this.columns.reduce(

            (sum, column) =>

                sum + column.width,

            0

        );

    }

    get columnCount() {

        return this.columns.length;

    }

    get rowCount() {

        return this.rows.length;

    }

    clear() {

        this.columns = [];

        this.rows = [];

        return this;

    }

    // =====================================================
    // Rendu
    // =====================================================

    render() {

        this.beforeRender();

        this.draw();

        this.afterRender();

    }

    beforeRender() {}

    afterRender() {}

    draw() {

        // Partie 2

    }

}

    // =====================================================
    // Rendu
    // =====================================================

    draw() {

        if (

            this.options.header &&

            this.columns.length

        ) {

            this.drawHeader();

        }

        for (

            const row

            of this.rows

        ) {

            const rowHeight =

                this.computeRowHeight(row);

            this.layout.ensureSpace(

                rowHeight

            );

            if (

                this.layout.page !==

                this.currentPage

            ) {

                this.currentPage =

                    this.layout.page;

                if (

                    this.options.repeatHeader

                ) {

                    this.drawHeader();

                }

            }

            this.drawRow(

                row,

                rowHeight

            );

        }

    }

    // =====================================================
    // Calcul hauteur ligne
    // =====================================================

    computeRowHeight(row) {

        let maxHeight =

            this.layout.theme.TABLE.ROW_HEIGHT;

        row.forEach(

            (

                cell,

                index

            ) => {

                const width =

                    this.computeCellWidth(

                        index,

                        cell.colspan

                    );

                const height =

                    this.measureTextHeight(

                        cell.text,

                        width,

                        cell

                    );

                maxHeight =

                    Math.max(

                        maxHeight,

                        height

                    );

            }

        );

        return maxHeight;

    }

    // =====================================================
    // Largeur cellule
    // =====================================================

    computeCellWidth(

        index,

        colspan = 1

    ) {

        let width = 0;

        for (

            let i = index;

            i <

            index + colspan;

            i++

        ) {

            width +=

                this.columns[i]?.width ??

                0;

        }

        return width;

    }

    // =====================================================
    // Mesure texte
    // =====================================================

    measureTextHeight(

        text,

        width,

        cell

    ) {

        const lines =

            this.wrapText(

                String(text),

                width,

                cell

            );

        return Math.max(

            this.layout.theme.TABLE.ROW_HEIGHT,

            lines.length *

            this.layout.theme.LINE.LINE_HEIGHT +

            this.layout.theme.TABLE.CELL_PADDING * 2

        );

    }

    // =====================================================
    // Word Wrap
    // =====================================================

    wrapText(

        text,

        width,

        cell

    ) {

        const fontSize =

            this.layout.theme.FONT.NORMAL;

        const font =

            cell.bold

                ? this.layout.context.bold

                : this.layout.context.font;

        const maxWidth =

            width -

            this.layout.theme.TABLE.CELL_PADDING * 2;

        const words =

            text.split(" ");

        const lines = [];

        let line = "";

        words.forEach(

            word => {

                const test =

                    line

                        ? line + " " + word

                        : word;

                const size =

                    font.widthOfTextAtSize(

                        test,

                        fontSize

                    );

                if (

                    size >

                    maxWidth &&

                    line

                ) {

                    lines.push(line);

                    line = word;

                }

                else {

                    line = test;

                }

            }

        );

        if (

            line.length

        ) {

            lines.push(line);

        }

        return lines;

    }

    // =====================================================
    // Header
    // =====================================================

    drawHeader() {

        const row =

            this.columns.map(

                column => ({

                    text:

                        column.title,

                    bold: true,

                    align:

                        column.headerAlign,

                    background:

                        this.layout.theme.COLOR.LIGHT

                })

            );

        const height =

            this.layout.theme.TABLE.HEADER_HEIGHT;

        this.drawRow(

            row,

            height

        );

    }

    // =====================================================
    // Ligne
    // =====================================================

    drawRow(

        row,

        rowHeight

    ) {

        let x =

            this.layout.x;

        row.forEach(

            (

                cell,

                index

            ) => {

                const width =

                    this.computeCellWidth(

                        index,

                        cell.colspan

                    );

                this.drawCell(

                    x,

                    this.layout.y,

                    width,

                    rowHeight,

                    cell

                );

                x += width;

            }

        );

        this.layout.moveDown(

            rowHeight

        );

    }

    // =====================================================
    // Cellule
    // =====================================================

    drawCell(

        x,

        y,

        width,

        height,

        cell

    ) {

        const theme =

            this.layout.theme;

        // -----------------------------
        // Fond
        // -----------------------------

        if (

            cell.background

        ) {

            this.layout.page.drawRectangle({

                x,

                y:

                    y - height,

                width,

                height,

                color:

                    cell.background

            });

        }

        // -----------------------------
        // Bordure
        // -----------------------------

        if (

            this.options.drawBorders

        ) {

            this.layout.page.drawRectangle({

                x,

                y:

                    y - height,

                width,

                height,

                borderWidth:

                    theme.TABLE.BORDER_WIDTH,

                borderColor:

                    theme.COLOR.BORDER

            });

        }

        // -----------------------------
        // Texte
        // -----------------------------

        const lines =

            this.wrapText(

                cell.text,

                width,

                cell

            );

        const font =

            cell.font ??

            (

                cell.bold

                    ? this.layout.context.bold

                    : this.layout.context.font

            );

        const color =

            cell.color ??

            theme.COLOR.TEXT;

        const fontSize =

            theme.FONT.NORMAL;

        let textY =

            y -

            theme.TABLE.CELL_PADDING -

            fontSize;

        lines.forEach(

            line => {

                this.layout.page.drawText(

                    line,

                    {

                        x:

                            this.computeTextX(

                                x,

                                width,

                                line,

                                font,

                                fontSize,

                                cell

                            ),

                        y:

                            textY,

                        font,

                        size:

                            fontSize,

                        color

                    }

                );

                textY -=

                    theme.LINE.LINE_HEIGHT;

            }

        );

    }

    // =====================================================
    // Position X du texte
    // =====================================================

    computeTextX(

        x,

        width,

        text,

        font,

        size,

        cell

    ) {

        const padding =

            this.layout.theme.TABLE.CELL_PADDING;

        const align =

            cell.align ??

            "left";

        const textWidth =

            font.widthOfTextAtSize(

                text,

                size

            );

        switch (

            align

        ) {

            case "center":

                return (

                    x +

                    (width - textWidth) / 2

                );

            case "right":

                return (

                    x +

                    width -

                    textWidth -

                    padding

                );

            default:

                return (

                    x +

                    padding

                );

        }

    }

    // =====================================================
    // Pagination
    // =====================================================

    currentPage = null;

    onPageChanged() {

        if (

            !this.options.repeatHeader ||

            !this.options.header

        ) {

            return;

        }

        this.drawHeader();

    }

    // =====================================================
    // Zébrage
    // =====================================================

    getRowBackground(index) {

        if (

            !this.options.zebra

        ) {

            return null;

        }

        return index % 2 === 0

            ? null

            : this.layout.theme.COLOR.LIGHT;

    }

    // =====================================================
    // Alignement vertical
    // =====================================================

    computeTextY(

        y,

        height,

        lineCount

    ) {

        const lineHeight =

            this.layout.theme.LINE.LINE_HEIGHT;

        const blockHeight =

            lineCount * lineHeight;

        return (

            y -

            ((height - blockHeight) / 2) -

            this.layout.theme.FONT.NORMAL

        );

    }

    // =====================================================
    // Cellules fusionnées
    // =====================================================

    validateColspan() {

        this.rows.forEach(

            row => {

                let count = 0;

                row.forEach(

                    cell =>

                        count +=

                            cell.colspan

                );

                if (

                    count !==

                    this.columnCount

                ) {

                    console.warn(

                        "PdfTable : colspan incorrect.",

                        row

                    );

                }

            }

        );

    }

    // =====================================================
    // Dessin
    // =====================================================

    beforeRender() {

        this.currentPage =

            this.layout.page;

        this.validateColspan();

    }

    afterRender() {

        this.layout.moveDown(

            this.layout.theme.SPACING.MD

        );

    }

    // =====================================================
    // API fluide
    // =====================================================

    static create(layout) {

        return new PdfTable(

            layout

        );

    }

}

/**
 * ==========================================================
 * OPE-SAR
 * ----------------------------------------------------------
 * PdfLayout.js
 *
 * Gestionnaire de mise en page.
 *
 * Tous les composants PDF utilisent cette classe.
 * ==========================================================
 */

export default class PdfLayout {

    constructor(context) {

        this.context =
            context;

        this.theme =
            context.theme;

        this.page =
            context.page;

        this.cursorX =
            this.theme.PAGE.MARGIN;

        this.cursorY =
            this.page.getHeight() -
            this.theme.PAGE.MARGIN;

    }

    // =====================================================
    // Position
    // =====================================================

    get x() {

        return this.cursorX;

    }

    get y() {

        return this.cursorY;

    }

    moveDown(

        value

    ) {

        this.cursorY -= value;

    }

    moveUp(

        value

    ) {

        this.cursorY += value;

    }

    resetX() {

        this.cursorX =
            this.theme.PAGE.MARGIN;

    }

    // =====================================================
    // Page
    // =====================================================

    newPage() {

        this.context.page =
            this.context.pdf.addPage();

        this.page =
            this.context.page;

        this.cursorX =
            this.theme.PAGE.MARGIN;

        this.cursorY =
            this.page.getHeight() -
            this.theme.PAGE.MARGIN;

    }

    // =====================================================
    // Pagination automatique
    // =====================================================

    ensureSpace(

        height

    ) {

        if (

            this.cursorY - height >

            this.theme.PAGE.FOOTER_HEIGHT

        ) {

            return;

        }

        this.newPage();

    }

    // =====================================================
    // Dessin texte
    // =====================================================

    drawText(

        text,

        options = {}

    ) {

        this.page.drawText(

            text,

            {

                x:

                    options.x ??

                    this.cursorX,

                y:

                    options.y ??

                    this.cursorY,

                size:

                    options.size ??

                    this.theme.FONT.NORMAL,

                font:

                    options.font ??

                    this.context.font,

                color:

                    options.color ??

                    this.theme.COLOR.TEXT

            }

        );

    }

    // =====================================================
    // Ligne
    // =====================================================

    drawLine() {

        this.page.drawLine({

            start:{

                x:this.theme.PAGE.MARGIN,

                y:this.cursorY

            },

            end:{

                x:

                    this.page.getWidth() -

                    this.theme.PAGE.MARGIN,

                y:this.cursorY

            },

            thickness:

                this.theme.LINE.THICKNESS,

            color:

                this.theme.COLOR.BORDER

        });

    }

    // =====================================================
    // Rectangle
    // =====================================================

    drawRectangle(

        width,

        height,

        options = {}

    ) {

        this.page.drawRectangle({

            x:

                options.x ??

                this.cursorX,

            y:

                options.y ??

                this.cursorY -

                height,

            width,

            height,

            borderWidth:

                options.borderWidth ??

                1,

            borderColor:

                options.borderColor ??

                this.theme.COLOR.BORDER,

            color:

                options.fillColor

        });

    }

    // =====================================================
    // Bloc
    // =====================================================

    beginBlock(

        height

    ) {

        this.ensureSpace(

            height

        );

    }

    endBlock(

        spacing = null

    ) {

        this.moveDown(

            spacing ??

            this.theme.SPACING.LG

        );

    }

}

/**
 * ==========================================================
 * OPE-SAR
 * ----------------------------------------------------------
 * PdfBox.js
 *
 * Encadré générique.
 *
 * Utilisé dans tous les rapports PDF.
 * ==========================================================
 */

export default class PdfBox {

    /**
     * Dessine un encadré.
     *
     * @param {PdfLayout} layout
     * @param {Object} options
     */
    static draw(layout, options = {}) {

        const theme = layout.theme;

        const {

            title = "",

            icon = "",

            width = theme.PAGE.CONTENT_WIDTH,

            height = 80,

            fillColor = null,

            borderColor = theme.COLOR.BORDER,

            titleBackground = theme.COLOR.LIGHT,

            content = null,

            padding = 8

        } = options;

        layout.beginBlock(height);

        const x = layout.x;
        const y = layout.y;

        // ============================================
        // Fond
        // ============================================

        layout.page.drawRectangle({

            x,

            y: y - height,

            width,

            height,

            color: fillColor,

            borderColor,

            borderWidth: 1

        });

        // ============================================
        // Bandeau titre
        // ============================================

        layout.page.drawRectangle({

            x,

            y: y - 24,

            width,

            height: 24,

            color: titleBackground,

            borderColor,

            borderWidth: 1

        });

        layout.page.drawText(

            `${icon} ${title}`,

            {

                x: x + padding,

                y: y - 17,

                size: theme.FONT.SECTION,

                font: layout.context.bold,

                color: theme.COLOR.TEXT

            }

        );

        // ============================================
        // Contenu
        // ============================================

        if (typeof content === "function") {

            const inner = {

                x: x + padding,

                y: y - 32,

                width: width - padding * 2,

                height: height - 40,

                page: layout.page,

                layout

            };

            content(inner);

        }

        layout.moveDown(

            height +

            theme.SPACING.SM

        );

    }

}

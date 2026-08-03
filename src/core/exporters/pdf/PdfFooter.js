/**
 * ==========================================================
 * OPE-SAR
 * ----------------------------------------------------------
 * PdfFooter.js
 *
 * Pied de page des rapports PDF.
 * ==========================================================
 */

export default class PdfFooter {

    /**
     * Dessine le pied de page.
     *
     * @param {Object} context
     */
    static draw(context) {

        const {

            page,
            report,
            theme,
            font

        } = context;

        const {

            width

        } = page.getSize();

        const y =
            theme.PAGE.MARGIN / 2;

        // ==================================================
        // Ligne de séparation
        // ==================================================

        page.drawLine({

            start: {

                x: theme.PAGE.MARGIN,

                y: y + 16

            },

            end: {

                x: width - theme.PAGE.MARGIN,

                y: y + 16

            },

            thickness: 0.5,

            color: theme.COLOR.BORDER

        });

        // ==================================================
        // Gauche
        // ==================================================

        page.drawText(

            "Généré par OPE-SAR",

            {

                x:

                    theme.PAGE.MARGIN,

                y,

                font,

                size:

                    theme.FONT.FOOTER,

                color:

                    theme.COLOR.MUTED

            }

        );

        // ==================================================
        // Centre
        // ==================================================

        page.drawText(

            `Patrouille : ${report.metadata.id.substring(0,8)}`,

            {

                x:

                    width / 2 - 40,

                y,

                font,

                size:

                    theme.FONT.FOOTER,

                color:

                    theme.COLOR.MUTED

            }

        );

        // ==================================================
        // Droite
        // ==================================================

        page.drawText(

            this.formatDate(

                new Date()

            ),

            {

                x:

                    width - 120,

                y,

                font,

                size:

                    theme.FONT.FOOTER,

                color:

                    theme.COLOR.MUTED

            }

        );

    }

    // ======================================================

    static formatDate(date) {

        return date.toLocaleString(

            "fr-FR"

        );

    }

}

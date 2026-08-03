/**
 * ==========================================================
 * OPE-SAR
 * ----------------------------------------------------------
 * PdfSection.js
 *
 * Titre de section.
 * ==========================================================
 */

export default class PdfSection {

    /**
     * Dessine une section.
     */
    static draw(

        layout,

        title,

        options = {}

    ) {

        const theme =
            layout.theme;

        const icon =
            options.icon ?? "";

        layout.ensureSpace(28);

        layout.drawLine();

        layout.moveDown(
            theme.SPACING.SM
        );

        layout.drawText(

            `${icon} ${title}`,

            {

                size:
                    theme.FONT.SECTION,

                font:
                    layout.context.bold,

                color:
                    theme.COLOR.PRIMARY

            }

        );

        layout.moveDown(

            theme.SPACING.LG

        );

    }

}

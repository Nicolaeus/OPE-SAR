/**
 * ==========================================================
 * OPE-SAR
 * ----------------------------------------------------------
 * PdfHeader.js
 *
 * En-tête du rapport PDF.
 * ==========================================================
 */

import PdfSection
    from "./PdfSection.js";

export default class PdfHeader {

    static draw(context) {

        const {

            layout,

            report

        } = context;

        const meta =
            report.metadata;

        const theme =
            layout.theme;

        // ==================================================
        // Logo (placeholder)
        // ==================================================

        layout.drawRectangle(

            42,

            42,

            {

                x: layout.x,

                y: layout.y,

                fillColor: null

            }

        );

        layout.drawText(

            "LOGO",

            {

                x:

                    layout.x + 5,

                y:

                    layout.y - 22,

                size: 8

            }

        );

        // ==================================================
        // Titre
        // ==================================================

        layout.drawText(

            "OPE-SAR",

            {

                x:

                    layout.x + 60,

                y:

                    layout.y,

                size:

                    theme.FONT.TITLE,

                font:

                    context.bold,

                color:

                    theme.COLOR.PRIMARY

            }

        );

        layout.moveDown(24);

        layout.drawText(

            "Rapport de patrouille",

            {

                x:

                    layout.x + 60,

                size:

                    theme.FONT.SUBTITLE

            }

        );

        layout.moveDown(30);

        // ==================================================
        // Informations générales
        // ==================================================

        layout.drawText(

            `Rapport : PAT-${meta.id.substring(0,8)}`

        );

        layout.moveDown(14);

        layout.drawText(

            `Station : ${meta.station ?? "-"}`

        );

        layout.moveDown(14);

        layout.drawText(

            `Canot : ${meta.vessel ?? "-"}`

        );

        layout.moveDown(14);

        layout.drawText(

            `Etat : ${meta.status}`

        );

        layout.moveDown(14);

        layout.drawText(

            `Départ : ${this.formatDate(meta.startedAt)}`

        );

        layout.moveDown(14);

        layout.drawText(

            `Retour : ${this.formatDate(meta.endedAt)}`

        );

        layout.moveDown(

            theme.SPACING.XL

        );

        PdfSection.draw(

            layout,

            "Informations générales"

        );

    }

    // ======================================================

    static formatDate(date) {

        if (!date) {

            return "-";

        }

        return new Date(

            date

        ).toLocaleString(

            "fr-FR"

        );

    }

}

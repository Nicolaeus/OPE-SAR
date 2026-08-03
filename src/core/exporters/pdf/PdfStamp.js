/**
 * ==========================================================
 * OPE-SAR
 * ----------------------------------------------------------
 * PdfStamp.js
 *
 * Cartouche d'identification du rapport.
 *
 * Contient :
 *  - QR Code
 *  - Identifiant
 *  - Station
 *  - Canot
 *  - Version
 * ==========================================================
 */

import PdfQRCode
    from "./PdfQRCode.js";

export default class PdfStamp {

    static async draw(context) {

        const {

            page,
            report,
            theme,
            font,
            bold

        } = context;

        const width = 170;
        const height = 95;

        const x =

            page.getWidth()

            - theme.PAGE.MARGIN

            - width;

        const y =

            page.getHeight()

            - theme.PAGE.MARGIN;

        // ============================================
        // Cadre
        // ============================================

        page.drawRectangle({

            x,
            y: y - height,
            width,
            height,

            borderWidth:1,

            borderColor:
                theme.COLOR.BORDER

        });

        // ============================================
        // QR Code
        // ============================================

        await PdfQRCode.draw(

            context,

            {

                x: x + 8,

                y: y - 58,

                size: 48

            }

        );

        // ============================================
        // Texte
        // ============================================

        const textX =
            x + 65;

        let textY =
            y - 18;

        page.drawText(

            "OPE-SAR",

            {

                x:textX,

                y:textY,

                font:bold,

                size:10

            }

        );

        textY -= 14;

        page.drawText(

            `PAT-${report.metadata.id.substring(0,8)}`,

            {

                x:textX,

                y:textY,

                font,

                size:8

            }

        );

        textY -= 12;

        page.drawText(

            report.metadata.station ?? "-",

            {

                x:textX,

                y:textY,

                font,

                size:8

            }

        );

        textY -= 12;

        page.drawText(

            report.metadata.vessel ?? "-",

            {

                x:textX,

                y:textY,

                font,

                size:8

            }

        );

        textY -= 12;

        page.drawText(

            `Version ${report.metadata.version}`,

            {

                x:textX,

                y:textY,

                font,

                size:8

            }

        );

    }

}

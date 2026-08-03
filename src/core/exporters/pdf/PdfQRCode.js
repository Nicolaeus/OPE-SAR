/**
 * ==========================================================
 * OPE-SAR
 * ----------------------------------------------------------
 * PdfQRCode.js
 * ==========================================================
 */

import QRCode
    from "../../../../vendors/qrcode/qrcode.js";

export default class PdfQRCode {

    static async draw(context) {

        const {

            page,
            report,
            theme

        } = context;

        const payload = {

            type: "patrol",

            id: report.metadata.id,

            station: report.metadata.station,

            vessel: report.metadata.vessel,

            startedAt: report.metadata.startedAt,

            endedAt: report.metadata.endedAt,

            version: report.metadata.version

        };

        const dataUrl =

            await QRCode.toDataURL(

                JSON.stringify(payload),

                {

                    margin: 0,

                    width:

                        theme.QR.SIZE

                }

            );

        const png =

            await context.pdf.embedPng(

                dataUrl

            );

        page.drawImage(

            png,

            {

                x:

                    page.getWidth()

                    - theme.PAGE.MARGIN

                    - theme.QR.SIZE,

                y:

                    page.getHeight()

                    - theme.PAGE.MARGIN

                    - theme.QR.SIZE,

                width:

                    theme.QR.SIZE,

                height:

                    theme.QR.SIZE

            }

        );

    }

}

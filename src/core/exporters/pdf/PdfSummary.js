/**
 * ==========================================================
 * OPE-SAR
 * ----------------------------------------------------------
 * PdfSummary.js
 *
 * Résumé opérationnel de la patrouille.
 * ==========================================================
 */

import PdfBox
    from "./PdfBox.js";

export default class PdfSummary {

    static draw(context) {

        const {

            layout,
            report

        } = context;

        PdfBox.draw(

            layout,

            {

                title: "Résumé de la patrouille",

                icon: "🚤",

                height: 140,

                content(box) {

                    const {

                        page,
                        layout

                    } = box;

                    const font =
                        layout.context.font;

                    const bold =
                        layout.context.bold;

                    const color =
                        layout.theme.COLOR.TEXT;

                    const leftX =
                        box.x;

                    const rightX =
                        box.x + 240;

                    let y =
                        box.y;

                    drawLabelValue(
                        "Départ",
                        formatDate(
                            report.summary.startedAt
                        )
                    );

                    drawLabelValue(
                        "Retour",
                        formatDate(
                            report.summary.endedAt
                        )
                    );

                    drawLabelValue(
                        "Durée",
                        formatDuration(
                            report.statistics.duration
                        )
                    );

                    y = box.y;

                    drawRight(
                        "Etat",
                        report.metadata.status
                    );

                    drawRight(
                        "Station",
                        report.metadata.station ?? "-"
                    );

                    drawRight(
                        "Canot",
                        report.metadata.vessel ?? "-"
                    );

                    function drawLabelValue(label, value) {

                        page.drawText(

                            label,

                            {

                                x: leftX,

                                y,

                                font: bold,

                                size: 10,

                                color

                            }

                        );

                        page.drawText(

                            value,

                            {

                                x: leftX + 70,

                                y,

                                font,

                                size: 10,

                                color

                            }

                        );

                        y -= 18;

                    }

                    function drawRight(label, value) {

                        page.drawText(

                            label,

                            {

                                x: rightX,

                                y,

                                font: bold,

                                size: 10,

                                color

                            }

                        );

                        page.drawText(

                            String(value),

                            {

                                x: rightX + 60,

                                y,

                                font,

                                size: 10,

                                color

                            }

                        );

                        y -= 18;

                    }

                }

            }

        );

    }

}

// ==========================================================

function formatDate(date) {

    if (!date) {

        return "-";

    }

    return new Date(

        date

    ).toLocaleString(

        "fr-FR"

    );

}

function formatDuration(duration) {

    if (!duration) {

        return "-";

    }

    const hours =

        Math.floor(

            duration / 3600000

        );

    const minutes =

        Math.floor(

            (duration % 3600000) / 60000

        );

    return `${hours} h ${minutes} min`;

}

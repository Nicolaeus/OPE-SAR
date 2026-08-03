/**
 * ==========================================================
 * OPE-SAR
 * ----------------------------------------------------------
 * PdfEngineHours.js
 *
 * Heures moteur et carburant.
 * ==========================================================
 */

import PdfBox
    from "./PdfBox.js";

export default class PdfEngineHours {

    static draw(context) {

        const {

            layout,
            report

        } = context;

        PdfBox.draw(

            layout,

            {

                title: "Moteur & Carburant",

                icon: "🛥️",

                height: 115,

                content(box) {

                    const {

                        page,
                        layout

                    } = box;

                    const engine =
                        report.summary.engine;

                    const fuel =
                        report.summary.fuel;

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

                    drawLeft(

                        "Début",

                        format(engine.startHours)

                    );

                    drawLeft(

                        "Fin",

                        format(engine.endHours)

                    );

                    drawLeft(

                        "Temps moteur",

                        formatDuration(

                            report.statistics.engineHours

                        )

                    );

                    y = box.y;

                    drawRight(

                        "Départ",

                        formatFuel(

                            fuel.departure

                        )

                    );

                    drawRight(

                        "Arrivée",

                        formatFuel(

                            fuel.arrival

                        )

                    );

                    drawRight(

                        "Consommé",

                        formatFuel(

                            fuel.consumed

                        )

                    );

                    function drawLeft(label, value) {

                        page.drawText(

                            label,

                            {

                                x:leftX,

                                y,

                                font:bold,

                                size:10,

                                color

                            }

                        );

                        page.drawText(

                            value,

                            {

                                x:leftX+90,

                                y,

                                font,

                                size:10,

                                color

                            }

                        );

                        y -= 18;

                    }

                    function drawRight(label, value) {

                        page.drawText(

                            label,

                            {

                                x:rightX,

                                y,

                                font:bold,

                                size:10,

                                color

                            }

                        );

                        page.drawText(

                            value,

                            {

                                x:rightX+75,

                                y,

                                font,

                                size:10,

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

function format(value) {

    if (

        value == null

    ) {

        return "-";

    }

    return `${value} h`;

}

function formatFuel(value) {

    if (

        value == null

    ) {

        return "-";

    }

    return `${value} L`;

}

function formatDuration(value) {

    if (

        value == null

    ) {

        return "-";

    }

    return `${value.toFixed(1)} h`;

}

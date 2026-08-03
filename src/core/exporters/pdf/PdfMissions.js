/**
 * ==========================================================
 * OPE-SAR
 * ----------------------------------------------------------
 * PdfMissions.js
 *
 * Missions SAR de la patrouille.
 * ==========================================================
 */

import PdfSection
    from "./PdfSection.js";

import PdfBox
    from "./PdfBox.js";

export default class PdfMissions {

    static draw(context) {

        const {

            layout,
            report

        } = context;

        if (

            !report.missions ||

            report.missions.length === 0

        ) {

            return;

        }

        PdfSection.draw(

            layout,

            "Missions SAR",

            {

                icon: "🚨"

            }

        );

        report.missions.forEach(

            (

                mission,

                index

            ) =>

                this.drawMission(

                    layout,

                    mission,

                    index + 1

                )

        );

    }

    // =====================================================

    static drawMission(

        layout,

        mission,

        number

    ) {

        PdfBox.draw(

            layout,

            {

                title:

                    `Mission ${number}`,

                icon: "🚤",

                height: 150,

                content(box) {

                    const {

                        page

                    } = box;

                    const font =
                        layout.context.font;

                    const bold =
                        layout.context.bold;

                    let y =
                        box.y;

                    draw(

                        "Type",

                        mission.type

                    );

                    draw(

                        "Début",

                        formatDate(

                            mission.startedAt

                        )

                    );

                    draw(

                        "Fin",

                        formatDate(

                            mission.endedAt

                        )

                    );

                    draw(

                        "Etat",

                        mission.status

                    );

                    draw(

                        "Description",

                        mission.description

                    );

                    function draw(label, value) {

                        page.drawText(

                            label,

                            {

                                x: box.x,

                                y,

                                font: bold,

                                size: 10

                            }

                        );

                        page.drawText(

                            String(

                                value ?? "-"

                            ),

                            {

                                x:

                                    box.x + 90,

                                y,

                                font,

                                size: 10

                            }

                        );

                        y -= 18;

                    }

                }

            }

        );

    }

}

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

/**
 * ==========================================================
 * OPE-SAR
 * ----------------------------------------------------------
 * PdfStatistics.js
 *
 * Statistiques de la patrouille.
 * ==========================================================
 */

import PdfSection
    from "./PdfSection.js";

import PdfTable
    from "./PdfTable.js";

export default class PdfStatistics {

    /**
     * Dessine les statistiques.
     *
     * @param {Object} context
     */
    static draw(context) {

        const {

            layout,
            report

        } = context;

        PdfSection.draw(

            layout,

            "Statistiques",

            {

                icon: "📊"

            }

        );

        const stats =
            report.statistics;

        const table =

            PdfTable.create(

                layout

            );

        table

            .setOptions({

                zebra: true

            })

            .addColumns([

                {

                    title: "Indicateur",

                    width: 260

                },

                {

                    title: "Valeur",

                    width: 255,

                    align: "right"

                }

            ]);

        table.addRow([

            {

                text: "Durée"

            },

            {

                text:

                    this.formatDuration(

                        stats.duration

                    )

            }

        ]);

        table.addRow([

            {

                text: "Distance"

            },

            {

                text:

                    this.formatDistance(

                        stats.distance

                    )

            }

        ]);

        table.addRow([

            {

                text: "Vitesse moyenne"

            },

            {

                text:

                    this.formatSpeed(

                        stats.averageSpeed

                    )

            }

        ]);

        table.addRow([

            {

                text: "Points GPS"

            },

            {

                text:

                    String(

                        stats.gpsPoints

                    )

            }

        ]);

        table.addRow([

            {

                text: "Communications"

            },

            {

                text:

                    String(

                        stats.communications

                    )

            }

        ]);

        table.addRow([

            {

                text: "Entrées du journal"

            },

            {

                text:

                    String(

                        stats.journal

                    )

            }

        ]);

        table.addRow([

            {

                text: "Missions SAR"

            },

            {

                text:

                    String(

                        stats.missions

                    )

            }

        ]);

        table.addRow([

            {

                text: "Evènements système"

            },

            {

                text:

                    String(

                        stats.systemEvents

                    )

            }

        ]);

        table.addRow([

            {

                text: "Equipiers"

            },

            {

                text:

                    `${stats.crewMandatory} / ${stats.crew}`

            }

        ]);

        table.render();

    }

    // ======================================================
    // Helpers
    // ======================================================

    static formatDuration(ms) {

        if (!ms) {

            return "-";

        }

        const h =

            Math.floor(

                ms / 3600000

            );

        const m =

            Math.floor(

                (ms % 3600000) /

                60000

            );

        return `${h} h ${m} min`;

    }

    static formatDistance(distance) {

        if (

            distance == null

        ) {

            return "-";

        }

        return `${(

            distance / 1000

        ).toFixed(2)} km`;

    }

    static formatSpeed(speed) {

        if (

            speed == null

        ) {

            return "-";

        }

        return `${

            speed.toFixed(1)

        } km/h`;

    }

}

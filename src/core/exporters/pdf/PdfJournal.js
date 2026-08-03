/**
 * ==========================================================
 * OPE-SAR
 * ----------------------------------------------------------
 * PdfJournal.js
 *
 * Journal opérationnel.
 * ==========================================================
 */

import PdfSection
    from "./PdfSection.js";

import PdfTable
    from "./PdfTable.js";

export default class PdfJournal {

    /**
     * Dessine le journal.
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

            "Journal opérationnel",

            {

                icon: "📖"

            }

        );

        const table =

            PdfTable.create(

                layout

            );

        table

            .setOptions({

                zebra: true,

                repeatHeader: true

            })

            .addColumns([

                {

                    title: "Heure",

                    width: 70

                },

                {

                    title: "Position",

                    width: 140

                },

                {

                    title: "Commentaire",

                    width: 305

                }

            ]);

        report.journal.forEach(

            entry => {

                table.addRow([

                    {

                        text:

                            this.formatTime(

                                entry.timestamp

                            )

                    },

                    {

                        text:

                            this.formatPosition(

                                entry

                            )

                    },

                    {

                        text:

                            this.formatComment(

                                entry

                            )

                    }

                ]);

            }

        );

        table.render();

    }

    // ======================================================

    static formatTime(timestamp) {

        if (!timestamp) {

            return "-";

        }

        return new Date(

            timestamp

        ).toLocaleTimeString(

            "fr-FR",

            {

                hour: "2-digit",

                minute: "2-digit"

            }

        );

    }

    // ======================================================

    static formatPosition(entry) {

        if (

            entry.latitude == null ||

            entry.longitude == null

        ) {

            return "-";

        }

        return (

            `${entry.latitude.toFixed(5)}\n` +

            `${entry.longitude.toFixed(5)}`

        );

    }

    // ======================================================

    static formatComment(entry) {

        return (

            entry.comment ??

            entry.description ??

            entry.text ??

            entry.type ??

            "-"

        );

    }

}

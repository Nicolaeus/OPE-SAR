/**
 * ==========================================================
 * OPE-SAR
 * ----------------------------------------------------------
 * PdfCommunications.js
 *
 * Registre des communications.
 * ==========================================================
 */

import PdfSection
    from "./PdfSection.js";

import PdfTable
    from "./PdfTable.js";

export default class PdfCommunications {

    /**
     * Dessine les communications.
     *
     * @param {Object} context
     */
    static draw(context) {

        const {

            layout,
            report

        } = context;

        if (

            !report.communications ||

            report.communications.length === 0

        ) {

            return;

        }

        PdfSection.draw(

            layout,

            "Communications",

            {

                icon: "📡"

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

                    width: 60

                },

                {

                    title: "Canal",

                    width: 60

                },

                {

                    title: "Correspondant",

                    width: 140

                },

                {

                    title: "Sens",

                    width: 60,

                    align: "center"

                },

                {

                    title: "Message",

                    width: 195

                }

            ]);

        report.communications.forEach(

            communication => {

                table.addRow([

                    {

                        text:

                            this.formatTime(

                                communication.timestamp

                            )

                    },

                    {

                        text:

                            communication.channel ??

                            "-"

                    },

                    {

                        text:

                            communication.contact ??

                            communication.sender ??

                            "-"

                    },

                    {

                        text:

                            this.formatDirection(

                                communication.direction

                            )

                    },

                    {

                        text:

                            communication.message ??

                            communication.text ??

                            "-"

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

    static formatDirection(direction) {

        switch (direction) {

            case "IN":

                return "←";

            case "OUT":

                return "→";

            case "BOTH":

                return "↔";

            default:

                return "-";

        }

    }

}

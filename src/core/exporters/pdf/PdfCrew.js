/**
 * ==========================================================
 * OPE-SAR
 * ----------------------------------------------------------
 * PdfCrew.js
 *
 * Equipage de la patrouille.
 * ==========================================================
 */

import PdfSection
    from "./PdfSection.js";

import PdfTable
    from "./PdfTable.js";

export default class PdfCrew {

    /**
     * Dessine l'équipage.
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

            "Equipage",

            {

                icon: "👥"

            }

        );

        const table =

            PdfTable.create(

                layout

            );

        table

            .addColumns([

                {

                    title: "Fonction",

                    width: 120

                },

                {

                    title: "Nom",

                    width: 180

                },

                {

                    title: "Prénom",

                    width: 180

                }

            ]);

        report.crew.forEach(

            member => {

                table.addRow([

                    {

                        text:

                            this.getRole(

                                member.role

                            )

                    },

                    {

                        text:

                            member.lastname

                    },

                    {

                        text:

                            member.firstname

                    }

                ]);

            }

        );

        table.render();

    }

    // ======================================================

    static getRole(role) {

        switch (role) {

            case "captain":

                return "Patron";

            case "deck":

                return "Equipier";

            case "mechanic":

                return "Mécanicien";

            case "doctor":

                return "Médecin";

            case "rescuer":

                return "Sauveteur";

            default:

                return role ?? "-";

        }

    }

}

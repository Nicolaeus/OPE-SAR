/**
 * ==========================================================
 * OPE-SAR Core
 * ----------------------------------------------------------
 * JsonExporter.js
 *
 * Export d'un rapport au format JSON.
 *
 * Ce service est indépendant des modules.
 * Il exporte uniquement un rapport normalisé.
 * ==========================================================
 */

export default class JsonExporter {

    /**
     * Exporte un rapport au format JSON.
     *
     * @param {Object} report
     * @param {String} filename
     *
     * @returns {File}
     */
    static async export(

        report,

        filename = 'Export'

    ) {

        const json =

            JSON.stringify(

                report,

                null,

                4

            );

        return new File(

            [

                json

            ],

            `${filename}.json`,

            {

                type:

                    'application/json'

            }

        );

    }

}

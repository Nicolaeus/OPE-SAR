/**
 * ==========================================================
 * OPE-SAR Core
 * ----------------------------------------------------------
 * JsonExporter.js
 *
 * Export d'un rapport au format JSON.
 *
 * Le rapport doit être construit au préalable
 * par ReportBuilder.
 * ==========================================================
 */

import BaseExporter
    from './BaseExporter.js';

export default class JsonExporter
    extends BaseExporter {

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

        return this.createFile(

            filename,

            'json',

            'application/json',

            json

        );

    }

}/**
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

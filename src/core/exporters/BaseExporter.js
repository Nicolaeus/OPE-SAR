/**
 * ==========================================================
 * OPE-SAR Core
 * ----------------------------------------------------------
 * BaseExporter.js
 *
 * Classe de base des exporteurs.
 *
 * Fournit les utilitaires communs :
 *
 *  - création de File
 *  - formatage des dates
 *  - échappement XML
 *
 * ==========================================================
 */

export default class BaseExporter {

    /**
     * Crée un fichier.
     *
     * @param {String} filename
     * @param {String} extension
     * @param {String} mimeType
     * @param {String|Uint8Array|Blob} content
     *
     * @returns {File}
     */
    static createFile(

        filename,

        extension,

        mimeType,

        content

    ) {

        return new File(

            [

                content

            ],

            `${filename}.${extension}`,

            {

                type: mimeType

            }

        );

    }

    /**
     * Retourne une date ISO.
     *
     * @param {Date|String|Number} value
     *
     * @returns {String}
     */
    static toISO(value) {

        return new Date(

            value

        ).toISOString();

    }

    /**
     * Echappe les caractères XML.
     *
     * @param {String} value
     *
     * @returns {String}
     */
    static escapeXML(value = '') {

        return String(value)

            .replaceAll('&', '&amp;')

            .replaceAll('<', '&lt;')

            .replaceAll('>', '&gt;')

            .replaceAll('"', '&quot;')

            .replaceAll("'", '&apos;');

    }

}

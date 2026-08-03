/**
 * ==========================================================
 * OPE-SAR Core
 * ----------------------------------------------------------
 * ExportService.js
 *
 * Service générique d'export.
 *
 * Ce service est indépendant des modules.
 *
 * Il permet :
 *
 *  - export JSON
 *  - téléchargement
 *  - partage natif
 *
 * Les exports PDF et GPX seront ajoutés
 * dans une prochaine version.
 * ==========================================================
 */

export default class ExportService {

    // =====================================================
    // JSON
    // =====================================================

    /**
     * Exporte un objet JSON.
     *
     * @param {Object} object
     * @param {String} filename
     *
     * @returns {File}
     */
    static async exportJSON(

        object,

        filename = 'export'

    ) {

        const json =

            JSON.stringify(

                object,

                null,

                2

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

    // =====================================================
    // Blob
    // =====================================================

    /**
     * Crée un Blob.
     *
     * @param {*} content
     * @param {String} type
     *
     * @returns {Blob}
     */
    static createBlob(

        content,

        type

    ) {

        return new Blob(

            [

                content

            ],

            {

                type

            }

        );

    }

    // =====================================================
    // Téléchargement
    // =====================================================

    /**
     * Télécharge un Blob.
     *
     * @param {Blob|File} file
     */
    static download(file) {

        const url =

            URL.createObjectURL(

                file

            );

        const link =

            document.createElement(

                'a'

            );

        link.href =
            url;

        link.download =
            file.name;

        document.body.appendChild(

            link

        );

        link.click();

        link.remove();

        URL.revokeObjectURL(

            url

        );

    }

    // =====================================================
    // Partage
    // =====================================================

    /**
     * Vérifie si le navigateur
     * supporte le partage natif.
     *
     * @returns {Boolean}
     */
    static canShare() {

        return (

            typeof navigator !== 'undefined' &&

            typeof navigator.share ===
                'function'

        );

    }

    /**
     * Partage un ou plusieurs fichiers.
     *
     * @param {File[]} files
     * @param {String} title
     * @param {String} text
     */
    static async share(

        files = [],

        title = 'OPE-SAR',

        text = ''

    ) {

        if (

            !this.canShare()

        ) {

            console.warn(

                'Partage natif indisponible.'

            );

            return false;

        }

        try {

            await navigator.share({

                title,

                text,

                files

            });

            return true;

        }

        catch (error) {

            console.warn(

                'Partage annulé.',

                error

            );

            return false;

        }

    }

    // =====================================================
    // Téléchargement multiple
    // =====================================================

    /**
     * Télécharge plusieurs fichiers.
     *
     * @param {File[]} files
     */
    static downloadMany(files = []) {

        files.forEach(

            file =>

                this.download(

                    file

                )

        );

    }

    // =====================================================
    // Utilitaires
    // =====================================================

    /**
     * Génère un nom de fichier.
     *
     * Exemple :
     *
     * Patrol_2026-08-03_14-32-18
     *
     * @param {String} prefix
     *
     * @returns {String}
     */
    static createFilename(

        prefix = 'Export'

    ) {

        const now =
            new Date();

        const date =

            now.toISOString()

                .replace(

                    'T',

                    '_'

                )

                .replaceAll(

                    ':',

                    '-'

                )

                .substring(

                    0,

                    19

                );

        return `${prefix}_${date}`;

    }

}

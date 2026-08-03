/**
 * ==========================================================
 * OPE-SAR Core
 * ----------------------------------------------------------
 * ExportService.js
 *
 * Service générique de gestion des exports.
 *
 * Il ne génère aucun format.
 *
 * Son rôle est uniquement :
 *
 *  - sauvegarder un fichier
 *  - sauvegarder plusieurs fichiers
 *  - partager des fichiers
 *  - générer un nom de fichier
 *
 * Les différents formats sont implémentés
 * dans les Exporters.
 * ==========================================================
 */

export default class ExportService {

    // =====================================================
    // Sauvegarde
    // =====================================================

    /**
     * Sauvegarde un fichier.
     *
     * @param {File|Blob} file
     */
    static save(file) {

        const url =
            URL.createObjectURL(file);

        const link =
            document.createElement('a');

        link.href =
            url;

        link.download =
            file.name;

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);

    }

    // =====================================================
    // Sauvegarde multiple
    // =====================================================

    /**
     * Sauvegarde plusieurs fichiers.
     *
     * @param {File[]} files
     */
    static saveMany(files = []) {

        files.forEach(

            file =>

                this.save(file)

        );

    }

    // =====================================================
    // Partage natif
    // =====================================================

    /**
     * Vérifie si le partage est disponible.
     *
     * @returns {Boolean}
     */
    static canShare() {

        return (

            typeof navigator !== 'undefined' &&

            typeof navigator.share === 'function'

        );

    }

    /**
     * Partage un ou plusieurs fichiers.
     *
     * @param {File[]} files
     * @param {String} title
     * @param {String} text
     *
     * @returns {Boolean}
     */
    static async share(

        files = [],

        title = 'OPE-SAR',

        text = ''

    ) {

        if (!this.canShare()) {

            console.warn(
                'Partage indisponible.'
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
    // Nom de fichier
    // =====================================================

    /**
     * Génère un nom de fichier.
     *
     * Exemple :
     *
     * Patrol_2026-08-03_18-42-17
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

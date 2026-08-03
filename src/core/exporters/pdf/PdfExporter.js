/**
 * ==========================================================
 * OPE-SAR
 * ----------------------------------------------------------
 * PdfExporter.js
 *
 * Orchestrateur du rapport PDF.
 *
 * Ce fichier ne dessine rien.
 *
 * Chaque section est déléguée
 * à un composant spécialisé.
 * ==========================================================
 */

import BaseExporter
    from '../BaseExporter.js';

import {

    PDFDocument,

    StandardFonts

}

from '../../../../vendors/pdf-lib/pdf-lib.min.js';

import PdfTheme
    from './PdfTheme.js';

import PdfLayout
    from './PdfLayout.js';

import PdfHeader
    from './PdfHeader.js';

import PdfSummary
    from './PdfSummary.js';

import PdfEngineHours
    from './PdfEngineHours.js';

import PdfMap
    from './PdfMap.js';

import PdfCrew
    from './PdfCrew.js';

import PdfStatistics
    from './PdfStatistics.js';

import PdfJournal
    from './PdfJournal.js';

import PdfCommunications
    from './PdfCommunications.js';

import PdfFooter
    from './PdfFooter.js';

import PdfQRCode
    from './PdfQRCode.js';

export default class PdfExporter
    extends BaseExporter {

    static async export(

        report,

        filename = 'Patrol'

    ) {

        const pdf =
            await PDFDocument.create();

        const context = {

            pdf,

            page:
                pdf.addPage(),

            theme:
                PdfTheme,

            layout:
                null,

            font:
                null,

            bold:
                null,

            report

        };

        context.font =

            await pdf.embedFont(

                StandardFonts.Helvetica

            );

        context.bold =

            await pdf.embedFont(

                StandardFonts.HelveticaBold

            );

        context.layout =

            new PdfLayout(

                context

            );

        // =================================================
        // Première page
        // =================================================

        PdfHeader.draw(context);

        PdfQRCode.draw(context);

        PdfSummary.draw(context);

        PdfEngineHours.draw(context);

        PdfMap.draw(context);

        PdfCrew.draw(context);

        // =================================================
        // Pages suivantes
        // =================================================

        context.layout.newPage();

        PdfStatistics.draw(context);

        PdfJournal.draw(context);

        PdfCommunications.draw(context);

        PdfFooter.draw(context);

        const bytes =
            await pdf.save();

        return this.createFile(

            filename,

            'pdf',

            'application/pdf',

            bytes

        );

    }

}

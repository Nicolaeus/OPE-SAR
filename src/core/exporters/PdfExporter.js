/**
 * ==========================================================
 * OPE-SAR Core
 * ----------------------------------------------------------
 * PdfExporter.js
 *
 * Export PDF d'un rapport OPE-SAR.
 *
 * V1
 *
 * Utilise pdf-lib.
 *
 * ==========================================================
 */

import BaseExporter
    from './BaseExporter.js';

import {

    PDFDocument,

    StandardFonts,

    rgb

}

from '../../../vendors/pdf-lib/pdf-lib.min.js';

export default class PdfExporter
    extends BaseExporter {

    /**
     * Exporte un rapport PDF.
     *
     * @param {Object} report
     * @param {String} filename
     *
     * @returns {File}
     */
    static async export(

        report,

        filename = 'Patrol'

    ) {

        const pdf =

            await PDFDocument.create();

        const page =

            pdf.addPage();

        const font =

            await pdf.embedFont(

                StandardFonts.Helvetica

            );

        const bold =

            await pdf.embedFont(

                StandardFonts.HelveticaBold

            );

        const context = {

            pdf,

            page,

            font,

            bold,

            width:

                page.getWidth(),

            height:

                page.getHeight(),

            cursorY:

                page.getHeight() - 50

        };

        this.build(

            context,

            report

        );

        const bytes =

            await pdf.save();

        return this.createFile(

            filename,

            'pdf',

            'application/pdf',

            bytes

        );

    }

    // =====================================================
    // Construction
    // =====================================================

    static build(

        context,

        report

    ) {

        this.drawTitle(

            context,

            'OPE-SAR'

        );

        this.drawSubtitle(

            context,

            'Rapport de patrouille'

        );

        this.drawSpacer(

            context,

            20

        );

        this.drawSummary(

            context,

            report

        );

        this.drawStatistics(

            context,

            report

        );

        this.drawCrew(

            context,

            report

        );

        this.drawCommunications(

            context,

            report

        );

        this.drawJournal(

            context,

            report

        );

        this.drawFooter(

            context

        );

    }

    // =====================================================
    // Helpers
    // =====================================================

    static drawTitle(

        context,

        text

    ) {

        context.page.drawText(

            text,

            {

                x: 50,

                y: context.cursorY,

                size: 22,

                font: context.bold,

                color: rgb(

                    0,

                    0,

                    0

                )

            }

        );

        context.cursorY -= 32;

    }

    static drawSubtitle(

        context,

        text

    ) {

        context.page.drawText(

            text,

            {

                x: 50,

                y: context.cursorY,

                size: 14,

                font: context.font,

                color: rgb(

                    0.30,

                    0.30,

                    0.30

                )

            }

        );

        context.cursorY -= 24;

    }

    static drawSection(

        context,

        title

    ) {

        context.cursorY -= 10;

        context.page.drawText(

            title,

            {

                x: 50,

                y: context.cursorY,

                size: 15,

                font: context.bold

            }

        );

        context.cursorY -= 18;

    }

    static drawRow(

        context,

        label,

        value

    ) {

        context.page.drawText(

            `${label} : ${value ?? '—'}`,

            {

                x: 60,

                y: context.cursorY,

                size: 11,

                font: context.font

            }

        );

        context.cursorY -= 14;

    }

    static drawText(

        context,

        text

    ) {

        context.page.drawText(

            text,

            {

                x: 60,

                y: context.cursorY,

                size: 11,

                font: context.font

            }

        );

        context.cursorY -= 14;

    }

    static drawSeparator(

        context

    ) {

        context.page.drawLine(

            {

                start: {

                    x: 50,

                    y: context.cursorY

                },

                end: {

                    x:

                        context.width - 50,

                    y: context.cursorY

                },

                thickness: 1,

                color: rgb(

                    0.80,

                    0.80,

                    0.80

                )

            }

        );

        context.cursorY -= 16;

    }

    static drawSpacer(

        context,

        size = 10

    ) {

        context.cursorY -= size;

    }

    /**
     * Passe à la page suivante si nécessaire.
     */

    static ensurePage(

        context

    ) {

        if (

            context.cursorY >

            60

        ) {

            return;

        }

        context.page =

            context.pdf.addPage();

        context.width =

            context.page.getWidth();

        context.height =

            context.page.getHeight();

        context.cursorY =

            context.height - 50;

    }

    // =====================================================
    // Résumé
    // =====================================================

    static drawSummary(
        context,
        report
    ) {

        this.ensurePage(context);

        this.drawSection(
            context,
            'Résumé'
        );

        this.drawRow(
            context,
            'Etat',
            report.metadata.status
        );

        this.drawRow(
            context,
            'Départ',
            report.summary.startedAt
                ? new Date(
                    report.summary.startedAt
                ).toLocaleString('fr-FR')
                : '—'
        );

        this.drawRow(
            context,
            'Retour',
            report.summary.endedAt
                ? new Date(
                    report.summary.endedAt
                ).toLocaleString('fr-FR')
                : '—'
        );

        this.drawRow(
            context,
            'Durée',
            report.statistics.duration
        );

        this.drawSeparator(
            context
        );

    }

    // =====================================================
    // Statistiques
    // =====================================================

    static drawStatistics(
        context,
        report
    ) {

        this.ensurePage(context);

        this.drawSection(
            context,
            'Statistiques'
        );

        const stats =
            report.statistics;

        this.drawRow(context,'Distance',`${(stats.distance/1000).toFixed(2)} km`);

        this.drawRow(context,'Vitesse moyenne',`${stats.averageSpeed.toFixed(1)} km/h`);

        this.drawRow(context,'Points GPS',stats.gpsPoints);

        this.drawRow(context,'Communications',stats.communications);

        this.drawRow(context,'Journal',stats.journal);

        this.drawRow(context,'Missions',stats.missions);

        this.drawRow(context,'Equipage',stats.crew);

        this.drawSeparator(
            context
        );

    }

    // =====================================================
    // Equipage
    // =====================================================

    static drawCrew(
        context,
        report
    ) {

        this.ensurePage(context);

        this.drawSection(
            context,
            'Equipage'
        );

        report.crew.forEach(

            member => {

                this.ensurePage(
                    context
                );

                this.drawText(

                    context,

                    `${member.role} - ${member.lastname} ${member.firstname}`

                );

            }

        );

        this.drawSeparator(
            context
        );

    }

    // =====================================================
    // Communications
    // =====================================================

    static drawCommunications(
        context,
        report
    ) {

        if (

            report.communications.length === 0

        ) {

            return;

        }

        this.ensurePage(
            context
        );

        this.drawSection(
            context,
            'Communications'
        );

        report.communications.forEach(

            communication => {

                this.ensurePage(
                    context
                );

                this.drawText(

                    context,

`${new Date(

communication.timestamp

).toLocaleTimeString('fr-FR')} - ${communication.channel ?? ''} - ${communication.subject ?? ''}`

                );

            }

        );

        this.drawSeparator(
            context
        );

    }

    // =====================================================
    // Journal
    // =====================================================

    static drawJournal(
        context,
        report
    ) {

        if (

            report.journal.length === 0

        ) {

            return;

        }

        this.ensurePage(
            context
        );

        this.drawSection(
            context,
            'Journal'
        );

        report.journal.forEach(

            event => {

                this.ensurePage(
                    context
                );

                this.drawText(

                    context,

`${new Date(

event.timestamp

).toLocaleTimeString('fr-FR')} - ${event.title ?? event.type ?? ''}`

                );

            }

        );

    }

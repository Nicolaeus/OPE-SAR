import BaseCard from '../../../shared/ui/cards/BaseCard.js';
import BaseCardController from '../../../shared/ui/cards/BaseCardController.js';
import CardSection from '../../../shared/ui/cards/CardSection.js';

import ReportBuilder from '../../../core/services/ReportBuilder.js';
import ExportService from '../../../core/services/ExportService.js';
import JsonExporter from '../../../core/exporters/JsonExporter.js';
import GpxExporter from '../../../core/exporters/GpxExporter.js';
import PatrolService from '../services/PatrolService.js';

export default class ExportCard extends BaseCardController {

    static create() {

        this.close();

        const card =
            new BaseCard({

                id: 'patrol-export-card',

                title: 'EXPORT DE PATROUILLE',

                icon: '📤',

                color: 'green'

            });

        card.add(

            this.buildExportSection().element

        );

        card.render(

            document.getElementById(
                'app'
            )

        );

        this.instance = card;

        card.element.addEventListener(

            'card:close',

            () => ExportCard.close()

        );

        this.bindEvents();

        return card;

    }

    static buildExportSection() {

        const section =
            new CardSection(
                'Rapport final'
            );

        const container =
            document.createElement(
                'div'
            );

        container.innerHTML = `

            <p class="opsar-muted">
                La patrouille est clôturée. Choisissez le format à exporter.
            </p>

            <div class="opsar-patrol-tools">
                <button
                    id="patrol-export-json"
                    class="opsar-btn opsar-btn-primary">
                    Exporter JSON
                </button>

                <button
                    id="patrol-export-gpx"
                    class="opsar-btn opsar-btn-secondary">
                    Exporter GPX
                </button>
            </div>

        `;

        section.add(
            container
        );

        return section;

    }

    static bindEvents() {

        document
            .getElementById(
                'patrol-export-json'
            )
            ?.addEventListener(
                'click',
                () => this.export('json')
            );

        document
            .getElementById(
                'patrol-export-gpx'
            )
            ?.addEventListener(
                'click',
                () => this.export('gpx')
            );

    }

    static async export(format) {

        const patrol =
            PatrolService.getCurrent();

        const report =
            ReportBuilder.fromPatrol(
                patrol
            );

        if (!report) {

            return;

        }

        const filename =
            ExportService.createFilename(
                'Patrol'
            );

        try {

            let file;

            switch (format) {

                case 'json':

                    file = await JsonExporter.export(
                        report,
                        filename
                    );

                    break;

                case 'gpx':

                    file = await GpxExporter.export(
                        report,
                        filename
                    );

                    break;

                default:

                    return;

            }

            ExportService.save(
                file
            );

        }

        catch (error) {

            console.error(
                'Erreur export patrouille.',
                error
            );

            alert(
                "L'export de la patrouille a échoué."
            );

        }

    }

}

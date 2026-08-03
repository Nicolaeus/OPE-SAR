/**
 * ==========================================================
 * OPE-SAR Core
 * ----------------------------------------------------------
 * GpxExporter.js
 *
 * Export d'un rapport au format GPX 1.1.
 *
 * Compatible :
 *
 *  - OpenCPN
 *  - QGIS
 *  - Garmin
 *  - Google Earth
 *  - Navionics
 *
 * Le rapport doit être construit par ReportBuilder.
 * ==========================================================
 */

import BaseExporter
    from './BaseExporter.js';

export default class GpxExporter
    extends BaseExporter {

    /**
     * Exporte un rapport au format GPX.
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

        const xml =

            this.build(report);

        return this.createFile(

            filename,

            'gpx',

            'application/gpx+xml',

            xml

        );

    }

    // =====================================================
    // Document GPX
    // =====================================================

    static build(report) {

        return `<?xml version="1.0" encoding="UTF-8"?>

<gpx

    version="1.1"

    creator="OPE-SAR"

    xmlns="http://www.topografix.com/GPX/1/1">

${this.buildMetadata(report)}

${this.buildTrack(report)}

</gpx>`;

    }

    // =====================================================
    // Métadonnées
    // =====================================================

    static buildMetadata(report) {

        return `

<metadata>

<name>

${this.escapeXML(

    report.metadata.vessel ??

    'OPE-SAR Patrol'

)}

</name>

<time>

${this.toISO(

    report.metadata.createdAt

)}

</time>

</metadata>`;

    }

    // =====================================================
    // Trace GPS
    // =====================================================

    /**
     * Construit la trace GPX.
     *
     * @param {Object} report
     *
     * @returns {String}
     */
    static buildTrack(report) {

        const points =

            report.track

                .map(

                    point =>

                        this.buildTrackPoint(point)

                )

                .join('\n');

        return `

<trk>

<name>

${this.escapeXML(

    report.metadata.vessel ??

    'Patrouille'

)}

</name>

<trkseg>

${points}

</trkseg>

</trk>`;

    }

    // =====================================================
    // Point GPS
    // =====================================================

    /**
     * Construit un point GPX.
     *
     * @param {Object} point
     *
     * @returns {String}
     */
    static buildTrackPoint(point) {

        return `

<trkpt

    lat="${point.latitude}"

    lon="${point.longitude}">

<ele>

${point.altitude ?? 0}

</ele>

<time>

${this.toISO(

    point.timestamp

)}

</time>

${this.buildExtensions(point)}

</trkpt>`;

    }

    // =====================================================
    // Extensions GPX
    // =====================================================

    /**
     * Extensions OPE-SAR.
     *
     * Prévu pour :
     *
     * - vitesse
     * - cap
     * - précision GPS
     * - etc.
     *
     * @param {Object} point
     *
     * @returns {String}
     */
    static buildExtensions(point) {

        return `

<extensions>

<speed>

${point.speed ?? 0}

</speed>

<course>

${point.heading ?? 0}

</course>

<accuracy>

${point.accuracy ?? 0}

</accuracy>

</extensions>`;

    }

    // =====================================================
    // Waypoints
    // =====================================================

    /**
     * Construit les waypoints GPX.
     *
     * Le ReportBuilder prépare déjà tous
     * les waypoints du rapport.
     *
     * @param {Object} report
     *
     * @returns {String}
     */
    static buildWaypoints(report) {

        if (

            !report.waypoints ||

            report.waypoints.length === 0

        ) {

            return '';

        }

        return report.waypoints

            .map(

                waypoint =>

                    this.buildWaypoint(
                        waypoint
                    )

            )

            .join('\n');

    }

    /**
     * Construit un waypoint.
     *
     * @param {Object} waypoint
     *
     * @returns {String}
     */
    static buildWaypoint(waypoint) {

        return `

<wpt

    lat="${waypoint.latitude}"

    lon="${waypoint.longitude}">

<name>

${this.escapeXML(

    waypoint.title ??

    waypoint.type ??

    'Waypoint'

)}

</name>

<desc>

${this.escapeXML(

    waypoint.description ??

    ''

)}

</desc>

<time>

${this.toISO(

    waypoint.timestamp

)}

</time>

<type>

${this.escapeXML(

    waypoint.type ??

    'UNKNOWN'

)}

</type>

</wpt>`;

    }

}

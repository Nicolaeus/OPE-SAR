/**
 * ==========================================================
 * OPE-SAR Core
 * ----------------------------------------------------------
 * ReportBuilder.js
 *
 * Construction d'un rapport métier à partir
 * des différents modèles OPE-SAR.
 *
 * Ce service ne réalise aucun export.
 * Il prépare uniquement les données.
 * ==========================================================
 */

export default class ReportBuilder {

    // =====================================================
    // Patrouille
    // =====================================================

    /**
     * Construit un rapport de patrouille.
     *
     * @param {PatrolModel} patrol
     *
     * @returns {Object}
     */
    static fromPatrol(patrol) {

        if (!patrol) {

            return null;

        }

        return {

            metadata:

                this.buildMetadata(
                    patrol
                ),

            summary:

                this.buildSummary(
                    patrol
                ),

            statistics:

                this.buildStatistics(
                    patrol
                ),

            crew:

                structuredClone(

                    patrol.crew

                ),

            communications:

                structuredClone(

                    patrol.communications

                ),

            journal:

                structuredClone(

                    patrol.journal

                ),

            missions:

                structuredClone(

                    patrol.missions ??

                    []

                ),

            track:

                structuredClone(

                    patrol.track

                ),

            attachments: []

        };

    }

    // =====================================================
    // Métadonnées
    // =====================================================

    static buildMetadata(patrol) {

        return {

            id:
                patrol.id,

            status:
                patrol.status,

            version:
                patrol.persistence.version,

            createdAt:
                patrol.createdAt,

            startedAt:
                patrol.startedAt,

            endedAt:
                patrol.endedAt,

            station:
                patrol.station,

            vessel:
                patrol.vessel

        };

    }

    // =====================================================
    // Résumé
    // =====================================================

    /**
     * Construit le résumé de la patrouille.
     *
     * @param {PatrolModel} patrol
     *
     * @returns {Object}
     */
    static buildSummary(patrol) {

        return {

            duration:

                patrol.duration,

            startedAt:

                patrol.startedAt,

            endedAt:

                patrol.endedAt,

            startPosition:

                patrol.startPosition,

            endPosition:

                patrol.endPosition,

            notes:

                patrol.notes,

            fuel:

                structuredClone(

                    patrol.fuel

                ),

            engine:

                structuredClone(

                    patrol.engine

                )

        };

    }

    // =====================================================
    // Statistiques
    // =====================================================

    /**
     * Calcule les statistiques.
     *
     * @param {PatrolModel} patrol
     *
     * @returns {Object}
     */
    static buildStatistics(patrol) {

    return {

        crew:
            patrol.crew.length,

        communications:
            patrol.communications.length,

        journal:
            patrol.journal.length,

        missions:
            patrol.missions?.length ?? 0,

        gpsPoints:
            patrol.track.length,

        systemEvents:
            patrol.systemEvents.length,

        duration:
            patrol.duration,

        engineHours:
            this.computeEngineHours(
                patrol
            ),

        fuelConsumed:
            patrol.fuel.consumed,

        distance:
            this.computeDistance(
                patrol
            ),

        averageSpeed:
            this.computeAverageSpeed(
                patrol
            ),

        trackStart:
  
            patrol.track[0] ?? null,
        
        trackEnd:
        
            patrol.track.at(-1) ?? null,

        crewMandatory:
      
          patrol.crew.filter(
      
              member => member.mandatory
      
          ).length,

    };

}

    // =====================================================
    // Temps moteur
    // =====================================================

    /**
     * Calcule le temps moteur.
     *
     * @param {PatrolModel} patrol
     *
     * @returns {Number|null}
     */
    static computeEngineHours(patrol) {

        if (

            patrol.engine.startHours == null ||

            patrol.engine.endHours == null

        ) {

            return null;

        }

        return (

            patrol.engine.endHours -

            patrol.engine.startHours

        );

    }

    // =====================================================
    // Distance parcourue
    // =====================================================

    /**
     * Calcule la distance totale parcourue.
     *
     * Retour en mètres.
     *
     * @param {PatrolModel} patrol
     *
     * @returns {Number}
     */
    static computeDistance(patrol) {

        if (

            !patrol.track ||

            patrol.track.length < 2

        ) {

            return 0;

        }

        let distance = 0;

        for (

            let i = 1;

            i < patrol.track.length;

            i++

        ) {

            distance +=

                this.computeSegmentDistance(

                    patrol.track[i - 1],

                    patrol.track[i]

                );

        }

        return distance;

    }

    /**
     * =====================================================
     * Distance entre deux positions
     * =====================================================
     */

    static computeSegmentDistance(a, b) {

        const R = 6371000;

        const lat1 =
            this.toRadians(a.latitude);

        const lat2 =
            this.toRadians(b.latitude);

        const dLat =
            this.toRadians(

                b.latitude - a.latitude

            );

        const dLon =
            this.toRadians(

                b.longitude - a.longitude

            );

        const h =

            Math.sin(dLat / 2) ** 2 +

            Math.cos(lat1) *

            Math.cos(lat2) *

            Math.sin(dLon / 2) ** 2;

        return (

            2 *

            R *

            Math.atan2(

                Math.sqrt(h),

                Math.sqrt(1 - h)

            )

        );

    }

    /**
     * =====================================================
     * Conversion degrés → radians
     * =====================================================
     */

    static toRadians(value) {

        return (

            value *

            Math.PI /

            180

        );

    }

    /**
     * =====================================================
     * Vitesse moyenne
     * =====================================================
     */

    static computeAverageSpeed(patrol) {

        if (

            patrol.duration <= 0

        ) {

            return 0;

        }

        const distance =

            this.computeDistance(

                patrol

            );

        const hours =

            patrol.duration /

            3600000;

        if (hours <= 0) {

            return 0;

        }

        return (

            distance /

            1000 /

            hours

        );

    }

}

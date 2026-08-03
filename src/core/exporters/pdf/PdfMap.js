/**
 * ==========================================================
 * OPE-SAR
 * ----------------------------------------------------------
 * PdfMap.js
 *
 * Miniature de la trace GPS.
 *
 * Le fond cartographique pourra être ajouté
 * ultérieurement (SHOM, OSM, etc.).
 * ==========================================================
 */

import PdfBox
    from "./PdfBox.js";

export default class PdfMap {

    static draw(context) {

        const {

            layout,
            report

        } = context;

        PdfBox.draw(

            layout,

            {

                title: "Trace de la patrouille",

                icon: "🗺️",

                height: 220,

                content(box) {

                    PdfMap.drawTrack(

                        box,

                        report.track

                    );

                }

            }

        );

    }

    // =====================================================

    static drawTrack(

        box,

        track

    ) {

        if (

            !track ||

            track.length < 2

        ) {

            return;

        }

        const page =
            box.page;

        const theme =
            box.layout.theme;

        const padding = 12;

        const width =
            box.width - padding * 2;

        const height =
            box.height - padding * 2;

        const bounds =

            this.computeBounds(

                track

            );

        let previous = null;

        track.forEach(point => {

            const p =

                this.project(

                    point,

                    bounds,

                    width,

                    height

                );

            const x =
                box.x + padding + p.x;

            const y =
                box.y - padding - p.y;

            if (previous) {

                page.drawLine({

                    start: previous,

                    end: {

                        x,

                        y

                    },

                    thickness: 1.5,

                    color:

                        theme.COLOR.PRIMARY

                });

            }

            previous = {

                x,

                y

            };

        });

        this.drawStart(

            page,

            previous,

            track,

            box,

            bounds,

            width,

            height,

            theme

        );

        this.drawEnd(

            page,

            track,

            box,

            bounds,

            width,

            height,

            theme

        );

    }

    // =====================================================

    static computeBounds(track) {

        return {

            minLat:

                Math.min(

                    ...track.map(

                        p => p.latitude

                    )

                ),

            maxLat:

                Math.max(

                    ...track.map(

                        p => p.latitude

                    )

                ),

            minLon:

                Math.min(

                    ...track.map(

                        p => p.longitude

                    )

                ),

            maxLon:

                Math.max(

                    ...track.map(

                        p => p.longitude

                    )

                )

        };

    }

    // =====================================================

    static project(

        point,

        bounds,

        width,

        height

    ) {

        const x =

            (

                point.longitude -

                bounds.minLon

            ) /

            (

                bounds.maxLon -

                bounds.minLon ||

                1

            );

        const y =

            (

                point.latitude -

                bounds.minLat

            ) /

            (

                bounds.maxLat -

                bounds.minLat ||

                1

            );

        return {

            x:

                x * width,

            y:

                height - y * height

        };

    }

    // =====================================================

    static drawStart(

        page,

        previous,

        track,

        box,

        bounds,

        width,

        height,

        theme

    ) {

        const p =

            this.project(

                track[0],

                bounds,

                width,

                height

            );

        page.drawCircle({

            x:

                box.x + 12 + p.x,

            y:

                box.y - 12 - p.y,

            size:4,

            color:

                theme.COLOR.PRIMARY

        });

    }

    // =====================================================

    static drawEnd(

        page,

        track,

        box,

        bounds,

        width,

        height,

        theme

    ) {

        const p =

            this.project(

                track.at(-1),

                bounds,

                width,

                height

            );

        page.drawCircle({

            x:

                box.x + 12 + p.x,

            y:

                box.y - 12 - p.y,

            size:5,

            borderWidth:2,

            borderColor:

                theme.COLOR.PRIMARY

        });

    }

}

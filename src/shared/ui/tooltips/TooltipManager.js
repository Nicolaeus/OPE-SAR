/*
==========================================================

OPE-SAR
TooltipManager

Version 2.0

==========================================================
*/

import TooltipState from "./TooltipState.js";

export default class TooltipManager {

    //======================================================
    // Stockage
    //======================================================

    static tooltips = new Map();

    static nextId = 1;


    //======================================================
    // Création
    //======================================================

    static register(marker, view, options = {}) {

        if (!marker)
            throw new Error("TooltipManager : marker manquant.");

        if (!view)
            throw new Error("TooltipManager : view manquant.");

        const id = TooltipManager.nextId++;

        const tooltip = {

            id,

            marker,

            view,

            state:
                options.state
                ?? TooltipState.DEFAULT,

            options

        };

        TooltipManager.tooltips.set(id, tooltip);

        TooltipManager.refresh(id);

        return id;

    }


    //======================================================
    // Recherche
    //======================================================

    static get(id) {

        return TooltipManager.tooltips.get(id);

    }


    static getByMarker(marker) {

        for (const tooltip of TooltipManager.tooltips.values()) {

            if (tooltip.marker === marker)
                return tooltip;

        }

        return null;

    }


    //======================================================
    // Suppression
    //======================================================

    static unregister(id) {

        TooltipManager.tooltips.delete(id);

    }


    static unregisterMarker(marker) {

        const tooltip =
            TooltipManager.getByMarker(marker);

        if (!tooltip)
            return;

        TooltipManager.unregister(tooltip.id);

    }


    //======================================================
    // Etat
    //======================================================

    static getState(id) {

        return TooltipManager.get(id)?.state;

    }


    static setState(id, state) {

        const tooltip =
            TooltipManager.get(id);

        if (!tooltip)
            return;

        if (!TooltipState.isValid(state))
            return;

        tooltip.state = state;

        TooltipManager.refresh(id);

    }


    static nextState(id) {

        const tooltip =
            TooltipManager.get(id);

        if (!tooltip)
            return;

        tooltip.state =
            TooltipState.next(
                tooltip.state
            );

        TooltipManager.refresh(id);

    }


    //======================================================
    // Rafraîchissement
    //======================================================

    static refresh(id) {

        const tooltip =
            TooltipManager.get(id);

        if (!tooltip)
            return;

        let html =
            tooltip.view.render(
                tooltip.state
            );

        html = `

<div
    class="opsar-tooltip"
    data-tooltip-id="${id}"
>

${html}

</div>

`;

        tooltip.marker.setTooltipContent(html);

    }


    static refreshMarker(marker) {

        const tooltip =
            TooltipManager.getByMarker(marker);

        if (!tooltip)
            return;

        TooltipManager.refresh(tooltip.id);

    }


    static refreshAll() {

        for (const tooltip of TooltipManager.tooltips.values()) {

            TooltipManager.refresh(
                tooltip.id
            );

        }

    }


    //======================================================
    // Nettoyage
    //======================================================

    static clear() {

        TooltipManager.tooltips.clear();

        TooltipManager.nextId = 1;

    }

}
/*
==========================================================

OPE-SAR
TooltipEvents

----------------------------------------------------------

Gestionnaire des interactions utilisateur.

Responsabilités

- clic
- tactile
- double clic
- long press (future)
- menu contextuel (future)

Aucune connaissance métier.

==========================================================
*/

import TooltipManager from "./TooltipManager.js";

export default class TooltipEvents {

    static initialized = false;

    // =====================================================
    // Initialisation
    // =====================================================

    static init(root = document) {

        if (TooltipEvents.initialized)
            return;

        TooltipEvents.initialized = true;

        root.addEventListener(
            "click",
            TooltipEvents.onClick,
            false
        );

    }

    // =====================================================
    // Gestion du clic
    // =====================================================

    static onClick(event) {

        // bouton d'état

        const button =
            event.target.closest(
                ".opsar-tooltip-action-state"
            );

        if (button) {

            event.preventDefault();
            event.stopPropagation();

            const tooltipElement =
                button.closest(".opsar-tooltip");

            if (!tooltipElement)
                return;

            const leafletId =
                tooltipElement.dataset.leafletId;

            if (!leafletId)
                return;

            const tooltip =
                TooltipManager.tooltips.get(
                    Number(leafletId)
                );

            if (!tooltip)
                return;

            TooltipManager.nextState(
                tooltip.marker
            );

            return;
        }

        //--------------------------------------------------

        // bouton fermeture

        const close =
            event.target.closest(
                ".opsar-tooltip-action-close"
            );

        if (close) {

            event.preventDefault();
            event.stopPropagation();

            const tooltipElement =
                close.closest(".opsar-tooltip");

            if (!tooltipElement)
                return;

            const leafletId =
                tooltipElement.dataset.leafletId;

            const tooltip =
                TooltipManager.tooltips.get(
                    Number(leafletId)
                );

            if (!tooltip)
                return;

            tooltip.marker.closeTooltip();

            TooltipManager.unregister(
                tooltip.marker
            );

        }

    }

}
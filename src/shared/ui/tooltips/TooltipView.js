/*
==========================================================

OPE-SAR
TooltipView

----------------------------------------------------------

Classe de base de toutes les vues de tooltip.

Elle transforme un objet métier
(SAR, Station, AIS, Weather...)

en contenu HTML.

Elle ne connaît pas Leaflet.

Elle ne connaît pas le TooltipManager.

==========================================================
*/

import TooltipState from "./TooltipState.js";

export default class TooltipView {

    constructor(model = null) {

        this.model = model;

    }

    // =====================================================
    // Modèle métier
    // =====================================================

    getModel() {

        return this.model;

    }

    setModel(model) {

        this.model = model;

    }

    // =====================================================
    // Informations générales
    // =====================================================

    getId() {

        return "tooltip";

    }

    getTitle() {

        return "Tooltip";

    }

    getIcon() {

        return "";

    }

    getTheme() {

        return "default";

    }

    // =====================================================
    // Point d'entrée unique
    // =====================================================

    render(state = TooltipState.DEFAULT) {

        switch (state) {

            case TooltipState.MINI:
                return this.renderMini();

            case TooltipState.FULL:
                return this.renderFull();

            case TooltipState.SUMMARY:
            default:
                return this.renderSummary();

        }

    }

    // =====================================================
    // Etats
    // =====================================================

    renderMini() {

        return "";

    }

    renderSummary() {

        return "";

    }

    renderFull() {

        return "";

    }

    // =====================================================
    // Helpers HTML
    // =====================================================

    row(label, value) {

        return `

<div class="opsar-tooltip-row">

    <span class="opsar-tooltip-label">

        ${label}

    </span>

    <strong class="opsar-tooltip-value">

        ${value}

    </strong>

</div>

`;

    }

    separator() {

        return `

<div class="opsar-tooltip-separator"></div>

`;

    }

    badge(text, css = "") {

        return `

<span class="opsar-tooltip-badge ${css}">

    ${text}

</span>

`;

    }

    icon(value) {

        return `

<span class="opsar-tooltip-icon">

    ${value}

</span>

`;

    }

    // =====================================================
    // Formatage
    // =====================================================

    formatNumber(value, digits = 2) {

        if (value === undefined || value === null)
            return "-";

        return Number(value).toFixed(digits);

    }

    formatDistance(value) {

        if (value === undefined || value === null)
            return "-";

        return `${Number(value).toFixed(2)} NM`;

    }

    formatBearing(value) {

        if (value === undefined || value === null)
            return "-";

        return `${Math.round(value)}°`;

    }

    formatLatitude(value) {

        if (value === undefined || value === null)
            return "-";

        return Number(value).toFixed(5);

    }

    formatLongitude(value) {

        if (value === undefined || value === null)
            return "-";

        return Number(value).toFixed(5);

    }

    formatTime(date) {

        if (!date)
            return "-";

        return new Date(date).toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    }

}
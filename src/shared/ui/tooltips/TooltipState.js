/*
==========================================================

OPE-SAR
TooltipState

----------------------------------------------------------
Gestion des états d'affichage des tooltips.

Tous les tooltips du framework utilisent ces états.

FULL
    Toutes les informations.

SUMMARY
    Informations principales.

MINI
    Titre uniquement.

==========================================================
*/

export default class TooltipState {

    // =====================================================
    // Etats
    // =====================================================

    static FULL = "full";

    static SUMMARY = "summary";

    static MINI = "mini";


    // =====================================================
    // Ordre de rotation
    // =====================================================

    static ORDER = [

        TooltipState.FULL,

        TooltipState.SUMMARY,

        TooltipState.MINI

    ];


    // =====================================================
    // Etat par défaut
    // =====================================================

    static DEFAULT = TooltipState.SUMMARY;


    // =====================================================
    // Vérifie un état
    // =====================================================

    static isValid(state) {

        return TooltipState.ORDER.includes(state);

    }


    // =====================================================
    // Etat suivant
    // =====================================================

    static next(state) {

        const index =
            TooltipState.ORDER.indexOf(state);

        if (index < 0)
            return TooltipState.DEFAULT;

        return TooltipState.ORDER[
            (index + 1)
            % TooltipState.ORDER.length
        ];

    }


    // =====================================================
    // Etat précédent
    // =====================================================

    static previous(state) {

        const index =
            TooltipState.ORDER.indexOf(state);

        if (index < 0)
            return TooltipState.DEFAULT;

        return TooltipState.ORDER[
            (index - 1 + TooltipState.ORDER.length)
            % TooltipState.ORDER.length
        ];

    }


    // =====================================================
    // Libellé utilisateur
    // =====================================================

    static label(state) {

        switch (state) {

            case TooltipState.FULL:
                return "Complet";

            case TooltipState.SUMMARY:
                return "Résumé";

            case TooltipState.MINI:
                return "Compact";

            default:
                return "Inconnu";

        }

    }


    // =====================================================
    // Icône associée
    // (servira plus tard dans le TooltipManager)
    // =====================================================

    static icon(state) {

        switch (state) {

            case TooltipState.FULL:
                return "⊟";

            case TooltipState.SUMMARY:
                return "⊞";

            case TooltipState.MINI:
                return "⊕";

            default:
                return "?";

        }

    }

}
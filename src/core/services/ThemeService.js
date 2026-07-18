/**
 * ==========================================================
 * OPE-SAR Core
 * ----------------------------------------------------------
 * ThemeService.js
 *
 * Gestion centralisée du thème de l'application.
 *
 * Les thèmes disponibles sont :
 *
 *  - light
 *  - dark
 *  - auto
 *
 * ==========================================================
 */

import SettingsService
    from './SettingsService.js';

export default class ThemeService {

    static THEMES = Object.freeze({

        LIGHT:
            'light',

        DARK:
            'dark',

        AUTO:
            'auto'

    });

    /**
     * =============================================
     * Applique le thème enregistré
     * =============================================
     */

    static async apply() {

        const theme =

            await SettingsService.getTheme();

        return this.set(

            theme

        );

    }

    /**
     * =============================================
     * Applique un thème
     * =============================================
     */

    static set(

        theme

    ) {

        if (

            theme ===
            this.THEMES.AUTO

        ) {

            theme =
                this.getSystemTheme();

        }

        document.documentElement.setAttribute(

            'data-theme',

            theme

        );

        console.log(

            `🎨 Thème : ${theme}`

        );

    }

    /**
     * =============================================
     * Enregistre + applique
     * =============================================
     */

    static async save(

        theme

    ) {

        await SettingsService.setTheme(

            theme

        );

        this.set(

            theme

        );

    }

    /**
     * =============================================
     * Détection système
     * =============================================
     */

    static getSystemTheme() {

        return window.matchMedia(

            '(prefers-color-scheme: dark)'

        ).matches

            ? this.THEMES.DARK

            : this.THEMES.LIGHT;

    }

    /**
     * =============================================
     * Écoute le changement système
     * =============================================
     */

    static listen() {

        window.matchMedia(

            '(prefers-color-scheme: dark)'

        ).addEventListener(

            'change',

            async () => {

                const theme =

                    await SettingsService.getTheme();

                if (

                    theme ===

                    this.THEMES.AUTO

                ) {

                    this.apply();

                }

            }

        );

    }

}

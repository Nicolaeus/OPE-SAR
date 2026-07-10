/**
 * ==========================================================
 * OPE-SAR Core
 * ----------------------------------------------------------
 * CacheManager.js
 *
 * Gestion centralisée du cache applicatif.
 *
 * Les données temporaires transitent toutes
 * par cette classe.
 *
 * Le cache est stocké dans IndexedDB via
 * StorageService.
 * ==========================================================
 */

import Collections
    from '../database/Collections.js';

import Sources
    from '../database/Sources.js';

import StorageService
    from '../services/StorageService.js';

export default class CacheManager {

    /**
     * =============================================
     * Enregistrement
     * =============================================
     */

    static async put(

        key,

        value,

        options = {}

    ) {

        const now =
            Date.now();

        const ttl =
            options.ttl ?? 3600;

        return StorageService.save(

            Collections.CACHE,

            {

                id:
                    key,

                value,

                expiresAt:
                    now + (ttl * 1000),

                source:
                    Sources.LOCAL

            }

        );

    }

    /**
     * =============================================
     * Lecture
     * =============================================
     */

    static async get(

        key

    ) {

        const entry =

            await StorageService.load(

                Collections.CACHE,

                key

            );

        if (!entry) {

            return null;

        }

        if (

            this.isExpired(
                entry
            )

        ) {

            await this.remove(
                key
            );

            return null;

        }

        return entry.value;

    }

    /**
     * =============================================
     * Existence
     * =============================================
     */

    static async exists(

        key

    ) {

        return (

            await this.get(
                key
            )

        ) !== null;

    }

    /**
     * =============================================
     * Informations
     * =============================================
     */

    static async info(

        key

    ) {

        return StorageService.load(

            Collections.CACHE,

            key

        );

    }

    /**
     * =============================================
     * Suppression
     * =============================================
     */

    static async remove(

        key

    ) {

        return StorageService.remove(

            Collections.CACHE,

            key

        );

    }

    /**
     * =============================================
     * Vidage complet
     * =============================================
     */

    static async clear() {

        return StorageService.clear(

            Collections.CACHE

        );

    }

    /**
     * =============================================
     * Nettoyage
     * =============================================
     */

    static async cleanExpired() {

        const entries =

            await StorageService.list(

                Collections.CACHE

            );

        const now =
            Date.now();

        for (

            const entry

            of entries

        ) {

            if (

                entry.expiresAt <= now

            ) {

                await this.remove(

                    entry.id

                );

            }

        }

    }

    /**
     * =============================================
     * Temps restant
     * =============================================
     */

    static getRemainingTime(

        entry

    ) {

        return Math.max(

            entry.expiresAt -

            Date.now(),

            0

        );

    }

    /**
     * =============================================
     * Expiration
     * =============================================
     */

    static isExpired(

        entry

    ) {

        return (

            entry.expiresAt <=

            Date.now()

        );

    }

}

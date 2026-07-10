/**
 * ==========================================================
 * OPE-SAR Core
 * ----------------------------------------------------------
 * CacheManager.js
 *
 * Gestion centralisée du cache applicatif.
 *
 * Toutes les données temporaires transitent
 * par cette classe :
 *
 * - météo
 * - AIS
 * - GRIB
 * - calculs
 * - tuiles
 *
 * ==========================================================
 */

import StorageService
    from '../services/StorageService.js';

import Collections
    from '../database/Collections.js';

import Sources
    from '../database/Sources.js';

export default class CacheManager {

    // =====================================================
    // Enregistrement
    // =====================================================

    static async put(

        key,

        value,

        options = {}

    ) {

        const ttl =

            options.ttl ??

            3600;

        const now =
            Date.now();

        return StorageService.save(

            Collections.CACHE,

            {

                id:
                    key,

                value,

                source:
                    Sources.LOCAL,

                createdAt:
                    now,

                expiresAt:
                    now + (ttl * 1000)

            }

        );

    }

    // =====================================================
    // Lecture
    // =====================================================

    static async get(

        key

    ) {

        const entry =

            await StorageService.load(

                Collections.CACHE,

                key

            );

        if (

            !entry

        ) {

            return null;

        }

        if (

            entry.expiresAt < Date.now()

        ) {

            await this.remove(

                key

            );

            return null;

        }

        return entry.value;

    }

    // =====================================================
    // Suppression
    // =====================================================

    static async remove(

        key

    ) {

        return StorageService.remove(

            Collections.CACHE,

            key

        );

    }

    // =====================================================
    // Vider complètement le cache
    // =====================================================

    static async clear() {

        return StorageService.clear(

            Collections.CACHE

        );

    }

    // =====================================================
    // Nettoyage automatique
    // =====================================================

    static async cleanExpired() {

        const entries =

            await StorageService.list(

                Collections.CACHE

            );

        const now =
            Date.now();

        for (

            const entry

            of

            entries

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

    // =====================================================
    // Présence
    // =====================================================

    static async exists(

        key

    ) {

        const value =

            await this.get(

                key

            );

        return value !== null;

    }

    // =====================================================
    // Informations
    // =====================================================

    static async info(

        key

    ) {

        return StorageService.load(

            Collections.CACHE,

            key

        );

    }

}

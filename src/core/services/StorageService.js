/**
 * ==========================================================
 * OPE-SAR Core
 * ----------------------------------------------------------
 * StorageService.js
 *
 * Service unique de persistance.
 *
 * Les modules utilisent uniquement cette classe.
 *
 * Database.js reste totalement transparent.
 * ==========================================================
 */

import Database from '../database/Database.js';
import Sources from '../database/Sources.js';

export default class StorageService {

    // =====================================================
    // Création
    // =====================================================

    static async create(

        collection,

        values = {}

    ) {

        const now =
            Date.now();

        const object = {

            id:
                crypto.randomUUID(),

            createdAt:
                now,

            updatedAt:
                now,

            source:
                Sources.LOCAL,

            ...values

        };

        await Database.put(

            collection,

            object

        );

        return object;

    }

    // =====================================================
    // Sauvegarde
    // =====================================================

    static async save(

        collection,

        object

    ) {

        const now =
            Date.now();

        const existing =

            object.id

                ? await Database.get(

                    collection,

                    object.id

                )

                : null;

        const data = {

            ...(existing ?? {}),

            ...object,

            id:

                object.id ??

                crypto.randomUUID(),

            createdAt:

                existing?.createdAt ??

                object.createdAt ??

                now,

            updatedAt:

                now,

            source:

                object.source ??

                existing?.source ??

                Sources.LOCAL

        };

        await Database.put(

            collection,

            data

        );

        return data;

    }

    // =====================================================
    // Lecture
    // =====================================================

    static async load(

        collection,

        id

    ) {

        return Database.get(

            collection,

            id

        );

    }

    // =====================================================
    // Liste
    // =====================================================

    static async list(

        collection

    ) {

        return Database.getAll(

            collection

        );

    }

    // =====================================================
    // Suppression
    // =====================================================

    static async remove(

        collection,

        id

    ) {

        return Database.delete(

            collection,

            id

        );

    }

    // =====================================================
    // Nettoyage
    // =====================================================

    static async clear(

        collection

    ) {

        return Database.clear(

            collection

        );

    }

    // =====================================================
    // Existence
    // =====================================================

    static async exists(

        collection,

        id

    ) {

        return Database.exists(

            collection,

            id

        );

    }

    // =====================================================
    // Comptage
    // =====================================================

    static async count(

        collection

    ) {

        return Database.count(

            collection

        );

    }

}

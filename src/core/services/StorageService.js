/**
 * ==========================================================
 * OPE-SAR Core
 * ----------------------------------------------------------
 * StorageService.js
 *
 * Couche unique de persistance.
 *
 * Tous les modules utilisent ce service.
 *
 * StorageService ne connait pas le métier.
 * Il fournit uniquement les opérations CRUD.
 * ==========================================================
 */

import Database
    from '../database/Database.js';

import Sources
    from '../database/Sources.js';

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

        if (!object.id) {

            object.id =
                crypto.randomUUID();

        }

        const existing =

            await Database.get(

                collection,

                object.id

            );

        const now =
            Date.now();

        const record = {

            ...(existing ?? {}),

            ...object,

            id:
                object.id,

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

            record

        );

        return record;

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

    // =====================================================
    // Export d'une collection
    // =====================================================

    static async export(

        collection

    ) {

        return Database.getAll(

            collection

        );

    }

    // =====================================================
    // Import d'une collection
    // =====================================================

    static async import(

        collection,

        records = []

    ) {

        for (

            const record

            of records

        ) {

            await this.save(

                collection,

                record

            );

        }

    }

    // =====================================================
    // Sauvegarde complète
    // =====================================================

    static async backup(

        collections

    ) {

        const backup = {};

        for (

            const collection

            of collections

        ) {

            backup[collection] =

                await this.export(

                    collection

                );

        }

        return backup;

    }

    // =====================================================
    // Restauration complète
    // =====================================================

    static async restore(

        backup

    ) {

        for (

            const collection

            in backup

        ) {

            await this.clear(

                collection

            );

            await this.import(

                collection,

                backup[collection]

            );

        }

    }

}

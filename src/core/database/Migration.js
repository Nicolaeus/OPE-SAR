/**
 * ==========================================================
 * OPE-SAR Core
 * ----------------------------------------------------------
 * Migration.js
 *
 * Gestion des migrations IndexedDB.
 *
 * Chaque nouvelle version de la base
 * sera décrite ici.
 * ==========================================================
 */

import Collections from './Collections.js';

export default class Migration {

    static upgrade(db, oldVersion, newVersion) {

        console.log(

            `📦 Migration IndexedDB ${oldVersion} → ${newVersion}`

        );

        this.createStores(db);

    }

    static createStores(db) {

        Object.values(Collections)

            .forEach(store => {

                if (

                    db.objectStoreNames.contains(

                        store

                    )

                ) {

                    return;

                }

                db.createObjectStore(

                    store,

                    {

                        keyPath: 'id'

                    }

                );

            });

    }

}

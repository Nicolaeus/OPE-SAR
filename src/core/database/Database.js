/**
 * ==========================================================
 * OPE-SAR Core
 * ----------------------------------------------------------
 * Database.js
 *
 * Couche d'accès IndexedDB.
 *
 * Toutes les opérations de lecture/écriture
 * transitent par cette classe.
 *
 * Les modules ne doivent jamais utiliser
 * IndexedDB directement.
 * ==========================================================
 */

import Migration from './Migration.js';

export default class Database {

    static DB_NAME =
        'OPE-SAR';

    static DB_VERSION =
        1;

    static instance =
        null;

    // =====================================================
    // Ouverture
    // =====================================================

    static async open() {

        if (this.instance) {

            return this.instance;

        }

        return new Promise(

            (resolve, reject) => {

                const request =

                    indexedDB.open(

                        this.DB_NAME,

                        this.DB_VERSION

                    );

                request.onerror = () => {

                    reject(

                        request.error

                    );

                };

                request.onupgradeneeded =
                    event => {

                        Migration.upgrade(

                            event.target.result,

                            event.oldVersion,

                            event.newVersion

                        );

                    };

                request.onsuccess = () => {

                    this.instance =
                        request.result;

                    console.log(

                        '✅ IndexedDB ouverte'

                    );

                    resolve(

                        this.instance

                    );

                };

            }

        );

    }

    // =====================================================
    // Fermeture
    // =====================================================

    static close() {

        if (

            !this.instance

        ) {

            return;

        }

        this.instance.close();

        this.instance = null;

    }

    // =====================================================
    // Transaction
    // =====================================================

    static async transaction(

        store,

        mode = 'readonly'

    ) {

        const db =

            await this.open();

        return db.transaction(

            store,

            mode

        ).objectStore(

            store

        );

    }

    // =====================================================
    // Lecture
    // =====================================================

    static async get(

        store,

        id

    ) {

        const objectStore =

            await this.transaction(

                store

            );

        return new Promise(

            (resolve, reject) => {

                const request =

                    objectStore.get(

                        id

                    );

                request.onsuccess =
                    () =>

                        resolve(

                            request.result

                        );

                request.onerror =
                    () =>

                        reject(

                            request.error

                        );

            }

        );

    }

    // =====================================================
    // Lecture complète
    // =====================================================

    static async getAll(

        store

    ) {

        const objectStore =

            await this.transaction(

                store

            );

        return new Promise(

            (resolve, reject) => {

                const request =

                    objectStore.getAll();

                request.onsuccess =
                    () =>

                        resolve(

                            request.result

                        );

                request.onerror =
                    () =>

                        reject(

                            request.error

                        );

            }

        );

    }
      // =====================================================
    // Écriture
    // =====================================================

    static async put(

        store,

        value

    ) {

        const objectStore =

            await this.transaction(

                store,

                'readwrite'

            );

        return new Promise(

            (resolve, reject) => {

                const request =

                    objectStore.put(

                        value

                    );

                request.onsuccess =
                    () =>

                        resolve(

                            value

                        );

                request.onerror =
                    () =>

                        reject(

                            request.error

                        );

            }

        );

    }

    // =====================================================
    // Suppression
    // =====================================================

    static async delete(

        store,

        id

    ) {

        const objectStore =

            await this.transaction(

                store,

                'readwrite'

            );

        return new Promise(

            (resolve, reject) => {

                const request =

                    objectStore.delete(

                        id

                    );

                request.onsuccess =
                    () =>

                        resolve();

                request.onerror =
                    () =>

                        reject(

                            request.error

                        );

            }

        );

    }

    // =====================================================
    // Vider une collection
    // =====================================================

    static async clear(

        store

    ) {

        const objectStore =

            await this.transaction(

                store,

                'readwrite'

            );

        return new Promise(

            (resolve, reject) => {

                const request =

                    objectStore.clear();

                request.onsuccess =
                    () =>

                        resolve();

                request.onerror =
                    () =>

                        reject(

                            request.error

                        );

            }

        );

    }

    // =====================================================
    // Nombre d'enregistrements
    // =====================================================

    static async count(

        store

    ) {

        const objectStore =

            await this.transaction(

                store

            );

        return new Promise(

            (resolve, reject) => {

                const request =

                    objectStore.count();

                request.onsuccess =
                    () =>

                        resolve(

                            request.result

                        );

                request.onerror =
                    () =>

                        reject(

                            request.error

                        );

            }

        );

    }

    // =====================================================
    // Existence
    // =====================================================

    static async exists(

        store,

        id

    ) {

        const value =

            await this.get(

                store,

                id

            );

        return value !== undefined;

    }

    // =====================================================
    // Suppression complète
    // =====================================================

    static destroy() {

        this.close();

        return new Promise(

            (resolve, reject) => {

                const request =

                    indexedDB.deleteDatabase(

                        this.DB_NAME

                    );

                request.onsuccess =
                    () =>

                        resolve();

                request.onerror =
                    () =>

                        reject(

                            request.error

                        );

            }

        );

    }

}

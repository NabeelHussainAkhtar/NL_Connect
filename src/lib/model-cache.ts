import { openDB, DBSchema } from 'idb';

interface ModelCache extends DBSchema {
    models: {
        key: string;
        value: {
            id: string;
            name: string;
            description: string;
            params: any;
            limits: {
                rpm: number;
                rpd: number;
                tpm: number;
            };
            updatedAt: number;
        };
        indexes: { 'by-updated': 'updatedAt' };
    };
}

export const MODEL_CACHE_NAME = 'model-metadata-cache';
export const MODEL_STORE_NAME = 'models';

const dbPromise = openDB<ModelCache>(MODEL_CACHE_NAME, 1, {
    upgrade(db) {
        const store = db.createObjectStore(MODEL_STORE_NAME, {
            keyPath: 'id',
        });
        store.createIndex('by-updated', 'updatedAt');
    },
});

export async function getModel(id: string) {
    const db = await dbPromise;
    return db.get(MODEL_STORE_NAME, id);
}

export async function setModel(model: any) {
    const db = await dbPromise;
    return db.put(MODEL_STORE_NAME, {
        ...model,
        updatedAt: Date.now(),
    });
}

export async function getModels(limit = 10) {
    const db = await dbPromise;
    return db.getAllFromIndex(MODEL_STORE_NAME, 'by-updated', IDBKeyRange.upperBound(Date.now()), limit);
}

export async function clearExpiredModels(maxAge = 7 * 24 * 60 * 60 * 1000) {
    const db = await dbPromise;
    const tx = db.transaction(MODEL_STORE_NAME, 'readwrite');
    const index = tx.store.index('by-updated');

    let cursor = await index.openCursor(IDBKeyRange.upperBound(Date.now() - maxAge));
    while (cursor) {
        await cursor.delete();
        cursor = await cursor.continue();
    }

    await tx.done;
}

export async function initCache() {
    const db = await dbPromise;
    // Initialization tasks
    await clearExpiredModels();
    return db;
}
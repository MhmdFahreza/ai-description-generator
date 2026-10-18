/**
 * IndexedDB helper for storing and retrieving binary file data (images, videos).
 *
 * Each generator page uses its own dedicated store key so data never conflicts.
 * The DB is opened lazily and the connection is cached for the tab lifetime.
 */

const DB_NAME = "ai-gen-media";
const DB_VERSION = 1;
const STORE_NAME = "files";

let _db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    req.onsuccess = () => {
      _db = req.result;
      resolve(_db);
    };

    req.onerror = () => reject(req.error);
  });
}

/** Persist a File (or Blob) under the given key. */
export async function idbSetFile(key: string, file: File): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    // Store both the raw blob and its metadata so we can reconstruct the File
    tx.objectStore(STORE_NAME).put({ blob: file, name: file.name, type: file.type }, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Retrieve a previously stored File, or null if absent. */
export async function idbGetFile(key: string): Promise<File | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => {
      const data = req.result as { blob: Blob; name: string; type: string } | undefined;
      if (!data) {
        resolve(null);
        return;
      }
      // Reconstruct a proper File object
      const file = new File([data.blob], data.name, { type: data.type });
      resolve(file);
    };
    req.onerror = () => reject(req.error);
  });
}

/** Delete a stored file entry. */
export async function idbRemoveFile(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// src/services/offlineManager.js
// إدارة البيانات في وضع عدم الاتصال — IndexedDB + Background Sync

const DB_NAME    = 'hsepro-offline';
const DB_VERSION = 1;
const QUEUE_STORE = 'pendingWrites';

let dbInstance = null;

async function openDB() {
  if (dbInstance) return dbInstance;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: 'queueId' });
      }
    };
    req.onsuccess  = (e) => { dbInstance = e.target.result; resolve(dbInstance); };
    req.onerror    = (e) => reject(e.target.error);
  });
}

/** يضيف عملية كتابة للقائمة المحلية عند عدم الاتصال */
export async function queueWrite(collection, docId, data) {
  try {
    const db    = await openDB();
    const entry = {
      queueId:    `${collection}_${docId}_${Date.now()}`,
      collection,
      docId,
      data,
      queuedAt:   new Date().toISOString(),
    };
    const tx    = db.transaction(QUEUE_STORE, 'readwrite');
    tx.objectStore(QUEUE_STORE).put(entry);
    await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });

    // طلب Background Sync
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register('sync-offline-data').catch(() => {});
    }
  } catch (err) {
    console.warn('[OfflineManager] queueWrite failed:', err);
  }
}

/** يرجع كل العمليات المعلّقة */
export async function getPendingWrites() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(QUEUE_STORE, 'readonly');
      const req = tx.objectStore(QUEUE_STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror   = () => reject(req.error);
    });
  } catch { return []; }
}

/** يحذف عملية بعد رفعها */
export async function removePendingWrite(queueId) {
  try {
    const db = await openDB();
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    tx.objectStore(QUEUE_STORE).delete(queueId);
  } catch {}
}

/** يرفع كل البيانات المعلّقة — يُستدعى عند استعادة الاتصال */
export async function flushPendingWrites(db, setDoc, doc) {
  const pending = await getPendingWrites();
  if (!pending.length) return 0;
  let count = 0;
  for (const entry of pending) {
    try {
      await setDoc(doc(db, entry.collection, entry.docId), entry.data, { merge: true });
      await removePendingWrite(entry.queueId);
      count++;
    } catch (err) {
      console.warn(`[OfflineManager] Failed to flush ${entry.queueId}:`, err.message);
    }
  }
  return count;
}

/** يسجّل Service Worker */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    console.log('[SW] Registered:', reg.scope);
    return reg;
  } catch (err) {
    console.warn('[SW] Registration failed:', err);
  }
}

/** يستمع لرسائل Service Worker */
export function listenForSyncMessages(callback) {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SYNC_REQUESTED') callback();
  });
}

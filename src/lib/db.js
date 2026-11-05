/**
 * 记录存储：优先 IndexedDB（照片 dataURL 更适合放这里），
 * 不支持或写失败时自动回退到 localStorage。
 * 所有 API 都是异步的，返回 Promise。
 */
const DB_NAME = 'chounaozi-db';
const STORE = 'records';
const LS_KEY = 'chounaozi.records.v1';
const FALLBACK_KEY = 'chounaozi.records.fallback';

let dbPromise = null;
let writeQueue = Promise.resolve();

function hasIDB() {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = window.indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }).catch((err) => {
    dbPromise = null;
    throw err;
  });
  return dbPromise;
}

function lsRead() {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function lsWrite(records) {
  window.localStorage.setItem(LS_KEY, JSON.stringify(records));
}

export async function loadRecords() {
  try {
    if (window.localStorage.getItem(FALLBACK_KEY) === 'true') return lsRead();
  } catch {
    /* localStorage 不可用时继续尝试 IndexedDB */
  }
  if (hasIDB()) {
    try {
      const db = await openDB();
      const list = await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
      if (Array.isArray(list) && list.length) return list;
      // 兼容早期 localStorage 数据
      const legacy = lsRead();
      return legacy.length ? legacy : [];
    } catch {
      return lsRead();
    }
  }
  return lsRead();
}

async function writeRecords(records) {
  const list = Array.isArray(records) ? records : [];
  if (hasIDB()) {
    try {
      const db = await openDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        store.clear();
        list.forEach((r) => store.put(r));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
      try {
        window.localStorage.removeItem(LS_KEY);
        window.localStorage.removeItem(FALLBACK_KEY);
      } catch {
        /* IndexedDB 保存已完成 */
      }
      return;
    } catch {
      // 落到 localStorage
    }
  }
  lsWrite(list);
  window.localStorage.setItem(FALLBACK_KEY, 'true');
}

export function replaceRecords(records) {
  const write = writeQueue.then(() => writeRecords(records));
  writeQueue = write.catch(() => {});
  return write;
}

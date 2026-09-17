import { DecryptedClipboardItem, RoomConfig } from '../types';

const DB_NAME = 'ClipSyncDB';
const DB_VERSION = 1;
const STORE_ITEMS = 'clipboard_items';
const STORE_PENDING = 'pending_outbox';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_ITEMS)) {
        db.createObjectStore(STORE_ITEMS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_PENDING)) {
        db.createObjectStore(STORE_PENDING, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save decrypted item to local offline cache
 */
export async function saveLocalItem(item: DecryptedClipboardItem): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_ITEMS, 'readwrite');
    const store = tx.objectStore(STORE_ITEMS);
    store.put(item);
  } catch (e) {
    // Fallback to localStorage if IndexedDB has issues
    try {
      const existing = JSON.parse(localStorage.getItem('clipsync_items_cache') || '[]');
      const filtered = existing.filter((it: DecryptedClipboardItem) => it.id !== item.id);
      filtered.unshift(item);
      localStorage.setItem('clipsync_items_cache', JSON.stringify(filtered.slice(0, 50)));
    } catch (localErr) {
      console.warn('Storage fallback failed:', localErr);
    }
  }
}

/**
 * Get all cached items from local offline database
 */
export async function getLocalItems(): Promise<DecryptedClipboardItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_ITEMS, 'readonly');
      const store = tx.objectStore(STORE_ITEMS);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = (req.result as DecryptedClipboardItem[]) || [];
        // Sort descending by timestamp
        items.sort((a, b) => b.timestamp - a.timestamp);
        resolve(items);
      };
      req.onerror = () => {
        resolve(getLocalStorageFallbackItems());
      };
    });
  } catch (e) {
    return getLocalStorageFallbackItems();
  }
}

function getLocalStorageFallbackItems(): DecryptedClipboardItem[] {
  try {
    return JSON.parse(localStorage.getItem('clipsync_items_cache') || '[]');
  } catch {
    return [];
  }
}

/**
 * Delete item from local cache
 */
export async function deleteLocalItem(itemId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_ITEMS, 'readwrite');
    tx.objectStore(STORE_ITEMS).delete(itemId);
  } catch (e) {
    const existing = getLocalStorageFallbackItems();
    localStorage.setItem(
      'clipsync_items_cache',
      JSON.stringify(existing.filter((i) => i.id !== itemId))
    );
  }
}

/**
 * Clear local items except pinned items
 */
export async function clearLocalItems(keepPinned = true): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_ITEMS, 'readwrite');
    const store = tx.objectStore(STORE_ITEMS);
    const req = store.getAll();
    req.onsuccess = () => {
      const items = (req.result as DecryptedClipboardItem[]) || [];
      store.clear();
      if (keepPinned) {
        items.filter((i) => i.pinned).forEach((item) => store.put(item));
      }
    };
  } catch (e) {
    const existing = getLocalStorageFallbackItems();
    const remaining = keepPinned ? existing.filter((i) => i.pinned) : [];
    localStorage.setItem('clipsync_items_cache', JSON.stringify(remaining));
  }
}

/**
 * Add an item to the offline pending queue
 */
export async function queuePendingSync(item: DecryptedClipboardItem): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_PENDING, 'readwrite');
    tx.objectStore(STORE_PENDING).put(item);
  } catch (e) {
    const pending = JSON.parse(localStorage.getItem('clipsync_pending_queue') || '[]');
    pending.push(item);
    localStorage.setItem('clipsync_pending_queue', JSON.stringify(pending));
  }
}

/**
 * Get all items waiting in offline pending queue
 */
export async function getPendingSyncQueue(): Promise<DecryptedClipboardItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_PENDING, 'readonly');
      const store = tx.objectStore(STORE_PENDING);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (e) {
    try {
      return JSON.parse(localStorage.getItem('clipsync_pending_queue') || '[]');
    } catch {
      return [];
    }
  }
}

/**
 * Remove an item from pending queue after sync success
 */
export async function removePendingSync(itemId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_PENDING, 'readwrite');
    tx.objectStore(STORE_PENDING).delete(itemId);
  } catch (e) {
    const pending = JSON.parse(localStorage.getItem('clipsync_pending_queue') || '[]');
    localStorage.setItem(
      'clipsync_pending_queue',
      JSON.stringify(pending.filter((it: DecryptedClipboardItem) => it.id !== itemId))
    );
  }
}

// Config persistence
export function getSavedConfig(): Partial<RoomConfig> {
  try {
    const saved = localStorage.getItem('clipsync_room_config');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function saveConfig(config: Partial<RoomConfig>): void {
  try {
    const existing = getSavedConfig();
    localStorage.setItem('clipsync_room_config', JSON.stringify({ ...existing, ...config }));
  } catch (e) {
    console.warn('Failed to save config:', e);
  }
}

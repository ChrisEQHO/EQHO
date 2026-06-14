const DB_NAME = "eqho-player-db";
const DB_VERSION = 4;
const TRACK_STORE = "tracks";
const PLAYLIST_STORE = "playlists";
const SAVED_PLAYLISTS_STORE = "savedPlaylists";
const CURRENT_QUEUE_STORE = "currentQueue";

interface CachedTrack {
  id: string;
  title: string;
  file: File;
  durationSeconds: number;
}

interface CachedPlaylistItem {
  id: string;
  title: string;
  fileName: string;
  durationSeconds: number;
  uploadedAt: string;
}

interface CachedPlaylistWithFiles {
  id: string;
  title: string;
  fileName: string;
  durationSeconds: number;
  uploadedAt: string;
  file: File;
}

interface StoredPlaylistItem {
  id: string;
  title: string;
  fileName: string;
  durationSeconds: number;
  uploadedAt: string;
  fileData: ArrayBuffer;
  fileType: string;
}

interface SavedPlaylist {
  id: string;
  name: string;
  trackIds: string[];
}

interface SavedPlaylistWithTracks {
  id: string;
  name: string;
  tracks: {
    id: string;
    title: string;
    fileName: string;
    durationSeconds: number;
    uploadedAt: string;
    file: File;
  }[];
}

const openEqhoDB = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(TRACK_STORE)) {
        db.createObjectStore(TRACK_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(PLAYLIST_STORE)) {
        db.createObjectStore(PLAYLIST_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(SAVED_PLAYLISTS_STORE)) {
        db.createObjectStore(SAVED_PLAYLISTS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(CURRENT_QUEUE_STORE)) {
        db.createObjectStore(CURRENT_QUEUE_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export const saveTrackToCache = async (track: CachedTrack): Promise<void> => {
  const db = await openEqhoDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRACK_STORE, "readwrite");
    tx.objectStore(TRACK_STORE).put(track);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getCachedTracks = async (): Promise<CachedTrack[]> => {
  const db = await openEqhoDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRACK_STORE, "readonly");
    const request = tx.objectStore(TRACK_STORE).getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const clearCachedTracks = async (): Promise<void> => {
  const db = await openEqhoDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRACK_STORE, "readwrite");
    tx.objectStore(TRACK_STORE).clear();

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const removeTrackFromCache = async (id: string): Promise<void> => {
  const db = await openEqhoDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRACK_STORE, "readwrite");
    tx.objectStore(TRACK_STORE).delete(id);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const savePlaylistToCache = async (playlist: CachedPlaylistItem[]): Promise<void> => {
  const db = await openEqhoDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PLAYLIST_STORE, "readwrite");
    const store = tx.objectStore(PLAYLIST_STORE);
    
    // Clear existing and save new playlist
    store.clear();
    playlist.forEach((item) => store.put(item));

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getCachedPlaylist = async (): Promise<CachedPlaylistItem[]> => {
  const db = await openEqhoDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PLAYLIST_STORE, "readonly");
    const request = tx.objectStore(PLAYLIST_STORE).getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const clearCachedPlaylist = async (): Promise<void> => {
  const db = await openEqhoDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(CURRENT_QUEUE_STORE, "readwrite");
    tx.objectStore(CURRENT_QUEUE_STORE).clear();

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// Save current playlist with full track data including audio files
export const saveCurrentPlaylistWithFiles = async (playlist: CachedPlaylistWithFiles[]): Promise<void> => {
  const db = await openEqhoDB();

  // Convert File objects to ArrayBuffer for storage
  const itemsToStore: StoredPlaylistItem[] = await Promise.all(
    playlist.map(async (item) => {
      const arrayBuffer = await item.file.arrayBuffer();
      return {
        id: item.id,
        title: item.title,
        fileName: item.fileName,
        durationSeconds: item.durationSeconds,
        uploadedAt: item.uploadedAt,
        fileData: arrayBuffer,
        fileType: item.file.type,
      };
    })
  );

  return new Promise((resolve, reject) => {
    const tx = db.transaction(CURRENT_QUEUE_STORE, "readwrite");
    const store = tx.objectStore(CURRENT_QUEUE_STORE);
    
    store.clear();
    itemsToStore.forEach((item) => store.put(item));

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getCurrentPlaylistWithFiles = async (): Promise<CachedPlaylistWithFiles[]> => {
  const db = await openEqhoDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(CURRENT_QUEUE_STORE, "readonly");
    const request = tx.objectStore(CURRENT_QUEUE_STORE).getAll();

    request.onsuccess = () => {
      const storedItems: StoredPlaylistItem[] = request.result || [];
      // Convert ArrayBuffer back to File objects
      const restored = storedItems.map((item) => {
        const file = new File([item.fileData], item.fileName, { type: item.fileType });
        return {
          id: item.id,
          title: item.title,
          fileName: item.fileName,
          durationSeconds: item.durationSeconds,
          uploadedAt: item.uploadedAt,
          file,
        };
      });
      resolve(restored);
    };
    request.onerror = () => reject(request.error);
  });
};

// Saved Playlists (named playlists in sidebar)
export const saveSavedPlaylists = async (playlists: SavedPlaylist[]): Promise<void> => {
  const db = await openEqhoDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SAVED_PLAYLISTS_STORE, "readwrite");
    const store = tx.objectStore(SAVED_PLAYLISTS_STORE);
    
    store.clear();
    playlists.forEach((pl) => store.put(pl));

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getSavedPlaylists = async (): Promise<SavedPlaylist[]> => {
  const db = await openEqhoDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SAVED_PLAYLISTS_STORE, "readonly");
    const request = tx.objectStore(SAVED_PLAYLISTS_STORE).getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

// Save playlists with full track data including audio files
export const saveSavedPlaylistsWithTracks = async (playlists: SavedPlaylistWithTracks[]): Promise<void> => {
  const db = await openEqhoDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SAVED_PLAYLISTS_STORE, "readwrite");
    const store = tx.objectStore(SAVED_PLAYLISTS_STORE);
    
    store.clear();
    playlists.forEach((pl) => store.put(pl));

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getSavedPlaylistsWithTracks = async (): Promise<SavedPlaylistWithTracks[]> => {
  const db = await openEqhoDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SAVED_PLAYLISTS_STORE, "readonly");
    const request = tx.objectStore(SAVED_PLAYLISTS_STORE).getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const clearSavedPlaylists = async (): Promise<void> => {
  const db = await openEqhoDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SAVED_PLAYLISTS_STORE, "readwrite");
    tx.objectStore(SAVED_PLAYLISTS_STORE).clear();

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// ---------------------------------------------------------------------------
// Robust local audio extraction for cloud upload.
// Reads the raw records from the savedPlaylists and currentQueue stores and
// extracts a usable File from whatever audio representation each track holds:
// File, Blob, ArrayBuffer / typed array (fileData / audioData / buffer), or a
// (object/blob/cloud) URL. This does NOT assume a fixed schema, so it works
// across legacy and current storage formats.
// ---------------------------------------------------------------------------

export interface LocalAudioFile {
  id: string;
  fileName: string;
  title: string;
  file: File;
  source: string; // which representation it was extracted from
}

const extractFileFromRecord = async (
  rec: any
): Promise<{ file: File; source: string } | null> => {
  if (!rec) return null;
  const name = rec.fileName || rec.title || rec.name || "audio";
  const type = rec.fileType || rec.mimeType || rec.type || "audio/mpeg";

  // 1) Native File
  if (rec.file instanceof File) return { file: rec.file, source: "File" };

  // 2) Blob (in `file` or `blob`)
  if (rec.file instanceof Blob)
    return { file: new File([rec.file], name, { type: rec.file.type || type }), source: "Blob(file)" };
  if (rec.blob instanceof Blob)
    return { file: new File([rec.blob], name, { type: rec.blob.type || type }), source: "Blob" };

  // 3) ArrayBuffer / typed array, under any of the common field names
  const buf = rec.fileData ?? rec.audioData ?? rec.arrayBuffer ?? rec.buffer ?? rec.data;
  if (buf instanceof ArrayBuffer) return { file: new File([buf], name, { type }), source: "ArrayBuffer" };
  if (buf && ArrayBuffer.isView(buf)) return { file: new File([buf as any], name, { type }), source: "TypedArray" };

  // 4) URL string (object URL, blob: URL, or cloud URL)
  const url = rec.url || rec.objectUrl || rec.audioUrl || rec.fileUrl;
  if (typeof url === "string" && url) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const blob = await res.blob();
        return { file: new File([blob], name, { type: blob.type || type }), source: "URL" };
      }
    } catch (err) {
      console.log('[v0] extractFileFromRecord: failed to fetch url for', name, err);
    }
  }

  return null;
};

export const getAllLocalAudioFiles = async (): Promise<LocalAudioFile[]> => {
  const db = await openEqhoDB();
  console.log(
    `[v0] IndexedDB opened: "${DB_NAME}" v${DB_VERSION} — stores: [${Array.from(db.objectStoreNames).join(", ")}]`
  );

  const readStore = (storeName: string): Promise<any[]> =>
    new Promise((resolve) => {
      if (!db.objectStoreNames.contains(storeName)) {
        resolve([]);
        return;
      }
      const tx = db.transaction(storeName, "readonly");
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

  const [savedRaw, queueRaw] = await Promise.all([
    readStore(SAVED_PLAYLISTS_STORE),
    readStore(CURRENT_QUEUE_STORE),
  ]);

  console.log(`[v0] savedPlaylists count: ${savedRaw.length}`);
  console.log(`[v0] currentQueue count: ${queueRaw.length}`);

  const results: LocalAudioFile[] = [];
  const seen = new Set<string>();

  const handleTrack = async (rec: any, playlistLabel: string) => {
    const id = rec.id || rec.trackId || "";
    const fileName = rec.fileName || rec.title || "audio";
    const label = rec.title || fileName;

    const has = {
      File: rec.file instanceof File,
      Blob: rec.file instanceof Blob || rec.blob instanceof Blob,
      ArrayBuffer:
        (rec.fileData ?? rec.audioData ?? rec.arrayBuffer ?? rec.buffer ?? rec.data) instanceof ArrayBuffer,
      audioData: rec.audioData != null,
      url: typeof (rec.url || rec.objectUrl || rec.audioUrl || rec.fileUrl) === "string",
    };
    console.log(`[v0] [${playlistLabel}] track "${label}" audio sources:`, has);

    const extracted = await extractFileFromRecord(rec);
    if (!extracted) {
      console.log(
        `[v0] [${playlistLabel}] SKIP track "${label}" — reason: no usable audio (File/Blob/ArrayBuffer/audioData/url all absent)`
      );
      return;
    }

    const key = id || fileName;
    if (seen.has(key)) return;
    seen.add(key);
    results.push({ id, fileName, title: label, file: extracted.file, source: extracted.source });
  };

  // savedPlaylists records: either a playlist with a `tracks[]` array, or a flat track
  for (const rec of savedRaw) {
    if (Array.isArray(rec.tracks)) {
      console.log(`[v0] savedPlaylist "${rec.name || rec.id}" tracks found: ${rec.tracks.length}`);
      for (const t of rec.tracks) await handleTrack(t, `saved:${rec.name || rec.id}`);
    } else {
      await handleTrack(rec, "saved");
    }
  }

  // currentQueue records: flat track records (or, defensively, nested)
  for (const rec of queueRaw) {
    if (Array.isArray(rec.tracks)) {
      console.log(`[v0] currentQueue group "${rec.name || rec.id}" tracks found: ${rec.tracks.length}`);
      for (const t of rec.tracks) await handleTrack(t, "queue");
    } else {
      await handleTrack(rec, "queue");
    }
  }

  console.log(`[v0] getAllLocalAudioFiles: extracted ${results.length} audio file(s) from IndexedDB`);
  return results;
};

// Grouped, sync-ready view of local playlists read DIRECTLY from the IndexedDB
// savedPlaylists store (the source of truth for named playlists + their tracks),
// with the currentQueue store used as an additional source to resolve audio Files
// by track id / fileName. This intentionally does NOT depend on React state or
// Supabase metadata, which is why it fixes "N playlists but 0 tracks".
export interface SyncReadyTrack {
  id: string;
  title: string;
  fileName: string;
  durationSeconds: number;
  uploadedAt: string;
  file?: File;
}

export interface SyncReadyPlaylist {
  id: string;
  name: string;
  tracks: SyncReadyTrack[];
}

export const getLocalPlaylistsForSync = async (): Promise<SyncReadyPlaylist[]> => {
  const db = await openEqhoDB();
  console.log(
    `[v0] getLocalPlaylistsForSync: IndexedDB "${DB_NAME}" v${DB_VERSION} — stores: [${Array.from(db.objectStoreNames).join(", ")}]`
  );

  const readStore = (storeName: string): Promise<any[]> =>
    new Promise((resolve) => {
      if (!db.objectStoreNames.contains(storeName)) {
        resolve([]);
        return;
      }
      const tx = db.transaction(storeName, "readonly");
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

  const [savedRaw, queueRaw] = await Promise.all([
    readStore(SAVED_PLAYLISTS_STORE),
    readStore(CURRENT_QUEUE_STORE),
  ]);

  console.log(
    `[v0] getLocalPlaylistsForSync: savedPlaylists=${savedRaw.length}, currentQueue=${queueRaw.length}`
  );

  // Build a fallback File map (by id + fileName) from BOTH stores so a track whose
  // own record lacks usable audio can still be resolved from the other store.
  const fileById = new Map<string, File>();
  const fileByName = new Map<string, File>();
  const indexRecord = async (rec: any) => {
    const extracted = await extractFileFromRecord(rec);
    if (!extracted) return;
    const id = rec.id || rec.trackId;
    const fileName = rec.fileName || rec.title;
    if (id) fileById.set(id, extracted.file);
    if (fileName) fileByName.set(fileName, extracted.file);
  };
  for (const pl of savedRaw) {
    if (Array.isArray(pl.tracks)) for (const t of pl.tracks) await indexRecord(t);
    else await indexRecord(pl);
  }
  for (const rec of queueRaw) {
    if (Array.isArray(rec.tracks)) for (const t of rec.tracks) await indexRecord(t);
    else await indexRecord(rec);
  }

  const toSyncTrack = async (t: any): Promise<SyncReadyTrack> => {
    let file = (await extractFileFromRecord(t))?.file;
    if (!file) {
      file =
        (t.id && fileById.get(t.id)) ||
        ((t.fileName || t.title) && fileByName.get(t.fileName || t.title)) ||
        undefined;
    }
    return {
      id: t.id || t.trackId || "",
      title: t.title || t.fileName || "Untitled",
      fileName: t.fileName || t.title || "audio",
      durationSeconds: t.durationSeconds ?? t.duration ?? 0,
      uploadedAt: t.uploadedAt || new Date().toISOString(),
      file,
    };
  };

  const playlists: SyncReadyPlaylist[] = [];

  // Named saved playlists (the primary source — these are the user's 4 playlists)
  for (const pl of savedRaw) {
    const rawTracks: any[] = Array.isArray(pl.tracks)
      ? pl.tracks
      : Array.isArray(pl.trackIds)
        ? [] // metadata-only legacy record; tracks live elsewhere, resolved via map below
        : [];
    const tracks = await Promise.all(rawTracks.map(toSyncTrack));
    console.log(
      `[v0] getLocalPlaylistsForSync: playlist "${pl.name || pl.id}" -> ${tracks.length} track(s), ${tracks.filter((t) => t.file).length} with audio`
    );
    playlists.push({ id: pl.id, name: pl.name || "Untitled Playlist", tracks });
  }

  return playlists;
};

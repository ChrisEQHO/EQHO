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

// Describe the real shape of a stored record without guessing field names:
// maps each own key to a human-readable type (and size for binary/array values).
const describeShape = (rec: any): Record<string, string> => {
  const out: Record<string, string> = {};
  if (!rec || typeof rec !== "object") return out;
  for (const key of Object.keys(rec)) {
    const v = (rec as any)[key];
    if (v == null) out[key] = String(v);
    else if (v instanceof File) out[key] = `File(name=${v.name}, ${v.size}b, ${v.type})`;
    else if (v instanceof Blob) out[key] = `Blob(${v.size}b, ${v.type})`;
    else if (v instanceof ArrayBuffer) out[key] = `ArrayBuffer(${v.byteLength}b)`;
    else if (ArrayBuffer.isView(v)) out[key] = `${(v as any).constructor?.name || "TypedArray"}(${(v as any).byteLength}b)`;
    else if (Array.isArray(v)) out[key] = `Array(len=${v.length})`;
    else if (typeof v === "string") out[key] = `string("${v.length > 60 ? v.slice(0, 60) + "…" : v}")`;
    else out[key] = typeof v;
  }
  return out;
};

// Convert any single value into audio bytes if possible (File/Blob/ArrayBuffer/typed array).
const valueToAudio = (v: any): { file?: File; blob?: Blob; buffer?: ArrayBuffer | ArrayBufferView } | null => {
  if (v == null) return null;
  if (v instanceof File) return { file: v };
  if (v instanceof Blob) return { blob: v };
  if (v instanceof ArrayBuffer) return { buffer: v };
  if (ArrayBuffer.isView(v)) return { buffer: v };
  return null;
};

// Generic audio extractor: does NOT assume specific field names. It scans every
// own-enumerable value of the record for the first File/Blob/ArrayBuffer/typed
// array, then falls back to any string that looks like a URL. This adapts to the
// real stored structure instead of guessing keys.
const extractFileFromRecord = async (
  rec: any
): Promise<{ file: File; source: string } | null> => {
  if (!rec || typeof rec !== "object") return null;
  const name = rec.fileName || rec.title || rec.name || "audio";
  const type = rec.fileType || rec.mimeType || rec.type || "audio/mpeg";

  // 1) Scan all values for binary audio (File/Blob/ArrayBuffer/typed array)
  for (const key of Object.keys(rec)) {
    const audio = valueToAudio((rec as any)[key]);
    if (!audio) continue;
    if (audio.file) return { file: audio.file, source: `File@${key}` };
    if (audio.blob)
      return { file: new File([audio.blob], name, { type: audio.blob.type || type }), source: `Blob@${key}` };
    if (audio.buffer)
      return { file: new File([audio.buffer as any], name, { type }), source: `Buffer@${key}` };
  }

  // 2) Fall back to any string value that looks like a fetchable URL
  for (const key of Object.keys(rec)) {
    const v = (rec as any)[key];
    if (typeof v === "string" && /^(blob:|https?:|data:|\/)/.test(v)) {
      try {
        const res = await fetch(v);
        if (res.ok) {
          const blob = await res.blob();
          if (blob.size > 0)
            return { file: new File([blob], name, { type: blob.type || type }), source: `URL@${key}` };
        }
      } catch (err) {
        console.log('[v0] extractFileFromRecord: failed to fetch url for', name, "key", key, err);
      }
    }
  }

  return null;
};

// Find every array-valued property whose elements are objects (candidate track
// lists), instead of assuming the array is named `tracks`.
const findTrackArrays = (rec: any): { key: string; arr: any[] }[] => {
  const result: { key: string; arr: any[] }[] = [];
  if (!rec || typeof rec !== "object") return result;
  for (const key of Object.keys(rec)) {
    const v = (rec as any)[key];
    if (Array.isArray(v) && v.length > 0 && typeof v[0] === "object" && v[0] !== null) {
      result.push({ key, arr: v });
    }
  }
  return result;
};

// TEMPORARY DIAGNOSTIC: print the real IndexedDB structure so we can adapt the
// uploader to the actual stored shape instead of guessing field names.
export const debugInspectIndexedDb = async (): Promise<void> => {
  const db = await openEqhoDB();
  // 1) all object store names
  console.log('[v0][debug] (1) object stores in eqho-player-db:', Array.from(db.objectStoreNames));

  const readStore = (storeName: string): Promise<any[]> =>
    new Promise((resolve) => {
      if (!db.objectStoreNames.contains(storeName)) return resolve([]);
      const tx = db.transaction(storeName, "readonly");
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

  const [savedRaw, queueRaw] = await Promise.all([
    readStore(SAVED_PLAYLISTS_STORE),
    readStore(CURRENT_QUEUE_STORE),
  ]);

  // 2) number of savedPlaylists records
  console.log('[v0][debug] (2) savedPlaylists record count:', savedRaw.length);
  console.log('[v0][debug]     currentQueue record count:', queueRaw.length);

  const firstSaved = savedRaw[0];
  // 3) full shape/keys of the first saved playlist
  console.log('[v0][debug] (3) first savedPlaylist keys:', firstSaved ? Object.keys(firstSaved) : '(none)');
  console.log('[v0][debug]     first savedPlaylist shape:', firstSaved ? describeShape(firstSaved) : '(none)');

  // Locate the track list inside the first saved playlist (any array-of-objects key)
  const trackArrays = firstSaved ? findTrackArrays(firstSaved) : [];
  console.log('[v0][debug]     track-array keys on first savedPlaylist:', trackArrays.map((t) => `${t.key}(len=${t.arr.length})`));
  const firstTrack = trackArrays[0]?.arr?.[0] ?? (queueRaw[0] ? queueRaw[0] : undefined);

  // 4) full shape/keys of the first track
  console.log('[v0][debug] (4) first track keys:', firstTrack ? Object.keys(firstTrack) : '(none)');
  console.log('[v0][debug]     first track shape:', firstTrack ? describeShape(firstTrack) : '(none)');

  // 5) whether that track has audio data
  if (firstTrack) {
    const extracted = await extractFileFromRecord(firstTrack);
    console.log('[v0][debug] (5) first track has audio?', !!extracted, extracted ? `source=${extracted.source}, size=${extracted.file.size}b` : '(no audio found in any field)');
  } else {
    console.log('[v0][debug] (5) first track has audio? no track found to inspect');
  }

  // 6) shape of first currentQueue record too (queue is where playable audio lives)
  const firstQueue = queueRaw[0];
  console.log('[v0][debug] (6) first currentQueue keys:', firstQueue ? Object.keys(firstQueue) : '(none)');
  console.log('[v0][debug]     first currentQueue shape:', firstQueue ? describeShape(firstQueue) : '(none)');
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

  // savedPlaylists records: find any array-of-objects property (track list) rather
  // than assuming the array is named `tracks`. If none, treat the record as a track.
  for (const rec of savedRaw) {
    const trackArrays = findTrackArrays(rec);
    if (trackArrays.length > 0) {
      for (const { key, arr } of trackArrays) {
        console.log(`[v0] savedPlaylist "${rec.name || rec.id}" track list "${key}" found: ${arr.length}`);
        for (const t of arr) await handleTrack(t, `saved:${rec.name || rec.id}`);
      }
    } else {
      await handleTrack(rec, "saved");
    }
  }

  // currentQueue records: same generic detection
  for (const rec of queueRaw) {
    const trackArrays = findTrackArrays(rec);
    if (trackArrays.length > 0) {
      for (const { key, arr } of trackArrays) {
        console.log(`[v0] currentQueue group "${rec.name || rec.id}" track list "${key}" found: ${arr.length}`);
        for (const t of arr) await handleTrack(t, "queue");
      }
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
    const arrays = findTrackArrays(pl);
    if (arrays.length > 0) for (const { arr } of arrays) for (const t of arr) await indexRecord(t);
    else await indexRecord(pl);
  }
  for (const rec of queueRaw) {
    const arrays = findTrackArrays(rec);
    if (arrays.length > 0) for (const { arr } of arrays) for (const t of arr) await indexRecord(t);
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

  // Named saved playlists (sidebar playlists). NOTE: these are often empty
  // containers — the actual uploaded audio lives in the currentQueue store.
  for (const pl of savedRaw) {
    // Collect tracks from ANY array-of-objects property (not just `tracks`).
    const arrays = findTrackArrays(pl);
    const rawTracks: any[] = arrays.flatMap(({ arr }) => arr);
    const tracks = await Promise.all(rawTracks.map(toSyncTrack));
    console.log(
      `[v0] getLocalPlaylistsForSync: saved playlist "${pl.name || pl.id}" (track keys: ${arrays.map((a) => a.key).join(",") || "none"}) -> ${tracks.length} track(s), ${tracks.filter((t) => t.file).length} with audio`
    );
    playlists.push({ id: pl.id, name: pl.name || "Untitled Playlist", tracks });
  }

  // Current queue (the playable now-playing list). This is where uploaded audio
  // actually lives, so it MUST be uploaded too — otherwise empty saved playlists
  // produce "N playlists but 0 tracks". The queue records are flat track records.
  const queueTrackRecords: any[] = [];
  for (const rec of queueRaw) {
    const arrays = findTrackArrays(rec);
    if (arrays.length > 0) for (const { arr } of arrays) queueTrackRecords.push(...arr);
    else queueTrackRecords.push(rec);
  }
  if (queueTrackRecords.length > 0) {
    const queueTracks = await Promise.all(queueTrackRecords.map(toSyncTrack));
    let queueName = "Current Queue";
    try {
      if (typeof localStorage !== "undefined") {
        queueName = localStorage.getItem("currentPlaylistName") || queueName;
      }
    } catch {
      /* localStorage may be unavailable; fall back to default name */
    }
    console.log(
      `[v0] getLocalPlaylistsForSync: current queue "${queueName}" -> ${queueTracks.length} track(s), ${queueTracks.filter((t) => t.file).length} with audio`
    );
    playlists.push({ id: "current-queue", name: queueName, tracks: queueTracks });
  }

  const totalTracks = playlists.reduce((n, p) => n + p.tracks.length, 0);
  console.log(
    `[v0] getLocalPlaylistsForSync: returning ${playlists.length} playlist(s) with ${totalTracks} total track(s)`
  );
  return playlists;
};

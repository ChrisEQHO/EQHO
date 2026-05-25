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

const DB_NAME = "eqho-player-db";
const DB_VERSION = 3;
const TRACK_STORE = "tracks";
const PLAYLIST_STORE = "playlists";
const SAVED_PLAYLISTS_STORE = "savedPlaylists";

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
    const tx = db.transaction(PLAYLIST_STORE, "readwrite");
    tx.objectStore(PLAYLIST_STORE).clear();

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// Save current playlist with full track data including audio files
export const saveCurrentPlaylistWithFiles = async (playlist: CachedPlaylistWithFiles[]): Promise<void> => {
  const db = await openEqhoDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PLAYLIST_STORE, "readwrite");
    const store = tx.objectStore(PLAYLIST_STORE);
    
    store.clear();
    playlist.forEach((item) => store.put(item));

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getCurrentPlaylistWithFiles = async (): Promise<CachedPlaylistWithFiles[]> => {
  const db = await openEqhoDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PLAYLIST_STORE, "readonly");
    const request = tx.objectStore(PLAYLIST_STORE).getAll();

    request.onsuccess = () => resolve(request.result || []);
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

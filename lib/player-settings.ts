export const SETTINGS_STORAGE_KEY = "eqho-settings";
export const LEGACY_WARNING_PREFS_KEY = "eqho-warning-prefs";
export const LEGACY_BEEP_PREFS_KEY = "eqho-beep-prefs";

export interface PlayerSettings<Sound extends string = string> {
  defaultVolume: number;
  countdownSeconds: number;
  gapSeconds: number;
  playlistRepeats: number;
  backToBack: boolean;
  autoplayNext: boolean;
  showCountdown: boolean;
  showPauseWarning: boolean;
  showSkipWarning: boolean;
  beepSound: Sound;
  countdownSound: boolean;
}

export type SettingKey = keyof PlayerSettings;

export function createDefaultSettings<Sound extends string>(defaultBeepSound: Sound): PlayerSettings<Sound> {
  return {
    defaultVolume: 80,
    countdownSeconds: 3,
    gapSeconds: 10,
    playlistRepeats: 1,
    backToBack: false,
    autoplayNext: true,
    showCountdown: true,
    showPauseWarning: true,
    showSkipWarning: true,
    beepSound: defaultBeepSound,
    countdownSound: true,
  };
}

const NUMBER_RANGES: Partial<Record<SettingKey, [number, number]>> = {
  defaultVolume: [0, 100],
  countdownSeconds: [0, 15],
  gapSeconds: [0, 120],
  playlistRepeats: [1, 20],
};

const BOOLEAN_KEYS: SettingKey[] = [
  "backToBack",
  "autoplayNext",
  "showCountdown",
  "showPauseWarning",
  "showSkipWarning",
  "countdownSound",
];

/** Keeps only well-typed, in-range values so corrupt storage falls back to defaults. */
export function sanitizeSettings<Sound extends string>(
  raw: unknown,
  validBeepSounds: readonly Sound[],
): Partial<PlayerSettings<Sound>> {
  if (!raw || typeof raw !== "object") return {};
  const input = raw as Record<string, unknown>;
  const out: Partial<PlayerSettings<Sound>> = {};

  for (const [key, [min, max]] of Object.entries(NUMBER_RANGES) as [SettingKey, [number, number]][]) {
    const value = input[key];
    if (typeof value === "number" && Number.isFinite(value) && value >= min && value <= max) {
      (out as Record<string, unknown>)[key] = Math.round(value);
    }
  }
  for (const key of BOOLEAN_KEYS) {
    if (typeof input[key] === "boolean") (out as Record<string, unknown>)[key] = input[key];
  }
  if (typeof input.beepSound === "string" && (validBeepSounds as readonly string[]).includes(input.beepSound)) {
    out.beepSound = input.beepSound as Sound;
  }
  return out;
}

interface StorageLike {
  getItem(key: string): string | null;
}

function readJson(storage: StorageLike, key: string): unknown {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Loads saved settings from the single shared key. Values from the older
 * per-feature keys are used only when the shared key doesn't have them, so
 * existing users keep their warning and countdown-sound choices.
 */
export function loadStoredSettings<Sound extends string>(
  storage: StorageLike,
  validBeepSounds: readonly Sound[],
): Partial<PlayerSettings<Sound>> {
  const warning = sanitizeSettings(readJson(storage, LEGACY_WARNING_PREFS_KEY), validBeepSounds);
  const beepRaw = readJson(storage, LEGACY_BEEP_PREFS_KEY) as Record<string, unknown> | null;
  const beep = sanitizeSettings(beepRaw, validBeepSounds);
  // An earlier build stored the countdown sound on/off flag as `showCountdown`.
  const legacySoundOn =
    typeof beepRaw?.countdownSound === "boolean"
      ? beepRaw.countdownSound
      : typeof beepRaw?.showCountdown === "boolean"
        ? beepRaw.showCountdown
        : undefined;
  const legacy: Partial<PlayerSettings<Sound>> = {
    ...(typeof warning.showPauseWarning === "boolean" ? { showPauseWarning: warning.showPauseWarning } : {}),
    ...(typeof warning.showSkipWarning === "boolean" ? { showSkipWarning: warning.showSkipWarning } : {}),
    ...(beep.beepSound ? { beepSound: beep.beepSound } : {}),
    ...(typeof legacySoundOn === "boolean" ? { countdownSound: legacySoundOn } : {}),
  };
  return { ...legacy, ...sanitizeSettings(readJson(storage, SETTINGS_STORAGE_KEY), validBeepSounds) };
}

/** Defaults that are also mirrored into the player's live session state. */
export const SESSION_DEFAULT_KEYS = ["gapSeconds", "playlistRepeats", "backToBack", "defaultVolume"] as const;
export type SessionDefaultKey = (typeof SESSION_DEFAULT_KEYS)[number];

/**
 * A default only changes the live player when no session is running. While a
 * session runs, it's saved for the next session and the current one is untouched.
 */
export function shouldApplyDefaultToLiveState(key: SettingKey, sessionRunning: boolean): key is SessionDefaultKey {
  return !sessionRunning && (SESSION_DEFAULT_KEYS as readonly string[]).includes(key);
}

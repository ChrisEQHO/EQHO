export const ONBOARDING_STORAGE_KEY = "eqho-onboarding";

export const ONBOARDING_FLAGS = ["sessionTipDismissed", "guideCompleted", "guideSkipped"] as const;

export type OnboardingFlag = (typeof ONBOARDING_FLAGS)[number];

export type OnboardingState = Partial<Record<OnboardingFlag, boolean>>;

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function defaultStorage(): StorageLike | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function readOnboarding(storage: StorageLike | null = defaultStorage()): OnboardingState {
  if (!storage) return {};
  try {
    const raw = storage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const state: OnboardingState = {};
    for (const flag of ONBOARDING_FLAGS) {
      if ((parsed as Record<string, unknown>)[flag] === true) state[flag] = true;
    }
    return state;
  } catch {
    return {};
  }
}

export function markOnboarding(
  flag: OnboardingFlag,
  storage: StorageLike | null = defaultStorage(),
): OnboardingState {
  const next = { ...readOnboarding(storage), [flag]: true };
  if (storage) {
    try {
      storage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Private mode or quota errors: the tip simply reappears next visit.
    }
  }
  return next;
}

export function shouldShowSessionTip(input: {
  state: OnboardingState;
  previousQueueLength: number;
  addedTrackCount: number;
}): boolean {
  if (input.state.sessionTipDismissed) return false;
  return input.previousQueueLength === 0 && input.addedTrackCount > 0;
}

export function shouldShowGuide(state: OnboardingState): boolean {
  return !state.guideCompleted && !state.guideSkipped;
}

export type GuideAction =
  | "openPlaylists"
  | "openCloud"
  | "openQueue"
  | "openSessionControls"
  | "openCountdownSettings"
  | "openFullscreen";

export type GuideStep = {
  id: string;
  title: string;
  body: string;
  action?: { kind: GuideAction; label: string };
  secondaryAction?: { kind: GuideAction; label: string; requiresCloud?: boolean };
};

export const DEVICE_LOCK_NOTE =
  "For live classes, keep the device unlocked and EQHO Player open.";

export const GUIDE_STEPS: readonly GuideStep[] = [
  {
    id: "create",
    title: "Create or download a playlist",
    body: "Upload a folder of routine music from this device, or download a playlist you saved to EQHO Cloud.",
    action: { kind: "openPlaylists", label: "Open playlists" },
    secondaryAction: { kind: "openCloud", label: "Open EQHO Cloud", requiresCloud: true },
  },
  {
    id: "confirm",
    title: "Confirm the tracks",
    body: "Open the playlist and check every routine is there, in the order you teach it.",
    action: { kind: "openPlaylists", label: "Open playlists" },
  },
  {
    id: "offline",
    title: "Check it is Offline ready",
    body: "Look for the Offline ready badge on the playlist. It means every track is stored on this device, so the class plays without internet.",
    action: { kind: "openPlaylists", label: "Open playlists" },
  },
  {
    id: "countdown",
    title: "Set the countdown and gap",
    body: "The countdown runs before each routine. The gap is the rest between routines. Set your defaults in Settings, or change the gap for this session in the session controls.",
    action: { kind: "openSessionControls", label: "Show session controls" },
    secondaryAction: { kind: "openCountdownSettings", label: "Countdown settings" },
  },
  {
    id: "plays",
    title: "Set plays per track",
    body: "In Up Next, use the plays control on a track to play it more than once in a row.",
    action: { kind: "openQueue", label: "Show Up Next" },
  },
  {
    id: "repeat",
    title: "Set playlist repeat",
    body: "Reps in the session controls repeats the whole queue, for example 2x to run the class twice.",
    action: { kind: "openSessionControls", label: "Show session controls" },
  },
  {
    id: "review",
    title: "Review Up Next",
    body: "Check the order, remove anything you do not need and drag tracks to reorder them before you start.",
    action: { kind: "openQueue", label: "Show Up Next" },
  },
  {
    id: "start",
    title: "Start playback",
    body: "Press Start Session. The countdown plays, then the first routine starts. Pause and skip are always one tap away.",
    action: { kind: "openSessionControls", label: "Show Start Session" },
  },
  {
    id: "fullscreen",
    title: "Use fullscreen mode",
    body: "Coach view shows the countdown and current routine large enough to read from across the room.",
    action: { kind: "openFullscreen", label: "Open fullscreen" },
  },
];

export function clampGuideStep(index: number, total: number = GUIDE_STEPS.length): number {
  if (!Number.isFinite(index) || total <= 0) return 0;
  return Math.min(Math.max(Math.trunc(index), 0), total - 1);
}

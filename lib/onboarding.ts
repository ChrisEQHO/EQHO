export const ONBOARDING_STORAGE_KEY = "eqho-onboarding";

export type OnboardingFlag = "sessionTipDismissed";

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
    if ((parsed as Record<string, unknown>).sessionTipDismissed === true) {
      state.sessionTipDismissed = true;
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

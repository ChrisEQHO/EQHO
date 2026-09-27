// Pure math for pausing/resuming the inter-track countdown. The player stores a
// wall-clock deadline while running and a remaining duration while held; these
// helpers are the single authority for converting between the two, so the
// displayed number, the visible-number timeouts and the next-track deadline can
// never disagree.

/** Remaining time to store when the countdown is held. Never negative. */
export function holdRemainingMs(deadline: number, now: number): number {
  return Math.max(0, deadline - now);
}

/** Number to show while held. A countdown that still has time left shows at least 1. */
export function heldDisplayValue(remainingMs: number): number {
  return Math.max(1, Math.ceil(remainingMs / 1000));
}

/** New deadline created only on resume, from the stored remaining time. */
export function resumeDeadline(heldMs: number, now: number): number {
  return now + Math.max(0, heldMs);
}

/**
 * The visible numbers still ahead after resuming with `heldMs` left, each with the
 * delay from resume at which it should appear. The number already on screen is
 * excluded, so nothing jumps or repeats.
 */
export function remainingVisibleSteps(heldMs: number): { value: number; delayMs: number }[] {
  const steps: { value: number; delayMs: number }[] = [];
  for (let value = Math.ceil(heldMs / 1000) - 1; value >= 1; value--) {
    steps.push({ value, delayMs: Math.max(0, heldMs - value * 1000) });
  }
  return steps;
}

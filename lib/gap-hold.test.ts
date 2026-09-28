import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { heldDisplayValue, holdRemainingMs, remainingVisibleSteps, resumeDeadline } from "./gap-hold";

// Drives the gap-hold helpers the same way EqhoPlayer does: a wall-clock deadline
// polled by a ticker, per-number timeouts, and a single-fire guard on the
// next-track transition. Hold clears the deadline and timeouts; resume re-anchors.
function createGap(gapSeconds: number, onNext: () => void) {
  let deadline: number | null = Date.now() + gapSeconds * 1000;
  let heldMs: number | null = null;
  let fired = false;
  let display = gapSeconds;
  let numberTimers: ReturnType<typeof setTimeout>[] = [];

  const clearNumbers = () => {
    numberTimers.forEach(clearTimeout);
    numberTimers = [];
  };
  const scheduleNumbers = (ms: number) => {
    clearNumbers();
    for (const { value, delayMs } of remainingVisibleSteps(ms)) {
      numberTimers.push(
        setTimeout(() => {
          if (heldMs == null && !fired) display = value;
        }, delayMs),
      );
    }
  };
  scheduleNumbers(gapSeconds * 1000);

  const ticker = setInterval(() => {
    if (fired || deadline == null) return;
    if (deadline - Date.now() <= 0) {
      fired = true;
      clearInterval(ticker);
      onNext();
    }
  }, 16);

  return {
    toggle() {
      if (fired) return;
      if (heldMs == null) {
        if (deadline == null) return;
        heldMs = holdRemainingMs(deadline, Date.now());
        deadline = null;
        clearNumbers();
        display = heldDisplayValue(heldMs);
      } else {
        deadline = resumeDeadline(heldMs, Date.now());
        scheduleNumbers(heldMs);
        heldMs = null;
      }
    },
    get display() {
      return display;
    },
    get held() {
      return heldMs;
    },
    dispose() {
      clearInterval(ticker);
      clearNumbers();
    },
  };
}

describe("gap-hold helpers", () => {
  it("stores the exact remaining time and never goes negative", () => {
    expect(holdRemainingMs(10_000, 6_750)).toBe(3_250);
    expect(holdRemainingMs(10_000, 12_000)).toBe(0);
  });

  it("shows at least 1 while held", () => {
    expect(heldDisplayValue(3_250)).toBe(4);
    expect(heldDisplayValue(200)).toBe(1);
    expect(heldDisplayValue(0)).toBe(1);
  });

  it("creates a new deadline from the remaining time, not the original one", () => {
    expect(resumeDeadline(3_250, 50_000)).toBe(53_250);
  });

  it("schedules only the numbers still ahead", () => {
    expect(remainingVisibleSteps(3_250)).toEqual([
      { value: 3, delayMs: 250 },
      { value: 2, delayMs: 1_250 },
      { value: 1, delayMs: 2_250 },
    ]);
    expect(remainingVisibleSteps(400)).toEqual([]);
  });
});

describe("countdown pause/resume", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("freezes on pause and never starts the next track while paused", () => {
    const onNext = vi.fn();
    const gap = createGap(5, onNext);
    vi.advanceTimersByTime(1_200);
    gap.toggle();
    expect(gap.held).toBe(3_800);
    expect(gap.display).toBe(4);

    vi.advanceTimersByTime(20_000);
    expect(onNext).not.toHaveBeenCalled();
    expect(gap.display).toBe(4);
    gap.dispose();
  });

  it("resumes from the stored remaining time", () => {
    const onNext = vi.fn();
    const gap = createGap(5, onNext);
    vi.advanceTimersByTime(1_200);
    gap.toggle();
    vi.advanceTimersByTime(30_000);
    gap.toggle();

    vi.advanceTimersByTime(3_700);
    expect(onNext).not.toHaveBeenCalled();
    expect(gap.display).toBe(1);
    vi.advanceTimersByTime(200);
    expect(onNext).toHaveBeenCalledTimes(1);
    gap.dispose();
  });

  it("handles several pause/resume cycles in one countdown", () => {
    const onNext = vi.fn();
    const gap = createGap(5, onNext);
    let running = 0;
    for (let i = 0; i < 4; i++) {
      vi.advanceTimersByTime(600);
      running += 600;
      gap.toggle();
      vi.advanceTimersByTime(5_000);
      gap.toggle();
    }
    expect(onNext).not.toHaveBeenCalled();
    vi.advanceTimersByTime(5_000 - running - 50);
    expect(onNext).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(onNext).toHaveBeenCalledTimes(1);
    gap.dispose();
  });

  it("holds with under one second left and completes after resume", () => {
    const onNext = vi.fn();
    const gap = createGap(3, onNext);
    vi.advanceTimersByTime(2_900);
    gap.toggle();
    expect(gap.display).toBe(1);
    vi.advanceTimersByTime(10_000);
    expect(onNext).not.toHaveBeenCalled();
    gap.toggle();
    vi.advanceTimersByTime(150);
    expect(onNext).toHaveBeenCalledTimes(1);
    gap.dispose();
  });

  it("starts the next track exactly once, ignoring toggles after completion", () => {
    const onNext = vi.fn();
    const gap = createGap(2, onNext);
    vi.advanceTimersByTime(2_100);
    gap.toggle();
    gap.toggle();
    vi.advanceTimersByTime(10_000);
    expect(onNext).toHaveBeenCalledTimes(1);
    gap.dispose();
  });
});

"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Lock, X } from "lucide-react";
import { DEVICE_LOCK_NOTE, GUIDE_STEPS, clampGuideStep, type GuideAction } from "@/lib/onboarding";

export function OnboardingGuide({
  cloudAvailable,
  onAction,
  onSkip,
  onComplete,
}: {
  cloudAvailable: boolean;
  onAction: (action: GuideAction) => void;
  onSkip: () => void;
  onComplete: () => void;
}) {
  const [index, setIndex] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const step = GUIDE_STEPS[index];
  const isFirst = index === 0;
  const isLast = index === GUIDE_STEPS.length - 1;
  const secondary =
    step.secondaryAction && (!step.secondaryAction.requiresCloud || cloudAvailable)
      ? step.secondaryAction
      : undefined;

  useEffect(() => {
    headingRef.current?.focus();
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSkip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSkip]);

  const go = (delta: number) => setIndex((i) => clampGuideStep(i + delta));

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="eqho-guide-title"
      aria-describedby="eqho-guide-body"
      className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[500] mx-auto flex max-w-md flex-col gap-3 rounded-2xl border border-[#ff4fa3]/30 bg-[#0b1020] p-4 shadow-2xl shadow-black/60 desktop:inset-x-auto desktop:right-6 desktop:top-6 desktop:w-[400px]"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#ff8a00]">
          Getting started <span className="sr-only">step</span> {index + 1} of {GUIDE_STEPS.length}
        </p>
        <button
          type="button"
          onClick={onSkip}
          className="-mr-2 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-white/60 transition hover:text-white"
        >
          Skip guide
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      <div className="flex gap-1" aria-hidden="true">
        {GUIDE_STEPS.map((s, i) => (
          <span
            key={s.id}
            className={`h-1 flex-1 rounded-full ${i <= index ? "bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00]" : "bg-white/10"}`}
          />
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <h2
          id="eqho-guide-title"
          ref={headingRef}
          tabIndex={-1}
          className="text-lg font-bold text-white text-balance outline-none"
        >
          {step.title}
        </h2>
        <p id="eqho-guide-body" className="text-sm leading-relaxed text-white/70 text-pretty">
          {step.body}
        </p>
      </div>

      {(step.action || secondary) && (
        <div className="flex flex-wrap gap-2">
          {step.action && (
            <button
              type="button"
              onClick={() => onAction(step.action!.kind)}
              className="min-h-11 flex-1 rounded-lg border border-[#ff4fa3]/40 bg-[#ff4fa3]/10 px-3 text-sm font-semibold text-[#ff8cc6] transition hover:bg-[#ff4fa3]/20"
            >
              {step.action.label}
            </button>
          )}
          {secondary && (
            <button
              type="button"
              onClick={() => onAction(secondary.kind)}
              className="min-h-11 flex-1 rounded-lg border border-white/15 bg-white/5 px-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
            >
              {secondary.label}
            </button>
          )}
        </div>
      )}

      <p className="flex items-start gap-2 rounded-lg border border-[#ff8a00]/30 bg-[#ff8a00]/[0.08] px-3 py-2 text-xs leading-relaxed text-[#ffcf99]">
        <Lock size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
        {DEVICE_LOCK_NOTE}
      </p>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={isFirst}
          className="inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-white/70 transition hover:text-white disabled:opacity-30"
        >
          <ChevronLeft size={16} aria-hidden="true" />
          Back
        </button>
        <button
          type="button"
          onClick={isLast ? onComplete : () => go(1)}
          className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-5 text-sm font-bold text-white transition active:scale-[0.99]"
        >
          {isLast ? "Finish" : "Next"}
          {!isLast && <ChevronRight size={16} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}

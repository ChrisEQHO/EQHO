/*
 * Gradient action buttons, modelled on the "EQHO Player Trial" pill: a
 * horizontal gradient, a soft outer glow in the button's own hue, and a thin
 * top highlight for depth. All three share identical interaction states so
 * they feel like one family:
 *   hover    → brighter, stronger glow
 *   pressed  → slightly darker, glow tightens, 1px press-down
 *   focus    → 2px ring in the button's hue, offset from the dark panel
 *   disabled → gradient and glow removed, muted neutral fill
 */
const GRADIENT_ACTION_BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-md font-semibold bg-linear-to-r transition-[filter,box-shadow,transform] duration-150 hover:brightness-110 active:translate-y-px active:brightness-95 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070d1a] disabled:cursor-not-allowed disabled:bg-none disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none disabled:brightness-100 disabled:translate-y-0";

/** Add playlist / music folder. Dark text gives the strongest contrast on cyan. */
export const ADD_MUSIC_BTN = `${GRADIENT_ACTION_BASE} from-[#22d3ee] to-[#2dd4bf] text-[#051322] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_0_12px_rgba(34,211,238,0.4)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_0_18px_rgba(34,211,238,0.55)] active:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_0_8px_rgba(34,211,238,0.35)] focus-visible:ring-cyan-200`;

/**
 * Open. EQHO teal easing into a rich emerald, with a restrained glow so it
 * reads as "ready to use" rather than a success badge. Dark navy text stays
 * above 7:1 across the fill.
 */
export const OPEN_BTN = `${GRADIENT_ACTION_BASE} from-[#1cc7c1] to-[#12a37a] text-[#04142a] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_1px_2px_rgba(0,0,0,0.35),0_0_10px_rgba(24,178,160,0.22)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_1px_2px_rgba(0,0,0,0.35),0_0_14px_rgba(24,178,160,0.32)] active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2),0_0_6px_rgba(24,178,160,0.2)] focus-visible:ring-[#7fe3d2]`;

/**
 * Add to session. EQHO violet into a controlled warm magenta. Both ends are
 * deep enough that white text/icon stay above 4.5:1 across the fill.
 */
export const SESSION_BTN = `${GRADIENT_ACTION_BASE} from-[#7440e0] to-[#b8327e] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_1px_2px_rgba(0,0,0,0.35),0_0_10px_rgba(124,64,224,0.25)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_1px_2px_rgba(0,0,0,0.35),0_0_14px_rgba(124,64,224,0.35)] active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.25),0_0_6px_rgba(124,64,224,0.22)] focus-visible:ring-[#b9a2f5]`;

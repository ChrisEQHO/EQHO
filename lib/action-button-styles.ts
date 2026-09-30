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

/** Open. Dark text stays above 7:1 across the whole orange range. */
export const OPEN_BTN = `${GRADIENT_ACTION_BASE} from-[#ffb347] to-[#ff7a00] text-[#1a0b00] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_0_12px_rgba(255,138,0,0.4)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_0_18px_rgba(255,138,0,0.55)] active:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_0_8px_rgba(255,138,0,0.35)] focus-visible:ring-[#ffc27a]`;

/**
 * Add to session. Kept on white text/icon (the session colour convention);
 * the coral end is deep enough that white text stays legible across the fill.
 */
export const SESSION_BTN = `${GRADIENT_ACTION_BASE} from-[#e8456b] to-[#c2127a] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_0_12px_rgba(214,40,120,0.45)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0_18px_rgba(214,40,120,0.6)] active:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_0_8px_rgba(214,40,120,0.4)] focus-visible:ring-[#ff7eb6]`;

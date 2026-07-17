/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // Tailwind v4 runs first and generates the stylesheet. Its output targets
    // very modern browsers only: every utility is wrapped in `@layer`, theme
    // colors use `oklch()`, and opacity utilities use `color-mix()`. Older iPad
    // Safari (< 16.4, and especially < 15.4) cannot parse these — an unknown
    // `@layer` block is discarded wholesale, which throws away ALL Tailwind
    // styles and renders the app as raw, unstyled HTML.
    '@tailwindcss/postcss': {},
    // postcss-preset-env then downlevels that output for the browsers listed in
    // the "browserslist" field of package.json. The features below are the ones
    // that actually break old iPads:
    //   - cascade-layers: flattens `@layer` so styles are NOT discarded
    //   - oklab-function: emits rgb() fallbacks for oklch() colors
    //   - color-mix:      emits fallbacks for color-mix() opacity utilities
    // `preserve: true` keeps the modern syntax alongside the fallback, so newer
    // iPhones/iPads/desktops are visually unchanged and only gain a fallback.
    'postcss-preset-env': {
      features: {
        'cascade-layers': true,
        'oklab-function': { preserve: true },
        'color-mix': { preserve: true },
        'color-functional-notation': { preserve: true },
      },
    },
  },
}

export default config

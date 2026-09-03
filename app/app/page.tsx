import { EqhoPlayerClient } from "@/components/player/eqho-player-client";

// The production player. It is mounted CLIENT-ONLY (via <EqhoPlayerClient />,
// which wraps <EqhoPlayer /> in next/dynamic with ssr:false) for the same reason
// the public /features demo does: the ~10k-line browser-first player must not be
// server-rendered and hydrated, or the SSR/client divergence surfaces as a
// minified React hydration crash on /app. demoMode defaults to false here, so
// this is the full authenticated player.
export default function Page() {
  return <EqhoPlayerClient />;
}

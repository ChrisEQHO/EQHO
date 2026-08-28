import { EqhoPlayer } from "@/components/player/eqho-player";

// The production player. This is a thin wrapper around the shared <EqhoPlayer />
// component so the exact same player can also be rendered in read-only demo mode
// on the public /features page. Production behaviour is unchanged: demoMode
// defaults to false, giving the full authenticated player.
export default function Page() {
  return <EqhoPlayer />;
}

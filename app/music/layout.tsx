import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { canAccessMusic } from "@/lib/music/access"
import { MusicStoreProvider } from "@/components/music/music-store"
import { MusicHeader } from "@/components/music/music-header"
import { MusicPlayerBar } from "@/components/music/music-player-bar"
import { MusicFooter } from "@/components/music/music-footer"

// EQHO Music is an unreleased, hidden area. Keep it out of search engines even
// for allowlisted viewers.
export const metadata: Metadata = {
  title: "EQHO Music",
  robots: { index: false, follow: false },
}

// SECRECY GATE (spec §3/§4). This server component decides, before any Music UI
// is sent to the browser, whether the caller is allowed to see EQHO Music at
// all. Anyone who is not allowed gets a genuine 404 (notFound), so the entire
// area is indistinguishable from a route that does not exist. The auth
// middleware lists /music as "public" purely so it does not 307 to /login
// (which would leak the area's existence); real access control lives here.
export default async function MusicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let email: string | null = null
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    email = user?.email ?? null
  } catch {
    email = null
  }

  if (!canAccessMusic(email)) {
    notFound()
  }

  return (
    <MusicStoreProvider>
      <div className="min-h-screen bg-[#050414] text-white flex flex-col">
        <MusicHeader />
        <main className="flex-1 pb-32">{children}</main>
        <MusicFooter />
        <MusicPlayerBar />
      </div>
    </MusicStoreProvider>
  )
}

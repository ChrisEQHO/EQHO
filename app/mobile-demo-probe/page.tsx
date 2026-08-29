"use client"

import { useEffect, useState } from "react"
import { DemoPlayerLazy } from "@/components/marketing/demo-player-lazy"

// TEMPORARY diagnostic page. Patches fetch so /api/demo returns a seeded snapshot
// locally (this env has no published R2 snapshot), letting us see the REAL mobile
// player layout inside the embed. Deleted after verification.
const SNAPSHOT = {
  enabled: true,
  playlists: [
    {
      id: "ndp",
      name: "NDP GROUP",
      tracks: [
        { id: "t1", name: "AMY & SOPHIE", durationSeconds: 120 },
        { id: "t2", name: "JAKE & AMELIA", durationSeconds: 120 },
        { id: "t3", name: "JESS & LIV", durationSeconds: 120 },
      ],
    },
    {
      id: "dev",
      name: "DEV GROUP",
      tracks: [
        { id: "t4", name: "ROUTINE ONE", durationSeconds: 120 },
        { id: "t5", name: "ROUTINE TWO", durationSeconds: 120 },
      ],
    },
    { id: "fig", name: "FIG GROUP", tracks: [{ id: "t6", name: "FLOOR SET", durationSeconds: 150 }] },
  ],
}

export default function MobileDemoProbePage() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const orig = window.fetch
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString()
      if (url.includes("/api/demo") && !url.includes("action=audio")) {
        return new Response(JSON.stringify(SNAPSHOT), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      }
      return orig(input, init)
    }
    setReady(true)
    return () => {
      window.fetch = orig
    }
  }, [])
  if (!ready) return null
  return (
    <main>
      <DemoPlayerLazy />
      <section style={{ height: 400 }} className="flex items-center justify-center text-white/60">
        Ready to set up your own sessions?
      </section>
    </main>
  )
}

"use client"

import { useEffect, useState } from "react"
import { DemoPlayerLazy } from "@/components/marketing/demo-player-lazy"

// TEMPORARY diagnostic page. Patches fetch so /api/demo returns a seeded snapshot
// locally (this env has no published R2 snapshot), letting us drive the REAL
// mobile player inside the embed. Deleted after verification.
const SNAPSHOT = {
  enabled: true,
  playlists: [
    {
      id: "p1",
      name: "NDP GROUP",
      tracks: [
        { id: "p1-t1", name: "GRACE, BEA & ZARA", durationSeconds: 120 },
        { id: "p1-t2", name: "JULIE, SOPHIA & LILLY", durationSeconds: 120 },
        { id: "p1-t3", name: "NICK & JOSH", durationSeconds: 120 },
      ],
    },
    {
      id: "p2",
      name: "DEV GROUP",
      tracks: [
        { id: "p2-t1", name: "AMY & SOPHIE", durationSeconds: 120 },
        { id: "p2-t2", name: "JAKE & AMELIA", durationSeconds: 120 },
        { id: "p2-t3", name: "JESS & LIV", durationSeconds: 120 },
      ],
    },
    {
      id: "p3",
      name: "FIG GROUP",
      tracks: [
        { id: "p3-t1", name: "CHARLOTTE, EMMA & ROSIE", durationSeconds: 120 },
        { id: "p3-t2", name: "DANIEL & SOPHIA", durationSeconds: 120 },
        { id: "p3-t3", name: "EVIE & OLIVIA", durationSeconds: 120 },
      ],
    },
  ],
}

export default function MobileDemoProbePage() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const orig = window.fetch
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString()
      if (url.includes("/api/demo")) {
        if (url.includes("action=audio")) {
          return new Response(new Blob([], { type: "audio/mpeg" }), { status: 200 })
        }
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
      <div style={{ height: 240 }} className="flex items-center justify-center text-white/40">
        (probe: page content above the demo)
      </div>
      <DemoPlayerLazy />
      <section id="below-marker" style={{ height: 500 }} className="flex items-center justify-center text-white/60">
        Ready to set up your own sessions?
      </section>
    </main>
  )
}

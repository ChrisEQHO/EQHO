"use client"

// Download-only preview surface for the static EQHO Player advert.
// Not linked from the site nav and it changes nothing about the existing
// site or player. It shows the 1080x1350 advert scaled to fit the screen and
// exports ONLY the advert node (never this page, controls, or margins) as a
// high-quality 1080x1350 JPG.
import { useCallback, useEffect, useRef, useState } from "react"
import { toJpeg } from "html-to-image"
import { EqhoAdvert } from "@/components/advert/eqho-advert"

const ADVERT_W = 1080
const ADVERT_H = 1350

export default function AdvertPreviewPage() {
  const [scale, setScale] = useState(0.5)
  const [downloading, setDownloading] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)

  // Fit the advert within the viewport (leaving room for the button/heading).
  useEffect(() => {
    const fit = () => {
      const maxW = window.innerWidth - 48
      const maxH = window.innerHeight - 220
      setScale(Math.min(maxW / ADVERT_W, maxH / ADVERT_H, 0.62))
    }
    fit()
    window.addEventListener("resize", fit, { passive: true })
    return () => window.removeEventListener("resize", fit)
  }, [])

  const handleDownload = useCallback(async () => {
    const node = document.getElementById("eqho-advert")
    if (!node) return
    setDownloading(true)
    try {
      // Render the node at its true 1080x1350 layout size, ignoring the
      // preview scale applied to its ancestor.
      const dataUrl = await toJpeg(node, {
        width: ADVERT_W,
        height: ADVERT_H,
        quality: 0.96,
        pixelRatio: 1,
        cacheBust: true,
        backgroundColor: "#020617",
        style: { transform: "none", margin: "0" },
      })
      const link = document.createElement("a")
      link.download = "eqho-player-advert-1080x1350.jpg"
      link.href = dataUrl
      link.click()
    } finally {
      setDownloading(false)
    }
  }, [])

  return (
    <main className="flex min-h-screen w-full flex-col items-center gap-6 bg-[#020617] px-6 py-8">
      <p className="text-sm text-white/60">
        Preview only — the download saves just the advert as a 1080 × 1350 JPG.
      </p>

      {/* Scaled preview. The stage keeps the true pixel size so the export is
          full resolution; the inner wrapper is only visually scaled. */}
      <div
        ref={stageRef}
        className="relative"
        style={{ width: ADVERT_W * scale, height: ADVERT_H * scale }}
      >
        <div
          style={{
            width: ADVERT_W,
            height: ADVERT_H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <EqhoAdvert />
        </div>
      </div>

      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-8 text-base font-semibold text-white shadow-[0_10px_30px_rgba(255,105,60,0.4)] transition-opacity hover:opacity-95 disabled:opacity-60"
      >
        {downloading ? "Preparing JPG…" : "Download as JPG"}
      </button>
    </main>
  )
}

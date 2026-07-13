"use client"

import { useState } from "react"
import { Mail, Send, Loader2, CheckCircle2, AlertCircle, Bug, MessageSquare, Lightbulb, HelpCircle } from "lucide-react"

const CATEGORIES = [
  { id: "issue", label: "Report an Issue", icon: Bug, hint: "Something isn't working right" },
  { id: "feedback", label: "Feedback", icon: MessageSquare, hint: "Share your thoughts" },
  { id: "feature", label: "Feature Request", icon: Lightbulb, hint: "Suggest an improvement" },
  { id: "other", label: "Other", icon: HelpCircle, hint: "Anything else" },
] as const

export function ContactPage({ userEmail }: { userEmail?: string | null }) {
  const [category, setCategory] = useState<string>("issue")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  const canSend = message.trim().length > 0 && status !== "sending" && !!userEmail

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSend) return
    setStatus("sending")
    setErrorMsg("")
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, subject, message }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setStatus("error")
        setErrorMsg(data.error || "Something went wrong. Please try again.")
        return
      }
      setStatus("success")
      setSubject("")
      setMessage("")
    } catch {
      setStatus("error")
      setErrorMsg("Network error. Please check your connection and try again.")
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-5">
          <CheckCircle2 size={32} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Message sent</h2>
        <p className="text-white/60 max-w-sm mb-6 leading-relaxed">
          {"Thanks for reaching out. We've received your message and will reply to "}
          <span className="text-white/90 font-medium">{userEmail}</span>
          {" as soon as we can."}
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] hover:opacity-90 transition"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 max-w-2xl">
      {/* Intro */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <p className="text-white/70 leading-relaxed">
          {"This is where you can report issues, submit bugs, and share feedback or feature ideas. "}
          {"Fill in the form below and your message will be sent straight to our team at "}
          <span className="text-[#ff8a00] font-semibold">info@eqho-player.com</span>
          {". We'll reply directly to your account email."}
        </p>
      </div>

      {/* Category picker */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-3">What&apos;s this about?</label>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const active = category === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                  active
                    ? "border-[#ff4fa3]/60 bg-gradient-to-br from-[#ff4fa3]/15 to-[#ff8a00]/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <div
                  className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                    active ? "bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] text-white" : "bg-white/10 text-white/60"
                  }`}
                >
                  <Icon size={16} />
                </div>
                <div>
                  <div className={`text-sm font-semibold ${active ? "text-white" : "text-white/80"}`}>{cat.label}</div>
                  <div className="text-[11px] text-white/45">{cat.hint}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* From (read-only) */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Your email</label>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <Mail size={16} className="text-white/40 shrink-0" />
          <span className="text-sm text-white/80 truncate">{userEmail || "Not signed in"}</span>
        </div>
        <p className="mt-1.5 text-[11px] text-white/40">We&apos;ll use this address to reply to you.</p>
      </div>

      {/* Subject */}
      <div>
        <label htmlFor="contact-subject" className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">
          Subject <span className="text-white/30 normal-case font-normal">(optional)</span>
        </label>
        <input
          id="contact-subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Brief summary"
          maxLength={140}
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#ff4fa3]/50 focus:outline-none transition"
        />
      </div>

      {/* Message */}
      <div>
        <label htmlFor="contact-message" className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">
          Message
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your issue, feedback, or idea in as much detail as you can..."
          rows={6}
          maxLength={5000}
          className="w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#ff4fa3]/50 focus:outline-none transition leading-relaxed"
        />
        <div className="mt-1 text-right text-[11px] text-white/30">{message.length}/5000</div>
      </div>

      {/* Error */}
      {status === "error" && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {!userEmail && (
        <div className="flex items-center gap-2 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
          <AlertCircle size={16} className="shrink-0" />
          <span>Please sign in to send a message.</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSend}
        className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 font-semibold text-white bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {status === "sending" ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Sending...
          </>
        ) : (
          <>
            <Send size={18} /> Send message
          </>
        )}
      </button>
    </form>
  )
}

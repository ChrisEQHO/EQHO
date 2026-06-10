"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Check, Crown, Loader2, Music, Sparkles, CloudUpload, Headphones, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

function SubscriptionSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    async function verifySubscription() {
      try {
        const supabase = createClient();
        if (!supabase) {
          // No Supabase connection - still show success UI
          setIsLoading(false);
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUserName(user.email?.split("@")[0] || "there");
          
          // Update profile to mark as pro if needed
          if (sessionId) {
            await supabase
              .from("profiles")
              .update({ 
                subscription_status: "active",
              })
              .eq("id", user.id);
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Error verifying subscription:", err);
        // Still show success - don't block the user
        setIsLoading(false);
      }
    }

    verifySubscription();
  }, [sessionId]);

  const proFeatures = [
    { icon: CloudUpload, label: "Unlimited Cloud Storage", description: "Store all your routines in the cloud" },
    { icon: Music, label: "Unlimited Playlists", description: "Create as many playlists as you need" },
    { icon: Headphones, label: "Cross-Device Sync", description: "Access from web, desktop, mobile & tablet" },
    { icon: Clock, label: "Advanced Session Controls", description: "Full control over gaps, countdown & more" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#ff4fa3] animate-spin mx-auto mb-4" />
          <p className="text-white/70">Activating your subscription...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">!</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-white/60 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-semibold hover:shadow-[0_0_24px_rgba(255,79,163,0.25)] transition"
          >
            Return to EQHO Player
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 overflow-hidden">
      {/* Background gradient effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#ff4fa3]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#ff8a00]/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Success Card */}
        <div className="bg-[rgba(9,15,28,0.96)] border border-white/10 rounded-3xl p-8 backdrop-blur-sm shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="/eqho-logo.png"
              alt="EQHO"
              width={120}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </div>

          {/* Success Icon */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] rounded-full animate-pulse opacity-30" />
            <div className="relative w-full h-full bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] rounded-full flex items-center justify-center">
              <Check className="w-10 h-10 text-white" strokeWidth={3} />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-[#ff8a00]" />
              <span className="text-sm font-semibold text-[#ff8a00] uppercase tracking-wide">Pro Activated</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome to EQHO Pro{userName ? `, ${userName}` : ""}!
            </h1>
            <p className="text-white/60">
              Your subscription is now active. Enjoy unlimited access to all Pro features.
            </p>
          </div>

          {/* Features List */}
          <div className="space-y-3 mb-8">
            {proFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ff4fa3]/20 to-[#ff8a00]/20 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-[#ff8a00]" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{feature.label}</p>
                  <p className="text-white/50 text-xs">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Sparkles decoration */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="w-4 h-4 text-[#ff4fa3]" />
            <span className="text-xs text-white/40">All features unlocked</span>
            <Sparkles className="w-4 h-4 text-[#ff8a00]" />
          </div>

          {/* CTA Button */}
          <Link
            href="/"
            className="block w-full py-4 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white text-center font-semibold hover:shadow-[0_0_24px_rgba(255,79,163,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Start Using EQHO Pro
          </Link>

          {/* Help text */}
          <p className="text-center text-xs text-white/40 mt-4">
            Need help? Contact{" "}
            <a href="mailto:support@eqho.app" className="text-[#ff4fa3] hover:underline">
              support@eqho.app
            </a>
          </p>
        </div>

        {/* Confetti-like decorations */}
        <div className="absolute -top-4 -left-4 w-3 h-3 bg-[#ff4fa3] rounded-full opacity-60 animate-bounce" style={{ animationDelay: "0s" }} />
        <div className="absolute -top-2 right-8 w-2 h-2 bg-[#ff8a00] rounded-full opacity-60 animate-bounce" style={{ animationDelay: "0.2s" }} />
        <div className="absolute top-12 -right-3 w-2.5 h-2.5 bg-[#ff4fa3] rounded-full opacity-60 animate-bounce" style={{ animationDelay: "0.4s" }} />
        <div className="absolute -bottom-2 left-12 w-2 h-2 bg-[#ff8a00] rounded-full opacity-60 animate-bounce" style={{ animationDelay: "0.3s" }} />
        <div className="absolute bottom-8 -right-2 w-3 h-3 bg-[#ff4fa3] rounded-full opacity-60 animate-bounce" style={{ animationDelay: "0.1s" }} />
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-[#ff4fa3] animate-spin mx-auto mb-4" />
        <p className="text-white/70">Loading...</p>
      </div>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SubscriptionSuccessContent />
    </Suspense>
  );
}

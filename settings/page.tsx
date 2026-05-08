"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { SettingsHeader } from "@/components/settings/settings-header"
import { ProfileSection } from "@/components/settings/profile-section"
import { AccountSettings } from "@/components/settings/account-settings"
import { AudioPreferences } from "@/components/settings/audio-preferences"
import { SubscriptionPlans } from "@/components/settings/subscription-plans"
import { BillingHistory } from "@/components/settings/billing-history"
import { UsageOverview } from "@/components/settings/usage-overview"

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activePage="settings" />

      {/* Main Content */}
      <main className="flex-1 overflow-auto custom-scrollbar">
        {/* Waveform Background Accents */}
        <div className="pointer-events-none fixed right-0 top-0 h-64 w-64 opacity-30">
          <svg viewBox="0 0 200 200" className="h-full w-full waveform-accent">
            <path
              d="M20 100 Q40 60 60 100 Q80 140 100 100 Q120 60 140 100 Q160 140 180 100"
              stroke="#FF4DA6"
              strokeWidth="2"
              fill="none"
              opacity="0.3"
            />
            <path
              d="M20 120 Q40 80 60 120 Q80 160 100 120 Q120 80 140 120 Q160 160 180 120"
              stroke="#00C896"
              strokeWidth="2"
              fill="none"
              opacity="0.2"
            />
          </svg>
        </div>

        <div className="p-4 pt-16 lg:p-8 lg:pt-8">
          <div className="mx-auto max-w-7xl">
            <SettingsHeader />

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
              {/* Main Content - Left 2 columns */}
              <div className="space-y-6 lg:col-span-2 lg:space-y-8">
                <ProfileSection />
                <AccountSettings />
                <AudioPreferences />
                <SubscriptionPlans />
                <BillingHistory />

                {/* Bottom Info Card */}
                <div className="rounded-xl border border-eqho-blue/20 bg-gradient-to-r from-eqho-blue/10 via-eqho-green/5 to-eqho-pink/10 p-6">
                  <p className="text-center text-sm text-muted-foreground">
                    <span className="font-semibold text-eqho-blue">EQHO Pro</span> unlocks unlimited creative workflow tools for competition music.
                  </p>
                </div>
              </div>

              {/* Right Sidebar - Usage Overview */}
              <div className="lg:col-span-1">
                <div className="sticky top-8">
                  <UsageOverview />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

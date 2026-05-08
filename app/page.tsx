import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RecentRoutines } from "@/components/dashboard/recent-routines"
import { PopularTemplates } from "@/components/dashboard/popular-templates"
import { RecentExports } from "@/components/dashboard/recent-exports"
import { ActivityFeed } from "@/components/dashboard/activity-feed"

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <Header />

        {/* Dashboard Content */}
        <main className="relative flex-1 overflow-auto custom-scrollbar">
          {/* Waveform Background Accents */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {/* Top-right waveform accent */}
            <svg
              className="absolute -right-20 -top-10 h-64 w-96 opacity-[0.03] waveform-accent"
              viewBox="0 0 200 80"
              preserveAspectRatio="none"
            >
              <path
                d="M0,40 Q10,20 20,40 Q30,60 40,40 Q50,20 60,40 Q70,60 80,40 Q90,20 100,40 Q110,60 120,40 Q130,20 140,40 Q150,60 160,40 Q170,20 180,40 Q190,60 200,40"
                fill="none"
                stroke="url(#wave-gradient-1)"
                strokeWidth="3"
              />
              <defs>
                <linearGradient id="wave-gradient-1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FF4DA6" />
                  <stop offset="100%" stopColor="#00C896" />
                </linearGradient>
              </defs>
            </svg>

            {/* Bottom-left waveform accent */}
            <svg
              className="absolute -bottom-10 -left-20 h-48 w-80 opacity-[0.03] waveform-accent"
              viewBox="0 0 200 60"
              preserveAspectRatio="none"
              style={{ animationDelay: "2s" }}
            >
              <path
                d="M0,30 Q10,15 20,30 Q30,45 40,30 Q50,15 60,30 Q70,45 80,30 Q90,15 100,30 Q110,45 120,30 Q130,15 140,30 Q150,45 160,30 Q170,15 180,30 Q190,45 200,30"
                fill="none"
                stroke="url(#wave-gradient-2)"
                strokeWidth="2"
              />
              <defs>
                <linearGradient id="wave-gradient-2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3D8BFF" />
                  <stop offset="100%" stopColor="#00C896" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Content */}
          <div className="relative px-4 py-6 lg:px-6 lg:py-8">
            <div className="mx-auto max-w-7xl space-y-6 lg:space-y-8">
              {/* Stats Cards */}
              <StatsCards />

              {/* Main Grid */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - Recent Routines */}
                <div className="lg:col-span-2">
                  <RecentRoutines />
                </div>

                {/* Right Column - Activity Feed */}
                <div>
                  <ActivityFeed />
                </div>
              </div>

              {/* Bottom Section */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Popular Templates */}
                <PopularTemplates />

                {/* Recent Exports */}
                <RecentExports />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

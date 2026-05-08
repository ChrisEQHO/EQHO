"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { AssetsHeader } from "@/components/assets/assets-header"
import { AssetsFilters } from "@/components/assets/assets-filters"
import { QuickAccessFolders } from "@/components/assets/quick-access-folders"
import { AssetsTable } from "@/components/assets/assets-table"
import { RecentUploads } from "@/components/assets/recent-uploads"
import { AssetDetailsPanel } from "@/components/assets/asset-details-panel"
import { Lightbulb } from "lucide-react"

export default function AssetsPage() {
  const [selectedAsset, setSelectedAsset] = useState<string | null>("cosmic-energy")
  const [showDetailsPanel, setShowDetailsPanel] = useState(true)

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activePage="asset-library" />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden lg:ml-0">
        {/* Waveform Background Accents */}
        <div className="pointer-events-none fixed right-0 top-0 h-96 w-96 opacity-30">
          <div className="waveform-accent absolute inset-0 bg-gradient-to-bl from-eqho-pink/10 via-transparent to-transparent" />
        </div>
        <div className="pointer-events-none fixed bottom-0 left-64 h-64 w-64 opacity-20">
          <div className="waveform-accent absolute inset-0 bg-gradient-to-tr from-eqho-green/10 via-transparent to-transparent" />
        </div>

        <div className="flex h-screen">
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8 pt-16 lg:pt-8">
            <div className="mx-auto max-w-7xl space-y-6 lg:space-y-8">
              <AssetsHeader />
              <AssetsFilters />
              <QuickAccessFolders />
              <AssetsTable 
                selectedAsset={selectedAsset} 
                onSelectAsset={(id) => {
                  setSelectedAsset(id)
                  setShowDetailsPanel(true)
                }} 
              />
              <RecentUploads />

              {/* Bottom Info Card */}
              <div className="rounded-xl border border-border/50 bg-gradient-to-r from-eqho-blue/5 via-eqho-green/5 to-eqho-pink/5 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-eqho-blue/10">
                    <Lightbulb className="h-5 w-5 text-eqho-blue" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Organise Your Assets</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Organise your routine music and reuse assets across projects. Upload once, use everywhere.
                      Tag your files for easy discovery and let AI detect BPM and key automatically.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side Panel - Asset Details */}
          {showDetailsPanel && selectedAsset && (
            <AssetDetailsPanel 
              assetId={selectedAsset} 
              onClose={() => setShowDetailsPanel(false)} 
            />
          )}
        </div>
      </main>
    </div>
  )
}

"use client"

import { useState, useCallback } from "react"
import { Upload, Music, FileAudio } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function UploadZone() {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    // Simulate upload progress
    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null || prev >= 100) {
          clearInterval(interval)
          setTimeout(() => setUploadProgress(null), 1000)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }, [])

  const handleBrowseClick = () => {
    // Simulate upload progress
    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null || prev >= 100) {
          clearInterval(interval)
          setTimeout(() => setUploadProgress(null), 1000)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300",
        isDragging
          ? "border-eqho-pink bg-eqho-pink/5 shadow-lg shadow-eqho-pink/20"
          : "border-border/50 bg-card/30 hover:border-eqho-blue/50 hover:bg-card/50",
        uploadProgress !== null && "border-eqho-green bg-eqho-green/5"
      )}
    >
      {/* Glowing border effect when dragging */}
      {isDragging && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-eqho-pink/20 via-eqho-green/10 to-eqho-blue/20 animate-pulse" />
      )}

      <div className="relative z-10">
        {/* Upload Icon */}
        <div className={cn(
          "mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl transition-all duration-300",
          isDragging
            ? "bg-gradient-to-br from-eqho-pink to-eqho-blue shadow-lg shadow-eqho-pink/30"
            : "bg-gradient-to-br from-eqho-blue/20 to-eqho-green/20"
        )}>
          {uploadProgress !== null ? (
            <FileAudio className="h-10 w-10 text-eqho-green animate-pulse" />
          ) : (
            <Upload className={cn(
              "h-10 w-10 transition-all duration-300",
              isDragging ? "text-white scale-110" : "text-eqho-blue"
            )} />
          )}
        </div>

        {/* Text */}
        {uploadProgress !== null ? (
          <div className="space-y-4">
            <p className="text-lg font-semibold text-foreground">Uploading...</p>
            {/* Progress Bar */}
            <div className="mx-auto max-w-xs">
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-gradient-to-r from-eqho-pink via-eqho-green to-eqho-blue transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{uploadProgress}%</p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xl font-semibold text-foreground">
              {isDragging ? "Drop your files here" : "Drop MP3 or WAV files here"}
            </p>
            <p className="mt-2 text-muted-foreground">
              or click to browse from your device
            </p>

            {/* Browse Button */}
            <Button
              onClick={handleBrowseClick}
              className="mt-6 gap-2 bg-gradient-to-r from-eqho-pink to-eqho-blue text-white shadow-lg shadow-eqho-pink/20 transition-all duration-200 hover:opacity-90 hover:shadow-xl hover:shadow-eqho-pink/30 hover:scale-[1.02]"
            >
              <Music className="h-4 w-4" />
              Browse Files
            </Button>

            {/* File Info */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 rounded-full bg-secondary/50 px-3 py-1">
                <FileAudio className="h-3 w-3" />
                MP3, WAV
              </span>
              <span className="rounded-full bg-secondary/50 px-3 py-1">
                Max 100MB per file
              </span>
              <span className="rounded-full bg-secondary/50 px-3 py-1">
                Up to 10 files at once
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

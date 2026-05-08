"use client"

import { Edit2, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function ProfileSection() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-6 hover-lift">
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        {/* Profile Image */}
        <div className="relative group">
          <Avatar className="h-20 w-20 border-2 border-eqho-blue/30 transition-all duration-200 group-hover:border-eqho-blue/50">
            <AvatarImage src="/avatars/user.jpg" alt="Profile" />
            <AvatarFallback className="bg-gradient-to-br from-eqho-pink/20 to-eqho-blue/20 text-xl font-semibold text-foreground">
              JD
            </AvatarFallback>
          </Avatar>
          <button className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-eqho-blue text-white shadow-lg shadow-eqho-blue/30 transition-all duration-200 hover:scale-110 hover:bg-eqho-blue/90">
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-foreground">Jordan Davis</h2>
            <span className="rounded-full bg-gradient-to-r from-eqho-pink/20 to-eqho-blue/20 px-3 py-1 text-xs font-medium text-eqho-blue">
              Pro Member
            </span>
          </div>
          <p className="text-sm text-muted-foreground">jordan.davis@email.com</p>
          <p className="text-xs text-muted-foreground">Coach / Music Editor</p>
        </div>

        {/* Edit Button */}
        <Button
          variant="outline"
          className="gap-2 border-border/50 bg-secondary/50 text-foreground transition-all duration-200 hover:bg-secondary hover:border-eqho-blue/30"
        >
          <Edit2 className="h-4 w-4" />
          Edit Profile
        </Button>
      </div>
    </div>
  )
}

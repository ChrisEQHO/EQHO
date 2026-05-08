"use client"

import { useState } from "react"
import { User, Mail, Lock, Globe, Bell, Moon, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

export function AccountSettings() {
  const [darkMode, setDarkMode] = useState(true)
  const [autosave, setAutosave] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)

  return (
    <div className="rounded-xl border border-border/50 bg-card p-6 hover-lift">
      <h3 className="mb-6 text-lg font-semibold text-foreground">Account Settings</h3>

      <div className="space-y-6">
        {/* Full Name */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <User className="h-4 w-4 text-eqho-blue" />
            Full Name
          </label>
          <Input
            defaultValue="Jordan Davis"
            className="border-border/50 bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:border-eqho-blue/50 focus:ring-eqho-blue/20"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Mail className="h-4 w-4 text-eqho-green" />
            Email Address
          </label>
          <Input
            type="email"
            defaultValue="jordan.davis@email.com"
            className="border-border/50 bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:border-eqho-blue/50 focus:ring-eqho-blue/20"
          />
        </div>

        {/* Password Reset */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Lock className="h-4 w-4 text-eqho-pink" />
            Password
          </label>
          <div className="flex items-center gap-3">
            <Input
              type="password"
              defaultValue="••••••••••••"
              disabled
              className="flex-1 border-border/50 bg-secondary/30 text-muted-foreground"
            />
            <Button
              variant="outline"
              className="border-border/50 bg-secondary/50 text-foreground transition-all duration-200 hover:bg-secondary hover:border-eqho-pink/30"
            >
              Reset Password
            </Button>
          </div>
        </div>

        {/* Timezone */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Globe className="h-4 w-4 text-eqho-blue" />
            Timezone
          </label>
          <select className="w-full rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 text-sm text-foreground focus:border-eqho-blue/50 focus:outline-none focus:ring-2 focus:ring-eqho-blue/20">
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="Europe/London">London (GMT)</option>
            <option value="Europe/Paris">Paris (CET)</option>
            <option value="Asia/Tokyo">Tokyo (JST)</option>
          </select>
        </div>

        {/* Notification Preferences */}
        <div className="space-y-4 border-t border-border/30 pt-6">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Bell className="h-4 w-4 text-eqho-green" />
            Notification Preferences
          </label>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
                className="data-[state=checked]:bg-eqho-green"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Push Notifications</p>
                <p className="text-xs text-muted-foreground">Browser push notifications</p>
              </div>
              <Switch
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
                className="data-[state=checked]:bg-eqho-green"
              />
            </div>
          </div>
        </div>

        {/* Dark Mode & Autosave */}
        <div className="space-y-4 border-t border-border/30 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-eqho-blue/10">
                <Moon className="h-4 w-4 text-eqho-blue" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Dark Mode</p>
                <p className="text-xs text-muted-foreground">Use dark theme throughout</p>
              </div>
            </div>
            <Switch
              checked={darkMode}
              onCheckedChange={setDarkMode}
              className="data-[state=checked]:bg-eqho-blue"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-eqho-green/10">
                <Save className="h-4 w-4 text-eqho-green" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Autosave</p>
                <p className="text-xs text-muted-foreground">Automatically save changes</p>
              </div>
            </div>
            <Switch
              checked={autosave}
              onCheckedChange={setAutosave}
              className="data-[state=checked]:bg-eqho-green"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

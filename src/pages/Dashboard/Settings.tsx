import { useState } from "react"
import Header from "@/components/ui/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Camera, Save, Shield, Bell, Globe } from "lucide-react"

export default function Settings() {
  const [notifications,   setNotifications]   = useState(true)
  const [twoFactor,       setTwoFactor]       = useState(false)
  const [marketingEmails, setMarketingEmails] = useState(false)
  const [darkMode,        setDarkMode]        = useState(false)

  return (
    <div>
      <Header title="Settings" />
      <div className="p-6 space-y-6 max-w-4xl">

        {/* ── Profile ──────────────────────────────────────────────────────── */}
        <Card variant="default">
          <CardHeader icon={<Camera className="w-4 h-4" />}>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Manage your personal information</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Avatar row */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] text-white text-2xl font-bold">
                    JD
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#7c3aed] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#6d28d9] transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div>
                <p className="font-semibold text-[#0f172a]">John Doe</p>
                <p className="text-sm text-[#475569]">john@company.com</p>
                <p className="text-xs text-[#7c3aed] font-medium mt-1">Event Director</p>
              </div>
            </div>

            {/* Form fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#0f172a] font-semibold">First Name</Label>
                <Input defaultValue="John" />
              </div>
              <div className="space-y-2">
                <Label className="text-[#0f172a] font-semibold">Last Name</Label>
                <Input defaultValue="Doe" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[#0f172a] font-semibold">Email</Label>
                <Input defaultValue="john@company.com" type="email" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[#0f172a] font-semibold">Organization</Label>
                <Input defaultValue="Acme Inc." />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[#0f172a] font-semibold">Bio</Label>
                <textarea
                  className="w-full min-h-[100px] rounded-xl border border-[#e2e8f0] bg-gradient-to-b from-white to-[#faf8ff] px-4 py-3 text-sm text-[#0f172a] placeholder:text-[#94a3b8] shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/40 focus:outline-none transition-all resize-none"
                  defaultValue="Event professional with 5+ years of experience in managing corporate events and conferences."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Preferences ──────────────────────────────────────────────────── */}
        <Card variant="default">
          <CardHeader icon={<Bell className="w-4 h-4" />}>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Customize your experience</CardDescription>
          </CardHeader>

          <CardContent className="space-y-0">
            {[
              {
                label: "Email Notifications",
                desc:  "Receive updates about your events",
                checked: notifications,
                onChange: setNotifications,
              },
              {
                label: "Marketing Emails",
                desc:  "Receive product updates and offers",
                checked: marketingEmails,
                onChange: setMarketingEmails,
              },
              {
                label: "Dark Mode",
                desc:  "Switch to dark theme",
                checked: darkMode,
                onChange: setDarkMode,
              },
            ].map((row, i, arr) => (
              <div key={row.label}>
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm font-semibold text-[#0f172a]">{row.label}</p>
                    <p className="text-xs text-[#64748b] mt-0.5">{row.desc}</p>
                  </div>
                  <Switch
                    checked={row.checked}
                    onCheckedChange={row.onChange}
                    className="data-[state=checked]:bg-[#7c3aed]"
                  />
                </div>
                {i < arr.length - 1 && (
                  <div className="h-px bg-[#f0ebff]" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── Security ─────────────────────────────────────────────────────── */}
        <Card variant="default">
          <CardHeader icon={<Shield className="w-4 h-4" />}>
            <CardTitle>Security</CardTitle>
            <CardDescription>Protect your account</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-semibold text-[#0f172a]">Two-Factor Authentication</p>
                <p className="text-xs text-[#64748b] mt-0.5">Add an extra layer of security</p>
              </div>
              <Switch
                checked={twoFactor}
                onCheckedChange={setTwoFactor}
                className="data-[state=checked]:bg-[#7c3aed]"
              />
            </div>

            <div className="h-px bg-[#f0ebff]" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#0f172a] font-semibold">Current Password</Label>
                <Input type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label className="text-[#0f172a] font-semibold">New Password</Label>
                <Input type="password" placeholder="••••••••" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Regional ─────────────────────────────────────────────────────── */}
        <Card variant="default">
          <CardHeader icon={<Globe className="w-4 h-4" />}>
            <CardTitle>Regional</CardTitle>
            <CardDescription>Language and timezone settings</CardDescription>
          </CardHeader>

          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#0f172a] font-semibold">Language</Label>
              <select className="w-full h-11 rounded-xl border border-[#e2e8f0] bg-gradient-to-b from-white to-[#faf8ff] px-4 text-sm text-[#0f172a] shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/40 focus:outline-none appearance-none transition-all">
                <option>English (US)</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[#0f172a] font-semibold">Timezone</Label>
              <select className="w-full h-11 rounded-xl border border-[#e2e8f0] bg-gradient-to-b from-white to-[#faf8ff] px-4 text-sm text-[#0f172a] shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/40 focus:outline-none appearance-none transition-all">
                <option>UTC-5 (Eastern Time)</option>
                <option>UTC-8 (Pacific Time)</option>
                <option>UTC+0 (GMT)</option>
                <option>UTC+1 (CET)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* ── Save ─────────────────────────────────────────────────────────── */}
        <div className="flex justify-end">
          <Button variant="default" size="lg">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>

      </div>
    </div>
  )
}

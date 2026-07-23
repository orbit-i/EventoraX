import { useState } from "react"
import Header from "@/components/ui/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Camera, Save, Shield, Bell, Globe, Palette } from "lucide-react"

export default function Settings() {
  const [notifications, setNotifications] = useState(true)
  const [twoFactor, setTwoFactor] = useState(false)
  const [marketingEmails, setMarketingEmails] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  return (
    <div>
      <Header title="Settings" />
      <div className="p-6 space-y-6 max-w-4xl">
        
        {/* Profile Section */}
        <Card className="border-[#e9e4ff] shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#f5f3ff] flex items-center justify-center">
                <Camera className="w-4 h-4 text-[#7c3aed]" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-[#0f172a]">Profile</CardTitle>
                <CardDescription className="text-[#475569]">Manage your personal information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#0f172a] font-semibold">First Name</Label>
                <Input defaultValue="John" className="bg-white border-[#e9e4ff] focus:border-[#7c3aed]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[#0f172a] font-semibold">Last Name</Label>
                <Input defaultValue="Doe" className="bg-white border-[#e9e4ff] focus:border-[#7c3aed]" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[#0f172a] font-semibold">Email</Label>
                <Input defaultValue="john@company.com" type="email" className="bg-white border-[#e9e4ff] focus:border-[#7c3aed]" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[#0f172a] font-semibold">Organization</Label>
                <Input defaultValue="Acme Inc." className="bg-white border-[#e9e4ff] focus:border-[#7c3aed]" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[#0f172a] font-semibold">Bio</Label>
                <textarea 
                  className="w-full min-h-[100px] rounded-xl border border-[#e9e4ff] bg-white px-4 py-3 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/30 focus:ring-offset-1 outline-none transition-all resize-none"
                  placeholder="Tell us about yourself..."
                  defaultValue="Event professional with 5+ years of experience in managing corporate events and conferences."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <Card className="border-[#e9e4ff] shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#f5f3ff] flex items-center justify-center">
                <Bell className="w-4 h-4 text-[#7c3aed]" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-[#0f172a]">Preferences</CardTitle>
                <CardDescription className="text-[#475569]">Customize your experience</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-semibold text-[#0f172a]">Email Notifications</p>
                <p className="text-sm text-[#475569]">Receive updates about your events</p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} className="data-[state=checked]:bg-[#7c3aed]" />
            </div>
            <div className="h-px bg-[#e9e4ff]" />
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-semibold text-[#0f172a]">Marketing Emails</p>
                <p className="text-sm text-[#475569]">Receive product updates and offers</p>
              </div>
              <Switch checked={marketingEmails} onCheckedChange={setMarketingEmails} className="data-[state=checked]:bg-[#7c3aed]" />
            </div>
            <div className="h-px bg-[#e9e4ff]" />
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-semibold text-[#0f172a]">Dark Mode</p>
                <p className="text-sm text-[#475569]">Switch to dark theme</p>
              </div>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} className="data-[state=checked]:bg-[#7c3aed]" />
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card className="border-[#e9e4ff] shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#f5f3ff] flex items-center justify-center">
                <Shield className="w-4 h-4 text-[#7c3aed]" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-[#0f172a]">Security</CardTitle>
                <CardDescription className="text-[#475569]">Protect your account</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-semibold text-[#0f172a]">Two-Factor Authentication</p>
                <p className="text-sm text-[#475569]">Add an extra layer of security</p>
              </div>
              <Switch checked={twoFactor} onCheckedChange={setTwoFactor} className="data-[state=checked]:bg-[#7c3aed]" />
            </div>
            <div className="h-px bg-[#e9e4ff]" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#0f172a] font-semibold">Current Password</Label>
                <Input type="password" placeholder="••••••••" className="bg-white border-[#e9e4ff]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[#0f172a] font-semibold">New Password</Label>
                <Input type="password" placeholder="••••••••" className="bg-white border-[#e9e4ff]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Regional Section */}
        <Card className="border-[#e9e4ff] shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#f5f3ff] flex items-center justify-center">
                <Globe className="w-4 h-4 text-[#7c3aed]" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-[#0f172a]">Regional</CardTitle>
                <CardDescription className="text-[#475569]">Language and timezone settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#0f172a] font-semibold">Language</Label>
              <select className="w-full h-10 rounded-xl border border-[#e9e4ff] bg-white px-4 text-sm text-[#0f172a] focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/30 outline-none">
                <option>English (US)</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[#0f172a] font-semibold">Timezone</Label>
              <select className="w-full h-10 rounded-xl border border-[#e9e4ff] bg-white px-4 text-sm text-[#0f172a] focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/30 outline-none">
                <option>UTC-5 (Eastern Time)</option>
                <option>UTC-8 (Pacific Time)</option>
                <option>UTC+0 (GMT)</option>
                <option>UTC+1 (CET)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl shadow-lg shadow-[#7c3aed]/25 px-8 h-11">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
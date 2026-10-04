import { useState, useEffect } from "react";
import Header from "@/components/ui/dashboard/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Save, Shield, Bell, Globe, Check, AlertCircle, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";

export default function Settings() {
  const { user, updateUser } = useAuth();

  // Profile Form
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [timezone, setTimezone] = useState("UTC+0 (GMT)");
  const [language, setLanguage] = useState("English (US)");

  // Preferences
  const [notifications, setNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Save status
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setOrgName(user.orgName || "");
      setPhone(user.phone || "");
      setBio(user.bio || "");
      setTimezone(user.timezone || "UTC+0 (GMT)");
      setLanguage(user.language || "English (US)");
      setNotifications(user.notificationsEnabled ?? true);
      setTwoFactor(user.twoFactorEnabled ?? false);
      setMarketingEmails(user.marketingEmailsEnabled ?? false);
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const res = await api.auth.updateProfile({
        fullName,
        orgName,
        phone,
        bio,
        timezone,
        language,
        notificationsEnabled: notifications,
        marketingEmailsEnabled: marketingEmails,
        twoFactorEnabled: twoFactor,
      });

      if (res.success && res.user) {
        updateUser(res.user);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      setSaveError(err.message || "Failed to update profile settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await api.auth.changePassword({
        currentPassword,
        newPassword,
      });

      if (res.success) {
        setPasswordSuccess("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(null), 3000);
      }
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const userInitials = fullName
    ? fullName.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2)
    : "JD";

  return (
    <div>
      <Header title="Settings" />
      <div className="p-6 space-y-6 max-w-4xl">
        
        {/* Feedback alerts */}
        {saveSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Profile and preferences updated successfully!</span>
          </div>
        )}

        {saveError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Profile Section */}
        <Card className="border-[#e9e4ff] shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#f5f3ff] flex items-center justify-center">
                <Camera className="w-4 h-4 text-[#7c3aed]" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-[#0f172a]">Profile</CardTitle>
                <CardDescription className="text-[#475569]">Manage your organizer account information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-20 h-20 shadow-md shadow-[#7c3aed]/15">
                  <AvatarFallback className="bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] text-white text-2xl font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <button 
                  type="button"
                  title="Change avatar"
                  className="absolute bottom-0 right-0 w-8 h-8 bg-[#7c3aed] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#6d28d9] transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div>
                <p className="font-semibold text-[#0f172a] text-lg">{fullName || "Event Organizer"}</p>
                <p className="text-sm text-[#475569]">{user?.email || "organizer@eventorax.com"}</p>
                <span className="inline-block mt-1 text-xs bg-[#f5f3ff] text-[#7c3aed] font-bold px-2.5 py-0.5 rounded-full border border-[#ddd6fe]">
                  {user?.role ? user.role.toUpperCase() : "ORGANIZER"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#0f172a] font-semibold text-xs">Full Name</Label>
                <Input 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-white border-[#e9e4ff] focus:border-[#7c3aed]" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#0f172a] font-semibold text-xs">Phone Number</Label>
                <Input 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="bg-white border-[#e9e4ff] focus:border-[#7c3aed]" 
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[#0f172a] font-semibold text-xs">Organization / Company</Label>
                <Input 
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Acme Tech, ORBIT-I"
                  className="bg-white border-[#e9e4ff] focus:border-[#7c3aed]" 
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[#0f172a] font-semibold text-xs">Bio & Description</Label>
                <textarea 
                  className="w-full min-h-[90px] rounded-xl border border-[#e9e4ff] bg-white px-4 py-3 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/30 outline-none transition-all resize-none"
                  placeholder="Tell us about yourself and your event organizing portfolio..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
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
                <CardTitle className="text-lg font-bold text-[#0f172a]">Preferences & Notifications</CardTitle>
                <CardDescription className="text-[#475569]">Customize alerts and notifications</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-semibold text-sm text-[#0f172a]">Email Notifications</p>
                <p className="text-xs text-[#475569]">Receive real-time alerts whenever attendees RSVP or buy tickets</p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} className="data-[state=checked]:bg-[#7c3aed]" />
            </div>
            <div className="h-px bg-[#e9e4ff]" />
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-semibold text-sm text-[#0f172a]">Marketing & Product Updates</p>
                <p className="text-xs text-[#475569]">Receive monthly insights, tips, and feature launches</p>
              </div>
              <Switch checked={marketingEmails} onCheckedChange={setMarketingEmails} className="data-[state=checked]:bg-[#7c3aed]" />
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
                <CardTitle className="text-lg font-bold text-[#0f172a]">Regional Settings</CardTitle>
                <CardDescription className="text-[#475569]">Language and local timezone configuration</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#0f172a] font-semibold text-xs">Language</Label>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full h-10 rounded-xl border border-[#e9e4ff] bg-white px-4 text-sm text-[#0f172a] focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/30 outline-none"
              >
                <option value="English (US)">English (US)</option>
                <option value="English (UK)">English (UK)</option>
                <option value="Urdu (اردو)">Urdu (اردو)</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[#0f172a] font-semibold text-xs">Timezone</Label>
              <select 
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full h-10 rounded-xl border border-[#e9e4ff] bg-white px-4 text-sm text-[#0f172a] focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/30 outline-none"
              >
                <option value="UTC+5 (Pakistan Standard Time)">UTC+5 (Pakistan Standard Time)</option>
                <option value="UTC+0 (GMT / London)">UTC+0 (GMT / London)</option>
                <option value="UTC-5 (Eastern Time)">UTC-5 (Eastern Time)</option>
                <option value="UTC-8 (Pacific Time)">UTC-8 (Pacific Time)</option>
                <option value="UTC+1 (CET)">UTC+1 (CET)</option>
                <option value="UTC+4 (Dubai / UAE)">UTC+4 (Dubai / UAE)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Save Button for Profile & Preferences */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSaveProfile}
            disabled={saving}
            className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl shadow-lg shadow-[#7c3aed]/25 px-8 h-11"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Profile & Preferences
          </Button>
        </div>

        {/* Security / Password Section */}
        <Card className="border-[#e9e4ff] shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#f5f3ff] flex items-center justify-center">
                <Shield className="w-4 h-4 text-[#7c3aed]" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-[#0f172a]">Security & Password</CardTitle>
                <CardDescription className="text-[#475569]">Update your account credentials</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-semibold text-sm text-[#0f172a]">Two-Factor Authentication (2FA)</p>
                <p className="text-xs text-[#475569]">Add an extra verification layer to protect your events</p>
              </div>
              <Switch checked={twoFactor} onCheckedChange={setTwoFactor} className="data-[state=checked]:bg-[#7c3aed]" />
            </div>
            <div className="h-px bg-[#e9e4ff]" />

            {/* Password Change Form */}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#7c3aed] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Change Password
              </h4>

              {passwordSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-[#0f172a] font-semibold text-xs">Current Password</Label>
                  <Input 
                    type="password" 
                    required
                    placeholder="••••••••" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="bg-white border-[#e9e4ff]" 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[#0f172a] font-semibold text-xs">New Password</Label>
                  <Input 
                    type="password" 
                    required
                    minLength={6}
                    placeholder="Min 6 characters" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-white border-[#e9e4ff]" 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[#0f172a] font-semibold text-xs">Confirm New Password</Label>
                  <Input 
                    type="password" 
                    required
                    placeholder="Confirm new password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-white border-[#e9e4ff]" 
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button 
                  type="submit"
                  disabled={passwordLoading}
                  className="bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl text-xs h-10 px-6"
                >
                  {passwordLoading ? 'Updating Password...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
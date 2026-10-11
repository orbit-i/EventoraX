import { useState, useEffect } from "react";
import Header from "@/components/ui/dashboard/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Camera, 
  Save, 
  Shield, 
  Check, 
  AlertCircle, 
  Lock, 
  Palette, 
  ExternalLink, 
  Sparkles,
  Ticket,
  Globe,
  ShieldCheck,
  Upload,
  Trash2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";

export default function Settings() {
  const { user, updateUser, currentTenant, switchTenant } = useAuth();

  // Profile Form
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [timezone, setTimezone] = useState("UTC+0 (GMT)");
  const [language, setLanguage] = useState("English (US)");

  // Preferences
  const [notifications, setNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);

  // Tenant Branding Form (Multi-Tenant White-Label)
  const [brandOrgName, setBrandOrgName] = useState("");
  const [brandSlug, setBrandSlug] = useState("");
  const [brandPrimaryColor, setBrandPrimaryColor] = useState("#7c3aed");
  const [brandSecondaryColor, setBrandSecondaryColor] = useState("#6d28d9");
  const [customDomain, setCustomDomain] = useState("");
  const [savingBrand, setSavingBrand] = useState(false);
  const [brandSuccess, setBrandSuccess] = useState(false);
  const [brandError, setBrandError] = useState<string | null>(null);

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
      setAvatarUrl(user.avatarUrl || user.avatar_url || "");
      setTimezone(user.timezone || "UTC+0 (GMT)");
      setLanguage(user.language || "English (US)");
      setNotifications(user.notificationsEnabled ?? true);
      setTwoFactor(user.twoFactorEnabled ?? false);
      setMarketingEmails(user.marketingEmailsEnabled ?? false);
    }
    if (currentTenant) {
      setBrandOrgName(currentTenant.name || "");
      setBrandSlug(currentTenant.slug || "");
      setBrandPrimaryColor(currentTenant.primary_color || "#7c3aed");
      setBrandSecondaryColor(currentTenant.secondary_color || "#6d28d9");
      setCustomDomain(currentTenant.custom_domain || "");
    }
  }, [user, currentTenant]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setSaveError("Avatar image must be smaller than 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setAvatarUrl(result);
        // Live instantaneous update in context so header/sidebar updates immediately
        updateUser({ avatarUrl: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl("");
    updateUser({ avatarUrl: "" });
  };

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
        avatarUrl,
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

  const handleSaveBranding = async () => {
    setSavingBrand(true);
    setBrandSuccess(false);
    setBrandError(null);

    try {
      const res = await api.tenants.updateCurrent({
        name: brandOrgName,
        slug: brandSlug,
        primaryColor: brandPrimaryColor,
        secondaryColor: brandSecondaryColor,
        customDomain: customDomain,
      });

      if (res.success && res.tenant) {
        switchTenant(res.tenant);
        setBrandSuccess(true);
        setTimeout(() => setBrandSuccess(false), 3000);
      }
    } catch (err: any) {
      setBrandError(err.message || "Failed to update workspace branding.");
    } finally {
      setSavingBrand(false);
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
      <div className="p-6 space-y-8 max-w-4xl">
        
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

        {/* SECTION 1: Multi-Tenant Workspace Branding & White-Label */}
        <Card className="border-[#e9e4ff] shadow-sm bg-white overflow-hidden">
          <div className="h-2 w-full" style={{ backgroundColor: brandPrimaryColor }} />
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#f5f3ff] flex items-center justify-center text-[#7c3aed]">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-[#0f172a]">
                    Workspace Branding & White-Label
                  </CardTitle>
                  <CardDescription className="text-[#475569]">
                    Customize your public event portal URL, colors, and tenant domain
                  </CardDescription>
                </div>
              </div>

              {brandSlug && (
                <a
                  href={`/t/${brandSlug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#faf8ff] border border-[#e9e4ff] text-xs font-semibold text-[#7c3aed] hover:bg-[#f3f0ff] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Preview Public Portal
                </a>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {brandSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Branding configuration updated successfully!</span>
              </div>
            )}
            {brandError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>{brandError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[#0f172a] font-semibold text-xs">Organization Workspace Name</Label>
                <Input
                  value={brandOrgName}
                  onChange={(e) => setBrandOrgName(e.target.value)}
                  placeholder="e.g. Acme Tech, EventoraX HQ"
                  className="bg-white border-[#e9e4ff]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[#0f172a] font-semibold text-xs">Portal URL Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#94a3b8] font-mono">/t/</span>
                  <Input
                    value={brandSlug}
                    onChange={(e) => setBrandSlug(e.target.value)}
                    placeholder="my-workspace"
                    className="bg-white border-[#e9e4ff] font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[#0f172a] font-semibold text-xs">Primary Brand Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandPrimaryColor}
                    onChange={(e) => setBrandPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-[#e9e4ff] cursor-pointer"
                  />
                  <Input
                    value={brandPrimaryColor}
                    onChange={(e) => setBrandPrimaryColor(e.target.value)}
                    className="w-36 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[#0f172a] font-semibold text-xs flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    Custom Domain (CNAME White-Label)
                  </Label>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    currentTenant?.plan === 'Enterprise' || user?.role === 'admin' || currentTenant?.id === 1
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {currentTenant?.plan === 'Enterprise' || user?.role === 'admin' || currentTenant?.id === 1
                      ? 'Included in Plan'
                      : 'Requires Enterprise Plan'}
                  </span>
                </div>

                {currentTenant?.plan === 'Enterprise' || user?.role === 'admin' || currentTenant?.id === 1 ? (
                  <div className="space-y-2 mt-1">
                    <div className="flex gap-2">
                      <Input
                        value={customDomain}
                        onChange={(e) => setCustomDomain(e.target.value)}
                        placeholder="e.g. events.yourcompany.com"
                        className="bg-white border-[#e9e4ff] text-xs font-mono"
                      />
                    </div>
                    {/* DNS Configuration Instructions */}
                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1.5 text-slate-700">
                      <p className="font-bold text-blue-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        DNS Setup Instructions (Your DNS Provider):
                      </p>
                      <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded-lg border border-blue-100 font-mono text-[11px]">
                        <div><span className="text-slate-400 block text-[9px] font-sans">TYPE</span>CNAME</div>
                        <div><span className="text-slate-400 block text-[9px] font-sans">HOST</span>events</div>
                        <div><span className="text-slate-400 block text-[9px] font-sans">TARGET</span>cname.eventorax.com</div>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        SSL Certificates (HTTPS) are provisioned automatically within 15 minutes of DNS propagation.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <p className="text-xs text-slate-600">
                      Connect your own branded domain (e.g., <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded">events.yourdomain.com</code>) with automatic SSL. This feature is unlocked on the <strong>Enterprise ($299/mo)</strong> plan.
                    </p>
                    <a
                      href="/pricing"
                      className="inline-block text-xs font-bold text-[#1d4ed8] hover:underline"
                    >
                      View Enterprise Plan Details →
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Live Interactive Branding Preview */}
            <div className="p-4 rounded-2xl bg-[#faf8ff] border border-[#e9e4ff] space-y-3">
              <p className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#7c3aed]" />
                Live White-Label Preview
              </p>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#e9e4ff]">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                    style={{ backgroundColor: brandPrimaryColor }}
                  >
                    {(brandOrgName || "EX").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0f172a]">{brandOrgName || "Organization Name"}</p>
                    <p className="text-[10px] text-[#94a3b8]">eventorax.com/t/{brandSlug || "slug"}</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="text-white text-xs h-8 rounded-lg shadow-sm"
                  style={{ backgroundColor: brandPrimaryColor }}
                >
                  <Ticket className="w-3.5 h-3.5 mr-1" />
                  Sample Ticket
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSaveBranding}
                disabled={savingBrand}
                className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-xs h-10 px-6 shadow-md"
              >
                {savingBrand ? "Saving Branding..." : "Save Workspace Branding"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: Profile Section */}
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
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-4 rounded-2xl bg-[#faf8ff] border border-[#e9e4ff]">
              <div className="relative group shrink-0">
                <Avatar className="w-20 h-20 shadow-md shadow-[#7c3aed]/15 ring-2 ring-white overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={fullName || "Avatar"} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] text-white text-2xl font-bold">
                      {userInitials}
                    </AvatarFallback>
                  )}
                </Avatar>
                <label 
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 w-7 h-7 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-full flex items-center justify-center cursor-pointer shadow-md transition-transform hover:scale-110"
                  title="Upload profile photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <input 
                    id="avatar-upload" 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarUpload} 
                    className="hidden" 
                  />
                </label>
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-[#0f172a] text-lg truncate">{fullName || "Event Organizer"}</p>
                  <span className="text-[10px] bg-[#f5f3ff] text-[#7c3aed] font-bold px-2 py-0.5 rounded-full border border-[#ddd6fe] uppercase">
                    {user?.role ? user.role.toUpperCase() : "ORGANIZER"}
                  </span>
                </div>
                <p className="text-xs text-[#475569]">{user?.email || "organizer@eventorax.com"}</p>
                <div className="flex items-center gap-2 pt-1">
                  <label 
                    htmlFor="avatar-upload-btn" 
                    className="px-3 py-1 rounded-xl bg-white border border-[#e9e4ff] text-xs font-semibold text-[#7c3aed] hover:bg-[#f3f0ff] cursor-pointer shadow-2xs transition-colors inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Profile Photo</span>
                    <input 
                      id="avatar-upload-btn" 
                      type="file" 
                      accept="image/*" 
                      onChange={handleAvatarUpload} 
                      className="hidden" 
                    />
                  </label>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="px-2.5 py-1 rounded-xl bg-white border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#0f172a] font-semibold text-xs">Full Name</Label>
                <Input 
                  value={fullName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFullName(val);
                    updateUser({ fullName: val });
                  }}
                  className="bg-white border-[#e9e4ff] focus:border-[#7c3aed]" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#0f172a] font-semibold text-xs">Phone Number</Label>
                <Input 
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPhone(val);
                    updateUser({ phone: val });
                  }}
                  placeholder="+92 300 1234567"
                  className="bg-white border-[#e9e4ff] focus:border-[#7c3aed]" 
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[#0f172a] font-semibold text-xs">Bio & Description</Label>
                <textarea 
                  className="w-full min-h-[90px] rounded-xl border border-[#e9e4ff] bg-white px-4 py-3 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/30 outline-none transition-all resize-none"
                  placeholder="Tell us about yourself and your event organizing portfolio..."
                  value={bio}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBio(val);
                    updateUser({ bio: val });
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button 
                onClick={handleSaveProfile}
                disabled={saving}
                className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-xs h-10 px-6 shadow-md shadow-[#7c3aed]/20"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: Security & Password */}
        <Card className="border-[#e9e4ff] shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#f5f3ff] flex items-center justify-center">
                <Shield className="w-4 h-4 text-[#7c3aed]" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-[#0f172a]">Security & Authentication</CardTitle>
                <CardDescription className="text-[#475569]">Manage your account password and security options</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
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
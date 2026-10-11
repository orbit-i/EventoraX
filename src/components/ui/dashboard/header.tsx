import { useState, useRef, useEffect } from "react";
import { 
  Building2, 
  ChevronDown, 
  Plus, 
  Check, 
  Bell, 
  Search, 
  ExternalLink,
  Sparkles,
  X,
  Menu
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { api } from "@/services/api";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { currentTenant, userTenants, switchTenant, refreshTenants, isSuperAdmin } = useAuth();
  const { toggleSidebar } = useSidebar();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgPlan, setNewOrgPlan] = useState("Professional");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Strictly filter workspaces: Non-admin clients NEVER see or access Tenant 1 (EventoraX HQ)
  const accessibleTenants = isSuperAdmin
    ? userTenants
    : userTenants.filter(t => t.id !== 1 && !t.name.toLowerCase().includes('eventorax hq'));

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    setCreating(true);
    setCreateError(null);
    try {
      const res = await api.tenants.create({
        name: newOrgName.trim(),
        plan: newOrgPlan
      });
      if (res.success && res.tenant) {
        setCreateModalOpen(false);
        setNewOrgName("");
        await refreshTenants();
        switchTenant(res.tenant);
      }
    } catch (err: any) {
      setCreateError(err.message || "Failed to create organization.");
    } finally {
      setCreating(false);
    }
  };

  const activeTenantName = currentTenant?.name || "EventoraX Workspace";
  const activePlan = currentTenant?.plan || "Professional";

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#e9e4ff] px-6 py-3.5">
        <div className="flex items-center justify-between gap-4">
          
          {/* Left: Hamburger, Title & Tenant Switcher */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-2 rounded-xl text-[#475569] hover:text-[#1d4ed8] hover:bg-slate-100 transition-colors shrink-0"
              title="Toggle Sidebar Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <h1 className="text-xl font-bold text-[#0f172a] hidden md:block">{title}</h1>

            <div className="h-6 w-[1px] bg-[#e9e4ff] hidden md:block" />

            {/* Tenant Switcher Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[#faf8ff] hover:bg-[#f3f0ff] border border-[#e9e4ff] text-left transition-all duration-200 shadow-sm group"
              >
                <div 
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm"
                  style={{
                    backgroundColor: currentTenant?.primary_color || '#7c3aed'
                  }}
                >
                  {activeTenantName.slice(0, 2).toUpperCase()}
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#0f172a] max-w-[130px] sm:max-w-[180px] truncate">
                      {activeTenantName}
                    </span>
                    <Badge className="bg-[#7c3aed]/10 text-[#7c3aed] hover:bg-[#7c3aed]/15 text-[10px] px-1.5 py-0 font-semibold border-none">
                      {activePlan}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-[#64748b]">
                    Multi-Tenant Workspace
                  </span>
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-[#94a3b8] group-hover:text-[#7c3aed] transition-colors ml-1" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white border border-[#e9e4ff] shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-[#f3f0ff] mb-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                      EventoraX Workspaces
                    </p>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {accessibleTenants.length === 0 ? (
                      <div className="p-3 text-xs text-[#94a3b8] text-center">No other workspaces found</div>
                    ) : (
                      accessibleTenants.map((t) => {
                        const isSelected = currentTenant?.id === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              switchTenant(t);
                              setDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors ${
                              isSelected
                                ? "bg-[#7c3aed]/10 text-[#7c3aed] font-bold"
                                : "hover:bg-[#f5f3ff] text-[#334155]"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div 
                                className="w-6 h-6 rounded-md flex items-center justify-center text-white font-bold text-[10px] shrink-0"
                                style={{ backgroundColor: t.primary_color || '#7c3aed' }}
                              >
                                {t.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="truncate">
                                <p className="truncate font-semibold text-[#0f172a]">{t.name}</p>
                                <p className="text-[10px] text-[#94a3b8]">Plan: {t.plan || 'Starter'}</p>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-[#7c3aed] shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="pt-2 mt-1 border-t border-[#f3f0ff] space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        setCreateModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#7c3aed] hover:bg-[#f5f3ff] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Create New Workspace
                    </button>

                    {currentTenant?.slug && (
                      <a
                        href={`/t/${currentTenant.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[#64748b] hover:text-[#7c3aed] hover:bg-[#faf8ff] transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <ExternalLink className="w-3.5 h-3.5" />
                          View Public Portal
                        </span>
                        <span className="text-[10px] text-[#94a3b8]">/t/{currentTenant.slug}</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Search, Notifications */}
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
              <Input 
                placeholder="Search events, attendees..." 
                className="pl-9 w-60 h-9 bg-[#f5f3ff] border-[#e9e4ff] focus:bg-white text-xs rounded-xl"
              />
            </div>

            <Button 
              variant="ghost" 
              size="icon"
              className="relative rounded-xl hover:bg-[#f5f3ff] text-[#64748b] hover:text-[#7c3aed] w-9 h-9"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#dc2626] rounded-full" />
            </Button>
          </div>
        </div>
      </header>

      {/* Modal: Create New Workspace */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#e9e4ff] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#f3f0ff]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-[#7c3aed]">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#0f172a]">Create Organization</h3>
                  <p className="text-xs text-[#64748b]">Set up an isolated multi-tenant workspace</p>
                </div>
              </div>
              <button 
                onClick={() => setCreateModalOpen(false)}
                className="text-[#94a3b8] hover:text-[#0f172a] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateTenant} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#0f172a] block mb-1.5">
                  Organization / Company Name
                </label>
                <Input
                  required
                  placeholder="e.g. Acme Conferences, Orbit Labs"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="rounded-xl border-[#e9e4ff] text-sm h-11"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#0f172a] block mb-1.5">
                  Subscription Tier
                </label>
                <select
                  value={newOrgPlan}
                  onChange={(e) => setNewOrgPlan(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-[#e9e4ff] bg-white text-sm text-[#0f172a] focus:ring-2 focus:ring-[#7c3aed]"
                >
                  <option value="Starter">Starter (Free, up to 500 attendees)</option>
                  <option value="Professional">Professional ($49/mo, 5,000 attendees)</option>
                  <option value="Enterprise">Enterprise ($199/mo, 50,000 attendees, White-label)</option>
                  <option value="PaaS Developer">PaaS Developer ($299/mo, Full API & Webhooks)</option>
                </select>
              </div>

              <div className="p-3.5 rounded-xl bg-[#faf8ff] border border-[#e9e4ff] text-xs text-[#64748b] space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-[#7c3aed]">
                  <Sparkles className="w-3.5 h-3.5" />
                  Instant Isolation
                </div>
                <p>
                  This will generate a dedicated workspace with partitioned events, independent ticketing, team permissions, and API keys.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl shadow-md"
                >
                  {creating ? "Creating..." : "Launch Workspace"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
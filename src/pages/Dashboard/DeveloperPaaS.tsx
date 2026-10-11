import { useState, useEffect } from "react";
import Header from "@/components/ui/dashboard/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Key, 
  Webhook, 
  Code2, 
  Copy, 
  Check, 
  Trash2, 
  Plus, 
  Send, 
  Terminal, 
  Layers, 
  ExternalLink,
  Sparkles
} from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

export default function DeveloperPaaS() {
  const { currentTenant } = useAuth();
  const [activeTab, setActiveTab] = useState<"keys" | "webhooks" | "widget" | "docs">("keys");

  // API Keys State
  const [keys, setKeys] = useState<any[]>([]);
  const [keysLoading, setKeysLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creatingKey, setCreatingKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Webhooks State
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [webhooksLoading, setWebhooksLoading] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookEvents] = useState("attendee.registered,attendee.checked_in");
  const [creatingWebhook, setCreatingWebhook] = useState(false);
  const [testingWebhookId, setTestingWebhookId] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);

  // Widget State
  const [widgetPrimaryColor, setWidgetPrimaryColor] = useState("#7c3aed");
  const [widgetTheme, setWidgetTheme] = useState<"light" | "dark">("light");
  const [copiedWidget, setCopiedWidget] = useState(false);

  // Load API Keys
  const loadKeys = async () => {
    setKeysLoading(true);
    try {
      const res = await api.developer.getKeys();
      if (res.success) {
        setKeys(res.keys || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setKeysLoading(false);
    }
  };

  // Load Webhooks
  const loadWebhooks = async () => {
    setWebhooksLoading(true);
    try {
      const res = await api.developer.getWebhooks();
      if (res.success) {
        setWebhooks(res.webhooks || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWebhooksLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
    loadWebhooks();
  }, [currentTenant?.id]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setCreatingKey(true);
    try {
      const res = await api.developer.createKey({ name: newKeyName.trim() });
      if (res.success && res.key) {
        setKeys([res.key, ...keys]);
        setNewKeyName("");
      }
    } catch (err: any) {
      alert(err.message || "Failed to create API key");
    } finally {
      setCreatingKey(false);
    }
  };

  const handleDeleteKey = async (id: number) => {
    if (!confirm("Are you sure you want to revoke this API key? External apps using this key will immediately lose access.")) return;
    try {
      await api.developer.deleteKey(id);
      setKeys(keys.filter((k) => k.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to revoke key");
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookUrl.trim()) return;
    setCreatingWebhook(true);
    try {
      const res = await api.developer.createWebhook({
        url: newWebhookUrl.trim(),
        events: newWebhookEvents
      });
      if (res.success && res.webhook) {
        setWebhooks([res.webhook, ...webhooks]);
        setNewWebhookUrl("");
      }
    } catch (err: any) {
      alert(err.message || "Failed to create webhook");
    } finally {
      setCreatingWebhook(false);
    }
  };

  const handleDeleteWebhook = async (id: number) => {
    if (!confirm("Delete this webhook endpoint?")) return;
    try {
      await api.developer.deleteWebhook(id);
      setWebhooks(webhooks.filter((w) => w.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete webhook");
    }
  };

  const handleTestWebhook = async (id: number) => {
    setTestingWebhookId(id);
    setTestResult(null);
    try {
      const res = await api.developer.testWebhook(id);
      if (res.success) {
        setTestResult(res);
      }
    } catch (err: any) {
      alert(err.message || "Failed to test webhook");
    } finally {
      setTestingWebhookId(null);
    }
  };

  const currentSlug = currentTenant?.slug || "eventorax-hq";
  const widgetIframeSnippet = `<iframe 
  src="${window.location.origin}/t/${currentSlug}?embed=true&color=${encodeURIComponent(widgetPrimaryColor)}&theme=${widgetTheme}" 
  width="100%" 
  height="600" 
  frameborder="0" 
  style="border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);" 
  allow="payment"
></iframe>`;

  const sampleApiKey = keys.length > 0 ? keys[0].api_key : "evx_live_99d8b746a5124e93bc48102a9b31";

  return (
    <div className="pb-16">
      <Header title="Developer & PaaS Portal" />

      <div className="p-6 space-y-8">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#18181b] via-[#27272a] to-[#3f3f46] p-8 text-white shadow-xl">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-purple-300">
              <Terminal className="w-3.5 h-3.5" />
              Platform-as-a-Service (PaaS) Developer Console
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              EventoraX Developer & Integration Hub
            </h1>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Build custom mobile apps, automated ticket scanners, or embed white-label ticketing widgets directly inside your own domain using our RESTful PaaS v1 API.
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-[#e9e4ff] pb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab("keys")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "keys"
                ? "bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/20"
                : "text-[#64748b] hover:bg-[#f5f3ff] hover:text-[#7c3aed]"
            }`}
          >
            <Key className="w-4 h-4" />
            API Keys ({keys.length})
          </button>

          <button
            onClick={() => setActiveTab("webhooks")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "webhooks"
                ? "bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/20"
                : "text-[#64748b] hover:bg-[#f5f3ff] hover:text-[#7c3aed]"
            }`}
          >
            <Webhook className="w-4 h-4" />
            Webhooks ({webhooks.length})
          </button>

          <button
            onClick={() => setActiveTab("widget")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "widget"
                ? "bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/20"
                : "text-[#64748b] hover:bg-[#f5f3ff] hover:text-[#7c3aed]"
            }`}
          >
            <Layers className="w-4 h-4" />
            Embeddable Ticket Widget
          </button>

          <button
            onClick={() => setActiveTab("docs")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "docs"
                ? "bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/20"
                : "text-[#64748b] hover:bg-[#f5f3ff] hover:text-[#7c3aed]"
            }`}
          >
            <Code2 className="w-4 h-4" />
            REST API v1 Documentation
          </button>
        </div>

        {/* TAB 1: API KEYS */}
        {activeTab === "keys" && (
          <div className="space-y-6">
            <Card className="border-[#e9e4ff] bg-white shadow-sm">
              <CardHeader className="pb-3 border-b border-[#f3f0ff]">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-[#0f172a]">Active API Keys</CardTitle>
                    <p className="text-xs text-[#64748b] mt-1">Authenticate requests to <code className="bg-[#f5f3ff] text-[#7c3aed] px-1.5 py-0.5 rounded font-mono">/api/v1/*</code> by passing your key in the <code className="bg-[#f5f3ff] text-[#7c3aed] px-1.5 py-0.5 rounded font-mono">x-api-key</code> header.</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Generate New Key Form */}
                <form onSubmit={handleCreateKey} className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="Key description (e.g. Mobile Ticketing Scanner, CRM Sync)"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="flex-1 rounded-xl border-[#e9e4ff] text-xs h-10"
                  />
                  <Button
                    type="submit"
                    disabled={creatingKey}
                    className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-xs h-10 px-5 shadow-sm shrink-0"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    {creatingKey ? "Generating..." : "Generate New Key"}
                  </Button>
                </form>

                {/* Keys List */}
                <div className="space-y-3">
                  {keysLoading ? (
                    <div className="p-8 text-center text-xs text-[#94a3b8]">Loading API keys...</div>
                  ) : keys.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#94a3b8] bg-[#faf8ff] rounded-2xl border border-dashed border-[#e9e4ff]">
                      No API keys generated yet. Click "Generate New Key" above.
                    </div>
                  ) : (
                    keys.map((k) => (
                      <div
                        key={k.id}
                        className="p-4 rounded-2xl border border-[#e9e4ff] bg-[#faf8ff] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#0f172a]">{k.name}</span>
                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                              Live
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="text-xs font-mono bg-white px-2.5 py-1 rounded-lg border border-[#e9e4ff] text-[#334155] select-all">
                              {k.api_key}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCopy(k.api_key, `key-${k.id}`)}
                              className="h-7 w-7 rounded-lg text-[#64748b] hover:text-[#7c3aed]"
                            >
                              {copiedKey === `key-${k.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </Button>
                          </div>
                          <p className="text-[10px] text-[#94a3b8]">
                            Created: {new Date(k.created_at).toLocaleDateString()} · Last used: {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : "Never"}
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteKey(k.id)}
                          className="text-red-600 hover:bg-red-50 text-xs h-8 px-3 rounded-xl shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Revoke
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: WEBHOOKS */}
        {activeTab === "webhooks" && (
          <div className="space-y-6">
            <Card className="border-[#e9e4ff] bg-white shadow-sm">
              <CardHeader className="pb-3 border-b border-[#f3f0ff]">
                <CardTitle className="text-base font-bold text-[#0f172a]">Webhook Subscriptions</CardTitle>
                <p className="text-xs text-[#64748b]">Receive instantaneous HTTP POST callbacks whenever tickets are purchased or attendees are checked in.</p>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Register Webhook Form */}
                <form onSubmit={handleCreateWebhook} className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      required
                      placeholder="https://your-crm-or-api.com/webhooks/eventorax"
                      value={newWebhookUrl}
                      onChange={(e) => setNewWebhookUrl(e.target.value)}
                      className="flex-1 rounded-xl border-[#e9e4ff] text-xs h-10"
                    />
                    <Button
                      type="submit"
                      disabled={creatingWebhook}
                      className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-xs h-10 px-5 shadow-sm shrink-0"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      {creatingWebhook ? "Adding..." : "Add Webhook"}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#64748b]">
                    <span>Events subscribed:</span>
                    <Badge variant="outline" className="text-[10px] bg-purple-50 text-[#7c3aed] border-purple-200">
                      attendee.registered
                    </Badge>
                    <Badge variant="outline" className="text-[10px] bg-purple-50 text-[#7c3aed] border-purple-200">
                      attendee.checked_in
                    </Badge>
                  </div>
                </form>

                {/* Webhooks List */}
                <div className="space-y-3">
                  {webhooksLoading ? (
                    <div className="p-8 text-center text-xs text-[#94a3b8]">Loading webhooks...</div>
                  ) : webhooks.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#94a3b8] bg-[#faf8ff] rounded-2xl border border-dashed border-[#e9e4ff]">
                      No webhooks configured. Enter your endpoint above to receive event webhooks.
                    </div>
                  ) : (
                    webhooks.map((w) => (
                      <div
                        key={w.id}
                        className="p-4 rounded-2xl border border-[#e9e4ff] bg-[#faf8ff] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#0f172a] truncate">{w.url}</span>
                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]">
                              Active
                            </Badge>
                          </div>
                          <p className="text-[11px] text-[#64748b]">
                            Subscribed: <code className="text-[#7c3aed]">{w.events}</code>
                          </p>
                          <p className="text-[10px] text-[#94a3b8]">
                            Signing Secret: <code className="bg-white px-1.5 py-0.5 rounded border border-[#e9e4ff]">{w.secret}</code>
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={testingWebhookId === w.id}
                            onClick={() => handleTestWebhook(w.id)}
                            className="text-[#7c3aed] border-[#e9e4ff] text-xs h-8 px-3 rounded-xl hover:bg-purple-50"
                          >
                            <Send className="w-3.5 h-3.5 mr-1" />
                            {testingWebhookId === w.id ? "Sending..." : "Test Ping"}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteWebhook(w.id)}
                            className="text-red-600 hover:bg-red-50 text-xs h-8 px-3 rounded-xl"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Test Result Inspector */}
                {testResult && (
                  <div className="p-4 rounded-2xl bg-[#0f172a] text-white space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-400">✓ Webhook Test Ping Delivered (200 OK)</span>
                      <button onClick={() => setTestResult(null)} className="text-zinc-400 hover:text-white">✕</button>
                    </div>
                    <pre className="text-[11px] font-mono text-zinc-300 overflow-x-auto p-2 bg-black/40 rounded-xl">
                      {JSON.stringify(testResult.payload, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 3: EMBEDDABLE WIDGET */}
        {activeTab === "widget" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Customizer */}
            <div className="space-y-6">
              <Card className="border-[#e9e4ff] bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-[#0f172a]">
                    White-Label Ticket Widget Generator
                  </CardTitle>
                  <p className="text-xs text-[#64748b]">
                    Allow customers to view and register for your events directly on your external website or CMS (WordPress, Webflow, Shopify, React).
                  </p>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-[#0f172a] block mb-1.5">
                      Brand Accent Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={widgetPrimaryColor}
                        onChange={(e) => setWidgetPrimaryColor(e.target.value)}
                        className="w-10 h-10 rounded-xl border border-[#e9e4ff] cursor-pointer"
                      />
                      <Input
                        value={widgetPrimaryColor}
                        onChange={(e) => setWidgetPrimaryColor(e.target.value)}
                        className="w-32 rounded-xl text-xs h-10 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#0f172a] block mb-1.5">
                      Color Theme
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setWidgetTheme("light")}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                          widgetTheme === "light"
                            ? "bg-[#7c3aed] text-white border-[#7c3aed]"
                            : "border-[#e9e4ff] text-[#64748b]"
                        }`}
                      >
                        Light Theme
                      </button>
                      <button
                        type="button"
                        onClick={() => setWidgetTheme("dark")}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                          widgetTheme === "dark"
                            ? "bg-[#7c3aed] text-white border-[#7c3aed]"
                            : "border-[#e9e4ff] text-[#64748b]"
                        }`}
                      >
                        Dark Theme
                      </button>
                    </div>
                  </div>

                  {/* Copy HTML Snippet */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-[#0f172a]">
                        Embed HTML Code
                      </label>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(widgetIframeSnippet);
                          setCopiedWidget(true);
                          setTimeout(() => setCopiedWidget(false), 2000);
                        }}
                        className="text-xs font-semibold text-[#7c3aed] hover:underline flex items-center gap-1"
                      >
                        {copiedWidget ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedWidget ? "Copied to clipboard!" : "Copy Embed Code"}
                      </button>
                    </div>
                    <pre className="text-[11px] font-mono bg-[#0f172a] text-zinc-200 p-3.5 rounded-2xl overflow-x-auto select-all leading-relaxed">
                      {widgetIframeSnippet}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Live Interactive Preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#7c3aed]" />
                  Live Embedded Widget Preview
                </span>
                <a
                  href={`/t/${currentSlug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#7c3aed] hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Standalone Portal
                </a>
              </div>

              <div className="rounded-3xl border border-[#e9e4ff] bg-white p-5 shadow-lg overflow-hidden">
                <div className="p-4 rounded-2xl text-white mb-4" style={{ backgroundColor: widgetPrimaryColor }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase font-bold tracking-wider opacity-80">Official Ticketing</p>
                      <h4 className="text-lg font-extrabold">{currentTenant?.name || "EventoraX Portal"}</h4>
                    </div>
                    <Badge className="bg-white/20 text-white border-none text-[10px]">PaaS Powered</Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl border border-[#f3f0ff] bg-[#faf8ff] flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-[#0f172a]">Global Tech Summit 2025</p>
                      <p className="text-[10px] text-[#64748b]">June 15, 2025 · Jinnah Convention Centre</p>
                    </div>
                    <Button size="sm" className="h-7 text-[11px] text-white rounded-lg shadow-sm" style={{ backgroundColor: widgetPrimaryColor }}>
                      Book Ticket · $49
                    </Button>
                  </div>

                  <div className="p-3.5 rounded-xl border border-[#f3f0ff] bg-[#faf8ff] flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-[#0f172a]">Fullstack Web & AI Masterclass</p>
                      <p className="text-[10px] text-[#64748b]">July 10, 2025 · National Incubation Center</p>
                    </div>
                    <Button size="sm" className="h-7 text-[11px] text-white rounded-lg shadow-sm" style={{ backgroundColor: widgetPrimaryColor }}>
                      Book Ticket · $29
                    </Button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#f3f0ff] text-center text-[10px] text-[#94a3b8]">
                  Powered by EventoraX PaaS Engine
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: API DOCUMENTATION & SANDBOX */}
        {activeTab === "docs" && (
          <div className="space-y-6">
            <Card className="border-[#e9e4ff] bg-white shadow-sm">
              <CardHeader className="pb-3 border-b border-[#f3f0ff]">
                <CardTitle className="text-base font-bold text-[#0f172a]">RESTful PaaS v1 API Reference</CardTitle>
                <p className="text-xs text-[#64748b]">Base URL: <code className="bg-[#f5f3ff] text-[#7c3aed] px-2 py-0.5 rounded font-mono font-bold">{window.location.origin}/api/v1</code></p>
              </CardHeader>
              <CardContent className="pt-6 space-y-8">
                {/* Endpoint 1: List Events */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-600 text-white font-mono text-xs">GET</Badge>
                    <code className="text-xs font-mono font-bold text-[#0f172a]">/api/v1/events</code>
                    <span className="text-xs text-[#64748b]">— Retrieve all events published by your organization</span>
                  </div>
                  <pre className="text-[11px] font-mono bg-[#0f172a] text-zinc-200 p-4 rounded-2xl overflow-x-auto">
{`curl -X GET "${window.location.origin}/api/v1/events" \\
  -H "x-api-key: ${sampleApiKey}"`}
                  </pre>
                </div>

                {/* Endpoint 2: Register Attendee */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-600 text-white font-mono text-xs">POST</Badge>
                    <code className="text-xs font-mono font-bold text-[#0f172a]">/api/v1/events/:id/attendees</code>
                    <span className="text-xs text-[#64748b]">— Register attendee and issue unique QR ticket code</span>
                  </div>
                  <pre className="text-[11px] font-mono bg-[#0f172a] text-zinc-200 p-4 rounded-2xl overflow-x-auto">
{`curl -X POST "${window.location.origin}/api/v1/events/1/attendees" \\
  -H "x-api-key: ${sampleApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Sarah Connor",
    "email": "sarah@example.com",
    "phone": "+1 555-0199",
    "ticketType": "VIP Pass"
  }'`}
                  </pre>
                </div>

                {/* Endpoint 3: Ticket Check-in Scanner */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-600 text-white font-mono text-xs">POST</Badge>
                    <code className="text-xs font-mono font-bold text-[#0f172a]">/api/v1/checkin</code>
                    <span className="text-xs text-[#64748b]">— Real-time on-site barcode / QR ticket scanner verification</span>
                  </div>
                  <pre className="text-[11px] font-mono bg-[#0f172a] text-zinc-200 p-4 rounded-2xl overflow-x-auto">
{`curl -X POST "${window.location.origin}/api/v1/checkin" \\
  -H "x-api-key: ${sampleApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "ticketCode": "EVX-1-TECH-781"
  }'`}
                  </pre>
                </div>

                {/* Endpoint 4: Stats */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-600 text-white font-mono text-xs">GET</Badge>
                    <code className="text-xs font-mono font-bold text-[#0f172a]">/api/v1/stats</code>
                    <span className="text-xs text-[#64748b]">— Real-time ticket sales and attendee metrics</span>
                  </div>
                  <pre className="text-[11px] font-mono bg-[#0f172a] text-zinc-200 p-4 rounded-2xl overflow-x-auto">
{`curl -X GET "${window.location.origin}/api/v1/stats" \\
  -H "x-api-key: ${sampleApiKey}"`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

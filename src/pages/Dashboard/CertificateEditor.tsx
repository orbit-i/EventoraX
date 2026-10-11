import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  EyeOff, 
  ZoomIn, 
  ZoomOut, 
  Grid, 
  ShieldCheck, 
  Trash2, 
  Settings2,
  Upload,
  Plus,
  Palette
} from 'lucide-react';
import { CERTIFICATE_TEMPLATES_100 } from '@/data/certificateTemplates';

interface CanvasElement {
  id: string;
  type: 'title' | 'text' | 'variable' | 'signature' | 'badge' | 'qr';
  text: string;
  x: number; // percentage
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string;
  align: 'left' | 'center' | 'right';
  variableKey?: string;
}

const PRESET_THEMES = [
  { id: 'cobalt_executive', name: 'Cobalt Executive', primary: '#1d4ed8', border: '#3b82f6', bg: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)' },
  { id: 'gold_diploma', name: 'Golden Honors', primary: '#b45309', border: '#f59e0b', bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' },
  { id: 'modern_dark', name: 'Cyber Minimalist', primary: '#38bdf8', border: '#0284c7', bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', textColor: '#f8fafc' },
  { id: 'emerald_summit', name: 'Emerald Crest', primary: '#047857', border: '#10b981', bg: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)' },
  { id: 'crimson_royalty', name: 'Crimson Royalty', primary: '#991b1b', border: '#ef4444', bg: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)' },
  { id: 'vintage_parchment', name: 'Vintage Classic', primary: '#78350f', border: '#d97706', bg: 'linear-gradient(135deg, #fefce8 0%, #fef08a 100%)' },
  { id: 'deep_sapphire', name: 'Sapphire Prestige', primary: '#1e3a8a', border: '#60a5fa', bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' },
  { id: 'clean_platinum', name: 'Clean Platinum', primary: '#334155', border: '#94a3b8', bg: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }
];

const FONTS = [
  'Cinzel',
  'Playfair Display',
  'Montserrat',
  'Inter',
  'Space Grotesk',
  'Georgia',
  'Times New Roman'
];

export default function CertificateEditor() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  // Template State
  const [templateName, setTemplateName] = useState('Executive Technology Excellence Award');
  const [theme, setTheme] = useState(PRESET_THEMES[0]);
  const [versionNumber, setVersionNumber] = useState(1);
  const [isSaved, setIsSaved] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [selectedId, setSelectedId] = useState<string | null>('el-name');
  const [mobileTab, setMobileTab] = useState<'canvas' | 'tools' | 'properties'>('canvas');

  // Auto-fit zoom on mobile viewport
  useEffect(() => {
    if (window.innerWidth < 640) {
      setZoomLevel(38);
    } else if (window.innerWidth < 1024) {
      setZoomLevel(60);
    }
  }, []);

  // Custom Template Image Upload
  const [customBgUrl, setCustomBgUrl] = useState<string | null>(null);

  // 10+ Sponsor Logos Bar
  const [showSponsorsBar, setShowSponsorsBar] = useState(true);
  const [sponsorsList] = useState<any[]>([
    { name: 'Google Cloud', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/googlecloud/googlecloud-original.svg' },
    { name: 'AWS Cloud', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg' },
    { name: 'Microsoft Azure', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg' },
    { name: 'GitHub', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg' },
    { name: 'Stripe', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/stripe/stripe-original.svg' },
    { name: 'Jazz Digital', logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&q=80' },
    { name: 'Systems Ltd', logo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&w=80&q=80' },
    { name: 'NetSol Tech', logo: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=80&q=80' },
    { name: 'NayaPay', logo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=80&q=80' },
    { name: 'Meezan Bank', logo: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=80&q=80' }
  ]);

  // Canvas elements state
  const [elements, setElements] = useState<CanvasElement[]>([
    { id: 'el-title', type: 'title', text: 'CERTIFICATE OF EXCELLENCE', x: 50, y: 20, fontSize: 30, fontFamily: 'Cinzel', fontWeight: 'bold', color: '#1d4ed8', align: 'center' },
    { id: 'el-subtitle', type: 'text', text: 'THIS IS PROUDLY PRESENTED TO', x: 50, y: 29, fontSize: 13, fontFamily: 'Montserrat', fontWeight: '600', color: '#64748b', align: 'center' },
    { id: 'el-name', type: 'variable', text: '{{recipient_name}}', x: 50, y: 41, fontSize: 38, fontFamily: 'Playfair Display', fontWeight: 'bold', color: '#0f172a', align: 'center', variableKey: 'recipient_name' },
    { id: 'el-body', type: 'text', text: 'for outstanding performance and successful participation in {{event_name}}.', x: 50, y: 52, fontSize: 15, fontFamily: 'Inter', fontWeight: 'normal', color: '#475569', align: 'center' },
    { id: 'el-date', type: 'variable', text: 'Issued on: {{issue_date}}', x: 25, y: 72, fontSize: 13, fontFamily: 'Inter', fontWeight: '500', color: '#64748b', align: 'center', variableKey: 'issue_date' },
    { id: 'el-id', type: 'variable', text: 'ID: {{certificate_id}}', x: 75, y: 72, fontSize: 13, fontFamily: 'Space Grotesk', fontWeight: '600', color: '#1d4ed8', align: 'center', variableKey: 'certificate_id' },
    { id: 'el-sign', type: 'text', text: 'Authorized Executive\nEventoraX Credentials', x: 50, y: 72, fontSize: 12, fontFamily: 'Montserrat', fontWeight: '600', color: '#334155', align: 'center' }
  ]);

  useEffect(() => {
    if (id) {
      const match = CERTIFICATE_TEMPLATES_100.find(t => String(t.id) === id);
      if (match) {
        setTemplateName(match.name);
        setTheme({
          id: `custom_${match.id}`,
          name: match.name,
          primary: match.primaryColor,
          border: match.accentColor,
          bg: match.background
        });
      }
    }
  }, [id]);

  const selectedElement = elements.find(el => el.id === selectedId) || null;

  const updateElements = (newElements: CanvasElement[]) => {
    setElements(newElements);
    setIsSaved(false);
  };

  const addVariable = (varTag: string) => {
    const newEl: CanvasElement = {
      id: `el-var-${Date.now()}`,
      type: 'variable',
      text: varTag,
      x: 50,
      y: 50,
      fontSize: 16,
      fontFamily: 'Inter',
      fontWeight: '600',
      color: theme.primary,
      align: 'center',
      variableKey: varTag.replace(/[{}]/g, '')
    };
    updateElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const addTextElement = () => {
    const newEl: CanvasElement = {
      id: `el-text-${Date.now()}`,
      type: 'text',
      text: 'Custom Certificate Heading',
      x: 50,
      y: 50,
      fontSize: 18,
      fontFamily: 'Montserrat',
      fontWeight: 'normal',
      color: '#334155',
      align: 'center'
    };
    updateElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const deleteElement = (idToDelete: string) => {
    updateElements(elements.filter(el => el.id !== idToDelete));
    if (selectedId === idToDelete) setSelectedId(null);
  };

  const handleSaveVersion = async () => {
    setIsSaved(true);
    setVersionNumber(prev => prev + 1);
    alert(`Version snapshot v${versionNumber + 1}.0 saved successfully!`);
  };

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomBgUrl(url);
      setIsSaved(false);
    }
  };

  const getRenderedText = (el: CanvasElement) => {
    if (!previewMode) return el.text;
    let t = el.text;
    t = t.replace('{{recipient_name}}', 'Dr. Alexander Wright');
    t = t.replace('{{certificate_id}}', 'EVX-CERT-2025-001');
    t = t.replace('{{issue_date}}', new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
    t = t.replace('{{event_name}}', 'Global Tech Summit 2025');
    t = t.replace('{{organization_name}}', 'EventoraX Global');
    return t;
  };

  // Download High-Res PNG
  const handleDownloadPng = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1123;
    canvas.height = 794;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, '#eff6ff');
    grad.addColorStop(1, '#f8fafc');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = theme.primary || '#1d4ed8';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    elements.forEach((el) => {
      const textToDraw = getRenderedText(el);
      const fontSize = el.fontSize || 16;
      ctx.font = `${el.fontWeight || 'normal'} ${fontSize}px ${el.fontFamily || 'Cinzel'}, sans-serif`;
      ctx.fillStyle = el.type === 'title' ? theme.primary : (el.color || '#0f172a');
      ctx.textAlign = (el.align as CanvasTextAlign) || 'center';
      const xPos = (el.x / 100) * canvas.width;
      const yPos = (el.y / 100) * canvas.height;
      const lines = textToDraw.split('\n');
      const lineHeight = fontSize * 1.35;
      lines.forEach((line, lineIdx) => {
        ctx.fillText(line, xPos, yPos + (lineIdx * lineHeight));
      });
    });

    const link = document.createElement('a');
    link.download = `${templateName.toLowerCase().replace(/\s+/g, '-')}-v${versionNumber}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="h-screen max-h-screen flex flex-col overflow-hidden bg-[#f1f5f9] antialiased select-none">
      {/* Top Navigation & Action Bar */}
      <header className="min-h-16 h-auto py-2.5 bg-white border-b border-[#cbd5e1] px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 shrink-0 z-40 shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard/certificates')}
            className="p-2 rounded-xl text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition-colors"
            title="Back to Certificates"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={templateName}
                onChange={(e) => { setTemplateName(e.target.value); setIsSaved(false); }}
                className="text-sm sm:text-base font-extrabold text-[#0f172a] bg-transparent border-b border-transparent hover:border-[#cbd5e1] focus:border-[#1d4ed8] focus:outline-none transition-colors max-w-[180px] sm:max-w-xs"
              />
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#1d4ed8] border border-blue-200">
                v{versionNumber}.0
              </span>
            </div>
            <div className="text-[11px] text-[#64748b] flex items-center gap-2">
              <span className="hidden sm:inline">A4 Landscape (1123 × 794 px) •</span>
              <span className={isSaved ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                {isSaved ? "Saved" : "Unsaved changes"}
              </span>
            </div>
          </div>
        </div>

        {/* Center Canvas Tools */}
        <div className="flex items-center gap-1.5 bg-[#f8fafc] p-1 rounded-xl border border-[#cbd5e1] order-3 sm:order-2">
          <button
            onClick={() => setZoomLevel(Math.max(30, zoomLevel - 10))}
            className="p-1.5 rounded-lg text-[#64748b] hover:text-[#0f172a] hover:bg-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-[#334155] px-1.5">{zoomLevel}%</span>
          <button
            onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}
            className="p-1.5 rounded-lg text-[#64748b] hover:text-[#0f172a] hover:bg-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-[#cbd5e1] mx-0.5" />
          <button
            onClick={() => setShowGuides(!showGuides)}
            className={`p-1.5 rounded-lg transition-colors ${showGuides ? 'bg-blue-100 text-[#1d4ed8]' : 'text-[#64748b] hover:bg-white'}`}
            title="Toggle Alignment Guides"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              previewMode ? 'bg-emerald-100 text-emerald-800' : 'text-[#64748b] hover:bg-white'
            }`}
            title="Preview with Live Data"
          >
            {previewMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{previewMode ? 'Live Preview' : 'Design Mode'}</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 order-2 sm:order-3">
          <Link
            to="/dashboard/design-studio?type=certificate"
            className="hidden md:flex px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Palette className="w-3.5 h-3.5 text-purple-600" />
            Canva Studio
          </Link>
          <button
            onClick={handleDownloadPng}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            Download PNG
          </button>
          <button
            onClick={handleSaveVersion}
            className="px-3 sm:px-4 py-1.5 rounded-xl bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save Snapshot</span> v{versionNumber + 1}.0
          </button>
        </div>
      </header>

      {/* Mobile Tab Bar (Visible on mobile/tablet screens < lg) */}
      <div className="lg:hidden flex items-center justify-around bg-white border-b border-[#cbd5e1] px-2 py-1.5 shrink-0 z-30 shadow-xs">
        <button
          type="button"
          onClick={() => setMobileTab('tools')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg text-center transition-all ${
            mobileTab === 'tools' ? 'bg-blue-50 text-[#1d4ed8] shadow-xs' : 'text-[#64748b]'
          }`}
        >
          🛠️ Tools & Tags
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('canvas')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg text-center transition-all ${
            mobileTab === 'canvas' ? 'bg-blue-50 text-[#1d4ed8] shadow-xs' : 'text-[#64748b]'
          }`}
        >
          🎨 Canvas ({zoomLevel}%)
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('properties')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg text-center transition-all ${
            mobileTab === 'properties' ? 'bg-blue-50 text-[#1d4ed8] shadow-xs' : 'text-[#64748b]'
          }`}
        >
          ⚙️ Inspector {selectedId ? '•' : ''}
        </button>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <aside className={`w-full lg:w-72 bg-white border-r border-[#cbd5e1] p-5 flex flex-col gap-5 overflow-y-auto shrink-0 ${
          mobileTab === 'tools' ? 'flex' : 'hidden lg:flex'
        }`}>
          {/* Custom Background Graphic Upload */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-800 block flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-[#1d4ed8]" />
              Upload Custom Background
            </span>
            <p className="text-[10px] text-slate-500">
              Upload your own custom designed certificate graphic (PNG/JPG).
            </p>
            <label className="w-full py-2 px-3 rounded-xl bg-white border border-slate-300 hover:border-blue-500 text-xs font-bold text-blue-700 text-center cursor-pointer block transition-colors">
              <span>{customBgUrl ? 'Replace Background' : 'Choose Background Image'}</span>
              <input type="file" accept="image/*" onChange={handleCustomImageUpload} className="hidden" />
            </label>
            {customBgUrl && (
              <button
                onClick={() => setCustomBgUrl(null)}
                className="text-[10px] text-rose-600 font-bold hover:underline block"
              >
                Reset to Theme Gradient
              </button>
            )}
          </div>

          {/* 10+ Sponsors Bar Toggle */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">10+ Sponsor Logos Bar</span>
              <input
                type="checkbox"
                checked={showSponsorsBar}
                onChange={(e) => setShowSponsorsBar(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </div>
            <p className="text-[10px] text-slate-500">
              Renders sponsor & organizer logos horizontally across certificate footer.
            </p>
          </div>

          {/* Add Text Layer */}
          <div>
            <button
              onClick={addTextElement}
              className="w-full py-2.5 px-3 rounded-xl bg-blue-50 text-[#1d4ed8] border border-blue-200 hover:bg-blue-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add Custom Text Block
            </button>
          </div>

          {/* Dynamic Placeholders */}
          <div>
            <h4 className="text-xs font-bold text-[#64748b] uppercase tracking-wider mb-2">Dynamic Tags</h4>
            <div className="flex flex-col gap-1.5">
              {[
                { tag: '{{recipient_name}}', label: 'Recipient Name' },
                { tag: '{{event_name}}', label: 'Event Name' },
                { tag: '{{issue_date}}', label: 'Issue Date' },
                { tag: '{{certificate_id}}', label: 'Certificate Hash ID' },
                { tag: '{{organization_name}}', label: 'Organization Title' }
              ].map(v => (
                <button
                  key={v.tag}
                  onClick={() => addVariable(v.tag)}
                  className="px-3 py-2 rounded-xl text-left text-xs bg-[#f8fafc] hover:bg-[#eff6ff] hover:text-[#1d4ed8] border border-[#e2e8f0] transition-colors flex items-center justify-between group"
                >
                  <span className="font-semibold text-[#334155]">{v.label}</span>
                  <Plus className="w-3.5 h-3.5 text-[#94a3b8] group-hover:text-[#1d4ed8]" />
                </button>
              ))}
            </div>
          </div>

          {/* Theme Presets */}
          <div>
            <h4 className="text-xs font-bold text-[#64748b] uppercase tracking-wider mb-2">Border Themes</h4>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTheme(t); setIsSaved(false); }}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                    theme.id === t.id ? 'border-[#1d4ed8] bg-blue-50/60 ring-2 ring-blue-500/20' : 'border-slate-200'
                  }`}
                >
                  <div className="w-full h-3 rounded-md mb-1.5" style={{ background: t.bg, borderColor: t.border, borderWidth: 1 }} />
                  <span className="text-[11px] block truncate">{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Center Canvas Viewport */}
        <main className={`flex-1 overflow-auto p-4 sm:p-12 items-center justify-center bg-slate-100/70 ${
          mobileTab === 'canvas' ? 'flex' : 'hidden lg:flex'
        }`}>
          <div 
            style={{ 
              transform: `scale(${zoomLevel / 100})`, 
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease'
            }}
          >
            {/* The Certificate Canvas */}
            <div 
              className={`w-[980px] h-[690px] relative rounded-3xl shadow-2xl overflow-hidden select-none border-8 ${
                showGuides ? 'ring-1 ring-[#cbd5e1]' : ''
              }`}
              style={{
                background: customBgUrl ? `url(${customBgUrl}) center/cover no-repeat` : theme.bg,
                borderColor: theme.border
              }}
            >
              {/* Corner Ornaments */}
              <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4" style={{ borderColor: theme.primary }} />
              <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4" style={{ borderColor: theme.primary }} />
              <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4" style={{ borderColor: theme.primary }} />
              <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4" style={{ borderColor: theme.primary }} />

              {/* Background watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <ShieldCheck className="w-96 h-96" style={{ color: theme.primary }} />
              </div>

              {/* Alignment Guides */}
              {showGuides && (
                <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 pointer-events-none opacity-20">
                  {Array.from({ length: 144 }).map((_, i) => (
                    <div key={i} className="border border-[#94a3b8]/40" />
                  ))}
                </div>
              )}

              {/* Canvas Elements */}
              {elements.map((el) => {
                const isSelected = selectedId === el.id;
                const displayText = getRenderedText(el);

                return (
                  <div
                    key={el.id}
                    onClick={() => setSelectedId(el.id)}
                    style={{
                      position: 'absolute',
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      transform: 'translate(-50%, -50%)',
                      fontSize: `${el.fontSize}px`,
                      fontFamily: el.fontFamily,
                      fontWeight: el.fontWeight,
                      color: el.type === 'title' ? theme.primary : el.color,
                      textAlign: el.align,
                      cursor: 'pointer',
                      whiteSpace: 'pre-wrap'
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      isSelected && !previewMode 
                        ? 'ring-2 ring-[#1d4ed8] ring-offset-2 bg-blue-50/40 shadow-md' 
                        : 'hover:outline hover:outline-dashed hover:outline-1 hover:outline-[#1d4ed8]/50'
                    }`}
                  >
                    {displayText}
                  </div>
                );
              })}

              {/* 10+ Sponsors Bar Footer */}
              {showSponsorsBar && (
                <div className="absolute bottom-4 inset-x-12 p-2 bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/60 flex items-center justify-between gap-3 shadow-xs">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap pl-2">
                    Official Partners:
                  </div>
                  <div className="flex items-center gap-4 overflow-x-auto pr-2">
                    {sponsorsList.map((sp, idx) => (
                      <div key={idx} className="flex items-center gap-1 shrink-0 opacity-80 hover:opacity-100 transition-opacity">
                        <img src={sp.logo} alt={sp.name} className="h-5 w-auto max-w-[50px] object-contain" />
                        <span className="text-[8px] font-bold text-slate-700">{sp.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Element Properties Inspector */}
        <aside className={`w-full lg:w-80 bg-white border-l border-[#cbd5e1] p-5 flex flex-col gap-6 overflow-y-auto shrink-0 ${
          mobileTab === 'properties' ? 'flex' : 'hidden lg:flex'
        }`}>
          {selectedElement ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
                <h4 className="text-xs font-bold text-[#64748b] uppercase tracking-wider flex items-center gap-1.5">
                  <Settings2 className="w-4 h-4 text-[#1d4ed8]" />
                  Element Properties
                </h4>
                <button
                  onClick={() => deleteElement(selectedElement.id)}
                  className="text-red-600 hover:text-red-700 p-1 rounded-md hover:bg-red-50 text-xs font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>

              {/* Text Content */}
              <div>
                <label className="text-xs font-bold text-[#475569] block mb-1">Text Content</label>
                <textarea
                  value={selectedElement.text}
                  onChange={(e) => {
                    const newText = e.target.value;
                    updateElements(elements.map(el => el.id === selectedElement.id ? { ...el, text: newText } : el));
                  }}
                  rows={2}
                  className="w-full p-2.5 bg-[#f8fafc] border border-[#cbd5e1] focus:border-[#1d4ed8] rounded-xl text-xs font-semibold text-[#0f172a] focus:outline-none"
                />
              </div>

              {/* Font Family */}
              <div>
                <label className="text-xs font-bold text-[#475569] block mb-1">Font Family</label>
                <select
                  value={selectedElement.fontFamily}
                  onChange={(e) => {
                    const font = e.target.value;
                    updateElements(elements.map(el => el.id === selectedElement.id ? { ...el, fontFamily: font } : el));
                  }}
                  className="w-full p-2.5 bg-[#f8fafc] border border-[#cbd5e1] focus:border-[#1d4ed8] rounded-xl text-xs font-semibold text-[#0f172a] focus:outline-none"
                >
                  {FONTS.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              {/* Font Size & Controls */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#475569]">Size ({selectedElement.fontSize}px)</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const sz = Math.max(8, (selectedElement.fontSize || 16) - 2);
                        updateElements(elements.map(el => el.id === selectedElement.id ? { ...el, fontSize: sz } : el));
                      }}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                      title="Decrease Size"
                    >
                      A-
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const sz = Math.min(140, (selectedElement.fontSize || 16) + 2);
                        updateElements(elements.map(el => el.id === selectedElement.id ? { ...el, fontSize: sz } : el));
                      }}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                      title="Increase Size"
                    >
                      A+
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min={8}
                  max={120}
                  value={selectedElement.fontSize || 16}
                  onChange={(e) => {
                    const sz = parseInt(e.target.value, 10) || 12;
                    updateElements(elements.map(el => el.id === selectedElement.id ? { ...el, fontSize: sz } : el));
                  }}
                  className="w-full accent-[#1d4ed8]"
                />
              </div>

              {/* Weight & Alignment */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#475569] block mb-1">Weight</label>
                  <select
                    value={selectedElement.fontWeight}
                    onChange={(e) => {
                      const w = e.target.value;
                      updateElements(elements.map(el => el.id === selectedElement.id ? { ...el, fontWeight: w } : el));
                    }}
                    className="w-full p-2 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl text-xs font-semibold"
                  >
                    <option value="normal">Normal</option>
                    <option value="600">Semi Bold</option>
                    <option value="bold">Bold</option>
                  </select>
                </div>
              </div>

              {/* Color & Alignment */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#475569] block mb-1">Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedElement.color || theme.primary || '#0f172a'}
                      onChange={(e) => {
                        const col = e.target.value;
                        updateElements(elements.map(el => el.id === selectedElement.id ? { ...el, color: col } : el));
                      }}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                    />
                    <input
                      type="text"
                      value={selectedElement.color || theme.primary || '#0f172a'}
                      onChange={(e) => {
                        const col = e.target.value;
                        updateElements(elements.map(el => el.id === selectedElement.id ? { ...el, color: col } : el));
                      }}
                      className="w-20 p-1.5 border rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#475569] block mb-1">Align</label>
                  <div className="flex border rounded-xl overflow-hidden">
                    {(['left', 'center', 'right'] as const).map((al) => (
                      <button
                        key={al}
                        onClick={() => {
                          updateElements(elements.map(el => el.id === selectedElement.id ? { ...el, align: al } : el));
                        }}
                        className={`flex-1 py-1 text-xs font-bold capitalize ${
                          selectedElement.align === al ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-700'
                        }`}
                      >
                        {al[0].toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Coordinates */}
              <div className="pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Canvas Coordinates (%)</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block">X (Horizontal %)</label>
                    <input
                      type="number"
                      value={selectedElement.x}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        updateElements(elements.map(el => el.id === selectedElement.id ? { ...el, x: val } : el));
                      }}
                      className="w-full p-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">Y (Vertical %)</label>
                    <input
                      type="number"
                      value={selectedElement.y}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        updateElements(elements.map(el => el.id === selectedElement.id ? { ...el, y: val } : el));
                      }}
                      className="w-full p-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              Click any element on the certificate canvas to edit its font, size, and coordinates.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Save, 
  Download, 
  Printer, 
  Eye, 
  EyeOff, 
  ZoomIn, 
  ZoomOut, 
  Grid, 
  Trash2, 
  Copy, 
  Plus, 
  Layers, 
  Check, 
  Palette, 
  CreditCard,
  QrCode,
  Type,
  Image as ImageIcon
} from 'lucide-react';
import { printElement } from '@/lib/printUtils';

export interface IDCanvasElement {
  id: string;
  type: 'text' | 'image' | 'qr' | 'barcode' | 'avatar';
  text?: string;
  imageUrl?: string;
  imageAlt?: string;
  x: number; // percentage (0 to 100)
  y: number; // percentage (0 to 100)
  width?: number; // px
  height?: number; // px
  fontSize?: number; // px
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  rotation?: number; // degrees
  opacity?: number;
  variableKey?: string;
}

const FONTS = [
  'Space Grotesk',
  'Montserrat',
  'Inter',
  'Cinzel',
  'Playfair Display',
  'Oswald',
  'Georgia'
];

const BADGE_PRESETS = [
  { id: 'id_vertical', name: 'Executive Lanyard (480 × 760 px)', width: 480, height: 760, orientation: 'vertical' },
  { id: 'id_horizontal', name: 'Corporate Clip Card (760 × 480 px)', width: 760, height: 480, orientation: 'horizontal' },
  { id: 'cr80_card', name: 'Standard CR80 Badge (520 × 820 px)', width: 520, height: 820, orientation: 'vertical' }
];

export default function IDCardEditor() {
  const navigate = useNavigate();

  // Document Info
  const [badgeTitle, setBadgeTitle] = useState('Executive Attendee Conference Badge');
  const [selectedPreset, setSelectedPreset] = useState('id_vertical');
  const [canvasWidth, setCanvasWidth] = useState(480);
  const [canvasHeight, setCanvasHeight] = useState(760);
  const [hasLanyardHole, setHasLanyardHole] = useState(true);

  // Background
  const [bgType, setBgType] = useState<'gradient' | 'color' | 'image'>('gradient');
  const [bgColor, setBgColor] = useState('#0f172a');
  const [bgGradient, setBgGradient] = useState('linear-gradient(180deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)');
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);

  // Studio Controls
  const [zoomLevel, setZoomLevel] = useState(90);
  const [showGrid, setShowGrid] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>('el-name');
  const [mobileTab, setMobileTab] = useState<'canvas' | 'tools' | 'properties'>('canvas');

  // Auto-fit zoom on mobile viewport
  useEffect(() => {
    if (window.innerWidth < 640) {
      setZoomLevel(55);
    } else if (window.innerWidth < 1024) {
      setZoomLevel(75);
    }
  }, []);

  // Dragging state
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragElementId, setDragElementId] = useState<string | null>(null);

  // Elements state
  const [elements, setElements] = useState<IDCanvasElement[]>([
    {
      id: 'el-ev-header',
      type: 'text',
      text: 'GLOBAL TECH SUMMIT 2026',
      x: 50,
      y: 11,
      fontSize: 14,
      fontFamily: 'Space Grotesk',
      fontWeight: 'bold',
      color: '#60a5fa',
      align: 'center',
      letterSpacing: 2
    },
    {
      id: 'el-avatar',
      type: 'avatar',
      x: 50,
      y: 25,
      width: 95,
      height: 95
    },
    {
      id: 'el-name',
      type: 'text',
      text: '{{attendee_name}}',
      x: 50,
      y: 38,
      fontSize: 22,
      fontFamily: 'Montserrat',
      fontWeight: 'bold',
      color: '#ffffff',
      align: 'center',
      variableKey: 'attendee_name'
    },
    {
      id: 'el-role',
      type: 'text',
      text: '{{designation}}',
      x: 50,
      y: 44,
      fontSize: 13,
      fontFamily: 'Inter',
      fontWeight: '600',
      color: '#93c5fd',
      align: 'center',
      variableKey: 'designation'
    },
    {
      id: 'el-org',
      type: 'text',
      text: '{{organization}}',
      x: 50,
      y: 49,
      fontSize: 12,
      fontFamily: 'Inter',
      fontWeight: 'normal',
      color: '#94a3b8',
      align: 'center',
      variableKey: 'organization'
    },
    {
      id: 'el-tier',
      type: 'text',
      text: 'VIP ALL-ACCESS PASS',
      x: 50,
      y: 56,
      fontSize: 11,
      fontFamily: 'Space Grotesk',
      fontWeight: 'bold',
      color: '#fbbf24',
      align: 'center',
      letterSpacing: 2
    },
    {
      id: 'el-qr',
      type: 'qr',
      x: 50,
      y: 71,
      width: 95,
      height: 95
    },
    {
      id: 'el-barcode',
      type: 'barcode',
      x: 50,
      y: 89,
      width: 220,
      height: 40
    }
  ]);

  const selectedElement = elements.find((el) => el.id === selectedId) || null;

  // Preset switch
  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId);
    setIsSaved(false);
    const preset = BADGE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setCanvasWidth(preset.width);
      setCanvasHeight(preset.height);
      setHasLanyardHole(preset.orientation === 'vertical');
    }
  };

  // Add text element
  const addTextElement = (text = 'Custom Text Layer') => {
    const newEl: IDCanvasElement = {
      id: `el-text-${Date.now()}`,
      type: 'text',
      text,
      x: 50,
      y: 50,
      fontSize: 14,
      fontFamily: 'Inter',
      fontWeight: '600',
      color: '#ffffff',
      align: 'center'
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
    setIsSaved(false);
  };

  // Add dynamic variable
  const addVariable = (tag: string, label: string) => {
    const newEl: IDCanvasElement = {
      id: `el-var-${Date.now()}`,
      type: 'text',
      text: tag,
      x: 50,
      y: 50,
      fontSize: 15,
      fontFamily: 'Montserrat',
      fontWeight: 'bold',
      color: '#60a5fa',
      align: 'center',
      variableKey: label
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
    setIsSaved(false);
  };

  // Add Logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        const newEl: IDCanvasElement = {
          id: `el-logo-${Date.now()}`,
          type: 'image',
          imageUrl: url,
          imageAlt: file.name,
          x: 50,
          y: 18,
          width: 90,
          height: 45
        };
        setElements([...elements, newEl]);
        setSelectedId(newEl.id);
        setIsSaved(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Custom Background Upload
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomBgImage(url);
      setBgType('image');
      setIsSaved(false);
    }
  };

  // Delete element
  const deleteElement = (id: string) => {
    setElements(elements.filter((el) => el.id !== id));
    if (selectedId === id) setSelectedId(null);
    setIsSaved(false);
  };

  // Duplicate element
  const duplicateElement = (el: IDCanvasElement) => {
    const clone: IDCanvasElement = {
      ...el,
      id: `el-clone-${Date.now()}`,
      x: Math.min(el.x + 3, 90),
      y: Math.min(el.y + 3, 90)
    };
    setElements([...elements, clone]);
    setSelectedId(clone.id);
    setIsSaved(false);
  };

  // Dragging handlers
  const handleMouseDown = (elId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedId(elId);
    setDragElementId(elId);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragElementId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPercent = Math.max(0, Math.min(100, Math.round((mouseX / rect.width) * 100)));
    const yPercent = Math.max(0, Math.min(100, Math.round((mouseY / rect.height) * 100)));

    setElements(elements.map((el) => 
      el.id === dragElementId ? { ...el, x: xPercent, y: yPercent } : el
    ));
    setIsSaved(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragElementId(null);
  };

  // Render text with preview replacements
  const getRenderedContent = (el: IDCanvasElement) => {
    if (!previewMode || !el.text) return el.text || '';
    let t = el.text;
    t = t.replace('{{attendee_name}}', 'Dr. Alexander Wright');
    t = t.replace('{{recipient_name}}', 'Dr. Alexander Wright');
    t = t.replace('{{designation}}', 'Chief Technology Officer');
    t = t.replace('{{organization}}', 'Orbit Dynamics Global');
    t = t.replace('{{ticket_code}}', 'EVX-1-TECH-781');
    t = t.replace('{{ticket_type}}', 'VIP All-Access Pass');
    t = t.replace('{{event_title}}', 'Global Tech Summit 2026');
    t = t.replace('{{event_name}}', 'Global Tech Summit 2026');
    return t;
  };

  // Download High-Resolution Badge PNG
  const handleDownloadPng = () => {
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    if (bgType === 'color') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.6, '#1e1b4b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // Border
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, canvasWidth - 24, canvasHeight - 24);

    // Text elements
    elements.forEach((el) => {
      if (el.type === 'text') {
        const textToDraw = getRenderedContent(el);
        const fontSize = el.fontSize || 14;
        ctx.font = `${el.fontWeight || 'normal'} ${fontSize}px ${el.fontFamily || 'Inter'}, sans-serif`;
        ctx.fillStyle = el.color || '#ffffff';
        ctx.textAlign = el.align || 'center';
        const xPos = (el.x / 100) * canvasWidth;
        const yPos = (el.y / 100) * canvasHeight;
        ctx.fillText(textToDraw, xPos, yPos);
      }
    });

    const link = document.createElement('a');
    link.download = `${badgeTitle.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="h-screen max-h-screen flex flex-col overflow-hidden bg-[#f1f5f9] select-none" onMouseUp={handleMouseUp}>
      {/* Top Navbar */}
      <header className="min-h-16 h-auto py-2.5 bg-white border-b border-[#cbd5e1] px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 z-30 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard/id-cards')}
            className="p-2 rounded-xl text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition-colors"
            title="Back to ID Badges"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#1d4ed8] flex items-center justify-center font-bold shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={badgeTitle}
                  onChange={(e) => { setBadgeTitle(e.target.value); setIsSaved(false); }}
                  className="text-sm font-extrabold text-[#0f172a] bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#1d4ed8] focus:outline-none transition-colors max-w-[170px] sm:max-w-xs"
                />
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Badge Studio
                </span>
              </div>
              <div className="text-[10px] text-[#64748b] flex items-center gap-2">
                <span>{canvasWidth} × {canvasHeight} px</span>
                <span>•</span>
                <span className={isSaved ? "text-emerald-600 font-bold flex items-center gap-1" : "text-amber-600 font-bold"}>
                  {isSaved && <Check className="w-3 h-3 inline text-emerald-600" />}
                  {isSaved ? "Template Saved" : "Unsaved"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Tools: Zoom, Grid Guides, Live Attendee Data Preview */}
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
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-lg transition-colors ${showGrid ? 'bg-blue-100 text-[#1d4ed8]' : 'text-[#64748b] hover:bg-white'}`}
            title="Toggle Alignment Guides"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              previewMode ? 'bg-emerald-100 text-emerald-800' : 'text-[#64748b] hover:bg-white'
            }`}
            title="Preview with Live Attendee Data"
          >
            {previewMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{previewMode ? 'Live Data Preview' : 'Design Mode'}</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 order-2 sm:order-3">
          <Link to="/dashboard/design-studio?type=id_badge" className="hidden md:inline-flex">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              <Palette className="w-3.5 h-3.5 text-purple-600" />
              Canva Studio
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadPng}
            className="text-xs font-bold rounded-xl flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Download</span> PNG
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (canvasRef.current) {
                printElement(canvasRef.current, `${badgeTitle} - Badge Print`);
              } else {
                window.print();
              }
            }}
            className="text-xs font-bold rounded-xl hidden sm:flex items-center gap-1.5"
            title="Print Badge"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </Button>
          <Button
            size="sm"
            onClick={() => { setIsSaved(true); alert('ID Card template saved to organization repository successfully!'); }}
            className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-600/20"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save</span> Badge
          </Button>
        </div>
      </header>

      {/* Mobile Tab Bar (Visible on mobile screens < lg) */}
      <div className="lg:hidden flex items-center justify-around bg-white border-b border-[#cbd5e1] px-2 py-1.5 shrink-0 z-30 shadow-xs">
        <button
          type="button"
          onClick={() => setMobileTab('tools')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg text-center transition-all ${
            mobileTab === 'tools' ? 'bg-blue-50 text-[#1d4ed8] shadow-xs' : 'text-[#64748b]'
          }`}
        >
          🛠️ Dimensions & Tags
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('canvas')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg text-center transition-all ${
            mobileTab === 'canvas' ? 'bg-blue-50 text-[#1d4ed8] shadow-xs' : 'text-[#64748b]'
          }`}
        >
          🪪 ID Badge ({zoomLevel}%)
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

      {/* Main Studio Body: 3-column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <aside className={`w-full lg:w-80 bg-white border-r border-[#cbd5e1] p-5 flex flex-col gap-5 overflow-y-auto shrink-0 ${
          mobileTab === 'tools' ? 'flex' : 'hidden lg:flex'
        }`}>
          {/* Badge Dimensions & Preset */}
          <div className="space-y-2 pb-4 border-b border-slate-100">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Badge Size Preset
            </label>
            <select
              value={selectedPreset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
            >
              {BADGE_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-slate-700">Lanyard Punch Hole</span>
              <input
                type="checkbox"
                checked={hasLanyardHole}
                onChange={(e) => setHasLanyardHole(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Background Styling */}
          <div className="space-y-2 pb-4 border-b border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-blue-600" />
              Badge Background
            </h4>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => { setBgType('gradient'); setIsSaved(false); }}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold ${bgType === 'gradient' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                Gradient
              </button>
              <button
                onClick={() => { setBgType('color'); setIsSaved(false); }}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold ${bgType === 'color' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                Solid
              </button>
              <button
                onClick={() => { setBgType('image'); setIsSaved(false); }}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold ${bgType === 'image' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                Image
              </button>
            </div>
            {bgType === 'gradient' && (
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {[
                  { name: 'Dark Navy', val: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)' },
                  { name: 'Royal Blue', val: 'linear-gradient(180deg, #1e3a8a 0%, #2563eb 60%, #1e3a8a 100%)' },
                  { name: 'Emerald', val: 'linear-gradient(180deg, #064e3b 0%, #059669 60%, #064e3b 100%)' },
                  { name: 'Burgundy', val: 'linear-gradient(180deg, #4c0519 0%, #be123c 60%, #4c0519 100%)' },
                ].map((g) => (
                  <button
                    key={g.name}
                    type="button"
                    onClick={() => { setBgGradient(g.val); setIsSaved(false); }}
                    className="p-1.5 rounded-lg text-[10px] font-bold text-white border border-slate-700 hover:scale-102 transition-all text-center shadow-xs truncate"
                    style={{ background: g.val }}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            )}
            {bgType === 'color' && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => { setBgColor(e.target.value); setIsSaved(false); }}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => { setBgColor(e.target.value); setIsSaved(false); }}
                  className="w-24 px-2 py-1 border rounded-lg text-xs font-mono"
                />
              </div>
            )}
            {bgType === 'image' && (
              <label className="w-full py-2 px-3 rounded-xl bg-white border border-blue-300 hover:border-blue-600 text-xs font-bold text-blue-700 text-center cursor-pointer block transition-colors">
                <span>{customBgImage ? 'Replace Image' : 'Choose Background Image'}</span>
                <input type="file" accept="image/*" onChange={handleBgUpload} className="hidden" />
              </label>
            )}
          </div>

          {/* Dynamic Placeholders */}
          <div className="space-y-2 pb-4 border-b border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Dynamic Attendee Tags
            </h4>
            <div className="flex flex-col gap-1.5">
              {[
                { tag: '{{attendee_name}}', label: 'Attendee Name' },
                { tag: '{{designation}}', label: 'Designation' },
                { tag: '{{organization}}', label: 'Company / Org' },
                { tag: '{{ticket_code}}', label: 'Ticket Code' },
                { tag: '{{ticket_type}}', label: 'Access Tier' },
                { tag: '{{event_title}}', label: 'Event Title' }
              ].map((v) => (
                <button
                  key={v.tag}
                  onClick={() => addVariable(v.tag, v.label)}
                  className="px-3 py-2 rounded-xl text-left text-xs bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition-colors flex items-center justify-between group"
                >
                  <span className="font-semibold text-slate-700">{v.label}</span>
                  <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                </button>
              ))}
            </div>
          </div>

          {/* Badges & Elements */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Add Elements
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => addTextElement('Custom Header')}
                className="text-xs font-bold rounded-xl justify-start gap-1.5"
              >
                <Type className="w-3.5 h-3.5 text-blue-600" />
                Text Layer
              </Button>
              <label className="py-2 px-3 rounded-xl border border-slate-300 hover:border-blue-600 bg-white text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs">
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>Logo Upload</span>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
            </div>
          </div>
        </aside>

        {/* Center Canvas Viewport */}
        <main
          className={`flex-1 overflow-auto p-4 sm:p-12 items-center justify-center relative bg-slate-100 ${
            mobileTab === 'canvas' ? 'flex' : 'hidden lg:flex'
          }`}
          onMouseMove={handleMouseMove}
        >
          <div
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.15s ease'
            }}
          >
            {/* The Badge Canvas */}
            <div
              ref={canvasRef}
              onClick={() => setSelectedId(null)}
              className="relative rounded-3xl shadow-2xl overflow-hidden select-none border-4 border-slate-800"
              style={{
                width: `${canvasWidth}px`,
                height: `${canvasHeight}px`,
                background: bgType === 'image' && customBgImage 
                  ? `url(${customBgImage}) center/cover no-repeat` 
                  : (bgType === 'color' ? bgColor : bgGradient)
              }}
            >
              {/* Lanyard punch hole */}
              {hasLanyardHole && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-3.5 bg-slate-950/80 rounded-full border border-slate-600/60 z-20 pointer-events-none" />
              )}

              {/* Alignment Grid Overlay */}
              {showGrid && (
                <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 pointer-events-none opacity-15">
                  {Array.from({ length: 144 }).map((_, i) => (
                    <div key={i} className="border border-slate-400" />
                  ))}
                </div>
              )}

              {/* Elements Rendering */}
              {elements.map((el) => {
                const isSelected = selectedId === el.id;
                const displayText = getRenderedContent(el);

                return (
                  <div
                    key={el.id}
                    onMouseDown={(e) => handleMouseDown(el.id, e)}
                    style={{
                      position: 'absolute',
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      transform: `translate(-50%, -50%) rotate(${el.rotation || 0}deg)`,
                      cursor: isDragging ? 'grabbing' : 'grab',
                      userSelect: 'none'
                    }}
                    className={`transition-shadow ${
                      isSelected && !previewMode
                        ? 'ring-2 ring-blue-500 ring-offset-2 rounded-lg bg-blue-500/20 shadow-lg'
                        : 'hover:outline hover:outline-dashed hover:outline-1 hover:outline-blue-400'
                    }`}
                  >
                    {el.type === 'text' && (
                      <div
                        style={{
                          fontSize: `${el.fontSize || 14}px`,
                          fontFamily: el.fontFamily || 'Inter',
                          fontWeight: el.fontWeight || 'normal',
                          color: el.color || '#ffffff',
                          textAlign: el.align || 'center',
                          letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : 'normal',
                          whiteSpace: 'pre-wrap'
                        }}
                        className="px-2 py-1 leading-snug"
                      >
                        {displayText}
                      </div>
                    )}

                    {el.type === 'image' && (
                      <div className="p-1">
                        <img
                          src={el.imageUrl}
                          alt={el.imageAlt || 'logo'}
                          style={{
                            width: `${el.width || 80}px`,
                            height: el.height ? `${el.height}px` : 'auto',
                            objectFit: 'contain'
                          }}
                          className="pointer-events-none"
                        />
                      </div>
                    )}

                    {el.type === 'qr' && (
                      <div className="bg-white p-2 rounded-2xl shadow-inner border border-slate-200">
                        <QrCode
                          style={{
                            width: `${el.width || 90}px`,
                            height: `${el.height || 90}px`
                          }}
                          className="text-slate-900 mx-auto"
                        />
                      </div>
                    )}

                    {el.type === 'barcode' && (
                      <div className="bg-white/90 backdrop-blur-xs p-2 rounded-xl border border-slate-200 text-center font-mono">
                        <div className="h-6 flex items-center justify-center gap-0.5 max-w-[200px] mx-auto opacity-80">
                          {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 1, 3].map((w, i) => (
                            <span key={i} className="h-full bg-slate-900" style={{ width: `${w * 1.5}px` }} />
                          ))}
                        </div>
                        <span className="block mt-0.5 text-[9px] font-bold tracking-widest text-slate-800">
                          {previewMode ? 'EVX-1-TECH-781' : '{{ticket_code}}'}
                        </span>
                      </div>
                    )}

                    {el.type === 'avatar' && (
                      <div
                        style={{
                          width: `${el.width || 95}px`,
                          height: `${el.height || 95}px`
                        }}
                        className="rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-1 shadow-md"
                      >
                        <div className="w-full h-full rounded-xl bg-slate-900 flex items-center justify-center font-bold text-xl text-white">
                          AW
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {/* Right Element Properties Inspector */}
        <aside className={`w-full lg:w-80 bg-white border-l border-[#cbd5e1] p-5 flex flex-col gap-5 overflow-y-auto shrink-0 ${
          mobileTab === 'properties' ? 'flex' : 'hidden lg:flex'
        }`}>
          {selectedElement ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Element Properties ({selectedElement.type})
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => duplicateElement(selectedElement)}
                    title="Duplicate Element"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteElement(selectedElement.id)}
                    title="Delete Element"
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Text Edit */}
              {selectedElement.type === 'text' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Text Content</label>
                    <textarea
                      value={selectedElement.text || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setElements(elements.map((el) => el.id === selectedElement.id ? { ...el, text: val } : el));
                        setIsSaved(false);
                      }}
                      rows={2}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:border-blue-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Font Family</label>
                    <select
                      value={selectedElement.fontFamily || 'Inter'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setElements(elements.map((el) => el.id === selectedElement.id ? { ...el, fontFamily: val } : el));
                        setIsSaved(false);
                      }}
                      className="w-full p-2 rounded-xl border border-slate-300 text-xs font-medium bg-white"
                    >
                      {FONTS.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">Font Size ({selectedElement.fontSize || 14}px)</label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const sz = Math.max(8, (selectedElement.fontSize || 14) - 2);
                            setElements(elements.map(el => el.id === selectedElement.id ? { ...el, fontSize: sz } : el));
                            setIsSaved(false);
                          }}
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                          title="Decrease Font Size"
                        >
                          A-
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const sz = Math.min(100, (selectedElement.fontSize || 14) + 2);
                            setElements(elements.map(el => el.id === selectedElement.id ? { ...el, fontSize: sz } : el));
                            setIsSaved(false);
                          }}
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                          title="Increase Font Size"
                        >
                          A+
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={80}
                      value={selectedElement.fontSize || 14}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 12;
                        setElements(elements.map((el) => el.id === selectedElement.id ? { ...el, fontSize: val } : el));
                        setIsSaved(false);
                      }}
                      className="w-full accent-blue-600 mb-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Weight</label>
                      <select
                        value={selectedElement.fontWeight || 'normal'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setElements(elements.map((el) => el.id === selectedElement.id ? { ...el, fontWeight: val } : el));
                          setIsSaved(false);
                        }}
                        className="w-full p-2 rounded-xl border border-slate-300 text-xs font-medium bg-white"
                      >
                        <option value="normal">Normal</option>
                        <option value="600">Semi Bold</option>
                        <option value="bold">Bold</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Color</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={selectedElement.color || '#ffffff'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setElements(elements.map((el) => el.id === selectedElement.id ? { ...el, color: val } : el));
                            setIsSaved(false);
                          }}
                          className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={selectedElement.color || '#ffffff'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setElements(elements.map((el) => el.id === selectedElement.id ? { ...el, color: val } : el));
                            setIsSaved(false);
                          }}
                          className="w-full p-1.5 border rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Resize Width & Height for QR, Barcode, Avatar, Image */}
              {(selectedElement.type === 'image' || selectedElement.type === 'qr' || selectedElement.type === 'barcode' || selectedElement.type === 'avatar') && (
                <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                    Element Dimensions
                  </span>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-600">Width ({selectedElement.width || 80}px)</label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const w = Math.max(20, (selectedElement.width || 80) - 5);
                            setElements(elements.map(el => el.id === selectedElement.id ? { ...el, width: w } : el));
                            setIsSaved(false);
                          }}
                          className="px-1.5 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-xs font-bold text-slate-700"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const w = Math.min(400, (selectedElement.width || 80) + 5);
                            setElements(elements.map(el => el.id === selectedElement.id ? { ...el, width: w } : el));
                            setIsSaved(false);
                          }}
                          className="px-1.5 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-xs font-bold text-slate-700"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="350"
                      value={selectedElement.width || 80}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setElements(elements.map((el) => el.id === selectedElement.id ? { ...el, width: val } : el));
                        setIsSaved(false);
                      }}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-600">Height ({selectedElement.height || 80}px)</label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const h = Math.max(20, (selectedElement.height || 80) - 5);
                            setElements(elements.map(el => el.id === selectedElement.id ? { ...el, height: h } : el));
                            setIsSaved(false);
                          }}
                          className="px-1.5 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-xs font-bold text-slate-700"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const h = Math.min(400, (selectedElement.height || 80) + 5);
                            setElements(elements.map(el => el.id === selectedElement.id ? { ...el, height: h } : el));
                            setIsSaved(false);
                          }}
                          className="px-1.5 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-xs font-bold text-slate-700"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="350"
                      value={selectedElement.height || 80}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setElements(elements.map((el) => el.id === selectedElement.id ? { ...el, height: val } : el));
                        setIsSaved(false);
                      }}
                      className="w-full accent-blue-600"
                    />
                  </div>
                </div>
              )}

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
                        setElements(elements.map((el) => el.id === selectedElement.id ? { ...el, x: val } : el));
                        setIsSaved(false);
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
                        setElements(elements.map((el) => el.id === selectedElement.id ? { ...el, y: val } : el));
                        setIsSaved(false);
                      }}
                      className="w-full p-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 space-y-2">
              <Layers className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-600">No element selected</p>
              <p className="text-[11px] leading-relaxed">
                Click any layer on the badge to reposition or adjust its properties.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

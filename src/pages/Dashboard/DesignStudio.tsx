import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { CERTIFICATE_TEMPLATES_100 } from '@/data/certificateTemplates';
import Header from '@/components/ui/dashboard/header';
import { Button } from '@/components/ui/button';
import { 
  Type, 
  Image as ImageIcon, 
  QrCode, 
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
  RotateCw, 
  Layers, 
  Upload, 
  ArrowLeft, 
  Check, 
  ShieldCheck, 
  Palette, 
  CreditCard, 
  Award,
  Maximize2
} from 'lucide-react';

export type DesignDocType = 'certificate' | 'id_badge';

export interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'qr' | 'barcode' | 'avatar' | 'shape';
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
  'Cinzel',
  'Playfair Display',
  'Montserrat',
  'Inter',
  'Space Grotesk',
  'Oswald',
  'Georgia',
  'Times New Roman'
];

const PRESET_SPONSORS = [
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
];

export default function DesignStudio() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id?: string }>();

  // Mode: Certificate vs ID Badge
  const [docType, setDocType] = useState<DesignDocType>('certificate');
  const [docTitle, setDocTitle] = useState('Executive Technology Excellence Award');

  // Dimensions state - selective page sizing
  const [canvasWidth, setCanvasWidth] = useState(1123);
  const [canvasHeight, setCanvasHeight] = useState(794);
  const [selectedPresetSize, setSelectedPresetSize] = useState('a4_landscape');

  // Background state
  const [bgType, setBgType] = useState<'gradient' | 'image' | 'color'>('gradient');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [bgGradient, setBgGradient] = useState('linear-gradient(135deg, #ffffff 0%, #eff6ff 50%, #f8fafc 100%)');
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const [bgOpacity, setBgOpacity] = useState(100);
  const [hasLanyardHole, setHasLanyardHole] = useState(false);

  // Uploaded Custom Logos Library (Canva-style)
  const [uploadedLogos, setUploadedLogos] = useState<{ id: string; name: string; url: string }[]>([
    { id: 'logo-official', name: 'EventoraX Ribbon Star', url: '/images/eventorax-app-icon.png' },
    { id: 'logo-orbit', name: 'ORBIT-I Official Seal', url: '/images/logo-orbit.png' }
  ]);

  // Canvas elements
  const [elements, setElements] = useState<CanvasElement[]>([
    {
      id: 'el-title',
      type: 'text',
      text: 'CERTIFICATE OF EXCELLENCE',
      x: 50,
      y: 18,
      fontSize: 32,
      fontFamily: 'Cinzel',
      fontWeight: 'bold',
      color: '#1d4ed8',
      align: 'center',
      rotation: 0
    },
    {
      id: 'el-subtitle',
      type: 'text',
      text: 'PROUDLY PRESENTED TO',
      x: 50,
      y: 28,
      fontSize: 13,
      fontFamily: 'Montserrat',
      fontWeight: '600',
      color: '#64748b',
      align: 'center',
      letterSpacing: 2,
      rotation: 0
    },
    {
      id: 'el-name',
      type: 'text',
      text: '{{recipient_name}}',
      x: 50,
      y: 40,
      fontSize: 38,
      fontFamily: 'Playfair Display',
      fontWeight: 'bold',
      color: '#0f172a',
      align: 'center',
      rotation: 0,
      variableKey: 'recipient_name'
    },
    {
      id: 'el-body',
      type: 'text',
      text: 'For exemplary leadership and active participation in the {{event_name}}.',
      x: 50,
      y: 52,
      fontSize: 15,
      fontFamily: 'Inter',
      fontWeight: 'normal',
      color: '#334155',
      align: 'center',
      rotation: 0
    },
    {
      id: 'el-date',
      type: 'text',
      text: 'Date: {{issue_date}}',
      x: 25,
      y: 74,
      fontSize: 13,
      fontFamily: 'Inter',
      fontWeight: '500',
      color: '#64748b',
      align: 'center',
      rotation: 0,
      variableKey: 'issue_date'
    },
    {
      id: 'el-sign',
      type: 'text',
      text: 'Authorized Executive\nEventoraX Credentials',
      x: 75,
      y: 74,
      fontSize: 12,
      fontFamily: 'Montserrat',
      fontWeight: '600',
      color: '#1e293b',
      align: 'center',
      rotation: 0
    },
    {
      id: 'el-qr',
      type: 'qr',
      x: 50,
      y: 75,
      width: 70,
      height: 70,
      rotation: 0
    }
  ]);

  const [selectedId, setSelectedId] = useState<string | null>('el-name');
  const [previewMode, setPreviewMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(90);
  const [showGrid, setShowGrid] = useState(true);
  const [isSaved, setIsSaved] = useState(true);
  const [mobileTab, setMobileTab] = useState<'canvas' | 'tools' | 'properties'>('canvas');

  // Auto-fit zoom on mobile viewport
  useEffect(() => {
    if (window.innerWidth < 640) {
      setZoomLevel(40);
    } else if (window.innerWidth < 1024) {
      setZoomLevel(60);
    }
  }, []);

  // Dragging state
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragElementId, setDragElementId] = useState<string | null>(null);

  // Preset dimension switch
  const handleDimensionChange = (preset: string) => {
    setSelectedPresetSize(preset);
    setIsSaved(false);
    if (preset === 'a4_landscape') {
      setCanvasWidth(1123);
      setCanvasHeight(794);
      setHasLanyardHole(false);
    } else if (preset === 'a4_portrait') {
      setCanvasWidth(794);
      setCanvasHeight(1123);
      setHasLanyardHole(false);
    } else if (preset === 'us_letter_landscape') {
      setCanvasWidth(1056);
      setCanvasHeight(816);
      setHasLanyardHole(false);
    } else if (preset === 'us_letter_portrait') {
      setCanvasWidth(816);
      setCanvasHeight(1056);
      setHasLanyardHole(false);
    } else if (preset === 'presentation_16_9') {
      setCanvasWidth(1280);
      setCanvasHeight(720);
      setHasLanyardHole(false);
    } else if (preset === 'square_diploma') {
      setCanvasWidth(900);
      setCanvasHeight(900);
      setHasLanyardHole(false);
    } else if (preset === 'id_vertical') {
      setCanvasWidth(480);
      setCanvasHeight(760);
      setHasLanyardHole(true);
    } else if (preset === 'id_horizontal') {
      setCanvasWidth(760);
      setCanvasHeight(480);
      setHasLanyardHole(true);
    } else if (preset === 'cr80_card') {
      setCanvasWidth(520);
      setCanvasHeight(820);
      setHasLanyardHole(true);
    }
  };

  // Switch between Certificate & ID Badge default sets
  const switchDocType = (type: DesignDocType) => {
    setDocType(type);
    setIsSaved(false);
    if (type === 'id_badge') {
      setDocTitle('Executive Attendee Conference Badge');
      setCanvasWidth(480);
      setCanvasHeight(760);
      setSelectedPresetSize('id_vertical');
      setHasLanyardHole(true);
      setBgGradient('linear-gradient(180deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)');
      setElements([
        {
          id: 'el-ev-header',
          type: 'text',
          text: 'GLOBAL TECH SUMMIT 2025',
          x: 50,
          y: 12,
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
          y: 26,
          width: 90,
          height: 90
        },
        {
          id: 'el-name',
          type: 'text',
          text: '{{attendee_name}}',
          x: 50,
          y: 40,
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
          y: 46,
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
          y: 51,
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
          y: 58,
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
          y: 72,
          width: 90,
          height: 90
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
    } else {
      setDocTitle('Executive Technology Excellence Award');
      setCanvasWidth(1123);
      setCanvasHeight(794);
      setSelectedPresetSize('a4_landscape');
      setHasLanyardHole(false);
      setBgGradient('linear-gradient(135deg, #ffffff 0%, #eff6ff 50%, #f8fafc 100%)');
    }
  };

  useEffect(() => {
    if (location.pathname.includes('/id-cards') || location.search.includes('type=id_badge')) {
      switchDocType('id_badge');
    } else if (id) {
      const match = CERTIFICATE_TEMPLATES_100.find((t) => String(t.id) === id);
      if (match) {
        setDocType('certificate');
        setDocTitle(match.name);
        setBgGradient(match.background || 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)');
        setElements((prev) =>
          prev.map((el) => {
            if (el.id === 'el-title') {
              return { ...el, color: match.primaryColor || '#1d4ed8' };
            }
            return el;
          })
        );
      }
    }
  }, [id, location.pathname, location.search]);

  const selectedElement = elements.find((el) => el.id === selectedId) || null;

  // Add new text element
  const addTextElement = (typeLabel = 'Heading') => {
    const isHeading = typeLabel === 'Heading';
    const newEl: CanvasElement = {
      id: `el-text-${Date.now()}`,
      type: 'text',
      text: isHeading ? 'Custom Main Title' : 'Enter custom body text description here',
      x: 50,
      y: 50,
      fontSize: isHeading ? 24 : 14,
      fontFamily: isHeading ? 'Cinzel' : 'Inter',
      fontWeight: isHeading ? 'bold' : 'normal',
      color: docType === 'id_badge' ? '#ffffff' : '#0f172a',
      align: 'center',
      rotation: 0
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
    setIsSaved(false);
  };

  // Add dynamic merge variable
  const addVariableElement = (tag: string, label: string) => {
    const newEl: CanvasElement = {
      id: `el-var-${Date.now()}`,
      type: 'text',
      text: tag,
      x: 50,
      y: 50,
      fontSize: 20,
      fontFamily: 'Montserrat',
      fontWeight: 'bold',
      color: '#1d4ed8',
      align: 'center',
      rotation: 0,
      variableKey: label
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
    setIsSaved(false);
  };

  // Add Sponsor / Logo element
  const addSponsorLogo = (logoUrl: string, name: string) => {
    const newEl: CanvasElement = {
      id: `el-logo-${Date.now()}`,
      type: 'image',
      imageUrl: logoUrl,
      imageAlt: name,
      x: 50,
      y: 85,
      width: 110,
      height: 50,
      rotation: 0,
      opacity: 100
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
    setIsSaved(false);
  };

  // Add Official Gold Seal / Badge
  const addOfficialSecuritySeal = () => {
    const newEl: CanvasElement = {
      id: `el-seal-${Date.now()}`,
      type: 'image',
      imageUrl: '/images/eventorax-app-icon.png',
      imageAlt: 'Official Gold Verification Seal',
      x: 82,
      y: 78,
      width: 75,
      height: 75,
      rotation: 0,
      opacity: 95
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
    setIsSaved(false);
  };

  // Add 10+ Sponsors Strip
  const addAllSponsorsStrip = () => {
    const startX = 15;
    const step = 70 / Math.min(PRESET_SPONSORS.length, 8);
    const newLogos: CanvasElement[] = PRESET_SPONSORS.slice(0, 8).map((sp, idx) => ({
      id: `el-sponsor-strip-${Date.now()}-${idx}`,
      type: 'image',
      imageUrl: sp.logo,
      imageAlt: sp.name,
      x: Math.round(startX + idx * step),
      y: docType === 'certificate' ? 92 : 96,
      width: 55,
      height: 25,
      rotation: 0,
      opacity: 85
    }));
    setElements([...elements, ...newLogos]);
    setIsSaved(false);
  };

  // Add Scannable QR Code
  const addQrElement = () => {
    const newEl: CanvasElement = {
      id: `el-qr-${Date.now()}`,
      type: 'qr',
      x: 50,
      y: 50,
      width: 80,
      height: 80,
      rotation: 0
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
    setIsSaved(false);
  };

  // Add Barcode
  const addBarcodeElement = () => {
    const newEl: CanvasElement = {
      id: `el-barcode-${Date.now()}`,
      type: 'barcode',
      x: 50,
      y: 85,
      width: 200,
      height: 40,
      rotation: 0
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
    setIsSaved(false);
  };

  // Add Photo Avatar
  const addAvatarElement = () => {
    const newEl: CanvasElement = {
      id: `el-avatar-${Date.now()}`,
      type: 'avatar',
      x: 50,
      y: 35,
      width: 85,
      height: 85,
      rotation: 0
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
    setIsSaved(false);
  };

  // Custom Local Image Upload for Background Template
  const handleCustomBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomBgImage(url);
      setBgType('image');
      setIsSaved(false);
    }
  };

  // Custom Local Logo Upload (Canva feature)
  const handleCustomLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        const newLogoItem = {
          id: `logo-${Date.now()}`,
          name: cleanName,
          url
        };
        setUploadedLogos(prev => [newLogoItem, ...prev]);
        addSponsorLogo(url, cleanName);
      };
      reader.readAsDataURL(file);
    }
  };

  // Delete active element
  const deleteElement = (id: string) => {
    setElements(elements.filter((el) => el.id !== id));
    if (selectedId === id) setSelectedId(null);
    setIsSaved(false);
  };

  // Duplicate active element
  const duplicateElement = (el: CanvasElement) => {
    const clone: CanvasElement = {
      ...el,
      id: `el-clone-${Date.now()}`,
      x: Math.min(el.x + 3, 90),
      y: Math.min(el.y + 3, 90)
    };
    setElements([...elements, clone]);
    setSelectedId(clone.id);
    setIsSaved(false);
  };

  // Dragging handlers on canvas
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

  // High-Res PNG Download
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
      const grad = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, '#eff6ff');
      grad.addColorStop(1, '#f8fafc');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // Border
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 6;
    ctx.strokeRect(16, 16, canvasWidth - 32, canvasHeight - 32);

    // Text elements
    elements.forEach((el) => {
      if (el.type === 'text') {
        const textToDraw = getRenderedContent(el);
        const fontSize = el.fontSize || 16;
        ctx.font = `${el.fontWeight || 'normal'} ${fontSize}px ${el.fontFamily || 'Inter'}, sans-serif`;
        ctx.fillStyle = el.color || '#0f172a';
        ctx.textAlign = el.align || 'center';
        const xPos = (el.x / 100) * canvasWidth;
        const yPos = (el.y / 100) * canvasHeight;
        ctx.fillText(textToDraw, xPos, yPos);
      }
    });

    const link = document.createElement('a');
    link.download = `${docTitle.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Preview replacement text
  const getRenderedContent = (el: CanvasElement) => {
    if (!previewMode || !el.text) return el.text || '';
    let t = el.text;
    t = t.replace('{{recipient_name}}', 'Dr. Alexander Wright');
    t = t.replace('{{attendee_name}}', 'Dr. Alexander Wright');
    t = t.replace('{{event_name}}', 'Global Tech Summit 2025');
    t = t.replace('{{event_title}}', 'Global Tech Summit 2025');
    t = t.replace('{{designation}}', 'Chief Technology Officer');
    t = t.replace('{{organization}}', 'Orbit Dynamics Global');
    t = t.replace('{{organization_name}}', 'Orbit Dynamics Global');
    t = t.replace('{{issue_date}}', 'June 15, 2025');
    t = t.replace('{{certificate_id}}', 'EVX-CERT-2025-001');
    t = t.replace('{{ticket_code}}', 'EVX-1-TECH-781');
    t = t.replace('{{ticket_type}}', 'VIP All-Access Pass');
    return t;
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col antialiased select-none" onMouseUp={handleMouseUp}>
      <Header title="Canva Design Studio" />

      {/* Top Studio Bar */}
      <header className="h-16 bg-white border-b border-[#cbd5e1] px-6 flex items-center justify-between sticky top-14 z-30 shadow-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(docType === 'certificate' ? '/dashboard/certificates' : '/dashboard/id-cards')}
            className="p-2 rounded-xl text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Doc Type Selector */}
          <div className="flex items-center gap-1 bg-[#f1f5f9] p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => switchDocType('certificate')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                docType === 'certificate'
                  ? 'bg-white text-[#1d4ed8] shadow-xs'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Certificate
            </button>
            <button
              onClick={() => switchDocType('id_badge')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                docType === 'id_badge'
                  ? 'bg-white text-[#1d4ed8] shadow-xs'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              ID Badge / Card
            </button>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* Document Title */}
          <div>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => { setDocTitle(e.target.value); setIsSaved(false); }}
              className="text-sm font-extrabold text-[#0f172a] bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#1d4ed8] focus:outline-none transition-colors"
            />
            <div className="text-[10px] text-[#64748b] flex items-center gap-2">
              <span>{canvasWidth} × {canvasHeight} px</span>
              <span>•</span>
              <span className={isSaved ? "text-emerald-600 font-bold flex items-center gap-1" : "text-amber-600 font-bold"}>
                {isSaved && <Check className="w-3 h-3 inline text-emerald-600" />}
                {isSaved ? "Saved" : "Unsaved changes"}
              </span>
            </div>
          </div>
        </div>

        {/* Center Tools: Zoom, Guides, Live Preview */}
        <div className="flex items-center gap-1.5 bg-[#f8fafc] p-1 rounded-xl border border-[#cbd5e1]">
          <button
            onClick={() => setZoomLevel(Math.max(40, zoomLevel - 10))}
            className="p-1.5 rounded-lg text-[#64748b] hover:text-[#0f172a] hover:bg-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-[#334155] px-2">{zoomLevel}%</span>
          <button
            onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}
            className="p-1.5 rounded-lg text-[#64748b] hover:text-[#0f172a] hover:bg-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-[#cbd5e1] mx-1" />
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-lg transition-colors ${showGrid ? 'bg-blue-100 text-[#1d4ed8]' : 'text-[#64748b] hover:bg-white'}`}
            title="Toggle Alignment Guides"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              previewMode ? 'bg-emerald-100 text-emerald-800' : 'text-[#64748b] hover:bg-white'
            }`}
            title="Preview with Realistic Attendee Data"
          >
            {previewMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{previewMode ? 'Data Preview' : 'Design Mode'}</span>
          </button>
        </div>

        {/* Right Actions: Export PNG, Print & Save */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadPng}
            className="text-xs font-bold rounded-xl flex items-center gap-1.5"
            title="Download High Resolution PNG"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            Download PNG
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            className="text-xs font-bold rounded-xl flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Layout
          </Button>
          <Button
            size="sm"
            onClick={() => { setIsSaved(true); alert('Template layout saved to organization library successfully!'); }}
            className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-600/20"
          >
            <Save className="w-3.5 h-3.5" />
            Save Template
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
          🛠️ Tools & Presets
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
          ⚙️ Properties {selectedId ? '•' : ''}
        </button>
      </div>

      {/* Main Studio Body: 3-column Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT TOOLBAR: Add Elements, Presets, Logos, Templates */}
        <aside className={`w-full lg:w-80 bg-white border-r border-[#cbd5e1] p-5 flex flex-col gap-5 overflow-y-auto shrink-0 ${
          mobileTab === 'tools' ? 'flex' : 'hidden lg:flex'
        }`}>
          
          {/* Dimensions & Presets (Selective Page Size) */}
          <div className="space-y-2 pb-4 border-b border-slate-100">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
              Selective Page Size
            </label>
            <select
              value={selectedPresetSize}
              onChange={(e) => handleDimensionChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
            >
              {docType === 'certificate' ? (
                <>
                  <option value="a4_landscape">A4 Landscape (1123 × 794 px)</option>
                  <option value="a4_portrait">A4 Portrait (794 × 1123 px)</option>
                  <option value="us_letter_landscape">US Letter Landscape (1056 × 816 px)</option>
                  <option value="us_letter_portrait">US Letter Portrait (816 × 1056 px)</option>
                  <option value="presentation_16_9">Presentation Widescreen (1280 × 720 px)</option>
                  <option value="square_diploma">Square Diploma (900 × 900 px)</option>
                </>
              ) : (
                <>
                  <option value="id_vertical">Executive Lanyard (480 × 760 px)</option>
                  <option value="id_horizontal">Corporate Clip Card (760 × 480 px)</option>
                  <option value="cr80_card">Standard CR80 Badge (520 × 820 px)</option>
                </>
              )}
            </select>
            {/* Custom Dimension Inputs */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block">Width (px)</label>
                <input
                  type="number"
                  value={canvasWidth}
                  onChange={(e) => { setCanvasWidth(Number(e.target.value)); setSelectedPresetSize('custom'); setIsSaved(false); }}
                  className="w-full px-2.5 py-1.5 border rounded-lg text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block">Height (px)</label>
                <input
                  type="number"
                  value={canvasHeight}
                  onChange={(e) => { setCanvasHeight(Number(e.target.value)); setSelectedPresetSize('custom'); setIsSaved(false); }}
                  className="w-full px-2.5 py-1.5 border rounded-lg text-xs font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Background Styling & Palette */}
          <div className="space-y-2 pb-4 border-b border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-blue-600" />
              Canvas Background
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
                Solid Color
              </button>
              <button
                onClick={() => { setBgType('image'); setIsSaved(false); }}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold ${bgType === 'image' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                Image
              </button>
            </div>
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
          </div>

          {/* Canva Custom Logos Library */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                Your Logos &amp; Graphics
              </h4>
            </div>

            {/* Custom Logo Upload Button */}
            <label className="w-full py-2.5 px-3 rounded-xl bg-white border-2 border-dashed border-blue-400 hover:border-blue-600 text-xs font-bold text-blue-700 text-center cursor-pointer block transition-colors shadow-2xs">
              <Upload className="w-3.5 h-3.5 inline mr-1.5" />
              <span>Upload Custom Logo (PNG/SVG)</span>
              <input type="file" accept="image/*" onChange={handleCustomLogoUpload} className="hidden" />
            </label>

            {/* Uploaded Logos Gallery Tray */}
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {uploadedLogos.map((logo) => (
                <div key={logo.id} className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={logo.url} alt={logo.name} className="w-6 h-6 object-contain rounded" />
                    <span className="text-[11px] font-bold text-slate-700 truncate">{logo.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => addSponsorLogo(logo.url, logo.name)}
                      className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] font-bold"
                    >
                      Insert
                    </button>
                    {logo.id !== 'logo-official' && (
                      <button
                        onClick={() => setUploadedLogos(uploadedLogos.filter(l => l.id !== logo.id))}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Security Seal & 8-Sponsors Strip */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={addOfficialSecuritySeal}
                className="text-[11px] font-bold rounded-xl justify-center gap-1 text-emerald-700 border-emerald-200 bg-emerald-50/50"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Gold Seal
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={addAllSponsorsStrip}
                className="text-[11px] font-bold rounded-xl justify-center gap-1 text-blue-700 border-blue-200 bg-blue-50/50"
              >
                + 8 Logos
              </Button>
            </div>
          </div>

          {/* Upload Custom Background Template */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2.5">
            <label className="text-xs font-bold text-blue-950 block flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-blue-600" />
              Upload Certificate Background
            </label>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Upload custom background (PNG/JPG) designed in Canva, Illustrator, or Photoshop.
            </p>
            <label className="w-full py-2 px-3 rounded-xl bg-white border border-blue-300 hover:border-blue-600 text-xs font-bold text-blue-700 text-center cursor-pointer block transition-colors shadow-2xs">
              <span>{customBgImage ? 'Replace Template Image' : 'Choose Background File'}</span>
              <input type="file" accept="image/*" onChange={handleCustomBackgroundUpload} className="hidden" />
            </label>
            {customBgImage && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[10px] text-slate-600 font-bold">
                  <span>Background Opacity:</span>
                  <span>{bgOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={bgOpacity}
                  onChange={(e) => setBgOpacity(Number(e.target.value))}
                  className="w-full"
                />
                <button
                  onClick={() => { setCustomBgImage(null); setBgType('gradient'); }}
                  className="text-[10px] text-rose-600 font-bold hover:underline block pt-1"
                >
                  Remove Uploaded Template
                </button>
              </div>
            )}
          </div>

          {/* Add Text Layers */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-blue-600" />
              Text Layers
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => addTextElement('Heading')}
                className="text-xs font-bold rounded-xl justify-start gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                Add Title
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addTextElement('Body')}
                className="text-xs font-bold rounded-xl justify-start gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                Add Text
              </Button>
            </div>
          </div>

          {/* Dynamic Placeholders */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Dynamic Tags (Auto-Populate)
            </h4>
            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
              {(docType === 'certificate' ? [
                { tag: '{{recipient_name}}', label: 'Recipient Name' },
                { tag: '{{event_name}}', label: 'Event Title' },
                { tag: '{{issue_date}}', label: 'Issue Date' },
                { tag: '{{certificate_id}}', label: 'Certificate ID' },
                { tag: '{{organization_name}}', label: 'Organization' }
              ] : [
                { tag: '{{attendee_name}}', label: 'Attendee Name' },
                { tag: '{{designation}}', label: 'Designation' },
                { tag: '{{organization}}', label: 'Company / Org' },
                { tag: '{{ticket_code}}', label: 'Ticket Code' },
                { tag: '{{ticket_type}}', label: 'Access Tier' },
                { tag: '{{event_title}}', label: 'Event Title' }
              ]).map((v) => (
                <button
                  key={v.tag}
                  onClick={() => addVariableElement(v.tag, v.label)}
                  className="px-3 py-2 rounded-xl text-left text-xs bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition-colors flex items-center justify-between group"
                >
                  <span className="font-semibold text-slate-700">{v.label}</span>
                  <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Badges & QR Section */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Interactive Badges &amp; Codes
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={addQrElement}
                className="text-xs font-bold rounded-xl justify-start gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5 text-blue-600" />
                Add QR Code
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={addBarcodeElement}
                className="text-xs font-bold rounded-xl justify-start gap-1.5"
              >
                <span className="font-mono text-xs font-bold">||||</span>
                Add Barcode
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={addAvatarElement}
                className="text-xs font-bold rounded-xl justify-start gap-1.5"
              >
                <span className="text-xs">👤</span>
                Attendee Photo
              </Button>
              {docType === 'id_badge' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHasLanyardHole(!hasLanyardHole)}
                  className={`text-xs font-bold rounded-xl justify-start gap-1.5 ${hasLanyardHole ? 'bg-blue-50 border-blue-300 text-blue-700' : ''}`}
                >
                  <span>⭕</span>
                  Lanyard Hole
                </Button>
              )}
            </div>
          </div>
        </aside>

        {/* CENTER VIEWPORT: THE INTERACTIVE CANVAS */}
        <main 
          className={`flex-1 overflow-auto p-4 sm:p-12 flex items-center justify-center relative bg-slate-100 ${
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
            {/* CANVAS WRAPPER */}
            <div
              ref={canvasRef}
              onClick={() => setSelectedId(null)}
              className={`relative rounded-3xl shadow-2xl overflow-hidden select-none border-4 ${
                docType === 'id_badge' ? 'border-slate-800' : 'border-blue-700/40'
              }`}
              style={{
                width: `${canvasWidth}px`,
                height: `${canvasHeight}px`,
                background: bgType === 'image' && customBgImage 
                  ? `url(${customBgImage}) center/cover no-repeat` 
                  : (bgType === 'color' ? bgColor : bgGradient),
                opacity: customBgImage ? bgOpacity / 100 : 1
              }}
            >
              {/* Lanyard punch hole for ID badges */}
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

              {/* RENDER CANVAS ELEMENTS */}
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
                        ? 'ring-2 ring-blue-600 ring-offset-2 rounded-lg bg-blue-50/20 shadow-lg'
                        : 'hover:outline hover:outline-dashed hover:outline-1 hover:outline-blue-400'
                    }`}
                  >
                    {/* Element Renderers by Type */}
                    {el.type === 'text' && (
                      <div
                        style={{
                          fontSize: `${el.fontSize || 16}px`,
                          fontFamily: el.fontFamily || 'Inter',
                          fontWeight: el.fontWeight || 'normal',
                          color: el.color || '#0f172a',
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
                            width: `${el.width || 100}px`,
                            height: el.height ? `${el.height}px` : 'auto',
                            opacity: (el.opacity ?? 100) / 100,
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
                            width: `${el.width || 80}px`,
                            height: `${el.height || 80}px`
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
                          width: `${el.width || 85}px`,
                          height: `${el.height || 85}px`
                        }}
                        className="rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-1 shadow-md"
                      >
                        <div className="w-full h-full rounded-xl bg-slate-900 flex items-center justify-center font-bold text-lg text-white">
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

        {/* RIGHT PROPERTY INSPECTOR */}
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

                  {/* Font Family */}
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

                  {/* Size & Weight */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Font Size (px)</label>
                      <input
                        type="number"
                        value={selectedElement.fontSize || 16}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setElements(elements.map((el) => el.id === selectedElement.id ? { ...el, fontSize: val } : el));
                          setIsSaved(false);
                        }}
                        className="w-full p-2 rounded-xl border border-slate-300 text-xs font-medium"
                      />
                    </div>
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
                        <option value="800">Extra Bold</option>
                      </select>
                    </div>
                  </div>

                  {/* Color & Alignment */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Text Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={selectedElement.color || '#0f172a'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setElements(elements.map((el) => el.id === selectedElement.id ? { ...el, color: val } : el));
                            setIsSaved(false);
                          }}
                          className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={selectedElement.color || '#0f172a'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setElements(elements.map((el) => el.id === selectedElement.id ? { ...el, color: val } : el));
                            setIsSaved(false);
                          }}
                          className="w-20 p-1.5 border rounded-lg text-[11px] font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Align</label>
                      <div className="flex border rounded-xl overflow-hidden">
                        {(['left', 'center', 'right'] as const).map((al) => (
                          <button
                            key={al}
                            onClick={() => {
                              setElements(elements.map((el) => el.id === selectedElement.id ? { ...el, align: al } : el));
                              setIsSaved(false);
                            }}
                            className={`flex-1 py-1.5 text-xs font-bold capitalize ${
                              selectedElement.align === al ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-700'
                            }`}
                          >
                            {al[0].toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Image / Logo Resize */}
              {selectedElement.type === 'image' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Logo Width: {selectedElement.width || 100}px</label>
                    <input
                      type="range"
                      min="30"
                      max="300"
                      value={selectedElement.width || 100}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setElements(elements.map((el) => el.id === selectedElement.id ? { ...el, width: val } : el));
                        setIsSaved(false);
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Logo Opacity: {selectedElement.opacity ?? 100}%</label>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={selectedElement.opacity ?? 100}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setElements(elements.map((el) => el.id === selectedElement.id ? { ...el, opacity: val } : el));
                        setIsSaved(false);
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {/* Rotation Angle */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <RotateCw className="w-3.5 h-3.5 text-slate-500" />
                    Rotation Angle
                  </span>
                  <span className="font-mono text-xs text-blue-600">{selectedElement.rotation || 0}°</span>
                </label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={selectedElement.rotation || 0}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setElements(elements.map((el) => el.id === selectedElement.id ? { ...el, rotation: val } : el));
                    setIsSaved(false);
                  }}
                  className="w-full"
                />
              </div>

              {/* Position Coordinates X & Y % */}
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
                Click any text, logo, QR code, or sponsor element on the canvas to edit its properties or drag to reposition.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

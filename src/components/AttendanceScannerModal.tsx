import { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  Users, 
  QrCode, 
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api } from '@/services/api';

interface AttendanceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  onAttendeeUpdated?: () => void;
}

export default function AttendanceScannerModal({
  isOpen,
  onClose,
  event,
  onAttendeeUpdated
}: AttendanceScannerModalProps) {
  const [activeTab, setActiveTab] = useState<'scanner' | 'manual'>('scanner');
  const [attendees, setAttendees] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'checked_in'>('all');

  // Scanner state
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [scanResult, setScanResult] = useState<{
    status: 'valid' | 'already_checked_in' | 'invalid';
    message: string;
    attendee?: any;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const loadAttendees = async () => {
    if (!event?.id) return;
    try {
      const res = await api.events.getAttendees(event.id);
      if (res.success) {
        setAttendees(res.attendees || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAttendees();
    }
  }, [isOpen, event]);

  // Camera start / stop
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isOpen && activeTab === 'scanner') {
      navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            setCameraActive(true);
          }
        })
        .catch(() => {
          setCameraActive(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [isOpen, activeTab]);

  if (!isOpen || !event) return null;

  const checkedInCount = attendees.filter(a => a.status === 'checked_in').length;
  const totalCount = attendees.length;
  const attendanceRate = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;

  const handleVerifyTicketCode = async (codeToVerify?: string) => {
    const code = (codeToVerify || manualCodeInput).trim().toUpperCase();
    if (!code) return;
    setIsVerifying(true);
    setScanResult(null);

    try {
      const res = await api.events.checkIn({ ticketCode: code, eventId: event.id });
      setScanResult({
        status: res.status as any,
        message: res.message,
        attendee: res.attendee
      });
      loadAttendees();
      onAttendeeUpdated?.();
      setManualCodeInput('');
    } catch (err: any) {
      setScanResult({
        status: 'invalid',
        message: err.message || 'Ticket not found or network error.'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleToggleManual = async (attendeeId: number) => {
    try {
      await api.events.toggleAttendeeCheckIn(event.id, attendeeId);
      loadAttendees();
      onAttendeeUpdated?.();
    } catch (err: any) {
      alert(err.message || 'Failed to update check-in status.');
    }
  };

  const handleExportCsv = () => {
    const headers = 'ID,Name,Email,Phone,Ticket Code,Tier,Status,Checked-in At\n';
    const rows = attendees.map(a => 
      `"${a.id}","${a.name}","${a.email}","${a.phone || ''}","${a.ticket_code}","${a.ticket_type}","${a.status}","${a.checked_in_at || ''}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.slug || 'event'}-attendance.csv`;
    link.click();
  };

  const filteredAttendees = attendees.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      String(a.ticket_code).toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1d4ed8] to-[#2563eb] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
              Live Check-In Desk
            </span>
            <span className="text-xs text-blue-100">{event.title}</span>
          </div>

          <h3 className="text-2xl font-bold font-heading">Event Attendance & QR Scanner</h3>

          {/* Real-time stats bar */}
          <div className="mt-4 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-xs">
              <div>
                <span className="text-blue-200 block">Total Registered</span>
                <span className="text-lg font-extrabold text-white">{totalCount}</span>
              </div>
              <div>
                <span className="text-emerald-200 block">Checked In</span>
                <span className="text-lg font-extrabold text-emerald-300">{checkedInCount}</span>
              </div>
              <div>
                <span className="text-amber-200 block">Remaining</span>
                <span className="text-lg font-extrabold text-amber-200">{totalCount - checkedInCount}</span>
              </div>
            </div>

            <div className="w-full sm:w-44">
              <div className="flex justify-between text-[11px] mb-1 font-semibold text-blue-100">
                <span>Check-in Rate</span>
                <span>{attendanceRate}%</span>
              </div>
              <Progress value={attendanceRate} className="h-2 bg-white/20" />
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-3">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`pb-3 font-bold text-xs flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'scanner'
                ? 'border-[#1d4ed8] text-[#1d4ed8]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            Live Camera QR Scanner
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`pb-3 font-bold text-xs flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'manual'
                ? 'border-[#1d4ed8] text-[#1d4ed8]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Manual Attendance List ({attendees.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'scanner' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Camera Video Viewport */}
              <div className="space-y-3">
                <div className="relative aspect-square bg-slate-950 rounded-3xl overflow-hidden flex items-center justify-center border-2 border-slate-800 shadow-inner">
                  {cameraActive ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-6 text-slate-400">
                      <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">Camera feed initializing or permissions required.</p>
                      <p className="text-[10px] text-slate-500 mt-1">You can also scan with handheld USB scanners or enter code below.</p>
                    </div>
                  )}

                  {/* Scanner Crosshair Reticle */}
                  <div className="absolute inset-10 border-2 border-dashed border-blue-400/70 rounded-2xl pointer-events-none flex items-center justify-center animate-pulse">
                    <QrCode className="w-12 h-12 text-blue-400/40" />
                  </div>
                </div>

                {/* Handheld / Manual QR input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Scan / Type Ticket Code (e.g. EVX-1-TECH-781)"
                    value={manualCodeInput}
                    onChange={(e) => setManualCodeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyTicketCode()}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono uppercase bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    onClick={() => handleVerifyTicketCode()}
                    disabled={isVerifying || !manualCodeInput.trim()}
                    className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl text-xs font-bold px-4"
                  >
                    Validate
                  </Button>
                </div>
              </div>

              {/* Real-time Result Card & Quick Test Buttons */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Validation Status</h4>

                {scanResult ? (
                  <div className={`p-5 rounded-3xl border-2 transition-all ${
                    scanResult.status === 'valid'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                      : scanResult.status === 'already_checked_in'
                        ? 'bg-amber-50 border-amber-400 text-amber-900'
                        : 'bg-rose-50 border-rose-400 text-rose-900'
                  }`}>
                    <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                      {scanResult.status === 'valid' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                      {scanResult.status === 'already_checked_in' && <AlertCircle className="w-5 h-5 text-amber-600" />}
                      {scanResult.status === 'invalid' && <AlertCircle className="w-5 h-5 text-rose-600" />}
                      <span>{scanResult.message}</span>
                    </div>

                    {scanResult.attendee && (
                      <div className="bg-white/80 p-3.5 rounded-2xl space-y-1 text-xs text-slate-700 font-sans border border-black/5 mt-3">
                        <div className="font-bold text-base text-slate-900">{scanResult.attendee.name}</div>
                        <div>Email: <span className="font-medium text-slate-600">{scanResult.attendee.email}</span></div>
                        <div>Tier: <span className="font-bold text-[#1d4ed8]">{scanResult.attendee.ticket_type}</span></div>
                        <div className="font-mono text-[11px] text-slate-500">Code: {scanResult.attendee.ticket_code}</div>
                        {scanResult.attendee.checked_in_at && (
                          <div className="text-[11px] text-emerald-700 font-semibold pt-1 border-t border-slate-200">
                            Check-in Timestamp: {new Date(scanResult.attendee.checked_in_at).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                    <QrCode className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    Scan any attendee QR ticket or select a ticket code below to simulate check-in.
                  </div>
                )}

                {/* Quick Simulation Buttons from existing attendees */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-600 block mb-2">Simulate Scan From Attendees:</span>
                  <div className="flex flex-wrap gap-2">
                    {attendees.slice(0, 4).map((att) => (
                      <button
                        key={att.id}
                        type="button"
                        onClick={() => handleVerifyTicketCode(att.ticket_code)}
                        className={`text-[11px] font-mono px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                          att.status === 'checked_in'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-white hover:bg-blue-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span>{att.name.split(' ')[0]}:</span>
                        <strong>{att.ticket_code}</strong>
                        {att.status === 'checked_in' && <Check className="w-3 h-3 text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* MANUAL ATTENDANCE TABLE */
            <div className="space-y-4">
              {/* Search & Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search attendee by name, email, or code..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="all">All Statuses</option>
                    <option value="confirmed">Pending ({totalCount - checkedInCount})</option>
                    <option value="checked_in">Checked In ({checkedInCount})</option>
                  </select>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportCsv}
                    className="rounded-xl text-xs flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Attendee</th>
                      <th className="p-3">Ticket Code</th>
                      <th className="p-3">Pass Tier</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAttendees.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500">
                          No attendees match your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredAttendees.map((att) => (
                        <tr key={att.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{att.name}</div>
                            <div className="text-[11px] text-slate-500">{att.email}</div>
                          </td>
                          <td className="p-3 font-mono font-bold text-blue-700">
                            {att.ticket_code}
                          </td>
                          <td className="p-3 font-semibold text-slate-700">
                            {att.ticket_type}
                          </td>
                          <td className="p-3">
                            {att.status === 'checked_in' ? (
                              <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                Checked In
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-slate-600 text-[10px]">
                                Pending
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleToggleManual(att.id)}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                                att.status === 'checked_in'
                                  ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                              }`}
                            >
                              {att.status === 'checked_in' ? 'Undo Check-In' : 'Check In'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

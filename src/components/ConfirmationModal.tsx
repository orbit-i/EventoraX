import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  loading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  loading = false
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: AlertTriangle,
      iconBg: 'bg-red-100 text-red-600',
      btn: 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-amber-100 text-amber-600',
      btn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
    },
    info: {
      icon: Info,
      iconBg: 'bg-blue-100 text-blue-600',
      btn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
    },
    success: {
      icon: CheckCircle2,
      iconBg: 'bg-emerald-100 text-emerald-600',
      btn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
    }
  };

  const style = variantStyles[variant];
  const Icon = style.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={loading ? undefined : onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl shadow-slate-900/20 border border-slate-200 z-10 animate-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${style.iconBg}`}>
            <Icon className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="text-lg font-bold font-heading text-slate-900 leading-tight">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed font-body">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer ${style.btn}`}
          >
            {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

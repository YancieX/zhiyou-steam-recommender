import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore, type Toast, type ToastType } from '../stores/toastStore';

const iconMap: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const colorMap: Record<ToastType, { text: string; bg: string; border: string; icon: string }> = {
  success: {
    text: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    icon: 'text-green-400',
  },
  error: {
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: 'text-red-400',
  },
  warning: {
    text: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    icon: 'text-yellow-400',
  },
  info: {
    text: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    icon: 'text-cyan-400',
  },
};

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore(state => state.removeToast);
  const Icon = iconMap[toast.type];
  const colors = colorMap[toast.type];

  return (
    <div
      className={`glass-card ${colors.bg} ${colors.border} border rounded-xl px-4 py-3 shadow-lg flex items-center gap-3 min-w-[280px] max-w-[400px] animate-fade-in-up`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${colors.icon}`} />
      <p className={`flex-1 text-sm font-medium ${colors.text}`}>{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 text-gray-500 hover:text-gray-300 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function Toast() {
  const toasts = useToastStore(state => state.toasts);

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <div className="pointer-events-auto flex flex-col gap-2">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>
    </div>
  );
}

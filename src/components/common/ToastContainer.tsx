import React from 'react';
import { useToast } from '../../context/ToastContext';
import {
  Droplets,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  Clock,
  Plus,
} from 'lucide-react';
import { ToastItem } from '../../types/toast';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast, snoozeHydrationReminder } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col gap-3 max-w-sm sm:max-w-md w-[calc(100vw-2rem)] pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastCard
          key={toast.id}
          toast={toast}
          onDismiss={() => dismissToast(toast.id)}
          onSnooze={(mins) => snoozeHydrationReminder(mins)}
        />
      ))}
    </div>
  );
};

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: () => void;
  onSnooze: (minutes: number) => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast, onDismiss, onSnooze }) => {
  const isHydration = toast.type === 'hydration';
  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';
  const isWarning = toast.type === 'warning';

  const payload = toast.hydrationPayload;
  const current = payload?.currentLiters || 0;
  const target = payload?.targetLiters || 3.0;
  const pct = Math.min(100, Math.round((current / target) * 100));

  // Visual Theme mapping
  const borderStyle = isHydration
    ? 'border-[#06B6D4]/50 bg-[#091520]/95 shadow-[#06B6D4]/15'
    : isSuccess
    ? 'border-[#10B981]/50 bg-[#0A1912]/95 shadow-[#10B981]/15'
    : isError
    ? 'border-rose-500/50 bg-[#1D0C10]/95 shadow-rose-500/15'
    : isWarning
    ? 'border-amber-500/50 bg-[#1B1307]/95 shadow-amber-500/15'
    : 'border-[#FF6A00]/40 bg-[#16120C]/95 shadow-[#FF6A00]/15';

  return (
    <div
      className={`pointer-events-auto rounded-2xl border p-4 shadow-2xl backdrop-blur-xl text-white transform transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 relative overflow-hidden ${borderStyle}`}
    >
      {/* Background ambient gradient glow */}
      <div
        className={`absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl pointer-events-none ${
          isHydration
            ? 'bg-[#06B6D4]/20'
            : isSuccess
            ? 'bg-[#10B981]/20'
            : isError
            ? 'bg-rose-500/20'
            : 'bg-[#FF6A00]/20'
        }`}
      />

      <div className="flex items-start gap-3 relative z-10">
        {/* Leading Icon */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
            isHydration
              ? 'bg-[#06B6D4]/20 border-[#06B6D4]/40 text-[#06B6D4]'
              : isSuccess
              ? 'bg-[#10B981]/20 border-[#10B981]/40 text-[#10B981]'
              : isError
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
              : 'bg-[#FF6A00]/20 border-[#FF6A00]/40 text-[#FF6A00]'
          }`}
        >
          {isHydration && <Droplets className="w-5 h-5 animate-bounce" />}
          {isSuccess && <CheckCircle2 className="w-5 h-5" />}
          {isError && <AlertTriangle className="w-5 h-5" />}
          {(isWarning || (!isHydration && !isSuccess && !isError)) && <Info className="w-5 h-5" />}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-white tracking-tight">{toast.title}</h4>
            {isHydration && (
              <span className="text-[10px] font-mono text-[#06B6D4] font-bold px-1.5 py-0.5 rounded bg-[#06B6D4]/10 border border-[#06B6D4]/30">
                {pct}%
              </span>
            )}
          </div>

          {toast.message && (
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{toast.message}</p>
          )}

          {/* Hydration Interactive Elements */}
          {isHydration && payload && (
            <div className="mt-3 space-y-2.5">
              {/* Progress bar */}
              <div className="w-full bg-[#1A2530] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#06B6D4] to-cyan-300 h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Quick Log Portions */}
              <div className="flex items-center gap-2 flex-wrap pt-0.5">
                {payload.onQuickAdd && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        payload.onQuickAdd?.(0.25);
                        setTimeout(onDismiss, 50);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#06B6D4]/20 hover:bg-[#06B6D4]/30 border border-[#06B6D4]/40 text-cyan-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+0.25 L Glass</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        payload.onQuickAdd?.(0.5);
                        setTimeout(onDismiss, 50);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#06B6D4] hover:bg-cyan-400 text-black text-[11px] font-bold flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-black stroke-[3]" />
                      <span>+0.50 L Rwenzori</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => onSnooze(30)}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-semibold flex items-center gap-1 border border-white/10 transition-colors ml-auto cursor-pointer"
                  title="Remind me again in 30 minutes"
                >
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Snooze 30m</span>
                </button>
              </div>
            </div>
          )}

          {/* Optional Generic Action button */}
          {!isHydration && toast.action && (
            <div className="mt-2.5">
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick();
                  onDismiss();
                }}
                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                {toast.action.label}
              </button>
            </div>
          )}
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { ToastItem, HydrationToastPayload } from '../types/toast';

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id' | 'createdAt'>) => string;
  showSuccess: (title: string, message?: string, durationMs?: number) => string;
  showError: (title: string, message?: string, durationMs?: number) => string;
  showInfo: (title: string, message?: string, durationMs?: number) => string;
  showHydrationReminder: (payload: HydrationToastPayload) => string;
  dismissToast: (id: string) => void;
  snoozeHydrationReminder: (minutes: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const dismissToast = useCallback((id: string) => {
    // Clear timer if active
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, 'id' | 'createdAt'>): string => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const durationMs = toast.durationMs !== undefined ? toast.durationMs : (toast.type === 'hydration' ? 12000 : 5000);

      const newToast: ToastItem = {
        ...toast,
        id,
        durationMs,
        createdAt: Date.now(),
      };

      // Asynchronously schedule toast state update to eliminate any setState-during-render collisions
      setTimeout(() => {
        setToasts((prev) => {
          // If it's a hydration toast, remove any existing hydration toast first to prevent stacking
          const filtered = toast.type === 'hydration' ? prev.filter((t) => t.type !== 'hydration') : prev;
          return [...filtered.slice(-3), newToast]; // Keep at most 4 toasts visible
        });
      }, 0);

      if (durationMs > 0) {
        const timer = setTimeout(() => {
          dismissToast(id);
        }, durationMs);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [dismissToast]
  );

  const showSuccess = useCallback(
    (title: string, message?: string, durationMs: number = 4500) => {
      return showToast({ type: 'success', title, message, durationMs });
    },
    [showToast]
  );

  const showError = useCallback(
    (title: string, message?: string, durationMs: number = 6000) => {
      return showToast({ type: 'error', title, message, durationMs });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (title: string, message?: string, durationMs: number = 4500) => {
      return showToast({ type: 'info', title, message, durationMs });
    },
    [showToast]
  );

  const showHydrationReminder = useCallback(
    (payload: HydrationToastPayload) => {
      const remaining = Math.max(0, payload.targetLiters - payload.currentLiters);
      return showToast({
        type: 'hydration',
        title: '💧 Kampala Hydration Check',
        message: `${payload.currentLiters.toFixed(2)}L logged of ${payload.targetLiters.toFixed(1)}L target (${remaining.toFixed(2)}L remaining). ${payload.tip || ''}`,
        durationMs: 14000,
        hydrationPayload: payload,
      });
    },
    [showToast]
  );

  const snoozeHydrationReminder = useCallback(
    (minutes: number) => {
      // Dismiss active hydration toasts
      setToasts((prev) => prev.filter((t) => t.type !== 'hydration'));
      showInfo('Hydration Reminder Snoozed', `We'll remind you again in ${minutes} minutes.`, 3000);
    },
    [showInfo]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        showSuccess,
        showError,
        showInfo,
        showHydrationReminder,
        dismissToast,
        snoozeHydrationReminder,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

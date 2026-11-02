export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'hydration';

export interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'water';
}

export interface HydrationQuickLogOption {
  liters: number;
  label: string;
}

export interface HydrationToastPayload {
  currentLiters: number;
  targetLiters: number;
  timeSlot: string;
  tip?: string;
  onQuickAdd?: (liters: number) => void;
  onSnooze?: (minutes: number) => void;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  durationMs?: number; // 0 or undefined for default (5000ms), 0 for sticky
  createdAt: number;
  action?: ToastAction;
  hydrationPayload?: HydrationToastPayload;
}

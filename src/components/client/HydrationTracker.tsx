import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, ClientProfile } from '../../types';
import {
  calculateHydrationTarget,
  calculateHydrationPercentage,
  getHydrationStatus,
  getHydrationRecommendations,
  checkAfternoonHydrationAlert,
} from '../../utils/hydrationCalc';
import {
  evaluateHydrationSchedule,
  isReminderDueByInterval,
  requestPushNotificationPermission,
  dispatchNativePushNotification,
  DEFAULT_HYDRATION_SETTINGS,
  HydrationReminderSettings,
} from '../../utils/hydrationReminderEngine';
import { useToast } from '../../context/ToastContext';
import {
  Droplets,
  Plus,
  Minus,
  RotateCcw,
  Sparkles,
  Sun,
  Dumbbell,
  Apple,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Bell,
  X,
  CheckCircle2,
  Clock,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface HydrationTrackerProps {
  user: User;
  profile: ClientProfile;
  hasWorkoutToday: boolean;
  onWaterUpdated?: (liters: number) => void;
}

export const HydrationTracker: React.FC<HydrationTrackerProps> = ({
  user,
  profile,
  hasWorkoutToday,
  onWaterUpdated,
}) => {
  const { showSuccess, showInfo, showHydrationReminder } = useToast();

  // Get today's date string in YYYY-MM-DD for Africa/Kampala
  const getTodayKampalaDate = () => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Kampala',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  };

  const todayKey = `flexifit_hydration_${user.id}_${getTodayKampalaDate()}`;
  const dismissKey = `flexifit_hydration_dismissed_${user.id}_${getTodayKampalaDate()}`;
  const settingsKey = `flexifit_hydration_settings_${user.id}`;

  // Calculate dynamic target based on weight & workout
  const targetLiters = calculateHydrationTarget({
    weightKg: profile.current_weight_kg,
    activityLevel: profile.activity_level,
    hasWorkoutToday,
  });

  // Load intake from localStorage or start at 0
  const [currentLiters, setCurrentLiters] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(todayKey);
      return saved ? parseFloat(saved) : 0;
    } catch {
      return 0;
    }
  });

  // Reminder settings state
  const [reminderSettings, setReminderSettings] = useState<HydrationReminderSettings>(() => {
    try {
      const saved = localStorage.getItem(settingsKey);
      return saved ? { ...DEFAULT_HYDRATION_SETTINGS, ...JSON.parse(saved) } : DEFAULT_HYDRATION_SETTINGS;
    } catch {
      return DEFAULT_HYDRATION_SETTINGS;
    }
  });

  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [showAllRecs, setShowAllRecs] = useState<boolean>(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState<boolean>(false);
  const [justAddedAmount, setJustAddedAmount] = useState<number | null>(null);
  const [isAlertDismissed, setIsAlertDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(dismissKey) === 'true';
    } catch {
      return false;
    }
  });
  const [simulate2pmMode, setSimulate2pmMode] = useState<boolean>(false);
  const [hasNotifiedNative, setHasNotifiedNative] = useState<boolean>(false);

  // Check initial push permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermission(Notification.permission);
    } else {
      setPushPermission('unsupported');
    }
  }, []);

  // Save settings when changed
  useEffect(() => {
    try {
      localStorage.setItem(settingsKey, JSON.stringify(reminderSettings));
    } catch (e) {
      console.error('Failed to save hydration reminder settings:', e);
    }
  }, [reminderSettings, settingsKey]);

  // Sync intake to localStorage and notify parent
  useEffect(() => {
    try {
      localStorage.setItem(todayKey, currentLiters.toString());
      onWaterUpdated?.(currentLiters);
    } catch (e) {
      console.error('Failed to save hydration log:', e);
    }
  }, [currentLiters, todayKey, onWaterUpdated]);

  // Current hour in Kampala
  const kampalaHour = parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Kampala',
      hour: 'numeric',
      hour12: false,
    }).format(new Date()),
    10
  );

  // Evaluate 2:00 PM alert
  const effectiveHour = simulate2pmMode ? 14 : kampalaHour;
  const alertCheck = checkAfternoonHydrationAlert(currentLiters, effectiveHour, 1.5);
  const shouldShowToast = alertCheck.shouldAlert && !isAlertDismissed;

  // Add water handler
  const handleAddWater = useCallback(
    (litersToAdd: number) => {
      let nextVal = 0;
      setCurrentLiters((prev) => {
        const updated = Math.round((prev + litersToAdd) * 100) / 100;
        nextVal = Math.min(8.0, Math.max(0, updated));
        return nextVal;
      });
      setJustAddedAmount(litersToAdd);
      setTimeout(() => setJustAddedAmount(null), 1500);

      // Invoke toast notification asynchronously outside the setState execution cycle
      setTimeout(() => {
        const pct = Math.min(100, Math.round((nextVal / targetLiters) * 100));
        showSuccess(
          'Hydration Logged',
          `+${litersToAdd}L recorded • Current: ${nextVal.toFixed(2)}L / ${targetLiters.toFixed(1)}L (${pct}%)`,
          3500
        );
      }, 0);
    },
    [targetLiters, showSuccess]
  );

  // Trigger push and subtle toast notification function
  const triggerHydrationAlert = useCallback(
    (customTitle?: string, customMessage?: string) => {
      const evaluation = evaluateHydrationSchedule(currentLiters, targetLiters, new Date());
      const title = customTitle || evaluation.title;
      const message = customMessage || evaluation.message;

      // 1. Dispatch native browser push notification if permitted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        dispatchNativePushNotification(title, message);
      }

      // 2. Trigger subtle floating in-app toast with quick-add actions
      showHydrationReminder({
        currentLiters,
        targetLiters,
        timeSlot: evaluation.slot,
        tip: evaluation.tip,
        onQuickAdd: (amount) => handleAddWater(amount),
      });

      // Update last reminder timestamp
      setReminderSettings((prev) => ({
        ...prev,
        lastReminderTimestamp: Date.now(),
      }));
    },
    [currentLiters, targetLiters, showHydrationReminder, handleAddWater]
  );

  // Background Reminder Loop (evaluates schedule and interval every 60 seconds)
  useEffect(() => {
    if (!reminderSettings.enabled) return;

    const intervalTimer = setInterval(() => {
      const now = Date.now();
      const isDue = isReminderDueByInterval(reminderSettings, now);

      if (isDue) {
        const schedule = evaluateHydrationSchedule(currentLiters, targetLiters, new Date());
        if (schedule.shouldRemind) {
          triggerHydrationAlert();
        }
      }
    }, 60000);

    return () => clearInterval(intervalTimer);
  }, [reminderSettings, currentLiters, targetLiters, triggerHydrationAlert]);

  // Native notification check for 2 PM threshold once per session
  useEffect(() => {
    if (shouldShowToast && !hasNotifiedNative && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        dispatchNativePushNotification(alertCheck.shortTitle, alertCheck.message);
        setHasNotifiedNative(true);
      }
    }
  }, [shouldShowToast, hasNotifiedNative, alertCheck]);

  const percentage = calculateHydrationPercentage(currentLiters, targetLiters);
  const statusInfo = getHydrationStatus(currentLiters, targetLiters);
  const recommendations = getHydrationRecommendations(
    currentLiters,
    targetLiters,
    hasWorkoutToday,
    kampalaHour
  );

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (Math.min(100, percentage) / 100) * circumference;

  const handleSubtractWater = (litersToSubtract: number) => {
    setCurrentLiters((prev) => {
      const updated = Math.round((prev - litersToSubtract) * 100) / 100;
      return Math.max(0, updated);
    });
  };

  const handleReset = () => {
    setCurrentLiters(0);
    setIsAlertDismissed(false);
    try {
      localStorage.removeItem(dismissKey);
    } catch {}
    showInfo("Hydration Reset", "Today's hydration log has been reset to 0.0 L.");
  };

  const handleDismissAlert = () => {
    setIsAlertDismissed(true);
    try {
      localStorage.setItem(dismissKey, 'true');
    } catch {}
  };

  const handleEnablePushNotifications = async () => {
    const result = await requestPushNotificationPermission();
    setPushPermission(result);
    if (result === 'granted') {
      showSuccess(
        'Push Notifications Active',
        'You will now receive gentle hydration reminders throughout the day.',
        4000
      );
      dispatchNativePushNotification(
        'FlexiFit Hydration Enabled',
        'Gentle tropical reminders calibrated for Kampala weather are active.'
      );
    } else if (result === 'denied') {
      showInfo(
        'Push Notifications Blocked',
        'Browser permissions are blocked. In-app subtle toast notifications will still alert you reliably.',
        5000
      );
    }
  };

  // Helper icon renderer
  const renderRecIcon = (type: string) => {
    switch (type) {
      case 'sun':
        return <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'dumbbell':
        return <Dumbbell className="w-3.5 h-3.5 text-[#FF6A00] shrink-0" />;
      case 'apple':
        return <Apple className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'zap':
        return <Zap className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
      default:
        return <Droplets className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    }
  };

  return (
    <div className="p-5 rounded-3xl bg-[#141414] border border-[#262626] relative overflow-hidden shadow-xl space-y-4">
      {/* 2:00 PM Hydration Toast / Push Banner */}
      {shouldShowToast && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/80 via-[#22170A] to-amber-950/80 border border-amber-500/50 shadow-xl shadow-amber-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-xs tracking-tight">
                  {alertCheck.shortTitle}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/30 text-amber-300">
                  Deficit: -{alertCheck.deficitLiters}L
                </span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-snug">
                {alertCheck.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => handleAddWater(0.5)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>Drink 500ml (+0.5L)</span>
            </button>
            <button
              type="button"
              onClick={handleDismissAlert}
              className="p-1.5 text-amber-400 hover:text-white rounded-lg hover:bg-amber-900/40 transition-colors cursor-pointer"
              title="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>Daily Hydration Tracker</span>
              {hasWorkoutToday && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#FF6A00]/20 text-[#FF6A00] font-semibold border border-[#FF6A00]/30">
                  +Workout Mode
                </span>
              )}
            </h2>
            <p className="text-[10px] text-slate-400">
              Calibrated for Kampala climate ({profile.current_weight_kg ? `${profile.current_weight_kg} kg target` : 'Standard target'})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Simulation Toggle for Testing 2:00 PM Alert */}
          <button
            type="button"
            onClick={() => {
              setSimulate2pmMode(!simulate2pmMode);
              setIsAlertDismissed(false);
            }}
            className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
              simulate2pmMode
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                : 'bg-[#1F1F1F] text-slate-400 border-[#2D2D2D] hover:text-white'
            }`}
            title="Toggle to test afternoon alert system at >=2 PM"
          >
            {simulate2pmMode ? '2:00 PM Active ⏱️' : '2:00 PM Alert Check'}
          </button>

          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.colorClass}`}>
            {statusInfo.label}
          </span>
          {currentLiters > 0 && (
            <button
              onClick={handleReset}
              className="p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              title="Reset today's water"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Hydration Dashboard: Circular Ring + Quick Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-1">
        {/* Progress Ring */}
        <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90">
            <defs>
              <linearGradient id="hydrationGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>
            </defs>
            {/* Background Track */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              stroke="#222222"
              strokeWidth="9"
              fill="none"
            />
            {/* Animated Dynamic Progress Ring */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              stroke="url(#hydrationGradient)"
              strokeWidth="9"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Center Metric Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="flex items-baseline gap-0.5">
              <span className="text-2xl font-black tracking-tight text-white font-mono tabular-nums">
                {currentLiters.toFixed(2)}
              </span>
              <span className="text-xs font-semibold text-cyan-400">L</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              of {targetLiters.toFixed(1)} L goal
            </span>
            <span className="text-xs font-bold text-cyan-300 mt-0.5 font-mono">
              {percentage}%
            </span>

            {/* Quick Added Floating Badge */}
            {justAddedAmount && (
              <span className="absolute -top-1 px-2 py-0.5 rounded-full bg-cyan-500 text-black text-[10px] font-extrabold animate-bounce shadow-lg">
                +{justAddedAmount} L
              </span>
            )}
          </div>
        </div>

        {/* Breakdown Stats */}
        <div className="flex-1 space-y-3 w-full">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-2xl bg-[#1A1A1A] border border-[#262626]">
              <span className="text-[10px] text-slate-400 block font-medium">Remaining</span>
              <span className="text-base font-bold text-white font-mono tabular-nums">
                {Math.max(0, targetLiters - currentLiters).toFixed(2)} L
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-[#1A1A1A] border border-[#262626]">
              <span className="text-[10px] text-slate-400 block font-medium">Status</span>
              <span className="text-xs font-semibold text-slate-300">
                {Math.round(currentLiters / 0.25)} / {Math.round(targetLiters / 0.25)} Cups
              </span>
            </div>
          </div>

          {/* Horizontal Progress Mini Bar */}
          <div className="space-y-1">
            <div className="w-full bg-[#222222] rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, percentage)}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>0.0 L</span>
              <span>Half: {(targetLiters / 2).toFixed(1)} L</span>
              <span>Goal: {targetLiters.toFixed(1)} L</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick-Add Buttons in Liters */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          Quick-Add Portions
        </span>
        <div className="grid grid-cols-4 gap-2">
          {/* Glass: 0.25 L */}
          <button
            type="button"
            onClick={() => handleAddWater(0.25)}
            className="p-2 rounded-xl bg-[#1A1A1A] hover:bg-[#222] border border-[#2C2C2C] hover:border-cyan-500/50 text-center transition-all cursor-pointer group active:scale-95"
          >
            <span className="block text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
              +0.25 L
            </span>
            <span className="text-[9px] text-slate-400 block">Glass (250ml)</span>
          </button>

          {/* Small Bottle: 0.50 L */}
          <button
            type="button"
            onClick={() => handleAddWater(0.5)}
            className="p-2 rounded-xl bg-[#1A1A1A] hover:bg-[#222] border border-[#2C2C2C] hover:border-cyan-500/50 text-center transition-all cursor-pointer group active:scale-95"
          >
            <span className="block text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
              +0.50 L
            </span>
            <span className="text-[9px] text-slate-400 block">Rwenzori (500ml)</span>
          </button>

          {/* Sports Shaker: 0.75 L */}
          <button
            type="button"
            onClick={() => handleAddWater(0.75)}
            className="p-2 rounded-xl bg-[#1A1A1A] hover:bg-[#222] border border-[#2C2C2C] hover:border-cyan-500/50 text-center transition-all cursor-pointer group active:scale-95"
          >
            <span className="block text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
              +0.75 L
            </span>
            <span className="text-[9px] text-slate-400 block">Gym Bottle (750ml)</span>
          </button>

          {/* Refill Jug: 1.00 L */}
          <button
            type="button"
            onClick={() => handleAddWater(1.0)}
            className="p-2 rounded-xl bg-[#1A1A1A] hover:bg-[#222] border border-[#2C2C2C] hover:border-cyan-500/50 text-center transition-all cursor-pointer group active:scale-95"
          >
            <span className="block text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
              +1.00 L
            </span>
            <span className="text-[9px] text-slate-400 block">Pitcher (1000ml)</span>
          </button>
        </div>

        {/* Fine Adjustment Steppers */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => handleSubtractWater(0.25)}
            disabled={currentLiters <= 0}
            className="text-[10px] text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:hover:text-slate-500 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Minus className="w-3 h-3" />
            <span>Undo last entry (-0.25 L)</span>
          </button>

          {/* Reminder Settings Toggle Button */}
          <button
            type="button"
            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
            className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer font-semibold"
          >
            <Bell className="w-3 h-3" />
            <span>{showSettingsPanel ? 'Hide Reminder Setup' : 'Hydration Reminders'}</span>
            {showSettingsPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Hydration Push & Subtle Toast Settings Panel */}
      {showSettingsPanel && (
        <div className="p-3.5 rounded-2xl bg-[#191919] border border-[#2C2C2C] space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-bold text-white">Daily Hydration Reminder System</span>
            </div>
            <button
              type="button"
              onClick={() => triggerHydrationAlert('🔔 Kampala Hydration Check', 'Testing your hydration reminder toast & push alert.')}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-bold border border-cyan-500/40 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>Test Toast Now</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* Push Notifications Toggle */}
            <div className="p-2.5 rounded-xl bg-[#141414] border border-[#242424] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-200 block">Web Push Alerts</span>
                <span className="text-[9px] text-slate-400 block">
                  {pushPermission === 'granted'
                    ? 'Active in background'
                    : pushPermission === 'denied'
                    ? 'Blocked by browser'
                    : 'Permission requested'}
                </span>
              </div>
              {pushPermission === 'granted' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleEnablePushNotifications}
                  className="px-2 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-[10px] transition-colors cursor-pointer"
                >
                  Enable Push
                </button>
              )}
            </div>

            {/* Reminder Interval Selector */}
            <div className="p-2.5 rounded-xl bg-[#141414] border border-[#242424] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-200 block">Reminder Cadence</span>
                <span className="text-[9px] text-slate-400 block">In-app subtle floating toast</span>
              </div>
              <select
                value={reminderSettings.enabled ? reminderSettings.intervalMinutes : 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (val === 0) {
                    setReminderSettings((prev) => ({ ...prev, enabled: false }));
                    showInfo('Reminders Paused', 'Hydration reminder toasts have been paused.');
                  } else {
                    setReminderSettings((prev) => ({ ...prev, enabled: true, intervalMinutes: val }));
                    showSuccess('Reminder Cadence Updated', `Reminders scheduled every ${val / 60} hours.`);
                  }
                }}
                className="bg-[#202020] border border-[#333] text-slate-200 text-[11px] rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value={90}>Every 1.5h</option>
                <option value={120}>Every 2h (Rec)</option>
                <option value={180}>Every 3h</option>
                <option value={0}>Paused</option>
              </select>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Reminders automatically pace your water intake across the day and alert you at 2:00 PM if intake drops below the Kampala 1.5L heat shield threshold.
          </p>
        </div>
      )}

      {/* Recommendations & Climate Advisory Accordion */}
      <div className="pt-2 border-t border-[#222222] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Coach Brian's Hydration Blueprint</span>
          </span>
          <button
            type="button"
            onClick={() => setShowAllRecs(!showAllRecs)}
            className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>{showAllRecs ? 'Show Less' : `All Recommendations (${recommendations.length})`}</span>
            {showAllRecs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Display Primary Top Recommendation */}
        {recommendations.slice(0, showAllRecs ? recommendations.length : 1).map((rec) => (
          <div
            key={rec.id}
            className="p-3 rounded-2xl bg-[#1A1A1A] border border-[#242424] space-y-1"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {renderRecIcon(rec.iconType)}
                <span className="text-xs font-bold text-white tracking-tight">{rec.title}</span>
              </div>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold px-1.5 py-0.5 rounded bg-white/5">
                {rec.tag}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed pl-5">
              {rec.text}
            </p>
          </div>
        ))}

        {/* Kampala Heat & Altitude Note */}
        <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-900/30 text-[10px] text-cyan-300/90 leading-tight">
          Kampala daytime average 26°C with 70% humidity increases unnoticeable sweat evaporation. Target at least 1.5L before 2:00 PM.
        </div>
      </div>
    </div>
  );
};

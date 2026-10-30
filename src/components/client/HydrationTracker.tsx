import React, { useState, useEffect } from 'react';
import { User, ClientProfile } from '../../types';
import {
  calculateHydrationTarget,
  calculateHydrationPercentage,
  getHydrationStatus,
  getHydrationRecommendations,
} from '../../utils/hydrationCalc';
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
  CheckCircle2,
} from 'lucide-react';

interface HydrationTrackerProps {
  user: User;
  profile: ClientProfile;
  hasWorkoutToday: boolean;
}

export const HydrationTracker: React.FC<HydrationTrackerProps> = ({
  user,
  profile,
  hasWorkoutToday,
}) => {
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

  const [showAllRecs, setShowAllRecs] = useState<boolean>(false);
  const [justAddedAmount, setJustAddedAmount] = useState<number | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(todayKey, currentLiters.toString());
    } catch (e) {
      console.error('Failed to save hydration log:', e);
    }
  }, [currentLiters, todayKey]);

  // Current hour in Kampala
  const kampalaHour = parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Kampala',
      hour: 'numeric',
      hour12: false,
    }).format(new Date()),
    10
  );

  const percentage = calculateHydrationPercentage(currentLiters, targetLiters);
  const statusInfo = getHydrationStatus(currentLiters, targetLiters);
  const recommendations = getHydrationRecommendations(
    currentLiters,
    targetLiters,
    hasWorkoutToday,
    kampalaHour
  );

  // Progress ring geometry (Radius 44, circumference ~ 276.46)
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (Math.min(100, percentage) / 100) * circumference;

  const handleAddWater = (litersToAdd: number) => {
    setCurrentLiters((prev) => {
      const updated = Math.round((prev + litersToAdd) * 100) / 100;
      return Math.min(8.0, Math.max(0, updated));
    });
    setJustAddedAmount(litersToAdd);
    setTimeout(() => setJustAddedAmount(null), 1500);
  };

  const handleSubtractWater = (litersToSubtract: number) => {
    setCurrentLiters((prev) => {
      const updated = Math.round((prev - litersToSubtract) * 100) / 100;
      return Math.max(0, updated);
    });
  };

  const handleReset = () => {
    if (window.confirm("Reset today's hydration log to 0.0 L?")) {
      setCurrentLiters(0);
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
    <div className="p-5 rounded-3xl bg-[#141414] border border-[#262626] relative overflow-hidden shadow-xl space-y-5">
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
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.colorClass}`}>
            {statusInfo.label}
          </span>
          {currentLiters > 0 && (
            <button
              onClick={handleReset}
              className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
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
            {/* Animated Cyan Fill Ring */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              stroke="url(#hydrationGradient)"
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              fill="none"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Inner Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
            <span className="text-2xl font-black text-white font-mono leading-none tracking-tight">
              {currentLiters.toFixed(2)}
              <span className="text-xs font-semibold text-cyan-400 ml-0.5">L</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium mt-1">
              of {targetLiters.toFixed(1)} L goal
            </span>
            <span className="text-[10px] font-bold text-cyan-400 font-mono mt-0.5">
              {percentage}%
            </span>
          </div>

          {/* Subtle Flash Animation when water is logged */}
          {justAddedAmount && (
            <div className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-cyan-500 text-black font-extrabold text-[10px] shadow-lg shadow-cyan-500/50 animate-bounce">
              +{justAddedAmount}L
            </div>
          )}
        </div>

        {/* Quick Summary & Remaining Volume */}
        <div className="w-full sm:w-auto flex-1 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2.5 rounded-2xl bg-[#1C1C1C] border border-[#282828]">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Remaining</span>
              <span className="text-sm font-extrabold font-mono text-white">
                {Math.max(0, Math.round((targetLiters - currentLiters) * 100) / 100).toFixed(2)} L
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-[#1C1C1C] border border-[#282828]">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Status</span>
              <span className="text-sm font-extrabold font-mono text-cyan-400">
                {percentage >= 100 ? 'Hydrated 🎯' : `${Math.round(currentLiters * 4)} / ${Math.round(targetLiters * 4)} Cups`}
              </span>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="space-y-1">
            <div className="w-full h-2 bg-[#222222] rounded-full overflow-hidden">
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

      {/* Quick-Add Buttons */}
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

        {/* Undo Button */}
        {currentLiters > 0 && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => handleSubtractWater(0.25)}
              className="text-[10px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Minus className="w-3 h-3" />
              <span>Undo last entry (-0.25 L)</span>
            </button>
          </div>
        )}
      </div>

      {/* Relevant Hydration Recommendations Card */}
      <div className="p-4 rounded-2xl bg-[#181818] border border-[#262626] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Coach Brian's Hydration Cues
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAllRecs(!showAllRecs)}
            className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>{showAllRecs ? 'Show Less' : `All Recommendations (${recommendations.length})`}</span>
            {showAllRecs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Primary/Dynamic Recommendation */}
        <div className="space-y-2">
          {(showAllRecs ? recommendations : recommendations.slice(0, 1)).map((rec) => (
            <div
              key={rec.id}
              className="p-3 rounded-xl bg-[#1E1E1E] border border-[#2A2A2A] flex items-start gap-2.5 text-xs"
            >
              <div className="w-6 h-6 rounded-lg bg-[#272727] flex items-center justify-center shrink-0 mt-0.5">
                {renderRecIcon(rec.iconType)}
              </div>
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-[11px]">{rec.title}</span>
                  <span className="text-[9px] uppercase font-semibold text-slate-400 px-1.5 py-0.2 rounded bg-[#272727]">
                    {rec.tag}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">{rec.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Ugandan Climate & Hydration Tip Footer */}
        <div className="flex items-center gap-1.5 pt-1 text-[10px] text-slate-400">
          <Info className="w-3 h-3 text-[#FF6A00] shrink-0" />
          <span>Kampala daytime average 26°C with 70% humidity increases unnoticeable sweat evaporation.</span>
        </div>
      </div>
    </div>
  );
};

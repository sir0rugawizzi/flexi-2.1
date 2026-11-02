import React, { useState } from 'react';
import { User, ClientProfile, WorkoutPlan, MealPlan, MealLog, WorkoutLog } from '../../types';
import {
  Flame,
  Dumbbell,
  UtensilsCrossed,
  PhoneCall,
  CreditCard,
  CheckCircle,
  Plus,
  Play,
  Calendar,
  MessageSquare,
  Camera,
  Trophy,
  ArrowUpRight,
  ShieldCheck,
  Video,
  Sparkles,
} from 'lucide-react';
import { formatKampalaDate } from '../../utils/formatters';
import { calculateHydrationTarget } from '../../utils/hydrationCalc';
import { evaluateMilestones } from '../../utils/milestonesEngine';
import { HydrationTracker } from './HydrationTracker';
import { MilestonesShowcase } from './MilestonesShowcase';

interface TodayScreenProps {
  user: User;
  profile: ClientProfile;
  macros: {
    totals: { calories: number; protein: number; carbs: number; fat: number };
    targets: { calories: number; protein: number; carbs: number; fat: number };
    percentages: { calories: number; protein: number; carbs: number; fat: number };
  };
  todayMeals: MealLog[];
  workoutLogsToday: WorkoutLog[];
  assignedWorkoutPlan: WorkoutPlan | null;
  assignedMealPlan: MealPlan | null;
  trainer: (User & { profile: any }) | null;
  onOpenWorkoutLogger: () => void;
  onOpenMealLogger: () => void;
  onOpenCallModal: () => void;
  onOpenSubscriptionModal: () => void;
  onOpenChat: () => void;
  onOpenAiTracker?: () => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({
  user,
  profile,
  macros,
  todayMeals,
  workoutLogsToday,
  assignedWorkoutPlan,
  assignedMealPlan,
  trainer,
  onOpenWorkoutLogger,
  onOpenMealLogger,
  onOpenCallModal,
  onOpenSubscriptionModal,
  onOpenChat,
  onOpenAiTracker,
}) => {
  const isWorkoutCompleted = workoutLogsToday.length > 0;

  // Hydration state tracking for live milestone evaluations
  const getTodayKampalaDate = () => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Kampala',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  };

  const todayKey = `flexifit_hydration_${user.id}_${getTodayKampalaDate()}`;
  const [waterLogged, setWaterLogged] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(todayKey);
      return saved ? parseFloat(saved) : 0;
    } catch {
      return 0;
    }
  });

  const targetWater = calculateHydrationTarget({
    weightKg: profile.current_weight_kg,
    activityLevel: profile.activity_level,
    hasWorkoutToday: isWorkoutCompleted || !!assignedWorkoutPlan,
  });

  // Evaluate dynamic milestones
  const milestones = evaluateMilestones({
    waterLoggedLiters: waterLogged,
    waterTargetLiters: targetWater,
    streakDays: profile.streak_days || 0,
    workoutCompletedToday: isWorkoutCompleted,
    totalWorkoutsCompleted: workoutLogsToday.length,
    proteinGramsLogged: macros.totals.protein || 0,
    proteinTargetGrams: macros.targets.protein || 120,
    aiPoseScore: 94,
  });

  // SVG Macro Ring Math (Radius 44, circumference ~ 276.46)
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const calStrokeOffset = circumference - (Math.min(100, macros.percentages.calories) / 100) * circumference;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-fade-in">
      {/* 1. EXECUTIVE COMMAND HEADER STRIP */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#141414] via-[#121212] to-[#161616] border border-[#222222] shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
        {/* Subtle radial ambient highlight */}
        <div className="absolute top-0 left-1/4 w-80 h-32 bg-[#FF6A00]/5 rounded-full blur-3xl pointer-events-none" />

        {/* User Identity & Kampala Date */}
        <div className="flex items-center gap-4 relative z-10">
          <div className="relative shrink-0">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-[#FF6A00]/60 shadow-lg shadow-[#FF6A00]/15"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF6A00] to-amber-600 text-white font-black text-2xl flex items-center justify-center border-2 border-[#FF6A00]/60 shadow-lg shrink-0">
                {user.name.charAt(0)}
              </div>
            )}
            <span
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#141414]"
              title="Active Trainee Session"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold uppercase tracking-wider">
              <span>{formatKampalaDate(new Date())}</span>
              <span aria-hidden="true">·</span>
              <span>Kampala EAT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
              Mwasuze mutya, {user.name.split(' ')[0]}!
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Consistent progressive training & indigenous nutrition. Guided by {trainer?.name || 'Coach Brian Mukasa'}.
            </p>
          </div>
        </div>

        {/* Key Metrics Pill Cluster */}
        <div className="flex items-center gap-3 relative z-10 flex-wrap sm:flex-nowrap">
          {/* Streak Flame Pill */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FF6A00]/10 border border-[#FF6A00]/30 text-[#FF6A00] font-black text-sm shrink-0 shadow-sm">
            <Flame className="w-5 h-5 fill-[#FF6A00] animate-pulse" />
            <span className="font-mono">{profile.streak_days}d Streak</span>
          </div>

          {/* Quick Log Food CTA */}
          <button
            onClick={onOpenMealLogger}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#1E1E1E] hover:bg-[#282828] border border-[#2F2F2F] hover:border-[#FF6A00]/60 text-slate-200 hover:text-white font-extrabold text-xs transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#FF6A00]" />
            <span>Log Food</span>
          </button>
        </div>
      </div>

      {/* 2. MASTER DUAL-DECK RESPONSIVE GRID (7 COLUMNS / 5 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT DECK (7 Columns): Milestones, Today's Workout, Macro Nutrition */}
        <div className="lg:col-span-7 space-y-8">
          {/* A. MILESTONES & VISUAL BADGES SHOWCASE */}
          <MilestonesShowcase badges={milestones} />

          {/* B. TODAY'S SCHEDULED WORKOUT ASSIGNMENT */}
          <div className="p-6 rounded-3xl bg-[#121212] border border-[#222222] space-y-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E1E1E]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FF6A00]/15 border border-[#FF6A00]/30 flex items-center justify-center text-[#FF6A00] shrink-0">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white">Today's Workout Program</h2>
                  <span className="text-[11px] text-slate-400">Kampala progressive bodyweight conditioning</span>
                </div>
              </div>

              {isWorkoutCompleted ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Completed</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/40 font-mono">
                  Scheduled Today
                </span>
              )}
            </div>

            <div>
              <h3 className="font-black text-xl text-white tracking-tight">
                {assignedWorkoutPlan ? assignedWorkoutPlan.title : 'Kampala Home Strength & Tone'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {assignedWorkoutPlan
                  ? assignedWorkoutPlan.description
                  : 'Targeting quadriceps, pelvic stability, and core rigidity with zero equipment required.'}
              </p>
            </div>

            {/* Exercise Breakdown Strip */}
            <div className="p-4 rounded-2xl bg-[#181818] border border-[#262626] space-y-2">
              <span className="text-xs font-bold text-slate-200 block uppercase tracking-wider text-[10px] text-slate-400">
                Day 1 Routine: Lower Body Power
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-[#121212] border border-[#242424]">
                  <span className="text-slate-400 block text-[10px]">Movement 1</span>
                  <span className="font-bold text-white block mt-0.5">Bodyweight Squats</span>
                  <span className="text-[11px] font-mono text-[#FF6A00] mt-0.5 block">4 sets × 15 reps</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#121212] border border-[#242424]">
                  <span className="text-slate-400 block text-[10px]">Movement 2</span>
                  <span className="font-bold text-white block mt-0.5">Walking Lunges</span>
                  <span className="text-[11px] font-mono text-[#FF6A00] mt-0.5 block">3 sets × 12 reps</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#121212] border border-[#242424]">
                  <span className="text-slate-400 block text-[10px]">Movement 3</span>
                  <span className="font-bold text-white block mt-0.5">Forearm Plank</span>
                  <span className="text-[11px] font-mono text-[#FF6A00] mt-0.5 block">3 sets × 45 sec</span>
                </div>
              </div>
            </div>

            {/* Action Buttons: AI Camera Tracking + Manual Log */}
            <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-1">
              {onOpenAiTracker && (
                <button
                  onClick={onOpenAiTracker}
                  className="flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white font-extrabold text-xs shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
                  title="Boot device camera immediately to auto-count reps and check joint angles"
                >
                  <Camera className="w-4 h-4 text-white" />
                  <span>⚡ AI Camera Tracking: Auto-Count Reps</span>
                </button>
              )}

              <button
                onClick={onOpenWorkoutLogger}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[#FF6A00] hover:bg-[#E55F00] active:scale-[0.99] text-white font-extrabold text-xs shadow-lg shadow-[#FF6A00]/25 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{isWorkoutCompleted ? 'Log Extra Set' : 'Start Workout Log'}</span>
              </button>
            </div>
          </div>

          {/* C. DAILY MACRO ADHERENCE & INDIGENOUS NUTRITION DECK */}
          <div className="p-6 rounded-3xl bg-[#121212] border border-[#222222] relative overflow-hidden shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E1E1E]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FF6A00]/15 border border-[#FF6A00]/30 flex items-center justify-center text-[#FF6A00] shrink-0">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white">Daily Macro Adherence</h2>
                  <span className="text-[11px] text-slate-400">Indigenous Ugandan calorie & nutrient targets</span>
                </div>
              </div>

              <button
                onClick={onOpenMealLogger}
                className="flex items-center gap-1 text-xs font-bold text-[#FF6A00] hover:text-[#E55F00] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Meal</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
              {/* Circular Calorie Progress Gauge */}
              <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="72" cy="72" r={radius} stroke="#202020" strokeWidth="9" fill="none" />
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    stroke="#FF6A00"
                    strokeWidth="9"
                    strokeDasharray={circumference}
                    strokeDashoffset={calStrokeOffset}
                    strokeLinecap="round"
                    fill="none"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-white font-mono leading-none tabular-nums">
                    {macros.totals.calories}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium mt-1">
                    / {macros.targets.calories} kcal
                  </span>
                </div>
              </div>

              {/* Individual Macronutrient Bars */}
              <div className="w-full space-y-3.5">
                {/* Protein */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-300">Protein (Tilapia / Beans / Mukene)</span>
                    <span className="font-mono text-emerald-400 font-bold tabular-nums">
                      {macros.totals.protein}g / {macros.targets.protein}g
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#1E1E1E] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, macros.percentages.protein)}%` }}
                    />
                  </div>
                </div>

                {/* Carbs */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-300">Carbs (Matooke / Posho / Sweet Potato)</span>
                    <span className="font-mono text-blue-400 font-bold tabular-nums">
                      {macros.totals.carbs}g / {macros.targets.carbs}g
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#1E1E1E] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, macros.percentages.carbs)}%` }}
                    />
                  </div>
                </div>

                {/* Fat */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-300">Fats (G-Nuts Sauce / Avocado)</span>
                    <span className="font-mono text-amber-400 font-bold tabular-nums">
                      {macros.totals.fat}g / {macros.targets.fat}g
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#1E1E1E] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, macros.percentages.fat)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Logged Foods Quick Strip */}
            {todayMeals.length > 0 ? (
              <div className="pt-3 border-t border-[#1E1E1E] flex items-center gap-2 overflow-x-auto text-[11px] text-slate-300">
                <span className="text-slate-500 font-semibold shrink-0">Logged meals:</span>
                {todayMeals.map((m) => (
                  <span key={m.id} className="px-3 py-1 rounded-xl bg-[#1C1C1C] border border-[#282828] shrink-0 font-medium">
                    {m.food_name} ({m.grams}g)
                  </span>
                ))}
              </div>
            ) : (
              <div className="pt-3 border-t border-[#1E1E1E] text-center text-xs text-slate-500">
                No meals recorded yet today. Tap <strong>+ Log Meal</strong> to track Matooke, Tilapia, or Rolex!
              </div>
            )}
          </div>
        </div>

        {/* RIGHT DECK (5 Columns): Hydration Command Center, Coach Brian Card, Membership */}
        <div className="lg:col-span-5 space-y-8">
          {/* A. DAILY HYDRATION COMMAND CENTER */}
          <HydrationTracker
            user={user}
            profile={profile}
            hasWorkoutToday={isWorkoutCompleted || !!assignedWorkoutPlan}
            onWaterUpdated={(liters) => setWaterLogged(liters)}
          />

          {/* B. ACCREDITED COACH BRIAN MUKASA ACCOUNTABILITY CARD */}
          <div className="p-6 rounded-3xl bg-[#121212] border border-[#222222] shadow-xl space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E1E1E]">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Assigned Accredited Coach
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                <ShieldCheck className="w-3 h-3" />
                <span>Accredited Coach 🏅</span>
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                {trainer?.avatar_url ? (
                  <img
                    src={trainer.avatar_url}
                    alt={trainer.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/60 shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white font-black text-2xl flex items-center justify-center border-2 border-emerald-500/60 shadow-lg">
                    {trainer?.name?.charAt(0) || 'B'}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#121212]" title="Active Online" />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold text-base text-white truncate">
                  {trainer?.name || 'Coach Brian Mukasa'}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  ID: {trainer?.profile?.accreditation_id || 'UG-CPT-2024-UOC01'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                  Authority: {trainer?.profile?.issuing_authority || 'Uganda Olympic Committee & IFBB'}
                </p>
              </div>
            </div>

            {/* Direct Connect Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={onOpenCallModal}
                className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#1C1C1C] hover:bg-[#262626] border border-[#2D2D2D] hover:border-emerald-500/60 text-slate-200 hover:text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
              >
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                <span>Connect Call</span>
              </button>

              <button
                onClick={onOpenChat}
                className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#1C1C1C] hover:bg-[#262626] border border-[#2D2D2D] hover:border-[#FF6A00]/60 text-slate-200 hover:text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
              >
                <MessageSquare className="w-4 h-4 text-[#FF6A00]" />
                <span>Trainer Chat</span>
              </button>
            </div>
          </div>

          {/* C. FLEXIFIT MEMBERSHIP & MOBILE MONEY CARD */}
          <div className="p-6 rounded-3xl bg-[#121212] border border-[#222222] shadow-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#FF6A00]/15 border border-[#FF6A00]/30 flex items-center justify-center text-[#FF6A00] shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">FlexiFit Membership</h3>
                <span className="text-[11px] text-slate-400 font-mono">MTN & Airtel MoMo (UGX)</span>
              </div>
            </div>

            <button
              onClick={onOpenSubscriptionModal}
              className="px-4 py-2.5 rounded-xl bg-[#1C1C1C] hover:bg-[#242424] border border-[#2F2F2F] text-xs font-bold text-[#FF6A00] hover:text-white transition-colors cursor-pointer shadow-sm"
            >
              Manage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

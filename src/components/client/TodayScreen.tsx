import React from 'react';
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
} from 'lucide-react';
import { formatKampalaDate } from '../../utils/formatters';
import { HydrationTracker } from './HydrationTracker';

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
}) => {
  const isWorkoutCompleted = workoutLogsToday.length > 0;

  // SVG Macro Ring Math (Radius 42, circumference ~ 263.8)
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const calStrokeOffset = circumference - (macros.percentages.calories / 100) * circumference;

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      {/* Greeting & Streak Hero Header */}
      <div className="flex items-center justify-between gap-4 pb-2">
        <div>
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
            {formatKampalaDate(new Date())}
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Mwasuze mutya, {user.name.split(' ')[0]}!
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Stay consistent with today's training & indigenous nutrition.
          </p>
        </div>

        {/* Streak Flame Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#FF6A00]/15 border border-[#FF6A00]/40 text-[#FF6A00] font-black text-sm shrink-0 shadow-lg shadow-[#FF6A00]/10">
          <Flame className="w-5 h-5 fill-[#FF6A00] animate-pulse" />
          <span className="font-mono">{profile.streak_days}d Streak</span>
        </div>
      </div>

      {/* Primary Macro Rings Card */}
      <div className="p-5 rounded-3xl bg-[#141414] border border-[#262626] relative overflow-hidden shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <UtensilsCrossed className="w-3.5 h-3.5 text-[#FF6A00]" />
            <span>Daily Macro Adherence</span>
          </span>
          <button
            onClick={onOpenMealLogger}
            className="flex items-center gap-1 text-xs font-bold text-[#FF6A00] hover:text-[#E55F00] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Food</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
          {/* Circular Calorie Progress Gauge */}
          <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="64"
                cy="64"
                r={radius}
                stroke="#242424"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r={radius}
                stroke="#FF6A00"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={calStrokeOffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-black text-white font-mono leading-none">
                {macros.totals.calories}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                / {macros.targets.calories} kcal
              </span>
            </div>
          </div>

          {/* Individual Macronutrient Bars */}
          <div className="w-full space-y-3">
            {/* Protein */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-300">Protein</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {macros.totals.protein}g / {macros.targets.protein}g
                </span>
              </div>
              <div className="w-full h-2 bg-[#222222] rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, macros.percentages.protein)}%` }}
                />
              </div>
            </div>

            {/* Carbs */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-300">Carbs (Matooke/Posho)</span>
                <span className="font-mono text-blue-400 font-bold">
                  {macros.totals.carbs}g / {macros.targets.carbs}g
                </span>
              </div>
              <div className="w-full h-2 bg-[#222222] rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, macros.percentages.carbs)}%` }}
                />
              </div>
            </div>

            {/* Fat */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-300">Fats (G-Nuts/Avocado)</span>
                <span className="font-mono text-amber-400 font-bold">
                  {macros.totals.fat}g / {macros.targets.fat}g
                </span>
              </div>
              <div className="w-full h-2 bg-[#222222] rounded-full overflow-hidden">
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
          <div className="pt-3 border-t border-[#222222] flex items-center gap-2 overflow-x-auto text-[11px] text-slate-300">
            <span className="text-slate-500 font-medium shrink-0">Logged today:</span>
            {todayMeals.map((m) => (
              <span key={m.id} className="px-2.5 py-1 rounded-lg bg-[#1E1E1E] shrink-0 font-medium">
                {m.food_name} ({m.grams}g)
              </span>
            ))}
          </div>
        ) : (
          <div className="pt-3 border-t border-[#222222] text-center text-xs text-slate-500">
            No meals recorded yet today. Tap <strong>+ Log Food</strong> to track Matooke, Tilapia, or Rolex!
          </div>
        )}
      </div>

      {/* Daily Hydration Tracker Component */}
      <HydrationTracker
        user={user}
        profile={profile}
        hasWorkoutToday={isWorkoutCompleted || !!assignedWorkoutPlan}
      />

      {/* Today's Workout Card */}
      <div className="p-5 rounded-3xl bg-[#141414] border border-[#262626] space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-[#FF6A00]" />
            <h2 className="text-sm font-bold text-white">Today's Workout Assignment</h2>
          </div>
          {isWorkoutCompleted ? (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
              <CheckCircle className="w-4 h-4" />
              <span>Completed</span>
            </span>
          ) : (
            <span className="text-xs font-semibold text-amber-400">Scheduled for today</span>
          )}
        </div>

        <div>
          <h3 className="font-black text-lg text-white">
            {assignedWorkoutPlan ? assignedWorkoutPlan.title : 'Kampala Home Strength & Tone'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {assignedWorkoutPlan
              ? assignedWorkoutPlan.description
              : 'Targeting quadriceps, pelvic stability, and core rigidity with zero equipment required.'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#1C1C1C] border border-[#2B2B2B] flex items-center justify-between">
          <div className="space-y-1 text-xs">
            <span className="font-bold text-slate-200 block">Day 1: Lower Body Power</span>
            <span className="text-slate-400 block">• Bodyweight Squats (4 × 15)</span>
            <span className="text-slate-400 block">• Walking Lunges (3 × 12)</span>
            <span className="text-slate-400 block">• Forearm Plank (3 × 45s)</span>
          </div>

          <button
            onClick={onOpenWorkoutLogger}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#FF6A00] hover:bg-[#E55F00] active:scale-95 text-white font-extrabold text-xs shadow-lg shadow-[#FF6A00]/20 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{isWorkoutCompleted ? 'Log Extra Set' : 'Start Workout'}</span>
          </button>
        </div>
      </div>

      {/* Coach Brian Contact & Mobile Money Quick Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Call Coach Modal Trigger */}
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400 shrink-0">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-white">Call Coach Brian</h3>
              <span className="text-[10px] text-slate-400">Google Meet or WhatsApp</span>
            </div>
          </div>
          <button
            onClick={onOpenCallModal}
            className="px-3 py-1.5 rounded-lg bg-[#222] hover:bg-[#2F2F2F] text-xs font-semibold text-slate-200 transition-colors"
          >
            Connect
          </button>
        </div>

        {/* Subscription / MoMo Trigger */}
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF6A00]/15 border border-[#FF6A00]/40 flex items-center justify-center text-[#FF6A00] shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-white">FlexiFit Membership</h3>
              <span className="text-[10px] text-slate-400">MTN & Airtel MoMo (UGX)</span>
            </div>
          </div>
          <button
            onClick={onOpenSubscriptionModal}
            className="px-3 py-1.5 rounded-lg bg-[#222] hover:bg-[#2F2F2F] text-xs font-semibold text-[#FF6A00] transition-colors"
          >
            Simulate
          </button>
        </div>
      </div>
    </div>
  );
};

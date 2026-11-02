import React, { useState } from 'react';
import { MilestoneBadge } from '../../types';
import {
  Award,
  Droplets,
  Flame,
  Dumbbell,
  UtensilsCrossed,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Lock,
  ChevronRight,
  Share2,
  X,
  Trophy,
} from 'lucide-react';

interface MilestonesShowcaseProps {
  badges: MilestoneBadge[];
  onBadgeClick?: (badge: MilestoneBadge) => void;
}

export const MilestonesShowcase: React.FC<MilestonesShowcaseProps> = ({ badges }) => {
  const [selectedBadge, setSelectedBadge] = useState<MilestoneBadge | null>(null);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'progress'>('all');

  const unlockedCount = badges.filter((b) => b.isUnlocked).length;
  const totalCount = badges.length;
  const percentage = Math.round((unlockedCount / totalCount) * 100);

  const filteredBadges = badges.filter((b) => {
    if (filter === 'unlocked') return b.isUnlocked;
    if (filter === 'progress') return !b.isUnlocked;
    return true;
  });

  const getIcon = (name: string, isUnlocked: boolean, color: string) => {
    const props = {
      className: `w-5 h-5 ${isUnlocked ? 'drop-shadow-md' : 'text-slate-500'}`,
      style: isUnlocked ? { color } : undefined,
    };

    switch (name) {
      case 'Droplets':
        return <Droplets {...props} />;
      case 'ShieldAlert':
        return <ShieldAlert {...props} />;
      case 'Dumbbell':
        return <Dumbbell {...props} />;
      case 'Flame':
        return <Flame {...props} />;
      case 'UtensilsCrossed':
        return <UtensilsCrossed {...props} />;
      case 'Sparkles':
      default:
        return <Sparkles {...props} />;
    }
  };

  return (
    <div className="p-5 rounded-3xl bg-[#121212] border border-[#222222] shadow-xl relative overflow-hidden space-y-4">
      {/* Background Ambient Glow */}
      <div className="absolute -top-16 -right-16 w-44 h-44 bg-[#FF6A00]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#1E1E1E]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
              <span>Daily Milestones & Accolades</span>
              <span className="text-[11px] font-mono text-amber-400 font-bold">
                {unlockedCount}/{totalCount} Earned
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Consistency badges awarded for tropical hydration, workouts & indigenous nutrition.
            </p>
          </div>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center p-1 bg-[#1A1A1A] border border-[#262626] rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
              filter === 'all' ? 'bg-[#292929] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setFilter('unlocked')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
              filter === 'unlocked' ? 'bg-amber-950/60 text-amber-300 border border-amber-800/50' : 'text-slate-400 hover:text-amber-400'
            }`}
          >
            Unlocked ({unlockedCount})
          </button>
          <button
            onClick={() => setFilter('progress')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
              filter === 'progress' ? 'bg-[#292929] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending ({totalCount - unlockedCount})
          </button>
        </div>
      </div>

      {/* Progress Track */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Overall Accolade Level</span>
          <span className="font-bold text-amber-400">{percentage}%</span>
        </div>
        <div className="w-full h-2 bg-[#1C1C1C] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-[#FF6A00] to-emerald-400 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
        {filteredBadges.map((badge) => {
          const isComplete = badge.isUnlocked;
          const progress = Math.min(100, Math.round((badge.currentValue / badge.targetValue) * 100));

          return (
            <div
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden ${
                isComplete
                  ? 'bg-gradient-to-b from-[#181818] to-[#121212] border-amber-500/30 hover:border-amber-500/60 shadow-lg shadow-black/40'
                  : 'bg-[#151515] border-[#222222] hover:border-[#333333] opacity-80 hover:opacity-100'
              }`}
            >
              {/* Top Row: Icon Ring & Tier Tag */}
              <div className="flex items-start justify-between gap-2">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${
                    isComplete
                      ? 'bg-gradient-to-br from-[#242424] to-[#181818] shadow-md'
                      : 'bg-[#1C1C1C] border-[#2B2B2B]'
                  }`}
                  style={{
                    borderColor: isComplete ? `${badge.accentColor}55` : '#2B2B2B',
                  }}
                >
                  {getIcon(badge.iconName, isComplete, badge.accentColor)}
                </div>

                {isComplete ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Unlocked</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1F1F1F] text-slate-400 border border-[#2B2B2B]">
                    <Lock className="w-2.5 h-2.5" />
                    <span>{progress}%</span>
                  </span>
                )}
              </div>

              {/* Title & Description */}
              <div className="my-2.5">
                <h3 className="font-extrabold text-xs text-white group-hover:text-amber-400 transition-colors leading-tight">
                  {badge.title}
                </h3>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {badge.description}
                </p>
              </div>

              {/* Micro Progress Bar */}
              <div className="pt-1 border-t border-[#1E1E1E]">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span>Goal: {badge.targetValue} {badge.unit}</span>
                  <span className={isComplete ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                    {badge.currentValue.toFixed(1)} {badge.unit}
                  </span>
                </div>
                <div className="w-full h-1 bg-[#202020] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: isComplete ? badge.accentColor : '#525252',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#141414] border border-[#2D2D2D] p-6 text-slate-100 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white bg-[#1E1E1E] border border-[#2D2D2D] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Icon Display */}
            <div className="text-center pt-2">
              <div
                className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border shadow-xl"
                style={{
                  backgroundColor: `${selectedBadge.accentColor}15`,
                  borderColor: `${selectedBadge.accentColor}60`,
                }}
              >
                {getIcon(selectedBadge.iconName, true, selectedBadge.accentColor)}
              </div>

              <span className="text-[10px] font-black uppercase tracking-wider block mt-3 text-amber-400 font-mono">
                {selectedBadge.tier} Accolade
              </span>
              <h3 className="text-lg font-black text-white mt-0.5">{selectedBadge.title}</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {selectedBadge.description}
              </p>
            </div>

            {/* Criteria Box */}
            <div className="p-3.5 rounded-2xl bg-[#1C1C1C] border border-[#2B2B2B] space-y-1.5 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Milestone Requirement
              </span>
              <p className="font-semibold text-slate-200">{selectedBadge.criteria}</p>

              <div className="flex items-center justify-between pt-2 border-t border-[#262626] font-mono text-[11px]">
                <span className="text-slate-400">Current Progress:</span>
                <span className={selectedBadge.isUnlocked ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {selectedBadge.currentValue.toFixed(1)} / {selectedBadge.targetValue} {selectedBadge.unit}
                </span>
              </div>
            </div>

            {/* Status Footer */}
            <div className="flex items-center gap-2">
              {selectedBadge.isUnlocked ? (
                <div className="w-full py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accolade Earned Today!</span>
                </div>
              ) : (
                <div className="w-full py-2.5 rounded-xl bg-[#1C1C1C] border border-[#2A2A2A] text-slate-400 text-xs font-semibold text-center">
                  Continue logging habits to unlock
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { User } from '../../types';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Users,
  Dumbbell,
  UtensilsCrossed,
  LineChart,
  DollarSign,
  CalendarCheck,
  Camera,
  MessageSquare,
  LogOut,
  RefreshCw,
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  currentTab: string;
  onTabChange: (tab: string) => void;
  onDemoSwitch: (targetRole: 'trainer' | 'client') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentTab,
  onTabChange,
  onDemoSwitch,
  onLogout,
}) => {
  const isTrainer = currentUser?.role === 'trainer';

  return (
    <header className="sticky top-0 z-40 bg-[#0B0B0B]/95 backdrop-blur-md border-b border-[#1F1F1F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onTabChange(isTrainer ? 'clients' : 'today')}
              className="flex items-center gap-2 group text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-[#FF6A00] flex items-center justify-center font-black text-black text-lg shadow-md shadow-[#FF6A00]/20 group-hover:scale-105 transition-transform">
                F
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold tracking-tight text-white group-hover:text-[#FF6A00] transition-colors">
                  FlexiFit
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                  Uganda
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Primary Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 overflow-x-auto py-1">
            {isTrainer ? (
              <>
                <button
                  onClick={() => onTabChange('clients')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    currentTab === 'clients'
                      ? 'bg-[#1C1C1C] text-[#FF6A00] border border-[#2D2D2D]'
                      : 'text-slate-300 hover:text-white hover:bg-[#141414]'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Clients Queue</span>
                </button>
                <button
                  onClick={() => onTabChange('workout_builder')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    currentTab === 'workout_builder'
                      ? 'bg-[#1C1C1C] text-[#FF6A00] border border-[#2D2D2D]'
                      : 'text-slate-300 hover:text-white hover:bg-[#141414]'
                  }`}
                >
                  <Dumbbell className="w-4 h-4" />
                  <span>Workout Builder</span>
                </button>
                <button
                  onClick={() => onTabChange('meal_builder')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    currentTab === 'meal_builder'
                      ? 'bg-[#1C1C1C] text-[#FF6A00] border border-[#2D2D2D]'
                      : 'text-slate-300 hover:text-white hover:bg-[#141414]'
                  }`}
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>Meal Architect</span>
                </button>
                <button
                  onClick={() => onTabChange('foods')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    currentTab === 'foods'
                      ? 'bg-[#1C1C1C] text-[#FF6A00] border border-[#2D2D2D]'
                      : 'text-slate-300 hover:text-white hover:bg-[#141414]'
                  }`}
                >
                  <span>Foods Database</span>
                </button>
                <button
                  onClick={() => onTabChange('revenue')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    currentTab === 'revenue'
                      ? 'bg-[#1C1C1C] text-[#FF6A00] border border-[#2D2D2D]'
                      : 'text-slate-300 hover:text-white hover:bg-[#141414]'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Business & MRR</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onTabChange('today')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    currentTab === 'today'
                      ? 'bg-[#1C1C1C] text-[#FF6A00] border border-[#2D2D2D]'
                      : 'text-slate-300 hover:text-white hover:bg-[#141414]'
                  }`}
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>Today</span>
                </button>
                <button
                  onClick={() => onTabChange('workouts')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    currentTab === 'workouts'
                      ? 'bg-[#1C1C1C] text-[#FF6A00] border border-[#2D2D2D]'
                      : 'text-slate-300 hover:text-white hover:bg-[#141414]'
                  }`}
                >
                  <Dumbbell className="w-4 h-4" />
                  <span>Workout Log</span>
                </button>
                <button
                  onClick={() => onTabChange('meals')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    currentTab === 'meals'
                      ? 'bg-[#1C1C1C] text-[#FF6A00] border border-[#2D2D2D]'
                      : 'text-slate-300 hover:text-white hover:bg-[#141414]'
                  }`}
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>Ugandan Meals</span>
                </button>
                <button
                  onClick={() => onTabChange('progress')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    currentTab === 'progress'
                      ? 'bg-[#1C1C1C] text-[#FF6A00] border border-[#2D2D2D]'
                      : 'text-slate-300 hover:text-white hover:bg-[#141414]'
                  }`}
                >
                  <LineChart className="w-4 h-4" />
                  <span>Progress Charts</span>
                </button>
                <button
                  onClick={() => onTabChange('vision')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    currentTab === 'vision'
                      ? 'bg-[#1C1C1C] text-[#FF6A00] border border-[#2D2D2D]'
                      : 'text-slate-300 hover:text-white hover:bg-[#141414]'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>AI Form Check</span>
                </button>
                <button
                  onClick={() => onTabChange('coach')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    currentTab === 'coach'
                      ? 'bg-[#1C1C1C] text-[#FF6A00] border border-[#2D2D2D]'
                      : 'text-slate-300 hover:text-white hover:bg-[#141414]'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Coach Brian</span>
                </button>
              </>
            )}
          </nav>

          {/* Zone 3: Actions & Quick Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton />

            {/* Quick Demo Role Switcher */}
            <button
              onClick={() => onDemoSwitch(isTrainer ? 'client' : 'trainer')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-[#1F1F1F] hover:bg-[#2C2C2C] text-slate-200 rounded-lg border border-[#333333] transition-colors whitespace-nowrap shrink-0"
              title={`Switch to demo as ${isTrainer ? 'Client' : 'Trainer'}`}
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#FF6A00]" />
              <span className="hidden sm:inline">Demo as</span>
              <span className="font-bold text-[#FF6A00]">{isTrainer ? 'Client' : 'Trainer'}</span>
            </button>

            {currentUser && (
              <div className="flex items-center gap-2 pl-2 border-l border-[#242424]">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-white truncate max-w-[120px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-400 capitalize">
                    {currentUser.role}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-[#1C1C1C] transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

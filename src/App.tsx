/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, ClientOverview } from './types/index.ts';
import { Navbar } from './components/common/Navbar.tsx';
import { OfflineBanner } from './components/common/OfflineBanner.tsx';

// Trainer views
import { ClientList } from './components/trainer/ClientList.tsx';
import { ClientDetail } from './components/trainer/ClientDetail.tsx';
import { WorkoutBuilder } from './components/trainer/WorkoutBuilder.tsx';
import { MealPlanBuilder } from './components/trainer/MealPlanBuilder.tsx';
import { FoodDatabaseManager } from './components/trainer/FoodDatabaseManager.tsx';
import { BusinessView } from './components/trainer/BusinessView.tsx';

// Client views
import { TodayScreen } from './components/client/TodayScreen.tsx';
import { WorkoutLogger } from './components/client/WorkoutLogger.tsx';
import { MealLogger } from './components/client/MealLogger.tsx';
import { ProgressCharts } from './components/client/ProgressCharts.tsx';
import { WeeklyCheckIn } from './components/client/WeeklyCheckIn.tsx';
import { TrainerChat } from './components/client/TrainerChat.tsx';
import { CallTrainerModal } from './components/client/CallTrainerModal.tsx';
import { SubscriptionModal } from './components/client/SubscriptionModal.tsx';

// Vision views
import { LivePoseTracker } from './components/vision/LivePoseTracker.tsx';
import { FormCheckUpload } from './components/vision/FormCheckUpload.tsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<string>('clients');

  // Modals
  const [showCallModal, setShowCallModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Trainer data
  const [clients, setClients] = useState<ClientOverview[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);

  // Client today data
  const [todayData, setTodayData] = useState<any>(null);
  const [isLoadingToday, setIsLoadingToday] = useState(false);

  // Load user session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('flexifit_user');
    const token = localStorage.getItem('flexifit_token');
    if (savedUser && token) {
      try {
        const parsed = JSON.parse(savedUser) as User;
        setCurrentUser(parsed);
        setActiveTab(parsed.role === 'trainer' ? 'clients' : 'today');
      } catch (e) {
        localStorage.removeItem('flexifit_user');
      }
    } else {
      // Default initial preview: log in as Coach Brian (Trainer)
      handleDemoSwitch('trainer');
    }
  }, []);

  // Fetch data whenever user or activeTab changes
  useEffect(() => {
    if (currentUser?.role === 'trainer') {
      fetchClients();
    } else if (currentUser?.role === 'client') {
      fetchTodayData();
    }
  }, [currentUser?.role, currentUser?.id]);

  const fetchClients = async () => {
    setIsLoadingClients(true);
    try {
      const token = localStorage.getItem('flexifit_token');
      const res = await fetch('/api/trainer/clients', {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setIsLoadingClients(false);
    }
  };

  const fetchTodayData = async () => {
    setIsLoadingToday(true);
    try {
      const token = localStorage.getItem('flexifit_token');
      const res = await fetch('/api/client/today', {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (res.ok) {
        const data = await res.json();
        setTodayData(data);
      }
    } catch (err) {
      console.error('Error fetching today client data:', err);
    } finally {
      setIsLoadingToday(false);
    }
  };

  const handleDemoSwitch = async (targetRole: 'trainer' | 'client') => {
    try {
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('flexifit_token', data.token);
        localStorage.setItem('flexifit_user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        if (data.user.role === 'trainer') {
          setActiveTab('clients');
        } else {
          setActiveTab('today');
        }
      }
    } catch (err) {
      console.error('Failed demo login:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('flexifit_token');
    localStorage.removeItem('flexifit_user');
    setCurrentUser(null);
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setActiveTab('client_detail');
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-gray-100 flex flex-col font-sans selection:bg-[#FF6A00] selection:text-black">
      {/* Offline Status */}
      <OfflineBanner />

      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        currentTab={activeTab}
        onTabChange={(tab: string) => setActiveTab(tab)}
        onDemoSwitch={handleDemoSwitch}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* TRAINER VIEWS */}
        {currentUser?.role === 'trainer' && (
          <>
            {activeTab === 'clients' && (
              <ClientList
                clients={clients}
                onSelectClient={handleSelectClient}
                onRefresh={fetchClients}
              />
            )}

            {activeTab === 'client_detail' && (
              <ClientDetail
                clientId={selectedClientId || 'client-sarah-02'}
                onBack={() => setActiveTab('clients')}
              />
            )}

            {activeTab === 'workout_builder' && (
              <WorkoutBuilder
                onPlanCreated={() => {
                  fetchClients();
                  setActiveTab('clients');
                }}
              />
            )}

            {activeTab === 'meal_builder' && (
              <MealPlanBuilder
                onPlanCreated={() => {
                  fetchClients();
                  setActiveTab('clients');
                }}
              />
            )}

            {activeTab === 'foods' && <FoodDatabaseManager />}

            {(activeTab === 'business' || activeTab === 'revenue') && <BusinessView />}
          </>
        )}

        {/* CLIENT VIEWS */}
        {currentUser?.role === 'client' && (
          <>
            {activeTab === 'today' && (
              todayData ? (
                <TodayScreen
                  user={todayData.user || currentUser}
                  profile={todayData.profile || {}}
                  macros={todayData.macros || { totals: {}, targets: {}, percentages: {} }}
                  todayMeals={todayData.todayMeals || []}
                  workoutLogsToday={todayData.workoutLogsToday || []}
                  assignedWorkoutPlan={todayData.assignedWorkoutPlan || null}
                  assignedMealPlan={todayData.assignedMealPlan || null}
                  trainer={todayData.trainer || null}
                  onOpenWorkoutLogger={() => setActiveTab('workouts')}
                  onOpenMealLogger={() => setActiveTab('meals')}
                  onOpenCallModal={() => setShowCallModal(true)}
                  onOpenSubscriptionModal={() => setShowSubscriptionModal(true)}
                  onOpenChat={() => setActiveTab('coach')}
                />
              ) : (
                <div className="flex items-center justify-center p-12 text-gray-400">
                  <div className="animate-spin w-6 h-6 border-2 border-[#FF6A00] border-t-transparent rounded-full mr-3" />
                  <span>Loading Today's Command Center...</span>
                </div>
              )
            )}

            {(activeTab === 'workout_logger' || activeTab === 'workouts') && (
              <WorkoutLogger
                onBack={() => setActiveTab('today')}
                onWorkoutLogged={() => {
                  fetchTodayData();
                  setActiveTab('today');
                }}
              />
            )}

            {(activeTab === 'meal_logger' || activeTab === 'meals') && (
              <MealLogger
                onBack={() => setActiveTab('today')}
                onMealLogged={() => {
                  fetchTodayData();
                  setActiveTab('today');
                }}
              />
            )}

            {activeTab === 'pose_tracker' && (
              <LivePoseTracker
                onBack={() => setActiveTab('today')}
                onSessionSaved={() => {
                  fetchTodayData();
                  setActiveTab('today');
                }}
              />
            )}

            {(activeTab === 'form_check' || activeTab === 'vision') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => setActiveTab('today')}
                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 bg-[#181818] rounded-xl border border-[#262626] transition"
                  >
                    ← Back to Today
                  </button>
                  <button
                    onClick={() => setActiveTab('pose_tracker')}
                    className="text-xs text-[#FF6A00] hover:underline font-semibold"
                  >
                    Try Live Pose Tracker (MediaPipe) →
                  </button>
                </div>
                <FormCheckUpload clientId={currentUser.id} />
              </div>
            )}

            {activeTab === 'progress' && <ProgressCharts />}

            {activeTab === 'check_in' && <WeeklyCheckIn />}

            {(activeTab === 'chat' || activeTab === 'coach') && <TrainerChat />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1e1e1e] bg-[#0c0c0c] py-6 px-4 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-300">FlexiFit Uganda</span>
            <span>•</span>
            <span>Kampala Urban Fitness & Indigenous Nutrition</span>
          </div>
          <p className="text-[11px] text-gray-500">
            Nutrition values approximate, to be validated by a nutritionist. Currency in UGX. Africa/Kampala.
          </p>
        </div>
      </footer>

      {/* Modals */}
      <CallTrainerModal
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
        trainer={
          todayData?.trainer
            ? {
                name: todayData.trainer.name,
                phone: todayData.trainer.phone || '+256 772 123456',
                profile: todayData.trainer.profile || {
                  meet_link: 'https://meet.google.com/flx-kamp-fit',
                  whatsapp_number: '+256772123456',
                  preferred_channel: 'meet',
                },
              }
            : {
                name: 'Coach Brian Mukasa',
                phone: '+256 772 123456',
                profile: {
                  meet_link: 'https://meet.google.com/flx-kamp-fit',
                  whatsapp_number: '+256772123456',
                  preferred_channel: 'meet',
                },
              }
        }
      />

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSubscribed={() => {
          setShowSubscriptionModal(false);
          fetchTodayData();
        }}
      />
    </div>
  );
}

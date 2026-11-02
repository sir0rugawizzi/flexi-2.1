import React, { useState, useEffect } from 'react';
import {
  ClientOverview,
  WorkoutLog,
  MealLog,
  WeightLog,
  CheckIn,
  FormCheck,
} from '../../types';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Dumbbell,
  UtensilsCrossed,
  LineChart as LineChartIcon,
  Video,
  MessageSquare,
  Send,
  User,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';
import { formatKampalaDate, formatKampalaDateTime } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

interface ClientDetailProps {
  clientId: string;
  onBack: () => void;
}

export const ClientDetail: React.FC<ClientDetailProps> = ({ clientId, onBack }) => {
  const { showSuccess, showError } = useToast();
  const [data, setData] = useState<{
    overview: ClientOverview;
    workoutLogs: WorkoutLog[];
    mealLogs: MealLog[];
    weightLogs: WeightLog[];
    checkIns: CheckIn[];
    formChecks: FormCheck[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'checkins' | 'formchecks' | 'chat'>('analytics');
  const [messages, setMessages] = useState<{ id: string; sender_id: string; content: string; created_at: string }[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [feedbackText, setFeedbackText] = useState<Record<string, string>>({});

  const fetchDossier = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('flexifit_token');
      const res = await fetch(`/api/trainer/clients/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch client dossier:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('flexifit_token');
      const res = await fetch(`/api/client/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setMessages(json);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  useEffect(() => {
    fetchDossier();
    fetchMessages();
  }, [clientId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const token = localStorage.getItem('flexifit_token');
      const res = await fetch('/api/client/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      if (res.ok) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (err) {
      console.error('Send message failed:', err);
    }
  };

  const handleSaveFormCheckComment = async (formCheckId: string) => {
    const text = commentText[formCheckId];
    if (!text?.trim()) return;

    try {
      const token = localStorage.getItem('flexifit_token');
      const res = await fetch(`/api/form-check/${formCheckId}/comment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comment: text.trim() }),
      });
      if (res.ok) {
        showSuccess('Feedback Saved', 'Coach feedback saved successfully!');
        fetchDossier();
      }
    } catch (err) {
      console.error('Save comment failed:', err);
      showError('Save Failed', 'Failed to save coach feedback.');
    }
  };

  const handleSaveCheckInFeedback = async (checkInId: string) => {
    const text = feedbackText[checkInId];
    if (!text?.trim()) return;

    try {
      const token = localStorage.getItem('flexifit_token');
      const res = await fetch(`/api/trainer/check-ins/${checkInId}/feedback`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ feedback: text.trim() }),
      });
      if (res.ok) {
        showSuccess('Review Saved', 'Check-in review saved!');
        fetchDossier();
      }
    } catch (err) {
      console.error('Save feedback failed:', err);
      showError('Review Failed', 'Failed to save check-in review.');
    }
  };

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3">
        <div className="w-8 h-8 border-2 border-[#FF6A00] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm">Loading client dossier and telemetry...</p>
      </div>
    );
  }

  const { overview, weightLogs, checkIns, formChecks } = data;

  // Prepare chart series data
  const weightChartData = [...weightLogs]
    .reverse()
    .map((w) => ({
      date: formatKampalaDate(w.logged_at),
      weight: w.weight_kg,
      target: overview.profile.target_weight_kg,
    }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Bar: Back Button & Client Hero */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#222222]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-[#1A1A1A] hover:bg-[#262626] text-slate-300 hover:text-white transition-colors"
            title="Back to Client List"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#202020] border border-[#333333] flex items-center justify-center text-[#FF6A00] font-bold overflow-hidden shrink-0">
              {overview.user.avatar_url ? (
                <img src={overview.user.avatar_url} alt={overview.user.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white tracking-tight">
                  {overview.user.name}
                </h1>
                {overview.is_flagged ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-950/80 text-red-400 border border-red-800/60">
                    <AlertTriangle className="w-3 h-3" />
                    Action Required
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                    <CheckCircle className="w-3 h-3" />
                    On Track
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {overview.user.email} · {overview.user.phone} · Goal: <strong className="text-slate-200 capitalize">{overview.profile.fitness_goal.replace('_', ' ')}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Quick WhatsApp deep link for coach */}
        <a
          href={`https://wa.me/${overview.user.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
            `Hi ${overview.user.name}, Coach Brian here from FlexiFit! Checking in on your progress this week.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-all self-start sm:self-auto"
        >
          <span>WhatsApp Client</span>
        </a>
      </div>

      {/* Flag Alert Details Banner if Flagged */}
      {overview.is_flagged && (
        <div className="p-4 rounded-2xl bg-red-950/30 border border-red-900/50 space-y-2">
          <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Compliance Alert Triggers</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-red-300">
            {overview.flag_reasons.map((r, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="font-bold">•</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-[#242424] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'analytics'
              ? 'bg-[#1F1F1F] text-[#FF6A00] border border-[#333333]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <LineChartIcon className="w-4 h-4" />
          <span>Analytics & Telemetry</span>
        </button>
        <button
          onClick={() => setActiveTab('checkins')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'checkins'
              ? 'bg-[#1F1F1F] text-[#FF6A00] border border-[#333333]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Check-Ins ({checkIns.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('formchecks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'formchecks'
              ? 'bg-[#1F1F1F] text-[#FF6A00] border border-[#333333]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Form-Checks ({formChecks.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'chat'
              ? 'bg-[#1F1F1F] text-[#FF6A00] border border-[#333333]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Coach Thread</span>
        </button>
      </div>

      {/* Tab 1: Analytics & Biometric Telemetry */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Key Metric Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#141414] border border-[#242424]">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Current Weight</span>
              <div className="text-2xl font-black text-white font-mono mt-1">
                {overview.profile.current_weight_kg || '—'} <span className="text-xs font-normal text-slate-400">kg</span>
              </div>
              <span className="text-[11px] text-slate-400">Target: {overview.profile.target_weight_kg} kg</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#141414] border border-[#242424]">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">7d Macro Adherence</span>
              <div className={`text-2xl font-black font-mono mt-1 ${overview.macro_adherence_7d < 70 ? 'text-red-400' : 'text-emerald-400'}`}>
                {overview.macro_adherence_7d}%
              </div>
              <span className="text-[11px] text-slate-400">Goal: {'>'}70%</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#141414] border border-[#242424]">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Active Streak</span>
              <div className="text-2xl font-black text-[#FF6A00] font-mono mt-1">
                {overview.profile.streak_days} <span className="text-xs font-normal text-slate-400">days</span>
              </div>
              <span className="text-[11px] text-slate-400">Continuous logs</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#141414] border border-[#242424]">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Daily Calorie Target</span>
              <div className="text-2xl font-black text-white font-mono mt-1">
                {overview.profile.target_calories} <span className="text-xs font-normal text-slate-400">kcal</span>
              </div>
              <span className="text-[11px] text-slate-400">P:{overview.profile.target_protein_g}g C:{overview.profile.target_carbs_g}g</span>
            </div>
          </div>

          {/* Interactive Recharts: Weight Trajectory */}
          <div className="p-5 rounded-2xl bg-[#141414] border border-[#242424]">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <span>Weight Progression Trajectory</span>
              <span className="text-xs font-normal text-slate-400">(Fasted Morning Log)</span>
            </h3>
            <div className="h-64 w-full">
              {weightChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="date" stroke="#666" fontSize={11} />
                    <YAxis domain={['dataMin - 2', 'dataMax + 2']} stroke="#666" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1C1C1C', borderColor: '#333', borderRadius: 8, color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="weight" stroke="#FF6A00" strokeWidth={3} dot={{ r: 4, fill: '#FF6A00' }} />
                    <Line type="monotone" dataKey="target" stroke="#10B981" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  No weight logs recorded yet.
                </div>
              )}
            </div>
          </div>

          {/* Assigned Plans Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#141414] border border-[#242424]">
              <div className="flex items-center gap-2 text-white font-bold text-sm mb-2">
                <Dumbbell className="w-4 h-4 text-[#FF6A00]" />
                <span>Assigned Workout Program</span>
              </div>
              {overview.active_workout_plan ? (
                <div>
                  <h4 className="font-extrabold text-slate-100">{overview.active_workout_plan.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{overview.active_workout_plan.description}</p>
                  <span className="inline-block mt-3 px-2 py-1 rounded-md bg-[#222222] text-[11px] font-semibold text-slate-300">
                    {overview.active_workout_plan.days_per_week} Days / Week
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No workout program assigned currently.</p>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-[#141414] border border-[#242424]">
              <div className="flex items-center gap-2 text-white font-bold text-sm mb-2">
                <UtensilsCrossed className="w-4 h-4 text-[#FF6A00]" />
                <span>Assigned Ugandan Meal Plan</span>
              </div>
              {overview.active_meal_plan ? (
                <div>
                  <h4 className="font-extrabold text-slate-100">{overview.active_meal_plan.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{overview.active_meal_plan.description}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs font-mono">
                    <span className="text-[#FF6A00] font-bold">{overview.active_meal_plan.target_calories} kcal</span>
                    <span className="text-slate-400">P: {overview.active_meal_plan.target_protein}g</span>
                    <span className="text-slate-400">C: {overview.active_meal_plan.target_carbs}g</span>
                    <span className="text-slate-400">F: {overview.active_meal_plan.target_fat}g</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No meal plan assigned currently.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Check-Ins */}
      {activeTab === 'checkins' && (
        <div className="space-y-4">
          {checkIns.map((cin) => {
            return (
              <div key={cin.id} className="p-5 rounded-2xl bg-[#141414] border border-[#242424] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Weekly Accountability Check-In
                    </h3>
                    <span className="text-xs text-slate-400">
                      Submitted: {formatKampalaDateTime(cin.submitted_at)}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    cin.status === 'reviewed' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                  }`}>
                    {cin.status === 'reviewed' ? 'Reviewed by Coach' : 'Needs Coach Review'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
                  <div className="p-2.5 rounded-xl bg-[#1C1C1C]">
                    <span className="text-[10px] text-slate-400 uppercase font-medium">Energy Level</span>
                    <span className="block text-lg font-extrabold text-white font-mono">{cin.energy_score}/10</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#1C1C1C]">
                    <span className="text-[10px] text-slate-400 uppercase font-medium">Sleep</span>
                    <span className="block text-lg font-extrabold text-white font-mono">{cin.sleep_hours} hrs</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#1C1C1C]">
                    <span className="text-[10px] text-slate-400 uppercase font-medium">Diet Adherence</span>
                    <span className="block text-lg font-extrabold text-white font-mono">{cin.diet_adherence_score}/10</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#1C1C1C]">
                    <span className="text-[10px] text-slate-400 uppercase font-medium">Workout Adherence</span>
                    <span className="block text-lg font-extrabold text-white font-mono">{cin.workout_adherence_score}/10</span>
                  </div>
                </div>

                {cin.notes && (
                  <div className="p-3 rounded-xl bg-[#181818] text-xs text-slate-200">
                    <strong className="text-slate-400 block mb-1">Client Notes:</strong>
                    {cin.notes}
                  </div>
                )}

                {/* Trainer Feedback Section */}
                <div className="pt-2">
                  {cin.trainer_feedback ? (
                    <div className="p-3 rounded-xl bg-[#1A251E] border border-emerald-900/40 text-xs text-emerald-300">
                      <strong className="text-emerald-400 block mb-1">Coach Brian's Feedback:</strong>
                      {cin.trainer_feedback}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        rows={2}
                        placeholder="Write encouragement and training tweaks for this check-in..."
                        value={feedbackText[cin.id] || ''}
                        onChange={(e) => setFeedbackText({ ...feedbackText, [cin.id]: e.target.value })}
                        className="w-full p-3 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF6A00]"
                      />
                      <button
                        onClick={() => handleSaveCheckInFeedback(cin.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#FF6A00] hover:bg-[#E55F00] text-xs font-bold text-white transition-colors"
                      >
                        Submit Review
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {checkIns.length === 0 && (
            <p className="p-8 text-center text-xs text-slate-400 rounded-2xl bg-[#141414] border border-[#242424]">
              No check-ins submitted yet.
            </p>
          )}
        </div>
      )}

      {/* Tab 3: Form-Check Video Submissions (Gemini AI + Trainer Comments) */}
      {activeTab === 'formchecks' && (
        <div className="space-y-4">
          {formChecks.map((fc) => {
            let goodPoints: string[] = [];
            let fixPoints: string[] = [];
            try {
              goodPoints = JSON.parse(fc.ai_good_json);
              fixPoints = JSON.parse(fc.ai_fixes_json);
            } catch {
              // fallback
            }

            return (
              <div key={fc.id} className="p-5 rounded-2xl bg-[#141414] border border-[#242424] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
                  <div>
                    <h3 className="font-extrabold text-base text-white">{fc.exercise}</h3>
                    <span className="text-xs text-slate-400">
                      Submitted: {formatKampalaDateTime(fc.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold">Gemini AI Score:</span>
                    <span className="px-3 py-1 rounded-xl bg-[#FF6A00]/10 border border-[#FF6A00]/30 text-[#FF6A00] font-black text-sm font-mono">
                      {fc.ai_score} / 10
                    </span>
                  </div>
                </div>

                {/* Video Preview or Placeholder */}
                <div className="aspect-video max-w-md mx-auto rounded-xl bg-black overflow-hidden flex items-center justify-center border border-[#2B2B2B]">
                  <video
                    src={fc.video_path}
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Structured AI Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40 space-y-1">
                    <strong className="text-emerald-400 block mb-1">What Looked Strong:</strong>
                    {goodPoints.map((item, idx) => (
                      <p key={idx} className="text-slate-300 flex items-start gap-1">
                        <span className="text-emerald-400">✓</span>
                        <span>{item}</span>
                      </p>
                    ))}
                  </div>

                  <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-900/40 space-y-1">
                    <strong className="text-red-400 block mb-1">Technique Fixes Required:</strong>
                    {fixPoints.map((item, idx) => (
                      <p key={idx} className="text-slate-300 flex items-start gap-1">
                        <span className="text-red-400">!</span>
                        <span>{item}</span>
                      </p>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#181818] text-xs text-slate-300">
                  <strong className="text-[#FF6A00] block mb-1">Recommended Verbal Cue:</strong>
                  "{fc.ai_cue}"
                </div>

                {/* Trainer Comment Section */}
                <div className="pt-2">
                  {fc.trainer_comment ? (
                    <div className="p-3 rounded-xl bg-[#1C1F26] border border-blue-900/40 text-xs text-blue-200">
                      <strong className="text-blue-400 block mb-1">Your Coach Feedback:</strong>
                      {fc.trainer_comment}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        rows={2}
                        placeholder="Add your personalized coach advice to this form check..."
                        value={commentText[fc.id] || ''}
                        onChange={(e) => setCommentText({ ...commentText, [fc.id]: e.target.value })}
                        className="w-full p-3 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF6A00]"
                      />
                      <button
                        onClick={() => handleSaveFormCheckComment(fc.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#FF6A00] hover:bg-[#E55F00] text-xs font-bold text-white transition-colors"
                      >
                        Send Video Comment
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {formChecks.length === 0 && (
            <p className="p-8 text-center text-xs text-slate-400 rounded-2xl bg-[#141414] border border-[#242424]">
              No video form check submissions yet.
            </p>
          )}
        </div>
      )}

      {/* Tab 4: Direct Chat Thread */}
      {activeTab === 'chat' && (
        <div className="p-5 rounded-2xl bg-[#141414] border border-[#242424] space-y-4">
          <h3 className="text-sm font-bold text-white">Direct Message Thread with {overview.user.name}</h3>

          <div className="h-80 overflow-y-auto space-y-3 p-3 bg-[#0E0E0E] rounded-xl border border-[#222222]">
            {messages.map((m) => {
              const isCoach = m.sender_id !== clientId;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isCoach ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[75%] p-3 rounded-2xl text-xs ${
                      isCoach
                        ? 'bg-[#FF6A00] text-white rounded-tr-none'
                        : 'bg-[#242424] text-slate-100 rounded-tl-none'
                    }`}
                  >
                    <p>{m.content}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 px-1">
                    {formatKampalaDateTime(m.created_at)}
                  </span>
                </div>
              );
            })}
            {messages.length === 0 && (
              <p className="text-center text-xs text-slate-500 py-12">No messages yet. Send an opening greeting!</p>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Type message to client..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF6A00]"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

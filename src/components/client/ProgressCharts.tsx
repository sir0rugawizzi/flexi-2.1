import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatKampalaDate } from '../../utils/formatters';
import { LineChart as LineChartIcon, Plus, Scale, Dumbbell, UtensilsCrossed } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const ProgressCharts: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [data, setData] = useState<{
    targetWeightKg: number;
    currentWeightKg: number;
    targetCalories: number;
    timeline: Array<{
      date: string;
      calories: number;
      adherencePercent: number;
      weightKg: number | null;
      workoutsCompleted: number;
    }>;
    weightHistory: any[];
    recentWorkouts: any[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [newWeight, setNewWeight] = useState('');
  const [weightNotes, setWeightNotes] = useState('');
  const [showLogModal, setShowLogModal] = useState(false);
  const [submittingWeight, setSubmittingWeight] = useState(false);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('flexifit_token');
      const res = await fetch('/api/client/progress', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load progress telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight) return;

    setSubmittingWeight(true);
    try {
      const token = localStorage.getItem('flexifit_token');
      const res = await fetch('/api/client/weights/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          weight_kg: parseFloat(newWeight),
          notes: weightNotes || 'Morning check-in',
        }),
      });

      if (res.ok) {
        showSuccess('Weight Logged', `${parseFloat(newWeight)} kg recorded successfully. Charts updated!`);
        setNewWeight('');
        setWeightNotes('');
        setShowLogModal(false);
        fetchProgress();
      }
    } catch (err) {
      console.error(err);
      showError('Logging Failed', 'Failed to log weight. Please try again.');
    } finally {
      setSubmittingWeight(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-[#FF6A00] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs">Loading 4-week biometric charts...</p>
      </div>
    );
  }

  // Filter weights for line chart
  const weightSeries = data.timeline
    .filter((d) => d.weightKg !== null)
    .map((d) => ({
      date: formatKampalaDate(d.date),
      weight: d.weightKg,
      target: data.targetWeightKg,
    }));

  const adherenceSeries = data.timeline.map((d) => ({
    date: d.date.slice(5), // MM-DD
    adherence: d.adherencePercent,
    workouts: d.workoutsCompleted,
  }));

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12 animate-fade-in">
      <div className="flex items-center justify-between pb-2">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Progress Telemetry</h1>
          <p className="text-xs text-slate-400 mt-1">
            4-week historical analysis of weight trends, macro adherence, and workout volume.
          </p>
        </div>

        <button
          onClick={() => setShowLogModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log Weight</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#242424]">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Current Weight</span>
          <span className="text-xl font-black text-white font-mono mt-1 block">
            {data.currentWeightKg || '—'} <span className="text-xs font-normal text-slate-400">kg</span>
          </span>
          <span className="text-[10px] text-slate-500">Goal: {data.targetWeightKg} kg</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#141414] border border-[#242424]">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Workouts</span>
          <span className="text-xl font-black text-[#FF6A00] font-mono mt-1 block">
            {data.recentWorkouts.length}
          </span>
          <span className="text-[10px] text-slate-500">Last 4 weeks</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#141414] border border-[#242424]">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Macro Compliance</span>
          <span className="text-xl font-black text-emerald-400 font-mono mt-1 block">
            {Math.round(adherenceSeries.reduce((s, a) => s + a.adherence, 0) / adherenceSeries.length)}%
          </span>
          <span className="text-[10px] text-slate-500">Target {'>'}70%</span>
        </div>
      </div>

      {/* Chart 1: Weight Progression */}
      <div className="p-5 rounded-3xl bg-[#141414] border border-[#262626] space-y-3 shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#FF6A00]" />
            <span>Body Weight Progression (kg)</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">
            Target: {data.targetWeightKg} kg
          </span>
        </div>

        <div className="h-60 w-full pt-2">
          {weightSeries.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="date" stroke="#666" fontSize={10} />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="#666" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1C1C1C', borderColor: '#333', borderRadius: 8, color: '#fff', fontSize: 11 }}
                />
                <Line type="monotone" dataKey="weight" stroke="#FF6A00" strokeWidth={3} dot={{ r: 4, fill: '#FF6A00' }} />
                <Line type="monotone" dataKey="target" stroke="#10B981" strokeDasharray="4 4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              No weight logs recorded yet. Tap "+ Log Weight" above!
            </div>
          )}
        </div>
      </div>

      {/* Chart 2: Daily Macro Adherence Timeline */}
      <div className="p-5 rounded-3xl bg-[#141414] border border-[#262626] space-y-3 shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
            <span>Daily Macro Adherence % (Last 28 Days)</span>
          </h2>
          <span className="text-xs text-emerald-400 font-mono font-bold">Target 70%+</span>
        </div>

        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={adherenceSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="date" stroke="#666" fontSize={9} />
              <YAxis domain={[0, 100]} stroke="#666" fontSize={10} />
              <Tooltip
                formatter={(val: any) => [`${val}%`, 'Adherence']}
                contentStyle={{ backgroundColor: '#1C1C1C', borderColor: '#333', borderRadius: 8, color: '#fff', fontSize: 11 }}
              />
              <Bar dataKey="adherence" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Modal: Log Body Weight */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#141414] border border-[#2E2E2E] p-6 text-slate-100 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-white">Log Fasted Body Weight</h3>

            <form onSubmit={handleLogWeight} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Morning Weight (kg) *</label>
                <input
                  type="number"
                  step={0.1}
                  placeholder="e.g. 74.2"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-4 py-3 bg-[#1C1C1C] border border-[#333] rounded-xl text-lg font-black text-white font-mono text-center focus:outline-none focus:border-[#FF6A00]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Post-bathroom, fasted"
                  value={weightNotes}
                  onChange={(e) => setWeightNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#1C1C1C] border border-[#333] rounded-xl text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#222] text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingWeight}
                  className="px-5 py-2 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold"
                >
                  {submittingWeight ? 'Saving...' : 'Save Weight'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

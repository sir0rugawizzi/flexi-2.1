import React, { useState, useEffect } from 'react';
import { CheckIn } from '../../types';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';
import { formatKampalaDateTime } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

export const WeeklyCheckIn: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [energy, setEnergy] = useState(8);
  const [sleep, setSleep] = useState(7.5);
  const [dietAdherence, setDietAdherence] = useState(8);
  const [workoutAdherence, setWorkoutAdherence] = useState(9);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCheckIns = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('flexifit_token');
      const res = await fetch('/api/client/check-ins', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setCheckIns(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckIns();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('flexifit_token');
      const res = await fetch('/api/client/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          energy_score: energy,
          sleep_hours: sleep,
          diet_adherence_score: dietAdherence,
          workout_adherence_score: workoutAdherence,
          notes,
        }),
      });

      if (res.ok) {
        showSuccess('Check-In Submitted', 'Weekly accountability check-in recorded! Coach Brian has been notified.');
        setNotes('');
        fetchCheckIns();
      }
    } catch (err) {
      console.error(err);
      showError('Submission Failed', 'Failed to submit check-in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Weekly Accountability Check-In</h1>
        <p className="text-xs text-slate-400 mt-1">
          Asynchronous Sunday check-in with Coach Brian to evaluate energy, sleep, diet adherence, and fatigue.
        </p>
      </div>

      {/* Check-In Submission Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-[#141414] border border-[#262626] space-y-5 shadow-xl">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#FF6A00]" />
          <span>This Week's Reflection</span>
        </h2>

        {/* 1. Energy */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Overall Energy & Recovery</span>
            <span className="font-mono text-[#FF6A00] font-bold">{energy} / 10</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={energy}
            onChange={(e) => setEnergy(parseInt(e.target.value))}
            className="w-full accent-[#FF6A00] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>1 (Exhausted / Drained)</span>
            <span>10 (Peak Vitality)</span>
          </div>
        </div>

        {/* 2. Sleep */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Average Nightly Sleep (Hours)</span>
            <span className="font-mono text-blue-400 font-bold">{sleep} hrs</span>
          </div>
          <input
            type="range"
            min={4}
            max={12}
            step={0.5}
            value={sleep}
            onChange={(e) => setSleep(parseFloat(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>4 hrs</span>
            <span>8 hrs</span>
            <span>12 hrs</span>
          </div>
        </div>

        {/* 3. Diet Adherence */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Nutrition & Macro Compliance</span>
            <span className="font-mono text-emerald-400 font-bold">{dietAdherence} / 10</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={dietAdherence}
            onChange={(e) => setDietAdherence(parseInt(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>1 (Completely Off-Track)</span>
            <span>10 (100% Target Met)</span>
          </div>
        </div>

        {/* 4. Workout Adherence */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Workout Consistency</span>
            <span className="font-mono text-[#FF6A00] font-bold">{workoutAdherence} / 10</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={workoutAdherence}
            onChange={(e) => setWorkoutAdherence(parseInt(e.target.value))}
            className="w-full accent-[#FF6A00] cursor-pointer"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Questions, Challenges, or Wins for Coach Brian
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Work was hectic on Wednesday, but hit all protein goals with Tilapia and G-nuts..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF6A00]"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-xs shadow-lg shadow-[#FF6A00]/20 transition-all cursor-pointer"
        >
          {submitting ? 'Submitting Check-In...' : 'Send Weekly Check-In to Coach'}
        </button>
      </form>

      {/* Historical Check-Ins List */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white">Past Check-Ins History</h2>
        {checkIns.map((cin) => (
          <div key={cin.id} className="p-4 rounded-2xl bg-[#141414] border border-[#262626] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatKampalaDateTime(cin.submitted_at)}</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                cin.status === 'reviewed' ? 'bg-emerald-950/80 text-emerald-400' : 'bg-amber-950/80 text-amber-400'
              }`}>
                {cin.status === 'reviewed' ? 'Reviewed' : 'Pending Review'}
              </span>
            </div>

            <div className="flex items-center gap-4 text-slate-300 font-mono text-[11px] py-1">
              <span>Energy: {cin.energy_score}/10</span>
              <span>Sleep: {cin.sleep_hours}h</span>
              <span>Diet: {cin.diet_adherence_score}/10</span>
              <span>Workouts: {cin.workout_adherence_score}/10</span>
            </div>

            {cin.notes && (
              <p className="text-slate-400 bg-[#1C1C1C] p-2 rounded-lg">
                "{cin.notes}"
              </p>
            )}

            {cin.trainer_feedback && (
              <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-900/40 text-emerald-300">
                <strong className="block text-emerald-400 mb-0.5">Coach Brian's Feedback:</strong>
                {cin.trainer_feedback}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

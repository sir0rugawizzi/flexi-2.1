import React, { useState, useEffect } from 'react';
import { Exercise, WorkoutLog } from '../../types';
import { Dumbbell, Play, Pause, RotateCcw, Video, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface WorkoutLoggerProps {
  onBack: () => void;
  onWorkoutLogged: () => void;
}

export const WorkoutLogger: React.FC<WorkoutLoggerProps> = ({ onBack, onWorkoutLogged }) => {
  const { showSuccess, showError, showInfo } = useToast();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  // Set-by-set tracker
  const [sets, setSets] = useState<Array<{ setNumber: number; reps: number; weightKg: number; completed: boolean }>>([
    { setNumber: 1, reps: 15, weightKg: 0, completed: false },
    { setNumber: 2, reps: 15, weightKg: 0, completed: false },
    { setNumber: 3, reps: 15, weightKg: 0, completed: false },
  ]);

  // Rest Timer State
  const [restSeconds, setRestSeconds] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const [rpeScore, setRpeScore] = useState(7);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Load exercise catalog
    const loadExercises = async () => {
      try {
        const token = localStorage.getItem('flexifit_token');
        const res = await fetch('/api/foods/../exercises', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const list = await res.json();
          setExercises(list);
          if (list.length > 0) setSelectedExercise(list[0]);
        } else {
          // fallback
          const defaultEx: Exercise = {
            id: 'ex-1',
            name: 'Bodyweight Squats',
            target_muscle: 'Quadriceps & Glutes',
            equipment: 'none',
            difficulty: 'beginner',
            instructions: 'Hinge back at the hips and lower body until thighs are parallel to the floor.',
            video_url: 'https://www.youtube.com/watch?v=aclHkVaku9U',
            is_bodyweight: true,
          };
          setExercises([defaultEx]);
          setSelectedExercise(defaultEx);
        }
      } catch {
        // fallback
      }
    };
    loadExercises();
  }, []);

  // Timer Tick Hook
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      // Play synthetic web audio chime
      playChime();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timeLeft]);

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch {
      // AudioContext unavailable
    }
  };

  const handleToggleSet = (index: number) => {
    const updated = [...sets];
    updated[index].completed = !updated[index].completed;
    setSets(updated);

    // If marked completed, trigger rest timer
    if (updated[index].completed) {
      setTimeLeft(restSeconds);
      setIsTimerRunning(true);
    }
  };

  const handleAddSet = () => {
    setSets([
      ...sets,
      {
        setNumber: sets.length + 1,
        reps: sets[sets.length - 1]?.reps || 12,
        weightKg: sets[sets.length - 1]?.weightKg || 0,
        completed: false,
      },
    ]);
  };

  const handleSaveWorkout = async () => {
    if (!selectedExercise) return;
    const completedSets = sets.filter((s) => s.completed);
    if (completedSets.length === 0) {
      showInfo('Incomplete Set', 'Please check off at least 1 completed set before saving.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('flexifit_token');
      const totalReps = completedSets.reduce((sum, s) => sum + s.reps, 0);
      const avgWeight = Math.max(...completedSets.map((s) => s.weightKg));

      const res = await fetch('/api/client/workouts/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          exercise_id: selectedExercise.id,
          exercise_name: selectedExercise.name,
          sets_completed: completedSets.length,
          reps_completed: totalReps,
          weight_kg: avgWeight,
          duration_minutes: 25,
          rpe_score: rpeScore,
          notes,
        }),
      });

      if (res.ok) {
        showSuccess(
          'Workout Logged',
          `Completed ${completedSets.length} sets of ${selectedExercise.name}! Daily workout consistency milestone updated.`
        );
        onWorkoutLogged();
      }
    } catch (err) {
      console.error(err);
      showError('Failed to log workout', 'Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Today</span>
        </button>
        <span className="text-xs font-bold text-[#FF6A00] font-mono">Live Session</span>
      </div>

      {/* Exercise Picker */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-300">Active Exercise</label>
        <select
          value={selectedExercise?.id || ''}
          onChange={(e) => {
            const found = exercises.find((ex) => ex.id === e.target.value);
            if (found) setSelectedExercise(found);
          }}
          className="w-full px-4 py-2.5 bg-[#141414] border border-[#2B2B2B] rounded-xl text-sm font-bold text-white focus:outline-none focus:border-[#FF6A00]"
        >
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name} ({ex.target_muscle})
            </option>
          ))}
        </select>
      </div>

      {/* Exercise Video & Form Instructions */}
      {selectedExercise && (
        <div className="p-5 rounded-3xl bg-[#141414] border border-[#262626] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">{selectedExercise.name} Technique Cues</h2>
            {selectedExercise.video_url && (
              <a
                href={selectedExercise.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-950/60 border border-red-800/40 text-red-400 text-xs font-semibold hover:bg-red-900/60 transition-colors"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Watch Demonstration</span>
              </a>
            )}
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {selectedExercise.instructions}
          </p>
        </div>
      )}

      {/* Rest Stopwatch Countdown Box */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#1C1510] to-[#141414] border border-[#FF6A00]/40 flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[10px] uppercase font-bold text-[#FF6A00] tracking-wider">
            Interval Rest Timer
          </span>
          <div className="text-3xl font-black font-mono text-white">
            {Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? `0${timeLeft % 60}` : timeLeft % 60}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className="p-3 rounded-xl bg-[#FF6A00] text-white hover:bg-[#E55F00] transition-colors cursor-pointer"
            title={isTimerRunning ? 'Pause rest timer' : 'Start rest timer'}
          >
            {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
          </button>
          <button
            onClick={() => {
              setIsTimerRunning(false);
              setTimeLeft(restSeconds);
            }}
            className="p-3 rounded-xl bg-[#242424] text-slate-300 hover:text-white transition-colors"
            title="Reset timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Set-by-Set Logging Table */}
      <div className="p-5 rounded-3xl bg-[#141414] border border-[#262626] space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-[#FF6A00]" />
            <span>Sets & Reps Tracker</span>
          </h2>
          <button
            type="button"
            onClick={handleAddSet}
            className="text-xs font-bold text-[#FF6A00] hover:underline"
          >
            + Add Set
          </button>
        </div>

        <div className="space-y-2">
          {sets.map((set, idx) => (
            <div
              key={set.setNumber}
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                set.completed
                  ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-300'
                  : 'bg-[#1C1C1C] border-[#2A2A2A] text-slate-200'
              }`}
            >
              <span className="font-mono font-bold text-sm w-8">Set {set.setNumber}</span>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400">Reps:</span>
                  <input
                    type="number"
                    min={1}
                    value={set.reps}
                    onChange={(e) => {
                      const updated = [...sets];
                      updated[idx].reps = parseInt(e.target.value) || 0;
                      setSets(updated);
                    }}
                    className="w-14 px-2 py-1 bg-[#141414] border border-[#333] rounded-lg text-center font-mono text-white text-sm"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400">Weight:</span>
                  <input
                    type="number"
                    min={0}
                    step={2.5}
                    value={set.weightKg}
                    onChange={(e) => {
                      const updated = [...sets];
                      updated[idx].weightKg = parseFloat(e.target.value) || 0;
                      setSets(updated);
                    }}
                    className="w-16 px-2 py-1 bg-[#141414] border border-[#333] rounded-lg text-center font-mono text-white text-sm"
                  />
                  <span className="text-[10px] text-slate-400">kg</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggleSet(idx)}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  set.completed
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#292929] text-slate-400 hover:text-white'
                }`}
                title={set.completed ? 'Mark incomplete' : 'Complete set'}
              >
                <CheckCircle2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* RPE & Notes */}
      <div className="p-5 rounded-3xl bg-[#141414] border border-[#262626] space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
            <span>Rate of Perceived Exertion (RPE)</span>
            <span className="text-[#FF6A00] font-mono">{rpeScore} / 10</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={rpeScore}
            onChange={(e) => setRpeScore(parseInt(e.target.value))}
            className="w-full accent-[#FF6A00] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>1 (Very Easy)</span>
            <span>5 (Moderate)</span>
            <span>10 (Max Effort / Failure)</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Workout Notes for Coach Brian
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Felt knee tension on set 3, rested 90s, form felt strong..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF6A00]"
          />
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSaveWorkout}
        disabled={submitting}
        className="w-full py-4 rounded-2xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-extrabold text-sm shadow-xl shadow-[#FF6A00]/20 active:scale-[0.98] transition-all cursor-pointer"
      >
        {submitting ? 'Saving Workout Log...' : 'Complete & Save Workout Session'}
      </button>
    </div>
  );
};

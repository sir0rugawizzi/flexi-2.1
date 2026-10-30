import React, { useState, useEffect } from 'react';
import { Exercise, WorkoutPlan, ClientOverview } from '../../types';
import { Dumbbell, Plus, Trash2, CheckCircle2, UserCheck, Video } from 'lucide-react';

interface WorkoutBuilderProps {
  onPlanCreated: () => void;
}

export const WorkoutBuilder: React.FC<WorkoutBuilderProps> = ({ onPlanCreated }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [clients, setClients] = useState<ClientOverview[]>([]);
  const [existingPlans, setExistingPlans] = useState<WorkoutPlan[]>([]);
  const [selectedMuscle, setSelectedMuscle] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalTag, setGoalTag] = useState('General Fitness');
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);

  // Weekly schedule structure
  const [days, setDays] = useState<
    Array<{
      day_number: number;
      day_name: string;
      exercises: Array<{
        exercise_id: string;
        exercise_name: string;
        sets: number;
        reps: number;
        rest_seconds: number;
        notes?: string;
      }>;
    }>
  >([
    {
      day_number: 1,
      day_name: 'Day 1: Full Body Compound',
      exercises: [],
    },
    {
      day_number: 2,
      day_name: 'Day 2: Core Rigidity & Conditioning',
      exercises: [],
    },
    {
      day_number: 3,
      day_name: 'Day 3: Lower Body & Posterior Chain',
      exercises: [],
    },
  ]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const token = localStorage.getItem('flexifit_token');
        const [exRes, clRes, plRes] = await Promise.all([
          fetch('/api/foods/../exercises', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/trainer/clients', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/trainer/workout-plans', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (clRes.ok) setClients(await clRes.json());
        if (plRes.ok) setExistingPlans(await plRes.json());

        // fallback exercises if route doesn't return
        if (exRes.ok) {
          setExercises(await exRes.json());
        } else {
          // fetch local
          const fallbackEx = [
            { id: 'ex-1', name: 'Bodyweight Squats', target_muscle: 'Quadriceps & Glutes', equipment: 'none', difficulty: 'beginner', instructions: 'Hip hinge and bend knees to parallel.', is_bodyweight: true },
            { id: 'ex-2', name: 'Push-Ups (Standard / Incline)', target_muscle: 'Pectorals (Chest)', equipment: 'none', difficulty: 'beginner', instructions: 'Chest to floor with 45-deg elbows.', is_bodyweight: true },
            { id: 'ex-3', name: 'Forearm Plank Hold', target_muscle: 'Core / Abdominals', equipment: 'none', difficulty: 'beginner', instructions: 'Tuck pelvis, maintain spine line.', is_bodyweight: true },
            { id: 'ex-4', name: 'Walking Lunges', target_muscle: 'Quadriceps & Glutes', equipment: 'none', difficulty: 'intermediate', instructions: 'Step and drop back knee toward deck.', is_bodyweight: true },
            { id: 'ex-5', name: 'Glute Bridges', target_muscle: 'Gluteus Maximus', equipment: 'none', difficulty: 'beginner', instructions: 'Drive hips up to bridge.', is_bodyweight: true },
            { id: 'ex-6', name: 'Mountain Climbers', target_muscle: 'Core & Conditioning', equipment: 'none', difficulty: 'intermediate', instructions: 'Rapid alternating knee drives.', is_bodyweight: true },
          ] as Exercise[];
          setExercises(fallbackEx);
        }
      } catch (err) {
        console.error('Failed to load workout builder data:', err);
      }
    };

    fetchCatalog();
  }, []);

  const handleAddExerciseToDay = (dayIndex: number, ex: Exercise) => {
    const updated = [...days];
    updated[dayIndex].exercises.push({
      exercise_id: ex.id,
      exercise_name: ex.name,
      sets: 3,
      reps: 12,
      rest_seconds: 60,
    });
    setDays(updated);
  };

  const handleRemoveExercise = (dayIndex: number, exIndex: number) => {
    const updated = [...days];
    updated[dayIndex].exercises.splice(exIndex, 1);
    setDays(updated);
  };

  const handleUpdateExParam = (dayIndex: number, exIndex: number, field: 'sets' | 'reps' | 'rest_seconds', val: number) => {
    const updated = [...days];
    updated[dayIndex].exercises[exIndex][field] = val;
    setDays(updated);
  };

  const handleSaveWorkoutPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a title for the workout plan.');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('flexifit_token');
      const res = await fetch('/api/trainer/workout-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          goal_tag: goalTag,
          days_per_week: daysPerWeek,
          schedule_json: days,
        }),
      });

      if (!res.ok) throw new Error('Failed to create plan');
      const plan = await res.json();

      // Assign to selected clients if any
      if (selectedClientIds.length > 0) {
        for (const clientId of selectedClientIds) {
          await fetch('/api/trainer/assign-plans', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              client_id: clientId,
              workout_plan_id: plan.id,
            }),
          });
        }
      }

      alert('Workout Plan successfully created and assigned!');
      setTitle('');
      setDescription('');
      setSelectedClientIds([]);
      onPlanCreated();
    } catch (err) {
      console.error(err);
      alert('Failed to save workout plan.');
    } finally {
      setSaving(false);
    }
  };

  const filteredExercises = exercises.filter((ex) => {
    if (selectedMuscle !== 'all' && !ex.target_muscle.toLowerCase().includes(selectedMuscle.toLowerCase())) {
      return false;
    }
    if (selectedEquipment !== 'all' && ex.equipment !== selectedEquipment) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Workout Program Architect
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Build progressive overload home & outdoor training schedules and assign them directly to your clients.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Schedule Builder Form */}
        <form onSubmit={handleSaveWorkoutPlan} className="lg:col-span-2 space-y-5">
          {/* Plan Meta Inputs */}
          <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-[#FF6A00]" />
              <span>Program Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Plan Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 4-Week Kampala Home Hypertrophy"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF6A00]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Goal Focus Tag
                </label>
                <select
                  value={goalTag}
                  onChange={(e) => setGoalTag(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs text-white focus:outline-none focus:border-[#FF6A00]"
                >
                  <option value="General Fitness">General Fitness</option>
                  <option value="Fat Loss & Tone">Fat Loss & Tone</option>
                  <option value="Muscle Hypertrophy">Muscle Hypertrophy</option>
                  <option value="Core & Posture">Core & Posture</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Program Description & Coaching Cues
              </label>
              <textarea
                rows={2}
                placeholder="Explain the weekly frequency, recovery tips, and progressive overload targets..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF6A00]"
              />
            </div>
          </div>

          {/* Days & Exercise Slots */}
          <div className="space-y-4">
            {days.map((day, dayIdx) => (
              <div key={day.day_number} className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
                  <input
                    type="text"
                    value={day.day_name}
                    onChange={(e) => {
                      const updated = [...days];
                      updated[dayIdx].day_name = e.target.value;
                      setDays(updated);
                    }}
                    className="font-bold text-sm text-[#FF6A00] bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-[#FF6A00] rounded px-1"
                  />
                  <span className="text-xs text-slate-400 font-mono">
                    {day.exercises.length} exercises
                  </span>
                </div>

                {/* Exercises list in this day */}
                <div className="space-y-2">
                  {day.exercises.map((ex, exIdx) => (
                    <div
                      key={exIdx}
                      className="p-3 rounded-xl bg-[#1C1C1C] border border-[#2B2B2B] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#262626] flex items-center justify-center text-[10px] text-slate-300 font-mono">
                          {exIdx + 1}
                        </span>
                        <span>{ex.exercise_name}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] text-slate-400">Sets:</label>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={ex.sets}
                            onChange={(e) => handleUpdateExParam(dayIdx, exIdx, 'sets', parseInt(e.target.value) || 1)}
                            className="w-12 px-1.5 py-1 bg-[#141414] border border-[#333] rounded text-center text-white font-mono"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <label className="text-[10px] text-slate-400">Reps:</label>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={ex.reps}
                            onChange={(e) => handleUpdateExParam(dayIdx, exIdx, 'reps', parseInt(e.target.value) || 1)}
                            className="w-12 px-1.5 py-1 bg-[#141414] border border-[#333] rounded text-center text-white font-mono"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <label className="text-[10px] text-slate-400">Rest(s):</label>
                          <input
                            type="number"
                            step={15}
                            min={0}
                            max={300}
                            value={ex.rest_seconds}
                            onChange={(e) => handleUpdateExParam(dayIdx, exIdx, 'rest_seconds', parseInt(e.target.value) || 30)}
                            className="w-14 px-1.5 py-1 bg-[#141414] border border-[#333] rounded text-center text-white font-mono"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveExercise(dayIdx, exIdx)}
                          className="p-1 text-slate-400 hover:text-red-400 rounded transition-colors"
                          title="Remove exercise"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {day.exercises.length === 0 && (
                    <p className="text-xs text-slate-500 py-3 text-center border border-dashed border-[#262626] rounded-xl">
                      Select an exercise from the library on the right to add to this day.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Assign to Clients Section */}
          <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#FF6A00]" />
              <span>Assign To Clients Immediately (Optional)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Select clients who will receive this program in their Today screen.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {clients.map((c) => {
                const isSelected = selectedClientIds.includes(c.user.id);
                return (
                  <button
                    key={c.user.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedClientIds(selectedClientIds.filter((id) => id !== c.user.id));
                      } else {
                        setSelectedClientIds([...selectedClientIds, c.user.id]);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-[#FF6A00]/15 border-[#FF6A00] text-white'
                        : 'bg-[#1C1C1C] border-[#2E2E2E] text-slate-300 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{c.user.name}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6A00] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-sm shadow-lg shadow-[#FF6A00]/20 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Saving & Publishing Program...' : 'Save & Publish Workout Plan'}
          </button>
        </form>

        {/* Right 1 Col: Exercise Library Drawer */}
        <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-4 h-fit sticky top-20">
          <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-[#FF6A00]" />
              <span>Exercise Library</span>
            </h3>
            <span className="text-xs text-slate-400">{filteredExercises.length} available</span>
          </div>

          {/* Quick Filters */}
          <div className="space-y-2">
            <select
              value={selectedMuscle}
              onChange={(e) => setSelectedMuscle(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#1C1C1C] border border-[#2B2B2B] rounded-lg text-xs text-white"
            >
              <option value="all">All Muscle Groups</option>
              <option value="Quadriceps">Quads & Glutes</option>
              <option value="Chest">Chest / Pectorals</option>
              <option value="Core">Core & Abs</option>
              <option value="Hamstrings">Hamstrings & Lower Back</option>
              <option value="Conditioning">Cardio Conditioning</option>
            </select>

            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#1C1C1C] border border-[#2B2B2B] rounded-lg text-xs text-white"
            >
              <option value="all">All Equipment</option>
              <option value="none">Bodyweight / No Equipment</option>
              <option value="chair">Chair / Couch</option>
              <option value="dumbbell">Dumbbells</option>
            </select>
          </div>

          {/* Exercise List */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredExercises.map((ex) => (
              <div
                key={ex.id}
                className="p-3 rounded-xl bg-[#1C1C1C] border border-[#2A2A2A] hover:border-[#FF6A00]/50 transition-colors text-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-white leading-tight">{ex.name}</h4>
                    <span className="text-[10px] text-slate-400">{ex.target_muscle}</span>
                  </div>
                  {ex.video_url && (
                    <a
                      href={ex.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-slate-400 hover:text-red-400"
                      title="Watch exercise demonstration"
                    >
                      <Video className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400">Add to:</span>
                  {days.map((d, dIdx) => (
                    <button
                      key={d.day_number}
                      type="button"
                      onClick={() => handleAddExerciseToDay(dIdx, ex)}
                      className="px-2 py-0.5 rounded bg-[#272727] hover:bg-[#FF6A00] hover:text-white text-[10px] font-semibold text-slate-300 transition-colors"
                    >
                      D{d.day_number}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

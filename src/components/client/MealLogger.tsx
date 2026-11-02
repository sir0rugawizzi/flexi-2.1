import React, { useState, useEffect } from 'react';
import { Food } from '../../types';
import { scaleFoodNutrients } from '../../utils/macroCalc';
import { ArrowLeft, Search, Plus, UtensilsCrossed, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface MealLoggerProps {
  onBack: () => void;
  onMealLogged: () => void;
}

export const MealLogger: React.FC<MealLoggerProps> = ({ onBack, onMealLogged }) => {
  const { showSuccess, showError } = useToast();
  const [foods, setFoods] = useState<Food[]>([]);
  const [search, setSearch] = useState('');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [portionGrams, setPortionGrams] = useState(150);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const res = await fetch('/api/foods');
        if (res.ok) {
          const list = await res.json();
          setFoods(list);
          if (list.length > 0) setSelectedFood(list[0]);
        }
      } catch (err) {
        console.error('Failed to load foods:', err);
      }
    };
    fetchFoods();
  }, []);

  const scaledNutrients = selectedFood
    ? scaleFoodNutrients(selectedFood, portionGrams)
    : { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const handleSaveMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFood) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('flexifit_token');
      const res = await fetch('/api/client/meals/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          meal_type: mealType,
          food_id: selectedFood.id,
          food_name: selectedFood.name,
          grams: portionGrams,
          calories: scaledNutrients.calories,
          protein: scaledNutrients.protein,
          carbs: scaledNutrients.carbs,
          fat: scaledNutrients.fat,
        }),
      });

      if (res.ok) {
        showSuccess(
          'Meal Logged',
          `Logged ${portionGrams}g of ${selectedFood.name} (${scaledNutrients.calories} kcal) for ${mealType}!`
        );
        onMealLogged();
      }
    } catch (err) {
      console.error(err);
      showError('Failed to log meal', 'Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFoods = foods.filter((f) => {
    return (
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.local_name && f.local_name.toLowerCase().includes(search.toLowerCase()))
    );
  });

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
        <span className="text-xs font-bold text-[#FF6A00] font-mono">Ugandan Nutrition</span>
      </div>

      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Log Indigenous Meal</h1>
        <p className="text-xs text-slate-400 mt-1">
          Select an authentic Ugandan dish and enter your portion size.
        </p>
      </div>

      {/* Meal Type Selector */}
      <div className="grid grid-cols-4 gap-2">
        {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setMealType(type)}
            className={`py-2.5 rounded-xl text-xs font-bold capitalize transition-colors ${
              mealType === type
                ? 'bg-[#FF6A00] text-white shadow-md shadow-[#FF6A00]/20'
                : 'bg-[#141414] border border-[#262626] text-slate-400 hover:text-white'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Food Search and Selection */}
      <div className="p-5 rounded-3xl bg-[#141414] border border-[#262626] space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <UtensilsCrossed className="w-4 h-4 text-[#FF6A00]" />
          <span>Select Ugandan Food</span>
        </h2>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Matooke, Tilapia, Rolex, Posho, Kalo, Beans..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF6A00]"
          />
        </div>

        {/* Quick Food Badges */}
        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
          {filteredFoods.map((f) => {
            const isSelected = selectedFood?.id === f.id;
            return (
              <div
                key={f.id}
                onClick={() => {
                  setSelectedFood(f);
                  setPortionGrams(f.typical_serving_g || 150);
                }}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors text-xs ${
                  isSelected
                    ? 'bg-[#FF6A00]/15 border-[#FF6A00] text-white'
                    : 'bg-[#1C1C1C] border-[#2A2A2A] text-slate-300 hover:text-white hover:border-[#3A3A3A]'
                }`}
              >
                <div>
                  <div className="font-bold">{f.name}</div>
                  {f.local_name && <span className="text-[10px] text-amber-400 italic block">{f.local_name}</span>}
                  <span className="text-[10px] text-slate-400 font-mono">
                    {f.calories_100g} kcal/100g · P:{f.protein_100g}g C:{f.carbs_100g}g F:{f.fat_100g}g
                  </span>
                </div>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-[#FF6A00] shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Portion Size & Live Macro Breakdown */}
      {selectedFood && (
        <div className="p-5 rounded-3xl bg-[#141414] border border-[#262626] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Portion Size</h3>
            <span className="text-xs text-slate-400">Typical: {selectedFood.serving_unit}</span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="number"
              step={10}
              min={10}
              max={1500}
              value={portionGrams}
              onChange={(e) => setPortionGrams(parseInt(e.target.value) || 100)}
              className="flex-1 px-4 py-2.5 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-base font-bold text-white font-mono text-center focus:outline-none focus:border-[#FF6A00]"
            />
            <span className="text-sm font-bold text-slate-300 font-mono">grams</span>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-2">
            {[100, 150, 200, 300, 400].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setPortionGrams(preset)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors ${
                  portionGrams === preset
                    ? 'bg-[#FF6A00] text-white'
                    : 'bg-[#1C1C1C] text-slate-400 hover:text-white'
                }`}
              >
                {preset}g
              </button>
            ))}
          </div>

          {/* Live Nutrition Calculation for this portion */}
          <div className="grid grid-cols-4 gap-2 text-center pt-2 border-t border-[#222222]">
            <div className="p-2 rounded-xl bg-[#1C1C1C]">
              <span className="text-[10px] text-slate-400 uppercase font-medium">Calories</span>
              <span className="block text-base font-black text-[#FF6A00] font-mono">
                {scaledNutrients.calories}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-[#1C1C1C]">
              <span className="text-[10px] text-slate-400 uppercase font-medium">Protein</span>
              <span className="block text-base font-black text-emerald-400 font-mono">
                {scaledNutrients.protein}g
              </span>
            </div>
            <div className="p-2 rounded-xl bg-[#1C1C1C]">
              <span className="text-[10px] text-slate-400 uppercase font-medium">Carbs</span>
              <span className="block text-base font-black text-blue-400 font-mono">
                {scaledNutrients.carbs}g
              </span>
            </div>
            <div className="p-2 rounded-xl bg-[#1C1C1C]">
              <span className="text-[10px] text-slate-400 uppercase font-medium">Fat</span>
              <span className="block text-base font-black text-amber-400 font-mono">
                {scaledNutrients.fat}g
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Nutrition Disclaimer */}
      <footer className="text-center text-[11px] text-slate-500 italic">
        Approximate values, to be validated by a nutritionist.
      </footer>

      {/* Save Button */}
      <button
        onClick={handleSaveMeal}
        disabled={submitting || !selectedFood}
        className="w-full py-4 rounded-2xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-extrabold text-sm shadow-xl shadow-[#FF6A00]/20 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
      >
        {submitting ? 'Recording Meal...' : `Log ${selectedFood ? selectedFood.name : 'Food'} for ${mealType.toUpperCase()}`}
      </button>
    </div>
  );
};

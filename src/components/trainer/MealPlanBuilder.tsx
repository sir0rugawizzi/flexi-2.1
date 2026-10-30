import React, { useState, useEffect } from 'react';
import { Food, ClientOverview, KampalaMarketId } from '../../types';
import { scaleFoodNutrients } from '../../utils/macroCalc';
import { KAMPALA_MARKETS } from '../../data/kampalaMarketPrices';
import {
  calculateItemCost,
  calculatePlanCost,
  formatUgx,
  findMarketPriceItem,
  getCostPer100g,
} from '../../utils/marketPriceCalc';
import { MarketShoppingListModal } from './MarketShoppingListModal';
import {
  UtensilsCrossed,
  Search,
  Trash2,
  CheckCircle2,
  UserCheck,
  TrendingDown,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Info,
  MapPin,
  CircleDollarSign,
} from 'lucide-react';

interface MealPlanBuilderProps {
  onPlanCreated: () => void;
}

export const MealPlanBuilder: React.FC<MealPlanBuilderProps> = ({ onPlanCreated }) => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [clients, setClients] = useState<ClientOverview[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMarketId, setSelectedMarketId] = useState<KampalaMarketId>('kalerwe');
  const [sortBy, setSortBy] = useState<'default' | 'cheapest_protein' | 'cheapest_100g' | 'highest_protein'>('default');
  const [isGroceryModalOpen, setIsGroceryModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetCalories, setTargetCalories] = useState(2000);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Meal plan items for everyday schedule
  const [meals, setMeals] = useState<
    Array<{
      meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
      food_id: string;
      food_name: string;
      serving_grams: number;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }>
  >([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('flexifit_token');
        const [foodRes, clRes] = await Promise.all([
          fetch('/api/foods'),
          fetch('/api/trainer/clients', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (foodRes.ok) setFoods(await foodRes.json());
        if (clRes.ok) setClients(await clRes.json());
      } catch (err) {
        console.error('Failed to load meal builder data:', err);
      }
    };
    loadData();
  }, []);

  const handleAddFoodToMeal = (food: Food, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    const grams = food.typical_serving_g || 150;
    const scaled = scaleFoodNutrients(food, grams);

    setMeals([
      ...meals,
      {
        meal_type: mealType,
        food_id: food.id,
        food_name: food.name,
        serving_grams: grams,
        calories: scaled.calories,
        protein: scaled.protein,
        carbs: scaled.carbs,
        fat: scaled.fat,
      },
    ]);
  };

  const handleUpdatePortion = (index: number, grams: number) => {
    const item = meals[index];
    const food = foods.find((f) => f.id === item.food_id || f.name.toLowerCase() === item.food_name.toLowerCase());
    if (!food) {
      // Scale proportionally if not found in db
      const ratio = grams / (item.serving_grams || 100);
      const updated = [...meals];
      updated[index] = {
        ...item,
        serving_grams: grams,
        calories: Math.round(item.calories * ratio),
        protein: Math.round(item.protein * ratio * 10) / 10,
        carbs: Math.round(item.carbs * ratio * 10) / 10,
        fat: Math.round(item.fat * ratio * 10) / 10,
      };
      setMeals(updated);
      return;
    }

    const scaled = scaleFoodNutrients(food, grams);
    const updated = [...meals];
    updated[index] = {
      ...item,
      serving_grams: grams,
      calories: scaled.calories,
      protein: scaled.protein,
      carbs: scaled.carbs,
      fat: scaled.fat,
    };
    setMeals(updated);
  };

  const handleRemoveMealItem = (index: number) => {
    const updated = [...meals];
    updated.splice(index, 1);
    setMeals(updated);
  };

  // 1-Click Smart Swap Implementation
  const handleApplySwap = (currentFoodWithPortion: string, suggestedFoodWithPortion: string) => {
    // Extract base name
    const currentBase = currentFoodWithPortion.split('(')[0].trim().toLowerCase();
    const suggestedBase = suggestedFoodWithPortion.split('(')[0].trim();

    // Find meal item matching current food
    const idx = meals.findIndex((m) => m.food_name.toLowerCase().includes(currentBase) || currentBase.includes(m.food_name.toLowerCase()));
    if (idx === -1) return;

    // Find target food in food catalog or fallback
    const matchedCatalogFood = foods.find((f) =>
      f.name.toLowerCase().includes(suggestedBase.toLowerCase()) ||
      (suggestedBase.toLowerCase().includes('mukene') && f.name.toLowerCase().includes('silverfish')) ||
      (suggestedBase.toLowerCase().includes('beans') && f.name.toLowerCase().includes('beans')) ||
      (suggestedBase.toLowerCase().includes('sweet potatoes') && f.name.toLowerCase().includes('sweet potatoes'))
    );

    if (matchedCatalogFood) {
      const newGrams = suggestedBase.toLowerCase().includes('mukene') ? 60 : matchedCatalogFood.typical_serving_g || 150;
      const scaled = scaleFoodNutrients(matchedCatalogFood, newGrams);
      const updated = [...meals];
      updated[idx] = {
        ...updated[idx],
        food_id: matchedCatalogFood.id,
        food_name: matchedCatalogFood.name,
        serving_grams: newGrams,
        calories: scaled.calories,
        protein: scaled.protein,
        carbs: scaled.carbs,
        fat: scaled.fat,
      };
      setMeals(updated);
    }
  };

  // Live Macro Totals
  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = Math.round(meals.reduce((sum, m) => sum + m.protein, 0) * 10) / 10;
  const totalCarbs = Math.round(meals.reduce((sum, m) => sum + m.carbs, 0) * 10) / 10;
  const totalFat = Math.round(meals.reduce((sum, m) => sum + m.fat, 0) * 10) / 10;
  const calDiff = totalCalories - targetCalories;

  // Live Market Cost Calculation
  const planCost = calculatePlanCost(meals, selectedMarketId);
  const activeMarket = KAMPALA_MARKETS[selectedMarketId] || KAMPALA_MARKETS.kalerwe;

  const handleSaveMealPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || meals.length === 0) {
      alert('Please provide a title and at least 1 meal item.');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('flexifit_token');
      const daysJson = [
        {
          day_number: 1,
          day_name: 'Daily Standard Ugandan Nutrition',
          market_id: selectedMarketId,
          estimated_daily_cost_ugx: planCost.daily_cost_ugx,
          meals,
        },
      ];

      const res = await fetch('/api/trainer/meal-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description:
            description ||
            `High-nutrient authentic Ugandan diet plan (Estimated budget: ${formatUgx(planCost.daily_cost_ugx)}/day at ${activeMarket.name})`,
          days_json: daysJson,
          target_calories: targetCalories,
          target_protein: totalProtein,
          target_carbs: totalCarbs,
          target_fat: totalFat,
        }),
      });

      if (!res.ok) throw new Error('Failed to create meal plan');
      const plan = await res.json();

      // Assign to selected clients
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
              meal_plan_id: plan.id,
            }),
          });
        }
      }

      alert('Meal plan created and assigned successfully with Kampala market price benchmarks!');
      setTitle('');
      setDescription('');
      setMeals([]);
      setSelectedClientIds([]);
      onPlanCreated();
    } catch (err) {
      console.error(err);
      alert('Failed to save meal plan.');
    } finally {
      setSaving(false);
    }
  };

  // Filter & Sort Foods in the catalog
  const filteredFoods = foods
    .filter((f) => {
      const matchesSearch =
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        (f.local_name && f.local_name.toLowerCase().includes(search.toLowerCase()));
      if (!matchesSearch) return false;
      if (selectedCategory !== 'all' && f.category !== selectedCategory) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'cheapest_protein') {
        const itemA = findMarketPriceItem(a.name);
        const itemB = findMarketPriceItem(b.name);
        const costA = itemA?.cost_per_gram_protein_ugx ?? 999;
        const costB = itemB?.cost_per_gram_protein_ugx ?? 999;
        return costA - costB;
      }
      if (sortBy === 'cheapest_100g') {
        const priceA = getCostPer100g(a.name, a.category, selectedMarketId);
        const priceB = getCostPer100g(b.name, b.category, selectedMarketId);
        return priceA - priceB;
      }
      if (sortBy === 'highest_protein') {
        return b.protein_100g - a.protein_100g;
      }
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Ugandan Meal Architect</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-[#FF6A00]/20 text-[#FF6A00] border border-[#FF6A00]/30">
              Live Price Tracker
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Build high-protein, macro-balanced nutrition plans calibrated with real Kampala market ingredient costs.
          </p>
        </div>

        {/* Action Button: Open Weekly Grocery List */}
        <button
          type="button"
          onClick={() => setIsGroceryModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-[#1C1C1C] hover:bg-[#262626] border border-[#333] hover:border-[#FF6A00]/60 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <ShoppingBag className="w-4 h-4 text-[#FF6A00]" />
          <span>Generate Market Grocery Guide</span>
          {meals.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#FF6A00] text-black font-extrabold text-[10px]">
              {meals.length}
            </span>
          )}
        </button>
      </div>

      {/* Experimental Local Market Price Tracker Toolbar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#181818] via-[#141414] to-[#181818] border border-[#2B2B2B] shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <CircleDollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Local Market Price Tracker
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Kampala Benchmark
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3 h-3 text-[#FF6A00]" />
                <span>{activeMarket.location} · <em>{activeMarket.tagline}</em></span>
              </p>
            </div>
          </div>

          {/* Market Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {(Object.keys(KAMPALA_MARKETS) as KampalaMarketId[]).map((mId) => {
              const m = KAMPALA_MARKETS[mId];
              const isSelected = selectedMarketId === mId;
              return (
                <button
                  key={mId}
                  type="button"
                  onClick={() => setSelectedMarketId(mId)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#FF6A00] text-white font-bold shadow-md shadow-[#FF6A00]/25'
                      : 'bg-[#1F1F1F] text-slate-300 hover:text-white hover:bg-[#282828] border border-[#2C2C2C]'
                  }`}
                >
                  {m.name.replace(' Market', '')}
                  {mId === 'kalerwe' && ' (Value)'}
                  {mId === 'nakasero' && ' (CBD)'}
                  {mId === 'owino' && ' (Pulses)'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Meal Plan Builder, Macro Speedometer & Price Tracker */}
        <form onSubmit={handleSaveMealPlan} className="lg:col-span-2 space-y-5">
          {/* Plan Metadata */}
          <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-[#FF6A00]" />
              <span>Nutrition Plan Blueprint</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Plan Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. High-Protein Budget Cut with Mukene & Matooke"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF6A00]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Daily Calories (kcal) *
                </label>
                <input
                  type="number"
                  step={50}
                  value={targetCalories}
                  onChange={(e) => setTargetCalories(parseInt(e.target.value) || 2000)}
                  className="w-full px-3.5 py-2 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#FF6A00]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Dietary Guidance & Market Sourcing Cues
              </label>
              <textarea
                rows={2}
                placeholder="Notes for client on buying beans/mukene in bulk, water intake, and prep tips..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF6A00]"
              />
            </div>
          </div>

          {/* Unified Dual Dashboard: Live Macro Speedometer + Real-time Market Cost Ticker */}
          <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
            {/* Top Bar: Calories Adherence + Cost Tier */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222222] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Live Plan Metrics & Budget
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({activeMarket.name})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold font-mono ${
                    Math.abs(calDiff) <= 100
                      ? 'text-emerald-400'
                      : calDiff > 100
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}
                >
                  {calDiff > 0 ? `+${calDiff} kcal over` : `${calDiff} kcal to target`}
                </span>
                <span className="text-slate-600">·</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF6A00]/15 text-[#FF6A00] border border-[#FF6A00]/30">
                  {planCost.budget_tier_label}
                </span>
              </div>
            </div>

            {/* Metric Cards Grid: Macros + Ugandan Shilling Live Costs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#262626]">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Calories</span>
                <span className="block text-xl font-extrabold text-[#FF6A00] font-mono">
                  {totalCalories} <span className="text-[10px] text-slate-400 font-normal">/ {targetCalories}</span>
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#262626]">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Protein</span>
                <span className="block text-xl font-extrabold text-emerald-400 font-mono">
                  {totalProtein}g
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#262626]">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Daily Food Cost</span>
                <span className="block text-lg font-extrabold text-white font-mono">
                  {formatUgx(planCost.daily_cost_ugx)}
                </span>
                <span className="text-[9px] text-slate-400 block font-mono">
                  ~{formatUgx(planCost.weekly_cost_ugx)} / wk
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#262626]">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Cost / g Protein</span>
                <span className="block text-lg font-extrabold text-sky-400 font-mono">
                  {planCost.cost_per_gram_protein > 0 ? `UGX ${planCost.cost_per_gram_protein}` : '—'}
                </span>
                <span className="text-[9px] text-slate-400 block">
                  {planCost.cost_per_gram_protein <= 40
                    ? '⚡ Ultra Efficient'
                    : planCost.cost_per_gram_protein <= 70
                    ? '👍 Good Balance'
                    : '💎 Premium Protein'}
                </span>
              </div>
            </div>
          </div>

          {/* Smart Budget Swaps Optimizer Card (Shows when savings opportunities are detected) */}
          {planCost.smart_swaps.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#181818] border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Kampala Budget Optimizer · Smart Swaps
                  </span>
                </div>
                <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Save up to {formatUgx(planCost.smart_swaps.reduce((sum, s) => sum + s.weekly_savings_ugx, 0))}/week
                </span>
              </div>

              <div className="space-y-2">
                {planCost.smart_swaps.map((swap, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-3 rounded-xl bg-[#1F1F1F] border border-[#2D2D2D] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-semibold text-white">
                        <span className="text-red-400 line-through">{swap.current_food}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-emerald-400 font-bold">{swap.suggested_food}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{swap.reason}</p>
                      <p className="text-[10px] text-amber-400/90 font-medium">
                        ✓ {swap.protein_comparison}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 sm:self-center shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-emerald-400 font-mono block">
                          Save {formatUgx(swap.daily_savings_ugx)}/d
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatUgx(swap.weekly_savings_ugx)}/wk
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleApplySwap(swap.current_food, swap.suggested_food)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#FF6A00] hover:bg-[#E55F00] text-white text-[11px] font-bold transition-all cursor-pointer"
                      >
                        Apply Swap
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meals List by Category with Live Portion Pricing */}
          <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Daily Meals Composition</h3>
              <span className="text-xs text-slate-400 font-mono">
                {meals.length} items configured
              </span>
            </div>

            {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => {
              const items = meals.filter((m) => m.meal_type === type);
              const mealCalories = items.reduce((acc, i) => acc + i.calories, 0);
              const mealCost = items.reduce((acc, i) => {
                const c = calculateItemCost(i.food_name, i.serving_grams, 'staple', selectedMarketId).cost_ugx;
                return acc + c;
              }, 0);

              return (
                <div key={type} className="space-y-2 pb-3 border-b border-[#222222] last:border-none">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#FF6A00] uppercase tracking-wider">
                      {type}
                    </span>
                    <div className="flex items-center gap-3 text-[11px] font-mono">
                      <span className="text-slate-400">{mealCalories} kcal</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-emerald-400 font-bold">{formatUgx(mealCost)}</span>
                    </div>
                  </div>

                  {items.map((item, idx) => {
                    const globalIdx = meals.indexOf(item);
                    const itemCost = calculateItemCost(
                      item.food_name,
                      item.serving_grams,
                      'staple',
                      selectedMarketId,
                      item.protein
                    );

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[#1C1C1C] border border-[#2A2A2A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="font-semibold text-white space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span>{item.food_name}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              {formatUgx(itemCost.cost_ugx)}
                            </span>
                          </div>
                          <span className="block text-[10px] text-slate-400 font-mono font-normal">
                            {item.calories} kcal · P:{item.protein}g C:{item.carbs}g F:{item.fat}g · ({formatUgx(itemCost.unit_price_per_100g)}/100g in {activeMarket.name.replace(' Market', '')})
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <label className="text-[10px] text-slate-400">Portion:</label>
                            <input
                              type="number"
                              step={10}
                              min={10}
                              max={1000}
                              value={item.serving_grams}
                              onChange={(e) => handleUpdatePortion(globalIdx, parseInt(e.target.value) || 100)}
                              className="w-16 px-2 py-1 bg-[#141414] border border-[#333] rounded text-center text-white font-mono focus:border-[#FF6A00] focus:outline-none"
                            />
                            <span className="text-[10px] text-slate-400">g</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveMealItem(globalIdx)}
                            className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                            title="Remove from plan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {items.length === 0 && (
                    <p className="text-[11px] text-slate-500 py-2 italic">
                      No foods added for {type} yet.
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Assign to Clients */}
          <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#FF6A00]" />
              <span>Assign To Clients Immediately (Optional)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
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
            {saving ? 'Publishing Meal Plan...' : 'Save & Publish Ugandan Meal Plan'}
          </button>
        </form>

        {/* Right 1 Col: Ugandan Food Catalog Drawer with Live Market Prices */}
        <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-4 h-fit sticky top-20">
          <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-[#FF6A00]" />
              <span>Local Foods Database</span>
            </h3>
            <span className="text-xs text-slate-400">{filteredFoods.length} items</span>
          </div>

          {/* Search, Filter & Sort Controls */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Matooke, Tilapia, Mukene..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#1C1C1C] border border-[#2B2B2B] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF6A00]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-2 py-1.5 bg-[#1C1C1C] border border-[#2B2B2B] rounded-lg text-[11px] text-white"
              >
                <option value="all">All Categories</option>
                <option value="staple">Staples & Starches</option>
                <option value="protein">Proteins & Fish</option>
                <option value="vegetable">Vegetables & Greens</option>
                <option value="street_food">Street Food (Rolex)</option>
                <option value="fruit">Fruits</option>
                <option value="snack">Healthy Snacks</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-2 py-1.5 bg-[#1C1C1C] border border-[#2B2B2B] rounded-lg text-[11px] text-amber-400 font-semibold"
              >
                <option value="default">Sort: Default</option>
                <option value="cheapest_protein">Best UGX / g Protein</option>
                <option value="cheapest_100g">Lowest Price / 100g</option>
                <option value="highest_protein">Highest Protein (g)</option>
              </select>
            </div>
          </div>

          {/* Food Items List with Pricing Badges */}
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {filteredFoods.map((f) => {
              const matchedMarketFood = findMarketPriceItem(f.name);
              const cost100g = getCostPer100g(f.name, f.category, selectedMarketId);
              const costPerGProtein =
                matchedMarketFood && matchedMarketFood.protein_per_100g > 0
                  ? Math.round(cost100g / matchedMarketFood.protein_per_100g)
                  : Math.round(cost100g / Math.max(1, f.protein_100g));

              return (
                <div
                  key={f.id}
                  className="p-3 rounded-xl bg-[#1C1C1C] border border-[#2A2A2A] hover:border-[#FF6A00]/50 transition-colors text-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-white leading-tight">{f.name}</h4>
                      {f.local_name && (
                        <span className="text-[10px] text-amber-400 italic block">{f.local_name}</span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono">
                        {f.calories_100g} kcal/100g · P:{f.protein_100g}g C:{f.carbs_100g}g F:{f.fat_100g}g
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-bold font-mono text-emerald-400 block">
                        {formatUgx(cost100g)}/100g
                      </span>
                      {f.protein_100g >= 4 && (
                        <span className="text-[9px] font-mono text-slate-400 block">
                          UGX {costPerGProtein}/g P
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#252525]">
                    <span className="text-[9px] text-slate-400">Add portion to:</span>
                    <div className="flex items-center gap-1">
                      {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((mtype) => (
                        <button
                          key={mtype}
                          type="button"
                          onClick={() => handleAddFoodToMeal(f, mtype)}
                          className="px-2 py-0.5 rounded bg-[#272727] hover:bg-[#FF6A00] hover:text-white text-[9px] font-semibold text-slate-300 capitalize transition-colors cursor-pointer"
                        >
                          {mtype[0].toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1 border-t border-[#222222]">
            <Info className="w-3 h-3 text-[#FF6A00]" />
            <span>Prices indexed against {activeMarket.name}</span>
          </div>
        </div>
      </div>

      {/* Grocery Guide & Shopping List Modal */}
      <MarketShoppingListModal
        isOpen={isGroceryModalOpen}
        onClose={() => setIsGroceryModalOpen(false)}
        marketId={selectedMarketId}
        meals={meals}
        costSummary={planCost}
      />
    </div>
  );
};

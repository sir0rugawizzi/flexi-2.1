import React, { useState } from 'react';
import { KampalaMarketId, PlanCostSummary } from '../../types';
import { KAMPALA_MARKETS } from '../../data/kampalaMarketPrices';
import { findMarketPriceItem, formatUgx } from '../../utils/marketPriceCalc';
import { ShoppingBag, X, Store, Check, Lightbulb, MapPin, Download, Sparkles } from 'lucide-react';

interface MarketShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  marketId: KampalaMarketId;
  meals: Array<{
    food_id: string;
    food_name: string;
    serving_grams: number;
    meal_type: string;
    calories: number;
    protein: number;
  }>;
  costSummary: PlanCostSummary;
}

export const MarketShoppingListModal: React.FC<MarketShoppingListModalProps> = ({
  isOpen,
  onClose,
  marketId,
  meals,
  costSummary,
}) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const market = KAMPALA_MARKETS[marketId] || KAMPALA_MARKETS.nakawa;

  if (!isOpen) return null;

  // Group meals by unique food item and aggregate weekly grams
  const aggregatedFoods: Record<
    string,
    {
      food_name: string;
      daily_grams: number;
      weekly_grams: number;
      weekly_cost_ugx: number;
      vendor_stall: string;
      bulk_hint?: string;
    }
  > = {};

  meals.forEach((m) => {
    if (!aggregatedFoods[m.food_name]) {
      const matched = findMarketPriceItem(m.food_name);
      aggregatedFoods[m.food_name] = {
        food_name: m.food_name,
        daily_grams: 0,
        weekly_grams: 0,
        weekly_cost_ugx: 0,
        vendor_stall: matched?.vendor_stall_type || 'Produce & Tubers',
        bulk_hint: matched?.bulk_discount_hint,
      };
    }
    aggregatedFoods[m.food_name].daily_grams += m.serving_grams;
    aggregatedFoods[m.food_name].weekly_grams += m.serving_grams * 7;
  });

  // Calculate weekly costs
  Object.values(aggregatedFoods).forEach((item) => {
    const matched = findMarketPriceItem(item.food_name);
    const cost100g = matched?.market_prices_ugx?.[marketId] ?? (matched ? matched.cost_per_100g_ugx * market.priceMultiplier : 300);
    item.weekly_cost_ugx = Math.round((cost100g * item.weekly_grams) / 100);
  });

  // Group by vendor stall
  const byVendorStall: Record<string, typeof aggregatedFoods[string][]> = {};
  Object.values(aggregatedFoods).forEach((item) => {
    if (!byVendorStall[item.vendor_stall]) {
      byVendorStall[item.vendor_stall] = [];
    }
    byVendorStall[item.vendor_stall].push(item);
  });

  const toggleCheck = (name: string) => {
    setCheckedItems((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#141414] border border-[#2B2B2B] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#222222] flex items-center justify-between bg-[#191919]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF6A00]/15 flex items-center justify-center text-[#FF6A00]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Kampala Market Weekly Grocery Guide</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF6A00]/20 text-[#FF6A00] border border-[#FF6A00]/30">
                  {market.name}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-[#FF6A00]" />
                <span>{market.location} · {market.tagline}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#262626] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Budget Summary Banner */}
        <div className="px-6 py-4 bg-[#1C1C1C] border-b border-[#262626] grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400">Weekly Total</span>
            <p className="text-base font-extrabold text-[#FF6A00] font-mono">
              {formatUgx(costSummary.weekly_cost_ugx)}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400">Daily Average</span>
            <p className="text-base font-extrabold text-white font-mono">
              {formatUgx(costSummary.daily_cost_ugx)}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400">Cost / g Protein</span>
            <p className="text-base font-extrabold text-emerald-400 font-mono">
              {costSummary.cost_per_gram_protein > 0 ? `UGX ${costSummary.cost_per_gram_protein}` : '—'}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400">Budget Tier</span>
            <p className="text-xs font-bold text-sky-400 truncate mt-0.5">
              {costSummary.budget_tier_label}
            </p>
          </div>
        </div>

        {/* Modal Body: Organized by Market Stall */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {Object.keys(byVendorStall).length === 0 ? (
            <div className="text-center py-12 text-slate-500 italic">
              No food items added to this meal plan yet. Add foods in the builder to generate a shopping list.
            </div>
          ) : (
            Object.entries(byVendorStall).map(([stallName, items]) => {
              const stallTotal = items.reduce((sum, i) => sum + i.weekly_cost_ugx, 0);

              return (
                <div key={stallName} className="p-4 rounded-xl bg-[#191919] border border-[#262626] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-2">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-[#FF6A00]" />
                      <h4 className="font-bold text-white text-sm">{stallName}</h4>
                      <span className="text-[10px] text-slate-400">({items.length} items)</span>
                    </div>
                    <span className="font-mono font-bold text-[#FF6A00] text-xs">
                      Est: {formatUgx(stallTotal)}
                    </span>
                  </div>

                  <div className="divide-y divide-[#222222]">
                    {items.map((item) => {
                      const isChecked = !!checkedItems[item.food_name];
                      const kg = (item.weekly_grams / 1000).toFixed(1);

                      return (
                        <div
                          key={item.food_name}
                          onClick={() => toggleCheck(item.food_name)}
                          className={`py-2.5 flex items-start justify-between gap-3 cursor-pointer select-none transition-opacity ${
                            isChecked ? 'opacity-40 line-through' : 'opacity-100'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div
                              className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                isChecked
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'border-[#444] bg-[#111]'
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div>
                              <span className="font-semibold text-white block">{item.food_name}</span>
                              <span className="text-[10px] text-slate-400">
                                Need for 7 days: <strong className="text-slate-200">{item.weekly_grams >= 1000 ? `${kg} kg` : `${item.weekly_grams}g`}</strong> (~{item.daily_grams}g/day)
                              </span>
                              {item.bulk_hint && (
                                <p className="text-[10px] text-amber-400/90 flex items-center gap-1 mt-0.5">
                                  <Sparkles className="w-3 h-3 shrink-0" />
                                  <span>{item.bulk_hint}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          <span className="font-mono font-bold text-slate-200 shrink-0 text-right">
                            {formatUgx(item.weekly_cost_ugx)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          {/* Kampala Sourcing Pro-Tip */}
          <div className="p-4 rounded-xl bg-[#FF6A00]/10 border border-[#FF6A00]/25 flex items-start gap-3">
            <Lightbulb className="w-4 h-4 text-[#FF6A00] shrink-0 mt-0.5" />
            <div className="space-y-1 text-slate-300 text-[11px] leading-relaxed">
              <strong className="text-white block font-semibold">Kampala Market Sourcing Rules for Trainers:</strong>
              <p>• <strong>Silverfish (Mukene) & Beans:</strong> Buy in 2–5kg quantities in Owino or Kalerwe dry stores. Mukene keeps up to 6 months in airtight glass tins without spoiling.</p>
              <p>• <strong>Matooke:</strong> Avoid roadside retail fingers. Suggest clients purchase small whole bunches (UGX 15,000–18,000) directly off delivery trucks before 7:00 AM.</p>
              <p>• <strong>Fresh Tilapia:</strong> Ggaba Landing Site or Nakawa fish section provides the freshest morning catch straight from Lake Victoria.</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#222222] bg-[#191919] flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {Object.values(checkedItems).filter(Boolean).length} of {Object.keys(aggregatedFoods).length} items gathered
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="px-3.5 py-1.5 rounded-lg bg-[#262626] hover:bg-[#333] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Print / Save List</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-1.5 rounded-lg bg-[#FF6A00] hover:bg-[#E55F00] text-white text-xs font-bold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

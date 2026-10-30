import React, { useState, useEffect } from 'react';
import { Food } from '../../types';
import { Search, Plus, Utensils, Globe, Sparkles, Check } from 'lucide-react';

export const FoodDatabaseManager: React.FC = () => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // External Open Food Facts Search
  const [externalSearchQuery, setExternalSearchQuery] = useState('');
  const [externalResults, setExternalResults] = useState<any[]>([]);
  const [externalSearching, setExternalSearching] = useState(false);
  const [activeCatalogTab, setActiveCatalogTab] = useState<'local' | 'external'>('local');

  // Custom Food Form
  const [newFood, setNewFood] = useState({
    name: '',
    local_name: '',
    category: 'staple' as const,
    calories_100g: 150,
    protein_100g: 5,
    carbs_100g: 25,
    fat_100g: 2,
    fiber_100g: 2,
    typical_serving_g: 150,
    serving_unit: 'plate portion (~150g)',
  });

  const fetchFoods = async () => {
    try {
      const res = await fetch('/api/foods');
      if (res.ok) setFoods(await res.json());
    } catch (err) {
      console.error('Failed to fetch foods:', err);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const handleCreateFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFood.name.trim()) return;

    try {
      const token = localStorage.getItem('flexifit_token');
      const res = await fetch('/api/foods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newFood),
      });

      if (res.ok) {
        alert('Custom food added to database successfully!');
        setShowAddModal(false);
        fetchFoods();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to add food');
    }
  };

  const handleExternalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!externalSearchQuery.trim()) return;

    setExternalSearching(true);
    try {
      const res = await fetch(`/api/foods/external/search?q=${encodeURIComponent(externalSearchQuery.trim())}`);
      if (res.ok) {
        setExternalResults(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExternalSearching(false);
    }
  };

  const handleAddExternalToLocal = async (item: any) => {
    try {
      const token = localStorage.getItem('flexifit_token');
      const res = await fetch('/api/foods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: item.name,
          local_name: item.brand ? `Imported: ${item.brand}` : '',
          category: 'snack',
          calories_100g: item.calories_100g,
          protein_100g: item.protein_100g,
          carbs_100g: item.carbs_100g,
          fat_100g: item.fat_100g,
          typical_serving_g: 100,
          serving_unit: item.serving_unit || '100g',
        }),
      });

      if (res.ok) {
        alert(`Added "${item.name}" to your local food database!`);
        fetchFoods();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredFoods = foods.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.local_name && f.local_name.toLowerCase().includes(search.toLowerCase()));
    if (!matchesSearch) return false;
    if (category !== 'all' && f.category !== category) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Ugandan Nutritional Composition Database
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse and manage local East African staples, fish, legumes, street foods, and search global groceries via Open Food Facts.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-xs shadow-md active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Local Food</span>
        </button>
      </div>

      {/* Database Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-[#242424] pb-2">
        <button
          onClick={() => setActiveCatalogTab('local')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeCatalogTab === 'local'
              ? 'bg-[#1F1F1F] text-[#FF6A00] border border-[#333333]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Ugandan Local Foods ({foods.length})</span>
        </button>
        <button
          onClick={() => setActiveCatalogTab('external')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeCatalogTab === 'external'
              ? 'bg-[#1F1F1F] text-[#FF6A00] border border-[#333333]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Open Food Facts Grocery Search (Free API)</span>
        </button>
      </div>

      {activeCatalogTab === 'local' && (
        <div className="space-y-4">
          {/* Search and Category Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Matooke, Tilapia, Rolex, Dodo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#141414] border border-[#2B2B2B] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FF6A00]"
              />
            </div>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 bg-[#141414] border border-[#2B2B2B] rounded-xl text-xs text-white focus:outline-none focus:border-[#FF6A00]"
            >
              <option value="all">All Food Categories</option>
              <option value="staple">Staples & Starches</option>
              <option value="protein">Meats, Fish & Legumes</option>
              <option value="vegetable">Vegetables & Greens</option>
              <option value="street_food">Street Food Favorites</option>
              <option value="fruit">Tropical Fruits</option>
              <option value="dairy">Dairy & Pantry</option>
            </select>
          </div>

          {/* Foods Table */}
          <div className="rounded-2xl bg-[#141414] border border-[#242424] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1A1A1A] border-b border-[#262626] text-slate-400 uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Food Item & Local Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Calories / 100g</th>
                    <th className="py-3 px-4 text-right">Protein</th>
                    <th className="py-3 px-4 text-right">Carbs</th>
                    <th className="py-3 px-4 text-right">Fat</th>
                    <th className="py-3 px-4">Typical Serving</th>
                    <th className="py-3 px-4">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222]">
                  {filteredFoods.map((f) => (
                    <tr key={f.id} className="hover:bg-[#1A1A1A] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-sm">{f.name}</div>
                        {f.local_name && (
                          <div className="text-[11px] text-amber-400 italic font-medium">{f.local_name}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize px-2 py-0.5 rounded-md bg-[#222222] text-[10px] font-semibold text-slate-300">
                          {f.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#FF6A00]">
                        {f.calories_100g} kcal
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-400">
                        {f.protein_100g}g
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-blue-400">
                        {f.carbs_100g}g
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-amber-400">
                        {f.fat_100g}g
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {f.typical_serving_g}g ({f.serving_unit})
                      </td>
                      <td className="py-3 px-4 text-[10px] text-slate-400 truncate max-w-[140px]">
                        {f.source}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* External Search Tab (Open Food Facts) */}
      {activeCatalogTab === 'external' && (
        <div className="space-y-4">
          <form onSubmit={handleExternalSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Search packaged groceries e.g. 'Rolled Oats', 'Greek Yogurt', 'Whey Protein'..."
              value={externalSearchQuery}
              onChange={(e) => setExternalSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-[#141414] border border-[#2B2B2B] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FF6A00]"
            />
            <button
              type="submit"
              disabled={externalSearching}
              className="px-5 py-2.5 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <Search className="w-4 h-4" />
              <span>{externalSearching ? 'Searching...' : 'Search Open Food Facts'}</span>
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {externalResults.map((item) => (
              <div key={item.id} className="p-4 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-between gap-4 text-xs">
                <div>
                  <h4 className="font-bold text-white text-sm">{item.name}</h4>
                  {item.brand && <span className="text-slate-400 block text-[10px]">{item.brand}</span>}
                  <div className="flex items-center gap-3 mt-1.5 font-mono text-slate-300">
                    <span className="text-[#FF6A00] font-bold">{item.calories_100g} kcal</span>
                    <span>P: {item.protein_100g}g</span>
                    <span>C: {item.carbs_100g}g</span>
                    <span>F: {item.fat_100g}g</span>
                  </div>
                </div>
                <button
                  onClick={() => handleAddExternalToLocal(item)}
                  className="px-3 py-1.5 rounded-lg bg-[#242424] hover:bg-[#FF6A00] hover:text-white text-slate-200 text-xs font-semibold transition-colors shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Import</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mandatory Nutrition Accuracy Disclaimer */}
      <footer className="pt-4 border-t border-[#222222] text-center text-xs text-slate-400 italic">
        Approximate values, to be validated by a nutritionist.
      </footer>

      {/* Custom Food Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#141414] border border-[#2E2E2E] p-6 text-slate-100 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-lg text-white">Add Custom Ugandan Food</h3>

            <form onSubmit={handleCreateFood} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Food Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Luwombo lw'embuzi (Goat Luwombo)"
                  value={newFood.name}
                  onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#333] rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Local Luganda / Regional Name</label>
                <input
                  type="text"
                  placeholder="e.g. Oluwombo lw'embuzi"
                  value={newFood.local_name}
                  onChange={(e) => setNewFood({ ...newFood, local_name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#333] rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={newFood.category}
                    onChange={(e) => setNewFood({ ...newFood, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#333] rounded-xl text-white"
                  >
                    <option value="staple">Staple</option>
                    <option value="protein">Protein</option>
                    <option value="vegetable">Vegetable</option>
                    <option value="street_food">Street Food</option>
                    <option value="fruit">Fruit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Calories / 100g *</label>
                  <input
                    type="number"
                    value={newFood.calories_100g}
                    onChange={(e) => setNewFood({ ...newFood, calories_100g: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#333] rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono">
                <div>
                  <label className="block text-slate-300 text-[10px] mb-1">Protein (g)</label>
                  <input
                    type="number"
                    step={0.1}
                    value={newFood.protein_100g}
                    onChange={(e) => setNewFood({ ...newFood, protein_100g: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1.5 bg-[#1C1C1C] border border-[#333] rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-[10px] mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    step={0.1}
                    value={newFood.carbs_100g}
                    onChange={(e) => setNewFood({ ...newFood, carbs_100g: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1.5 bg-[#1C1C1C] border border-[#333] rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-[10px] mb-1">Fat (g)</label>
                  <input
                    type="number"
                    step={0.1}
                    value={newFood.fat_100g}
                    onChange={(e) => setNewFood({ ...newFood, fat_100g: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1.5 bg-[#1C1C1C] border border-[#333] rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Typical Serving (g)</label>
                  <input
                    type="number"
                    value={newFood.typical_serving_g}
                    onChange={(e) => setNewFood({ ...newFood, typical_serving_g: parseFloat(e.target.value) || 100 })}
                    className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#333] rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Serving Unit Label</label>
                  <input
                    type="text"
                    placeholder="e.g. 1 pouch portion"
                    value={newFood.serving_unit}
                    onChange={(e) => setNewFood({ ...newFood, serving_unit: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#333] rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#222] hover:bg-[#2C2C2C] text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold"
                >
                  Save Food
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useCountry } from '../../context/CountryContext';
import { CountryProfile } from '../../types/country';
import { Globe, Check, X, Search, ThermometerSun, MapPin, Coins, Clock } from 'lucide-react';

interface CountrySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CountrySelectorModal: React.FC<CountrySelectorModalProps> = ({ isOpen, onClose }) => {
  const { country, setCountryCode, allCountries } = useCountry();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredCountries = allCountries.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.currency.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.climate.regionName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (selected: CountryProfile) => {
    setCountryCode(selected.code);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#121212] border border-[#262626] rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#222]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FF6A00]/15 text-[#FF6A00] flex items-center justify-center border border-[#FF6A00]/30">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Select Your Country & Region</span>
              </h2>
              <p className="text-xs text-slate-400">
                Adjusts currency, local time, tropical heat alerts & market prices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#1C1C1C] transition-colors cursor-pointer"
            aria-label="Close country selector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by country, currency (UGX, KES, USD) or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#181818] border border-[#2B2B2B] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF6A00]"
          />
        </div>

        {/* Countries Grid */}
        <div className="overflow-y-auto space-y-2 flex-1 pr-1 custom-scrollbar">
          {filteredCountries.map((c) => {
            const isSelected = c.code === country.code;
            return (
              <div
                key={c.code}
                onClick={() => handleSelect(c)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-[#1C1710] border-[#FF6A00] shadow-md shadow-[#FF6A00]/10'
                    : 'bg-[#161616] border-[#242424] hover:bg-[#1A1A1A] hover:border-[#333]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl select-none">{c.flag}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{c.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#222] text-[#FF6A00] border border-[#333]">
                        {c.currency} ({c.symbol})
                      </span>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 stroke-[3]" /> Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{c.climate.regionName}</span>
                    </p>
                  </div>
                </div>

                {/* Country Localized Metadata */}
                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono border-t sm:border-t-0 pt-2 sm:pt-0 border-[#222]">
                  <div className="flex items-center gap-1" title="Peak Heat Hour">
                    <ThermometerSun className="w-3.5 h-3.5 text-amber-400" />
                    <span>{c.climate.avgTemp} · {c.climate.heatPeakHour}:00 Peak</span>
                  </div>
                  <div className="flex items-center gap-1" title="Timezone">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{c.timezoneLabel.split(' ')[0]}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-[#222] flex items-center justify-between text-[11px] text-slate-400">
          <span>Auto-adapts hydrations, heat alerts, currency & markets</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#222] hover:bg-[#2A2A2A] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { ClientOverview } from '../../types';
import { Search, AlertTriangle, CheckCircle, Clock, ChevronRight, User } from 'lucide-react';
import { formatKampalaDate } from '../../utils/formatters';

interface ClientListProps {
  clients: ClientOverview[];
  onSelectClient: (clientId: string) => void;
  onRefresh: () => void;
}

export const ClientList: React.FC<ClientListProps> = ({
  clients,
  onSelectClient,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'flagged' | 'ontrack'>('all');

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.user.name.toLowerCase().includes(search.toLowerCase()) ||
      c.user.email.toLowerCase().includes(search.toLowerCase()) ||
      c.profile.fitness_goal.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === 'flagged') return c.is_flagged;
    if (filter === 'ontrack') return !c.is_flagged;
    return true;
  });

  const flaggedCount = clients.filter((c) => c.is_flagged).length;
  const onTrackCount = clients.length - flaggedCount;

  return (
    <div className="space-y-6">
      {/* Header and KPI strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Client Triage & Accountability
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Asynchronous compliance monitoring for your Kampala client roster.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-800/40 text-red-400 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{flaggedCount} Action Required</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{onTrackCount} On Track</span>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by client name, email, or goal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#141414] border border-[#2B2B2B] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FF6A00] transition-colors"
          />
        </div>

        {/* Segmented Filter Control */}
        <div className="flex items-center p-1 bg-[#141414] border border-[#242424] rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              filter === 'all'
                ? 'bg-[#292929] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({clients.length})
          </button>
          <button
            onClick={() => setFilter('flagged')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              filter === 'flagged'
                ? 'bg-red-950/60 text-red-400 border border-red-800/50'
                : 'text-slate-400 hover:text-red-400'
            }`}
          >
            Flagged ({flaggedCount})
          </button>
          <button
            onClick={() => setFilter('ontrack')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              filter === 'ontrack'
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            Compliant ({onTrackCount})
          </button>
        </div>
      </div>

      {/* Priority Flagged Queue Alert Box */}
      {flaggedCount > 0 && filter !== 'ontrack' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/30 via-[#181212] to-[#141414] border border-red-900/40">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-900/50 flex items-center justify-center shrink-0 text-red-400 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-red-300">
                Action Queue: {flaggedCount} clients need coach contact
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Clients are automatically flagged when they miss workouts for 3+ days, fall below 70% macro adherence, lapse weight updates, or miss weekly check-ins.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Client Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => {
          return (
            <div
              key={client.user.id}
              onClick={() => onSelectClient(client.user.id)}
              className={`p-5 rounded-2xl bg-[#141414] border transition-all cursor-pointer hover:scale-[1.01] hover:shadow-xl group flex flex-col justify-between ${
                client.is_flagged
                  ? 'border-red-900/60 hover:border-red-600/80 shadow-red-950/10'
                  : 'border-[#262626] hover:border-[#FF6A00]/60'
              }`}
            >
              <div>
                {/* Card Header: Avatar, Name & Status Chip */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#222222]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#202020] border border-[#333333] flex items-center justify-center text-[#FF6A00] font-bold overflow-hidden shrink-0">
                      {client.user.avatar_url ? (
                        <img
                          src={client.user.avatar_url}
                          alt={client.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white group-hover:text-[#FF6A00] transition-colors leading-tight">
                        {client.user.name}
                      </h3>
                      <span className="text-xs text-slate-400 capitalize">
                        {client.profile.fitness_goal.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div>
                    {client.is_flagged ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-950/80 text-red-400 border border-red-800/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                        Needs Attention
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        On Track
                      </span>
                    )}
                  </div>
                </div>

                {/* Flag Reasons (if flagged) */}
                {client.is_flagged && client.flag_reasons.length > 0 && (
                  <div className="my-3 p-2.5 rounded-xl bg-red-950/40 border border-red-900/40 space-y-1">
                    {client.flag_reasons.map((reason, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-xs text-red-300 font-medium">
                        <span className="text-red-400 font-bold shrink-0">•</span>
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 py-3 text-center">
                  <div className="p-2 rounded-xl bg-[#1A1A1A]">
                    <span className="block text-[10px] text-slate-400 uppercase font-medium">
                      Streak
                    </span>
                    <span className="text-sm font-extrabold text-white font-mono tabular-nums">
                      {client.profile.streak_days}d
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#1A1A1A]">
                    <span className="block text-[10px] text-slate-400 uppercase font-medium">
                      Weight
                    </span>
                    <span className="text-sm font-extrabold text-white font-mono tabular-nums">
                      {client.profile.current_weight_kg || '—'} kg
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#1A1A1A]">
                    <span className="block text-[10px] text-slate-400 uppercase font-medium">
                      7d Macros
                    </span>
                    <span
                      className={`text-sm font-extrabold font-mono tabular-nums ${
                        client.macro_adherence_7d < 70 ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {client.macro_adherence_7d}%
                    </span>
                  </div>
                </div>

                {/* Activity Timestamps */}
                <div className="space-y-1 text-xs text-slate-400 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Last Workout:</span>
                    </span>
                    <span className="font-medium text-slate-300">
                      {client.last_workout_date ? formatKampalaDate(client.last_workout_date) : 'None logged'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Last Weight:</span>
                    </span>
                    <span className="font-medium text-slate-300">
                      {client.last_weight_date ? formatKampalaDate(client.last_weight_date) : 'None logged'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer action */}
              <div className="mt-4 pt-3 border-t border-[#222222] flex items-center justify-between text-xs font-semibold text-[#FF6A00] group-hover:translate-x-1 transition-transform">
                <span>Open Dossier & Chat</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>

      {filteredClients.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-[#141414] border border-[#262626]">
          <p className="text-base font-semibold text-slate-300">No clients match your filter criteria.</p>
          <button
            onClick={() => {
              setSearch('');
              setFilter('all');
            }}
            className="mt-3 px-4 py-2 text-xs font-bold text-white bg-[#FF6A00] rounded-xl hover:bg-[#E55F00] transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

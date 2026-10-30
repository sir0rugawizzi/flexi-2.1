import React, { useState, useEffect } from 'react';
import { formatUGX } from '../../utils/formatters';
import { DollarSign, TrendingUp, Users, Scale, Clock, ShieldCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const BusinessView: React.FC = () => {
  const [data, setData] = useState<{
    activeClientsCount: number;
    monthlyRateUGX: number;
    inPersonRateUGX: number;
    currentMRR: number;
    inPersonComparison: {
      baselineClients: number;
      baselineMRR: number;
      revenueMultiplierVsInPerson: string;
    };
    scalingProjection: {
      targetClients: number;
      targetMRR: number;
      growthPotentialUGX: number;
    };
  } | null>(null);

  const [loading, setLoading] = useState(true);

  // Dynamic simulation slider
  const [simulatedClients, setSimulatedClients] = useState(42);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const token = localStorage.getItem('flexifit_token');
        const res = await fetch('/api/trainer/business', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load business metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-[#FF6A00] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs">Calculating business economics...</p>
      </div>
    );
  }

  const simulatedMRR = simulatedClients * data.monthlyRateUGX;

  // Comparison Bar Chart data
  const comparisonChartData = [
    {
      name: 'In-Person Gym (Max 8)',
      revenue: data.inPersonComparison.baselineMRR,
      clients: 8,
      fill: '#4A5568',
    },
    {
      name: 'FlexiFit Today (Live)',
      revenue: data.currentMRR,
      clients: data.activeClientsCount,
      fill: '#FF6A00',
    },
    {
      name: 'FlexiFit Scaled (60)',
      revenue: data.scalingProjection.targetMRR,
      clients: 60,
      fill: '#10B981',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Business View & Trainer Revenue Scaling
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Demonstrating the economic shift from 8 in-person gym clients to 60+ remote clients using asynchronous check-ins.
        </p>
      </div>

      {/* Top 3 KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] relative overflow-hidden">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Active Client Roster
            </span>
            <Users className="w-5 h-5 text-[#FF6A00]" />
          </div>
          <div className="text-3xl font-black text-white font-mono mt-1">
            {data.activeClientsCount} <span className="text-sm font-semibold text-slate-400">clients</span>
          </div>
          <span className="text-xs text-emerald-400 mt-2 block font-medium">
            100% active on remote check-ins
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] relative overflow-hidden">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Monthly Recurring Revenue (MRR)
            </span>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-[#FF6A00] font-mono mt-1">
            {formatUGX(data.currentMRR)}
          </div>
          <span className="text-xs text-slate-400 mt-2 block">
            at {formatUGX(data.monthlyRateUGX)} / client / month
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] relative overflow-hidden">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Scaling Potential (60 Clients)
            </span>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono mt-1">
            {formatUGX(data.scalingProjection.targetMRR)}
          </div>
          <span className="text-xs text-slate-400 mt-2 block">
            +{formatUGX(data.scalingProjection.growthPotentialUGX)} over in-person ceiling
          </span>
        </div>
      </div>

      {/* Model Comparison Breakdown & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comparison Chart */}
        <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#FF6A00]" />
            <span>Monthly Revenue: In-Person Gym vs FlexiFit Platform (UGX)</span>
          </h2>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="name" stroke="#777" fontSize={11} />
                <YAxis
                  stroke="#777"
                  fontSize={10}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  formatter={(value: any) => [formatUGX(value), 'Monthly Revenue']}
                  contentStyle={{ backgroundColor: '#1C1C1C', borderColor: '#333', borderRadius: 8, color: '#fff' }}
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Narrative & Value Proposition Comparison */}
        <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-4 flex flex-col justify-between">
          <div className="space-y-3 text-xs">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Core Economics: In-Person Gym vs FlexiFit</span>
            </h2>

            <div className="p-3 rounded-xl bg-[#1C1C1C] border border-[#2E2E2E] space-y-1.5">
              <span className="font-bold text-slate-200">The Traditional In-Person Bottleneck:</span>
              <p className="text-slate-400">
                A personal trainer physically coaching at a gym in Kololo or Nakasero is capped at roughly <strong>8 clients</strong> due to Kampala traffic and hour-by-hour scheduling.
              </p>
              <div className="flex items-center justify-between text-slate-300 font-mono pt-1">
                <span>8 clients × UGX 300,000/mo:</span>
                <strong className="text-white">{formatUGX(data.inPersonComparison.baselineMRR)}</strong>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#1C1C1C] border border-[#2E2E2E] space-y-1.5">
              <span className="font-bold text-[#FF6A00]">The FlexiFit Hybrid Platform Model:</span>
              <p className="text-slate-400">
                By moving client management, local meal plans, and weekly check-ins to an asynchronous dashboard, a trainer can easily support <strong>60+ clients</strong> in ~12 hours of review time per week.
              </p>
              <div className="flex items-center justify-between text-slate-300 font-mono pt-1">
                <span>60 clients × UGX 90,000/mo:</span>
                <strong className="text-emerald-400">{formatUGX(data.scalingProjection.targetMRR)}</strong>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#1F1810] border border-[#FF6A00]/30 text-xs text-[#FF6A00] font-medium flex items-center gap-2">
            <Clock className="w-4 h-4 shrink-0" />
            <span>Trainer monthly income more than doubles while clients save over 70% compared to private gym rates.</span>
          </div>
        </div>
      </div>

      {/* Interactive Scaling Simulator */}
      <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center justify-between">
          <span>Interactive Client Scale Simulator</span>
          <span className="text-xs font-mono text-[#FF6A00]">{simulatedClients} Clients</span>
        </h3>

        <div className="space-y-2">
          <input
            type="range"
            min={5}
            max={100}
            step={1}
            value={simulatedClients}
            onChange={(e) => setSimulatedClients(parseInt(e.target.value))}
            className="w-full accent-[#FF6A00] cursor-pointer"
          />
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>5 clients (Part-time)</span>
            <span>30 clients</span>
            <span>60 clients (Full FlexiFit Scale)</span>
            <span>100 clients (Agency Model)</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#1C1C1C] flex items-center justify-between text-sm">
          <span className="text-slate-300 font-medium">Projected Monthly Revenue at {simulatedClients} clients:</span>
          <span className="text-xl font-black text-emerald-400 font-mono">
            {formatUGX(simulatedMRR)} / month
          </span>
        </div>
      </div>
    </div>
  );
};

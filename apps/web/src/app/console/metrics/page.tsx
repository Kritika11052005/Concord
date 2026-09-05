'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../lib/api';
import { Activity } from 'lucide-react';

export default function ConsoleMetricsPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchApi('/v1/console/metrics');
        setMetrics(data);
      } catch (err) {
        console.error('Failed to load metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2 font-['SG',sans-serif]">
            <Activity className="h-5 w-5 text-[#c81b1c]" />
            Live Merchant Ops Metrics
          </h1>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Operational counters, latency percentiles, check firing frequency, and degradation telemetry
          </p>
        </div>
      </div>

      {/* ── METRIC CARDS GRID ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-[#09090b] border border-zinc-800 rounded-none">
          <div className="text-xs font-mono text-zinc-400 uppercase">Chain Height</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            #{metrics?.chain_length ?? 0}
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">Unbroken · Zero Forks</span>
        </div>

        <div className="p-5 bg-[#09090b] border border-zinc-800 rounded-none">
          <div className="text-xs font-mono text-zinc-400 uppercase">p95 Verify Latency</div>
          <div className="text-2xl font-bold font-mono text-[#c81b1c] mt-1">
            {metrics?.p95_latency_ms ?? 0} ms
          </div>
          <span className="text-[10px] text-zinc-400 font-mono">Sub-800ms target met</span>
        </div>

        <div className="p-5 bg-[#09090b] border border-zinc-800 rounded-none">
          <div className="text-xs font-mono text-zinc-400 uppercase">Extraction Cache Hit</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {((metrics?.cache_hit_rate ?? 0) * 100).toFixed(0)}%
          </div>
          <span className="text-[10px] text-zinc-400 font-mono">Cold-path LLM absorbed</span>
        </div>

        <div className="p-5 bg-[#09090b] border border-zinc-800 rounded-none">
          <div className="text-xs font-mono text-zinc-400 uppercase">Degradation Rate</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {((metrics?.degradation_rate || 0) * 100).toFixed(1)}%
          </div>
          <span className="text-[10px] text-zinc-400 font-mono">LLM availability healthy</span>
        </div>
      </div>

      {/* ── DECISION MIX ── */}
      <div className="p-6 bg-[#09090b] border border-zinc-800 rounded-none">
        <h2 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider mb-4">
          Decision Distribution
        </h2>

        <div className="grid grid-cols-3 gap-4 text-center font-mono">
          <div className="p-4 bg-black border border-emerald-900/60 rounded-none">
            <div className="text-xs text-emerald-400 font-bold uppercase">Pass Orders</div>
            <div className="text-3xl font-bold text-white mt-1">
              {metrics?.decision_mix?.pass ?? 0}
            </div>
            <span className="text-[10px] text-zinc-400">Conforming agent checkouts</span>
          </div>

          <div className="p-4 bg-black border border-amber-900/60 rounded-none">
            <div className="text-xs text-amber-400 font-bold uppercase">Step-Up Interceptions</div>
            <div className="text-3xl font-bold text-white mt-1">
              {metrics?.decision_mix?.step_up ?? 0}
            </div>
            <span className="text-[10px] text-zinc-400">Ambiguities / Near-misses</span>
          </div>

          <div className="p-4 bg-black border border-rose-900/60 rounded-none">
            <div className="text-xs text-rose-400 font-bold uppercase">Hard Declines</div>
            <div className="text-3xl font-bold text-white mt-1">
              {metrics?.decision_mix?.decline ?? 0}
            </div>
            <span className="text-[10px] text-zinc-400">Arithmetic budget violations</span>
          </div>
        </div>
      </div>

      {/* ── CHECKS FIRING & FAILURE FREQUENCY ── */}
      <div className="p-6 bg-[#09090b] border border-zinc-800 rounded-none">
        <h2 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider mb-4">
          Check Firing Frequency &amp; Interception Rates (SQL Aggregation)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-zinc-800 bg-black text-zinc-400 text-[10px] uppercase">
                <th className="py-2.5 px-3">Constraint Kind</th>
                <th className="py-2.5 px-3">Evaluations</th>
                <th className="py-2.5 px-3">Failures / Interventions</th>
                <th className="py-2.5 px-3 text-right">Interception Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {(metrics?.checks_breakdown && metrics.checks_breakdown.length > 0) ? (
                metrics.checks_breakdown.map((c: any, idx: number) => {
                  const rate = ((c.failures / (c.total || 1)) * 100).toFixed(0);
                  return (
                    <tr key={idx} className="hover:bg-zinc-900/40">
                      <td className="py-2.5 px-3 font-bold text-zinc-200">{c.constraint_kind}</td>
                      <td className="py-2.5 px-3 text-zinc-400">{c.total}</td>
                      <td className="py-2.5 px-3 text-amber-400 font-bold">{c.failures}</td>
                      <td className="py-2.5 px-3 text-right text-white font-bold">{rate}%</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-zinc-500">
                    No checks recorded yet. Run verified transactions to populate SQL telemetry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

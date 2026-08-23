'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi, formatINR } from '../../lib/api';
import {
  ListOrdered,
  Filter,
  RefreshCw,
  ArrowRight,
  Search,
} from 'lucide-react';

interface OrderItem {
  id: string;
  sequence_number: number;
  decision: 'pass' | 'step_up' | 'decline';
  intent_text: string;
  cart_total: number;
  currency: string;
  latency_total: number;
  failing_reason?: string;
  issued_at: string;
  hash: string;
}

export default function ConsoleOrderFeedPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const query = filter !== 'all' ? `?decision=${filter}` : '';
      const res = await fetchApi<{ orders: OrderItem[]; total: number }>(`/v1/console/orders${query}`);
      setOrders(res.orders || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000); // 5s polling
    return () => clearInterval(interval);
  }, [filter]);

  const filteredOrders = orders.filter((o) =>
    o.intent_text.toLowerCase().includes(search.toLowerCase()) ||
    o.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2 font-['SG',sans-serif]">
            <ListOrdered className="h-5 w-5 text-[#c81b1c]" />
            Agent Order Feed
          </h1>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Real-time stream of agent checkout verification requests and tamper-evident audit receipts
          </p>
        </div>

        <button
          onClick={loadOrders}
          className="px-3 py-1.5 bg-[#09090b] border border-zinc-800 hover:bg-zinc-900 text-zinc-300 text-xs font-mono flex items-center gap-1.5 transition rounded-none"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Auto-polling (5s)
        </button>
      </div>

      {/* ── CONTROLS & FILTERS ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#09090b] p-3 border border-zinc-800 rounded-none">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by intent text or receipt ID..."
            className="w-full pl-9 pr-3 py-1.5 bg-black border border-zinc-800 rounded-none text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#c81b1c]"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[11px] font-mono text-zinc-500 mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Filter:
          </span>
          {['all', 'pass', 'step_up', 'decline'].map((d) => (
            <button
              key={d}
              onClick={() => setFilter(d)}
              className={`px-3 py-1 text-[11px] font-mono font-medium transition uppercase rounded-none ${
                filter === d
                  ? 'bg-[#c81b1c] text-white font-bold'
                  : 'bg-black text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {d.replace('_', '-')}
            </button>
          ))}
        </div>
      </div>

      {/* ── ORDERS TABLE ── */}
      <div className="border border-zinc-800 bg-[#09090b] rounded-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-zinc-800 bg-black text-zinc-400 uppercase text-[10px]">
                <th className="py-3 px-4">Seq</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4">Intent / Failing Constraint</th>
                <th className="py-3 px-4">Cart Total</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    No orders found matching the criteria. Test a verification in the{' '}
                    <Link href="/shop" className="text-[#c81b1c] hover:underline font-bold">
                      Demo Store
                    </Link>
                    .
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="hover:bg-zinc-900/60 transition cursor-pointer"
                  >
                    <td className="py-3 px-4 text-zinc-400 font-bold">#{o.sequence_number}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-bold uppercase ${
                          o.decision === 'pass'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : o.decision === 'step_up'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {o.decision.replace('_', '-')}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="text-zinc-200 truncate font-sans text-xs">{o.intent_text}</div>
                      {o.failing_reason && (
                        <div className="text-[10px] text-amber-400 truncate mt-0.5">
                          {o.failing_reason}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-200 font-bold">
                      {formatINR(o.cart_total)}
                    </td>
                    <td className="py-3 px-4 text-zinc-400">{o.latency_total}ms</td>
                    <td className="py-3 px-4 text-zinc-500 text-[11px]">
                      {new Date(o.issued_at).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/console/receipts/${o.id}`}
                        className="inline-flex items-center gap-1 text-[#c81b1c] hover:text-red-400 text-[11px] font-bold"
                      >
                        Inspect <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

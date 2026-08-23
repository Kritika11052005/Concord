'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { runBuyerAgentSim, CATALOG } from '../../../lib/catalog';
import { formatINR } from '../../../lib/api';
import {
  Sparkles,
  CheckCircle2,
  Loader2,
  ShoppingBag,
  ArrowRight,
  ChevronRight,
  Layers,
  Search,
} from 'lucide-react';

function AgentRunnerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawIntent = searchParams.get('intent') || 'espresso machine under ₹15,000, delivered by Friday';

  const [currentStageIdx, setCurrentStageIdx] = useState<number>(0);
  const [runResult, setRunResult] = useState<any>(null);

  useEffect(() => {
    // Run the buyer agent simulation
    const result = runBuyerAgentSim(rawIntent, CATALOG);
    setRunResult(result as any);

    // Staggered step visualization for cinematic feel
    const t1 = setTimeout(() => setCurrentStageIdx(1), 700);
    const t2 = setTimeout(() => setCurrentStageIdx(2), 1600);
    const t3 = setTimeout(() => setCurrentStageIdx(3), 2600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [rawIntent]);

  const handleProceedToCheckout = () => {
    if (!runResult) return;
    const cartPayload = encodeURIComponent(JSON.stringify(runResult.cart));
    const intentPayload = encodeURIComponent(rawIntent);
    router.push(`/checkout/${runResult.cart.cart_id}?intent=${intentPayload}&cart=${cartPayload}`);
  };

  const steps = runResult?.steps || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Autonomous Buyer Agent Active
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Running
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Shopping on behalf of user · Building cart for verification
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push('/shop')}
          className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition"
        >
          Cancel
        </button>
      </div>

      {/* ── INTENT CARD ── */}
      <div className="p-5 rounded-2xl bg-surface border border-slate-800 mb-8 shadow-lg">
        <div className="text-xs font-mono text-slate-400 uppercase mb-2">Original Human Request</div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-medium text-base">
          &ldquo;{rawIntent}&rdquo;
        </div>
      </div>

      {/* ── STREAMED TRANSCRIPT STAGES ── */}
      <div className="space-y-4 mb-10">
        {/* Stage 1: Parsing */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            currentStageIdx >= 0
              ? 'bg-surface border-slate-700/80 shadow-md'
              : 'bg-surface/40 border-slate-800/40 opacity-40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentStageIdx > 0 ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              ) : (
                <Loader2 className="h-5 w-5 text-blue-400 animate-spin shrink-0" />
              )}
              <div>
                <div className="text-sm font-semibold text-white">Stage 1: Parsing Intent &amp; Constraints</div>
                <div className="text-xs text-slate-400">Extracting typed parameters and budget bounds</div>
              </div>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {currentStageIdx > 0 ? '✓ Parsed' : 'Processing...'}
            </span>
          </div>

          {currentStageIdx >= 0 && (
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap gap-2">
              <span className="text-xs px-2.5 py-1 rounded bg-blue-950/40 text-blue-300 font-mono border border-blue-800/50">
                intent_hash: sha256(...)
              </span>
              <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                provenance: character spans tracked
              </span>
            </div>
          )}
        </div>

        {/* Stage 2: Catalog Querying */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            currentStageIdx >= 1
              ? 'bg-surface border-slate-700/80 shadow-md'
              : 'bg-surface/40 border-slate-800/40 opacity-40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentStageIdx > 1 ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              ) : currentStageIdx === 1 ? (
                <Loader2 className="h-5 w-5 text-blue-400 animate-spin shrink-0" />
              ) : (
                <Search className="h-5 w-5 text-slate-600 shrink-0" />
              )}
              <div>
                <div className="text-sm font-semibold text-white">Stage 2: Catalog Candidate Retrieval</div>
                <div className="text-xs text-slate-400">Scanning 15 merchant catalog SKUs for semantic matches</div>
              </div>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {currentStageIdx > 1 ? '15 SKUs Indexed' : currentStageIdx === 1 ? 'Querying...' : 'Pending'}
            </span>
          </div>
        </div>

        {/* Stage 3: Item Selection */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            currentStageIdx >= 2
              ? 'bg-surface border-slate-700/80 shadow-md'
              : 'bg-surface/40 border-slate-800/40 opacity-40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentStageIdx > 2 ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              ) : currentStageIdx === 2 ? (
                <Loader2 className="h-5 w-5 text-blue-400 animate-spin shrink-0" />
              ) : (
                <Layers className="h-5 w-5 text-slate-600 shrink-0" />
              )}
              <div>
                <div className="text-sm font-semibold text-white">Stage 3: Selection Decision</div>
                <div className="text-xs text-slate-400">Agent selects top candidate matching heuristic</div>
              </div>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {currentStageIdx >= 2 ? 'Selected' : 'Pending'}
            </span>
          </div>

          {currentStageIdx >= 2 && runResult?.selectedItem && (
            <div className="mt-4 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={runResult.selectedItem.image_url}
                  alt={runResult.selectedItem.title}
                  className="h-12 w-12 rounded-lg object-cover bg-slate-800"
                />
                <div>
                  <div className="text-sm font-semibold text-slate-100">
                    {runResult.selectedItem.title}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    SKU: {runResult.selectedItem.sku}
                  </div>
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="text-sm font-bold text-white">
                  {formatINR(runResult.selectedItem.price_paise)}
                </div>
                <div className="text-[11px] text-emerald-400">In Stock</div>
              </div>
            </div>
          )}
        </div>

        {/* Stage 4: Cart Construction */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            currentStageIdx >= 3
              ? 'bg-surface border-blue-500/50 shadow-lg shadow-blue-500/10'
              : 'bg-surface/40 border-slate-800/40 opacity-40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentStageIdx >= 3 ? (
                <ShoppingBag className="h-5 w-5 text-blue-400 shrink-0" />
              ) : (
                <ShoppingBag className="h-5 w-5 text-slate-600 shrink-0" />
              )}
              <div>
                <div className="text-sm font-semibold text-white">Stage 4: Cart Ready for Verification</div>
                <div className="text-xs text-slate-400">
                  Cart created ({runResult?.cart.cart_id}). Awaiting Concord verification at checkout.
                </div>
              </div>
            </div>
            <span className="text-[11px] font-mono text-blue-400">
              {currentStageIdx >= 3 ? 'Ready' : 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* ── ACTION FOOTER ── */}
      {currentStageIdx >= 3 && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900/30 via-slate-900 to-indigo-900/30 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-base font-bold text-white">Agent Finished Shopping</div>
            <div className="text-xs text-slate-300">
              Trigger <code>POST /v1/verify</code> to decide if cart conforms to &ldquo;{rawIntent}&rdquo;
            </div>
          </div>
          <button
            onClick={handleProceedToCheckout}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-blue-500/25 transition shrink-0"
          >
            Verify Order at Checkout
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function AgentPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-400">Loading Agent Session...</div>}>
      <AgentRunnerContent />
    </Suspense>
  );
}

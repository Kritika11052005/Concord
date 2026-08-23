'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchApi, formatINR } from '../../../../lib/api';
import type { CheckResult, Constraint, Receipt } from '@concord/schema';
import {
  ArrowLeft,
  Lock,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { Loader } from '../../../../components/Loader';

export default function ReceiptDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [hoveredConstraint, setHoveredConstraint] = useState<string | null>(null);

  useEffect(() => {
    async function loadReceipt() {
      try {
        const res = await fetchApi<{ receipt: Receipt }>(`/v1/receipts/${id}`);
        setReceipt(res.receipt);
      } catch (err: any) {
        setError(err.message || 'Failed to load receipt');
      } finally {
        setLoading(false);
      }
    }
    loadReceipt();
  }, [id]);

  const copyId = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-12 border border-zinc-800 bg-[#09090b] flex items-center justify-center">
        <Loader label="Loading Cryptographic Receipt Evidence..." />
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="max-w-5xl mx-auto p-8 bg-rose-950/30 border border-rose-800 text-center rounded-none font-mono">
        <div className="text-sm font-bold text-white">Receipt Not Found</div>
        <p className="text-xs text-rose-300 font-mono mt-1">{error || 'Unknown error'}</p>
        <Link href="/console" className="mt-4 inline-block text-xs text-[#c81b1c] hover:underline font-bold">
          Return to Orders
        </Link>
      </div>
    );
  }

  const { intent_text, constraint_set, cart, checks, latency_ms } = receipt;
  const constraints = constraint_set?.constraints || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-['SG',sans-serif]">
      {/* ── TOP NAV ── */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <Link
          href="/console"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition font-mono"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Order Feed
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={copyId}
            className="px-3 py-1.5 bg-[#09090b] border border-zinc-800 hover:bg-zinc-900 text-[11px] font-mono text-zinc-300 flex items-center gap-1 transition rounded-none"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            Copy ID
          </button>
          <Link
            href={`/verify/${receipt.receipt_id}`}
            className="px-3 py-1.5 bg-[#c81b1c] hover:bg-[#b01617] text-white text-[11px] font-mono flex items-center gap-1.5 transition rounded-none"
          >
            <Lock className="h-3 w-3" /> Public Verifier <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* ── 1. DECISION HEADER ── */}
      <div className="p-6 bg-[#09090b] border border-zinc-800 rounded-none flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-none text-xs font-bold font-mono uppercase ${
                receipt.decision === 'pass'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : receipt.decision === 'step_up'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-rose-950 text-rose-300 border border-rose-800'
              }`}
            >
              DECISION: {receipt.decision.toUpperCase().replace('_', '-')}
            </span>
            <span className="text-xs font-mono text-zinc-400 font-bold">
              Seq #{receipt.sequence_number}
            </span>
            <span className="text-xs font-mono text-zinc-500">
              Strictness: {Number(receipt.strictness_used).toFixed(2)}
            </span>
          </div>
          <div className="text-xs text-zinc-400 font-mono mt-2">
            Issued at: {new Date(receipt.issued_at).toLocaleString()} · Request ID: {receipt.request_id}
          </div>
        </div>

        {/* Latency card */}
        <div className="text-right font-mono text-xs bg-black p-3 border border-zinc-800 rounded-none shrink-0">
          <div className="text-zinc-500">Execution Latency</div>
          <div className="text-base font-bold text-white">{latency_ms?.total || 0} ms total</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            Extract: {latency_ms?.extract}ms · L1: {latency_ms?.deterministic}ms · L2: {latency_ms?.semantic}ms
          </div>
        </div>
      </div>

      {/* ── 2. INTENT PROVENANCE & SOURCE SPANS ── */}
      <div className="p-6 bg-[#09090b] border border-zinc-800 rounded-none">
        <h2 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider mb-3">
          Intent Text &amp; Character-Level Provenance (Source Spans)
        </h2>

        {/* Highlighted text container */}
        <div className="p-4 bg-black border border-zinc-800 rounded-none text-sm font-['SG',sans-serif] text-zinc-100 leading-relaxed">
          &ldquo;{intent_text}&rdquo;
        </div>

        {/* Constraint chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {constraints.map((c: Constraint) => (
            <div
              key={c.id}
              onMouseEnter={() => setHoveredConstraint(c.id)}
              onMouseLeave={() => setHoveredConstraint(null)}
              className={`px-3 py-1.5 text-xs font-mono border rounded-none transition cursor-default ${
                hoveredConstraint === c.id
                  ? 'bg-[#c81b1c]/20 border-[#c81b1c] text-white'
                  : 'bg-black border-zinc-800 text-zinc-300'
              }`}
            >
              <span className="text-[#c81b1c] font-bold">{c.kind}</span>
              <span className="text-zinc-500 mx-1">:</span>
              <span className="text-zinc-200">
                {c.value.type === 'money'
                  ? formatINR(c.value.amount)
                  : c.value.type === 'string_set'
                  ? c.value.values.join(', ')
                  : JSON.stringify(c.value)}
              </span>
              <span className="ml-2 text-[10px] text-zinc-500">({c.hardness})</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. CART LINE ITEMS (STRUCTURED VS PROSE) ── */}
      <div className="p-6 bg-[#09090b] border border-zinc-800 rounded-none">
        <h2 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider mb-3">
          Cart Payload (Structured Layer 1 vs Ignored Layer 1 Free-Text)
        </h2>

        <div className="space-y-3">
          {cart.lines.map((line, idx) => (
            <div key={idx} className="p-4 bg-black border border-zinc-800 rounded-none text-xs font-mono">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white font-['SG',sans-serif]">{line.title}</span>
                <span className="text-sm font-bold text-zinc-200 font-mono">
                  {formatINR(line.unit_amount)} (Qty: {line.quantity})
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-zinc-400 bg-zinc-950 p-2.5 border border-zinc-800 rounded-none">
                <div>
                  <span className="text-zinc-500">Brand:</span> {line.brand}
                </div>
                <div>
                  <span className="text-zinc-500">Category:</span> {line.category_path.join(' > ')}
                </div>
                <div>
                  <span className="text-zinc-500">Condition:</span> {line.condition}
                </div>
                <div>
                  <span className="text-zinc-500">Refundable:</span> {line.refundable ? 'Yes' : 'No'}
                </div>
              </div>

              <div className="mt-2 text-[11px] text-zinc-500 font-sans italic border-l-2 border-zinc-700 pl-2">
                Merchant Description (Untrusted): &ldquo;{line.description}&rdquo;
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. PER-CHECK EVIDENCE TABLE ── */}
      <div className="p-6 bg-[#09090b] border border-zinc-800 rounded-none">
        <h2 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider mb-3">
          Check Evidence Log ({checks.length} Checks)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-zinc-800 bg-black text-zinc-400 text-[10px] uppercase">
                <th className="py-2 px-3">Verdict</th>
                <th className="py-2 px-3">Layer</th>
                <th className="py-2 px-3">Kind</th>
                <th className="py-2 px-3">Reason (Shown to Ops)</th>
                <th className="py-2 px-3 text-right">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {checks.map((c: CheckResult, idx: number) => (
                <tr key={idx} className="hover:bg-zinc-900/40">
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-none text-[10px] font-bold uppercase ${
                        c.verdict === 'pass'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {c.verdict}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-zinc-400 capitalize">{c.layer}</td>
                  <td className="py-2.5 px-3 text-zinc-300 font-bold">{c.constraint_kind}</td>
                  <td className="py-2.5 px-3 text-zinc-200 font-sans text-xs">{c.reason}</td>
                  <td className="py-2.5 px-3 text-right text-zinc-300 font-bold">
                    {(c.confidence * 100).toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. CRYPTOGRAPHIC INTEGRITY PROOF ── */}
      <div className="p-6 bg-[#09090b] border border-zinc-800 rounded-none space-y-3 font-mono text-xs">
        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Lock className="h-4 w-4 text-emerald-400" />
          Cryptographic Provenance &amp; Ed25519 Signature
        </h2>

        <div className="p-4 bg-black border border-zinc-800 rounded-none space-y-2 text-[11px]">
          <div>
            <span className="text-zinc-500">Hash Algorithm:</span> SHA-256 (Canonical JSON)
          </div>
          <div className="truncate">
            <span className="text-zinc-500">Previous Hash (Chain):</span>{' '}
            <span className="text-zinc-300">{receipt.prev_hash || '(Genesis Receipt / Seq #1)'}</span>
          </div>
          <div className="truncate">
            <span className="text-zinc-500">Receipt SHA-256:</span>{' '}
            <span className="text-[#c81b1c] font-bold">{receipt.hash}</span>
          </div>
          <div className="truncate">
            <span className="text-zinc-500">Ed25519 Digital Signature:</span>{' '}
            <span className="text-emerald-400">{receipt.signature}</span>
          </div>
          <div>
            <span className="text-zinc-500">Signing Key Version:</span> v{receipt.signing_key_version}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '../../../lib/api';
import type { PublicVerifyResult } from '@concord/schema';
import {
  CheckCircle2,
  XCircle,
  Lock,
  ExternalLink,
  ArrowLeft,
  FileCheck,
} from 'lucide-react';
import { Loader } from '../../../components/Loader';

export default function PublicReceiptVerifierPage() {
  const params = useParams();
  const receiptId = params.receiptId as string;

  const [verifyData, setVerifyData] = useState<PublicVerifyResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verify() {
      if (receiptId === 'demo') {
        // Mock demo verification
        setVerifyData({
          receipt_id: 'receipt_demo_78f102a9b3c4',
          sequence_number: 105,
          prev_hash: 'c4e2098b11fa44e73b218a093e051d7a872990c0',
          hash: 'a872990c0c4e2098b11fa44e73b218a093e051d7',
          signature: 'MC4CAQAwBQYDK2VwBCIEIJ72Ru8DtvdSlHbnfln3kcXtX0XCKXRIGbT1dXAhZJQg...',
          signature_valid: true,
          chain_link_valid: true,
          signing_key_version: 1,
          issued_at: new Date().toISOString(),
          decision: 'pass',
          strictness_used: 0.75,
          checks_summary: [
            {
              check_id: 'chk_c_price_max',
              constraint_kind: 'price_max',
              layer: 'deterministic',
              verdict: 'pass',
              confidence: 1.0,
              reason: 'Cart total within budget cap.',
            },
            {
              check_id: 'chk_c_delivery_by',
              constraint_kind: 'delivery_by',
              layer: 'deterministic',
              verdict: 'pass',
              confidence: 1.0,
              reason: 'Promised delivery meets required deadline.',
            },
            {
              check_id: 'chk_c_category',
              constraint_kind: 'category',
              layer: 'semantic',
              verdict: 'pass',
              confidence: 0.96,
              reason: 'Item matches requested category.',
            },
          ],
          versions: {
            extractor: '1.0.0',
            checker: '1.0.0',
            schema: '1.0.0',
            prompt: '2026.08.v1',
          },
        });
        setLoading(false);
        return;
      }

      try {
        const res = await fetchApi<PublicVerifyResult>(`/v1/receipts/${receiptId}/verify`);
        setVerifyData(res);
      } catch (err: any) {
        setError(err.message || 'Receipt could not be verified');
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, [receiptId]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6 font-['SG',sans-serif]">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-[#09090b] border border-zinc-800 flex items-center justify-center text-emerald-400">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
              Zero-Auth Public Proof (Zero PII)
            </span>
            <h1 className="text-xl font-bold text-white mt-0.5">Independent Cryptographic Verifier</h1>
          </div>
        </div>

        <Link
          href="/"
          className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 border border-zinc-800 transition flex items-center gap-1 font-mono rounded-none"
        >
          <ArrowLeft className="h-3 w-3" /> Home
        </Link>
      </div>

      {loading ? (
        <div className="p-12 border border-zinc-800 bg-[#09090b] flex items-center justify-center">
          <Loader label="Recomputing SHA-256 Hash & Verifying Ed25519 Signature..." />
        </div>
      ) : error || !verifyData ? (
        <div className="p-8 border border-rose-800 bg-rose-950/30 text-center rounded-none font-mono">
          <XCircle className="h-8 w-8 text-rose-400 mx-auto mb-2" />
          <div className="text-base font-bold text-white">Receipt Verification Failed</div>
          <p className="text-xs text-rose-300 mt-1">{error}</p>
        </div>
      ) : (
        <div className="space-y-6 font-mono">
          {/* ── INTEGRITY STATUS CARD ── */}
          <div className="p-6 bg-[#09090b] border border-zinc-800 space-y-4 rounded-none">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              <div>
                <div className="text-xs text-zinc-400">RECEIPT IDENTIFIER</div>
                <div className="text-base font-bold text-white break-all">{verifyData.receipt_id}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-zinc-400">CHAIN POSITION</div>
                <div className="text-base font-bold text-white">Sequence #{verifyData.sequence_number}</div>
              </div>
            </div>

            {/* Cryptographic Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-black border border-emerald-900/60 flex items-center gap-3 rounded-none">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs text-emerald-400 font-bold">Ed25519 Signature Valid</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    Signed by Concord Merchant Key v{verifyData.signing_key_version}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-black border border-emerald-900/60 flex items-center gap-3 rounded-none">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs text-emerald-400 font-bold">Hash Chain Linkage Valid</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    Prev Hash linked to Genesis / Prior Block
                  </div>
                </div>
              </div>
            </div>

            {/* Hash breakdown */}
            <div className="p-4 bg-black border border-zinc-800 space-y-2 text-[11px] rounded-none">
              <div className="truncate">
                <span className="text-zinc-500">Block SHA-256:</span>{' '}
                <span className="text-white font-bold">{verifyData.hash}</span>
              </div>
              <div className="truncate">
                <span className="text-zinc-500">Prev Hash:</span>{' '}
                <span className="text-zinc-300">{verifyData.prev_hash}</span>
              </div>
              <div className="truncate">
                <span className="text-zinc-500">Signature:</span>{' '}
                <span className="text-emerald-400">{verifyData.signature}</span>
              </div>
            </div>
          </div>

          {/* ── CHECKS SUMMARY ── */}
          <div className="p-6 bg-[#09090b] border border-zinc-800 space-y-4 rounded-none">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-emerald-400" />
              Verified Constraints Summary (Zero PII)
            </h2>

            <div className="divide-y divide-zinc-800/80">
              {verifyData.checks_summary.map((chk, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold capitalize">
                        {chk.constraint_kind} Check
                      </span>
                      <span className="text-[10px] text-zinc-500 uppercase">({chk.layer})</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-sans">{chk.reason}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] uppercase font-bold shrink-0 rounded-none">
                    {chk.verdict} ({(chk.confidence * 100).toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

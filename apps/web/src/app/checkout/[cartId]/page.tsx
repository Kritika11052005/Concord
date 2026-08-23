'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { fetchApi, formatINR } from '../../../lib/api';
import type { Cart, CheckResult, StepUpProposal, VerifyResponse } from '@concord/schema';
import { CATALOG } from '../../../lib/catalog';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  CreditCard,
  Lock,
  Layers,
  FileCheck,
  Check,
} from 'lucide-react';

function CheckoutContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const cartId = params.cartId as string;
  const rawIntent = searchParams.get('intent') || 'espresso machine under ₹15,000, delivered by Friday';
  const rawCartJson = searchParams.get('cart');

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifyResponse | null>(null);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  useEffect(() => {
    let parsedCart: Cart;
    if (rawCartJson) {
      try {
        parsedCart = JSON.parse(decodeURIComponent(rawCartJson));
      } catch {
        parsedCart = getDefaultDemoCart(cartId);
      }
    } else {
      parsedCart = getDefaultDemoCart(cartId);
    }

    setCart(parsedCart);
    runVerification(parsedCart, rawIntent);
  }, [cartId, rawCartJson, rawIntent]);

  function getDefaultDemoCart(cId: string): Cart {
    const item = CATALOG.find((i) => i.sku === 'SKU_GRIND_14500') || CATALOG[0];
    return {
      cart_id: cId,
      merchant_id: '00000000-0000-0000-0000-000000000001',
      currency: 'INR',
      lines: [
        {
          sku: item.sku,
          title: item.title,
          description: item.description,
          category_path: item.category_path,
          brand: item.brand,
          unit_amount: item.price_paise,
          quantity: 1,
          condition: item.condition,
          refundable: item.refundable,
          attributes: item.attributes || {},
          image_url: item.image_url,
        },
      ],
      total_amount: item.price_paise,
      promised_delivery_date: '2026-08-27',
    };
  }

  async function runVerification(cartToVerify: Cart, intentText: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi<VerifyResponse>('/v1/verify', {
        method: 'POST',
        body: JSON.stringify({
          intent_text: intentText,
          cart: cartToVerify,
          strictness: 0.75,
        }),
      });
      setVerifyResult(res);
    } catch (err: any) {
      console.error('Verify error:', err);
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  // Handle Step-Up Item Swap
  const handleSwapItem = async (proposal: StepUpProposal) => {
    setIsSwapping(true);
    const replacementItem = CATALOG.find((i) => i.sku === proposal.proposed_sku);
    if (!replacementItem) return;

    const newCart: Cart = {
      cart_id: `cart_${Math.random().toString(36).substring(2, 10)}`,
      merchant_id: cart?.merchant_id || '00000000-0000-0000-0000-000000000001',
      currency: 'INR',
      lines: [
        {
          sku: replacementItem.sku,
          title: replacementItem.title,
          description: replacementItem.description,
          category_path: replacementItem.category_path,
          brand: replacementItem.brand,
          unit_amount: replacementItem.price_paise,
          quantity: 1,
          condition: replacementItem.condition,
          refundable: replacementItem.refundable,
          attributes: replacementItem.attributes || {},
          image_url: replacementItem.image_url,
        },
      ],
      total_amount: replacementItem.price_paise,
      promised_delivery_date: '2026-08-27',
    };

    setCart(newCart);

    // Re-verify with swapped conforming item
    await runVerification(newCart, rawIntent);
    setIsSwapping(false);
  };

  const handleSimulatePayment = () => {
    setPaymentSuccess(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* ── HEADER ── */}
      <div className="mb-6 flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <span className="text-xs font-mono text-blue-400 uppercase tracking-wider">
            Checkout Verification Path
          </span>
          <h1 className="text-2xl font-bold text-white mt-1">Concord Order Verification</h1>
        </div>
        <Link
          href="/shop"
          className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 transition"
        >
          Back to Store
        </Link>
      </div>

      {loading ? (
        <div className="p-16 rounded-2xl bg-surface border border-slate-800 text-center">
          <RefreshCw className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-4" />
          <div className="text-base font-semibold text-white">Running Multi-Layer Verification...</div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Evaluating deterministic rules + Platt calibrated semantic category fit
          </p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-rose-950/40 border border-rose-800 text-center">
          <XCircle className="h-8 w-8 text-rose-400 mx-auto mb-2" />
          <div className="text-base font-bold text-white">Verification Error</div>
          <p className="text-xs text-rose-300 mt-1 font-mono">{error}</p>
          <button
            onClick={() => cart && runVerification(cart, rawIntent)}
            className="mt-4 px-4 py-2 rounded-lg bg-rose-800 hover:bg-rose-700 text-xs font-medium text-white transition"
          >
            Retry
          </button>
        </div>
      ) : verifyResult ? (
        <div className="space-y-6">
          {/* ── 1. DECISION BANNER (THE LARGEST ELEMENT) ── */}
          <div
            className={`p-8 rounded-2xl border relative overflow-hidden ${
              verifyResult.decision === 'pass'
                ? 'bg-emerald-950/40 border-emerald-500/40 glow-pass'
                : verifyResult.decision === 'step_up'
                ? 'bg-amber-950/40 border-amber-500/40 glow-stepup'
                : 'bg-rose-950/40 border-rose-500/40 glow-decline'
            }`}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 ${
                    verifyResult.decision === 'pass'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : verifyResult.decision === 'step_up'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {verifyResult.decision === 'pass' ? (
                    <CheckCircle2 className="h-9 w-9" />
                  ) : verifyResult.decision === 'step_up' ? (
                    <AlertTriangle className="h-9 w-9" />
                  ) : (
                    <XCircle className="h-9 w-9" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-mono text-slate-400">VERIFICATION OUTCOME</div>
                  <div className="text-3xl font-extrabold tracking-tight text-white mt-0.5">
                    DECISION: {verifyResult.decision.toUpperCase().replace('_', '-')}
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-lg">
                    {verifyResult.decision === 'pass'
                      ? 'All hard arithmetic and semantic constraints satisfied. Order approved for settlement.'
                      : verifyResult.decision === 'step_up'
                      ? 'Semantic mismatch or ambiguity detected. Concord intercepted order before shipment.'
                      : 'Hard deterministic constraint violated. Order declined.'}
                  </p>
                </div>
              </div>

              {/* Latency badge */}
              <div className="text-right font-mono text-xs bg-slate-900/80 p-3 rounded-xl border border-slate-800 shrink-0">
                <div className="text-slate-400">Total Latency</div>
                <div className="text-lg font-bold text-blue-400">
                  {verifyResult.latency_ms.total} ms
                </div>
                <div className="text-[10px] text-slate-500">
                  L1: {verifyResult.latency_ms.deterministic}ms · L2: {verifyResult.latency_ms.semantic}ms
                </div>
              </div>
            </div>
          </div>

          {/* ── 2. STEP-UP RESOLUTION CARD (IF STEP-UP) ── */}
          {verifyResult.decision === 'step_up' && verifyResult.step_up_proposal && (
            <div className="p-6 rounded-2xl bg-surface border-2 border-amber-500/60 shadow-xl relative">
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase font-bold mb-3">
                <AlertTriangle className="h-4 w-4" />
                Step-Up Resolver Proposes Correction
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-white">
                    Did you mean the {verifyResult.step_up_proposal.proposed_title}?
                  </div>
                  <p className="text-xs text-amber-300 mt-1">
                    {verifyResult.step_up_proposal.reason}
                  </p>
                </div>
                <div className="text-right font-mono shrink-0">
                  <div className="text-base font-bold text-white">
                    {formatINR(verifyResult.step_up_proposal.proposed_unit_amount)}
                  </div>
                  <span className="text-[11px] text-emerald-400">Conforming Substitute</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => verifyResult.step_up_proposal && handleSwapItem(verifyResult.step_up_proposal)}
                  disabled={isSwapping}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center gap-2 shadow transition"
                >
                  {isSwapping ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Yes, Swap Item &amp; Re-Verify
                </button>
                <Link
                  href={`/console/receipts/${verifyResult.receipt_id}`}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition"
                >
                  View Evidence Details
                </Link>
              </div>
            </div>
          )}

          {/* ── 3. PASS SETTLEMENT CARD (IF PASS) ── */}
          {verifyResult.decision === 'pass' && (
            <div className="p-6 rounded-2xl bg-surface border border-emerald-500/40 shadow-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-mono text-emerald-400 uppercase font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Razorpay Settlement Ready
                  </div>
                  <div className="text-sm text-slate-200 mt-1">
                    Order verified against original human intent. Razorpay Test Order ID:{' '}
                    <code className="text-blue-300 font-mono text-xs">
                      {verifyResult.razorpay_order_id || 'order_test_23b8f1'}
                    </code>
                  </div>
                </div>

                {!paymentSuccess ? (
                  <button
                    onClick={handleSimulatePayment}
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition shrink-0"
                  >
                    <CreditCard className="h-4 w-4" />
                    Pay {cart ? formatINR(cart.total_amount) : ''} (Test Mode)
                  </button>
                ) : (
                  <div className="px-4 py-2 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Payment Authorized &amp; Captured
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 4. CHECK EVIDENCE BREAKDOWN ── */}
          <div className="p-6 rounded-2xl bg-surface border border-slate-800 shadow-md">
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider mb-4 flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-400" />
              Per-Constraint Evidence Breakdown ({verifyResult.checks.length} Checks)
            </h3>

            <div className="space-y-3">
              {verifyResult.checks.map((c, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-mono ${
                    c.verdict === 'pass'
                      ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                      : c.verdict === 'fail'
                      ? 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                      : 'bg-amber-950/20 border-amber-800/40 text-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        c.verdict === 'pass'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {c.verdict}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-100">{c.reason}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Kind: <strong>{c.constraint_kind}</strong> · Layer: <strong>{c.layer}</strong> · Hardness: <strong>{c.hardness}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-slate-400">Confidence</div>
                    <div className="font-bold text-slate-200">
                      {(c.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 5. RECEIPT AUDIT LINK FOOTER ── */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Lock className="h-4 w-4 text-blue-400" />
              <span>
                Receipt ID: <code className="text-slate-200 font-mono">{verifyResult.receipt_id}</code> (Seq #{verifyResult.sequence_number})
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/console/receipts/${verifyResult.receipt_id}`}
                className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
              >
                Inspect Full Evidence <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <span className="text-slate-600">|</span>
              <Link
                href={`/verify/${verifyResult.receipt_id}`}
                className="text-slate-400 hover:text-white flex items-center gap-1"
              >
                Public Verifier <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-400">Loading Checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}

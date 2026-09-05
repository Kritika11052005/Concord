'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATALOG } from '../../lib/catalog';
import { formatINR } from '../../lib/api';
import {
  ShoppingBag,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCcw,
  Tag,
  Search,
} from 'lucide-react';
import type { ProductSKU } from '@concord/schema';

export default function ShopPage() {
  const router = useRouter();
  const [intentInput, setIntentInput] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductSKU | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const handleStartAgent = (intent: string) => {
    if (!intent.trim()) return;
    const encoded = encodeURIComponent(intent.trim());
    router.push(`/shop/agent?intent=${encoded}`);
  };

  const exampleChips = [
    {
      label: 'Pass: Espresso Maker ₹15k',
      intent: 'espresso machine under ₹15,000',
      type: 'pass',
      badge: 'PASS',
    },
    {
      label: 'Decline: Espresso vs Grinder',
      intent: 'espresso machine under ₹15,000, delivered by Friday',
      type: 'decline',
      badge: 'DECLINE',
    },
    {
      label: 'Decline: Budget Violation',
      intent: 'trail running shoes under ₹7,000',
      type: 'decline',
      badge: 'DECLINE',
    },
  ];

  const categories = ['all', 'Coffee', 'Running', 'Audio', 'Wearables', 'Pet Care', 'Keyboards'];

  const filteredCatalog = CATALOG.filter((p) => {
    if (categoryFilter === 'all') return true;
    return p.category_path.some((c) => c.toLowerCase().includes(categoryFilter.toLowerCase()));
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* ── PERSISTENT AGENT BAR ── */}
      <div className="mb-10 p-6 rounded-2xl bg-surface border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Autonomous Buyer Agent
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Ready to Shop
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Instruct the AI shopping agent with natural language. Concord verifies its cart before checkout.
              </p>
            </div>
          </div>
        </div>

        {/* Input bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleStartAgent(intentInput);
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={intentInput}
              onChange={(e) => setIntentInput(e.target.value)}
              placeholder="e.g. 'espresso machine under ₹15,000, delivered by Friday' or 'trail running shoes size 8'"
              className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <button
            type="submit"
            disabled={!intentInput.trim()}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition shrink-0"
          >
            Deploy Agent
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Example chips */}
        <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/80">
          <span className="text-xs font-mono text-slate-400 mr-1">One-Click Demo Flows:</span>
          {exampleChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => {
                setIntentInput(chip.intent);
                handleStartAgent(chip.intent);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono border transition flex items-center gap-1.5 ${
                chip.type === 'pass'
                  ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300 hover:bg-emerald-900/40'
                  : chip.type === 'stepup'
                  ? 'bg-amber-950/30 border-amber-800/50 text-amber-300 hover:bg-amber-900/40'
                  : 'bg-rose-950/30 border-rose-800/50 text-rose-300 hover:bg-rose-900/40'
              }`}
            >
              <span className="font-bold">[{chip.badge}]</span>
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── STORE CATALOG HEADER & CATEGORY FILTER ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-blue-400" />
            Merchant Catalog (15 Fixture SKUs)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Deliberate near-miss pairs (Espresso Maker vs Burr Grinder, Road vs Trail Running, Wired vs Wireless).
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition whitespace-nowrap ${
                categoryFilter === c
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {c === 'all' ? 'All Items' : c}
            </button>
          ))}
        </div>
      </div>

      {/* ── 15-SKU PRODUCT GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredCatalog.map((item) => (
          <div
            key={item.sku}
            onClick={() => setSelectedProduct(item)}
            className="group cursor-pointer rounded-xl bg-surface border border-slate-800/90 hover:border-slate-700 overflow-hidden flex flex-col justify-between transition-all hover:shadow-lg hover:shadow-black/40"
          >
            <div>
              {/* Product Image */}
              <div className="h-44 w-full bg-slate-900 relative overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-300"
                  loading="lazy"
                />
                <div className="absolute top-2 left-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 text-slate-200 backdrop-blur border border-white/10">
                    {item.brand}
                  </span>
                </div>
                <div className="absolute top-2 right-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/80 text-blue-200 backdrop-blur border border-blue-500/30">
                    {item.category_path[item.category_path.length - 1]}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="p-4">
                <h3 className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>

            {/* Price & Action footer */}
            <div className="p-4 pt-0 flex items-center justify-between border-t border-slate-800/60 mt-2">
              <div>
                <span className="text-xs text-slate-500 block font-mono">Price</span>
                <span className="text-base font-bold text-white font-mono">
                  {formatINR(item.price_paise)}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartAgent(`buy ${item.title}`);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-xs font-medium text-slate-200 hover:text-white transition"
              >
                Buy via Agent
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── PRODUCT DETAIL DRAWER / MODAL ── */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-slate-800 p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm"
            >
              ✕
            </button>
            <div className="h-52 w-full rounded-xl overflow-hidden mb-4 bg-slate-900">
              <img
                src={selectedProduct.image_url}
                alt={selectedProduct.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-blue-400 mb-1">
              <span>{selectedProduct.brand}</span>
              <span>•</span>
              <span>{selectedProduct.category_path.join(' > ')}</span>
            </div>
            <h2 className="text-lg font-bold text-white">{selectedProduct.title}</h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {selectedProduct.description}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-mono bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-500">Condition:</span>{' '}
                <span className="text-slate-200 capitalize">{selectedProduct.condition}</span>
              </div>
              <div>
                <span className="text-slate-500">Refundable:</span>{' '}
                <span className="text-emerald-400">Yes (7-day returns)</span>
              </div>
              <div>
                <span className="text-slate-500">Delivery:</span>{' '}
                <span className="text-slate-200">{selectedProduct.delivery_days} days promised</span>
              </div>
              <div>
                <span className="text-slate-500">SKU Code:</span>{' '}
                <span className="text-blue-300">{selectedProduct.sku}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800">
              <div className="text-xl font-bold font-mono text-white">
                {formatINR(selectedProduct.price_paise)}
              </div>
              <button
                onClick={() => {
                  handleStartAgent(`buy ${selectedProduct.title}`);
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium flex items-center gap-2"
              >
                Instruct Agent to Purchase
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

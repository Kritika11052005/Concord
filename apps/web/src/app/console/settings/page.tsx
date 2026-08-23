'use client';

import React, { useState } from 'react';
import { fetchApi } from '../../../lib/api';
import { Sliders, Key, RefreshCw, Save } from 'lucide-react';

export default function ConsoleSettingsPage() {
  const [strictness, setStrictness] = useState<number>(0.75);
  const [saving, setSaving] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);

  const handleSaveStrictness = async () => {
    setSaving(true);
    try {
      await fetchApi('/v1/console/settings', {
        method: 'POST',
        body: JSON.stringify({ strictness }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-['SG',sans-serif]">
      {/* ── HEADER ── */}
      <div className="pb-4 border-b border-zinc-800">
        <h1 className="text-xl font-bold text-white flex items-center gap-2 font-['SG',sans-serif]">
          <Sliders className="h-5 w-5 text-[#c81b1c]" />
          Merchant Settings &amp; API Credentials
        </h1>
        <p className="text-xs text-zinc-400 font-mono mt-0.5">
          Configure decision engine strictness threshold and view API authentication keys
        </p>
      </div>

      {/* ── 1. STRICTNESS THRESHOLD CONTROL ── */}
      <div className="p-6 bg-[#09090b] border border-zinc-800 rounded-none space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              Semantic Strictness Threshold
            </h2>
            <p className="text-xs text-zinc-400 font-mono mt-1 max-w-lg">
              Controls when ambiguous semantic mismatches trigger a <code>step_up</code> human escalation versus a hard <code>decline</code>.
            </p>
          </div>
          <div className="text-xl font-bold font-mono text-[#c81b1c] bg-black px-4 py-2 border border-zinc-800 rounded-none">
            {strictness.toFixed(2)}
          </div>
        </div>

        <input
          type="range"
          min="0.50"
          max="0.95"
          step="0.05"
          value={strictness}
          onChange={(e) => setStrictness(parseFloat(e.target.value))}
          className="w-full h-2 bg-zinc-800 rounded-none appearance-none cursor-pointer accent-[#c81b1c]"
        />

        <div className="flex justify-between text-[11px] font-mono text-zinc-500">
          <span>0.50 (Permissive · Fewer Step-Ups)</span>
          <span>0.75 (Recommended Default)</span>
          <span>0.95 (High Strictness · Max Security)</span>
        </div>

        <div className="pt-3 flex items-center justify-between border-t border-zinc-800">
          <span className="text-xs text-zinc-400 font-mono">
            {saved ? '✓ Changes saved to merchant profile.' : 'Adjust slider and commit.'}
          </span>
          <button
            onClick={handleSaveStrictness}
            disabled={saving}
            className="px-5 py-2.5 bg-[#c81b1c] hover:bg-[#b01617] text-white font-mono text-xs font-semibold flex items-center gap-2 transition rounded-none"
          >
            {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Strictness
          </button>
        </div>
      </div>

      {/* ── 2. API KEYS ── */}
      <div className="p-6 bg-[#09090b] border border-zinc-800 rounded-none space-y-4">
        <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
          <Key className="h-4 w-4 text-[#c81b1c]" />
          Active API Keys
        </h2>

        <div className="p-4 bg-black border border-zinc-800 rounded-none flex items-center justify-between font-mono text-xs">
          <div>
            <div className="text-zinc-200 font-bold">Demo Test API Key</div>
            <div className="text-zinc-500 text-[11px] mt-0.5">
              Prefix: <code>ck_test_demo</code> · Hash: Argon2id (Stored securely)
            </div>
          </div>
          <div className="px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] uppercase font-bold rounded-none">
            Active
          </div>
        </div>

        <div className="p-4 bg-black border border-zinc-800 rounded-none flex items-center justify-between font-mono text-xs">
          <div>
            <div className="text-zinc-200 font-bold">Receipt Ed25519 Signing Key Version</div>
            <div className="text-zinc-500 text-[11px] mt-0.5">
              Key Version: <code>v1</code> (Rotatable via DB schema)
            </div>
          </div>
          <div className="text-zinc-400 text-xs">Active</div>
        </div>
      </div>
    </div>
  );
}

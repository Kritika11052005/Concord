'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ListOrdered,
  Activity,
  BarChart3,
  Sliders,
  ShoppingBag,
  Lock,
  FileCode,
  ExternalLink,
} from 'lucide-react';

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Order Feed', href: '/console', icon: ListOrdered, exact: true },
    { label: 'Ops Metrics', href: '/console/metrics', icon: Activity },
    { label: 'Eval & Ablations', href: '/console/eval', icon: BarChart3 },
    { label: 'Strictness & Keys', href: '/console/settings', icon: Sliders },
  ];

  return (
    <div className="flex h-screen w-full bg-black text-zinc-100 overflow-hidden font-['SG',sans-serif]">
      {/* ── RESTRAINED OPS SIDEBAR ── */}
      <aside className="w-64 border-r border-zinc-800 bg-[#09090b] flex flex-col justify-between p-4 shrink-0">
        <div>
          {/* Brand header with Inward 4-Chevron Logo */}
          <Link href="/" className="flex items-center gap-3 px-2 mb-6 group text-decoration-none">
            <div className="w-7 h-7 flex items-center justify-center transition-transform group-hover:scale-105">
              <svg viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
                {/* North */}
                <path d="M23 0V19.5" stroke="#fff" strokeWidth="3" strokeLinecap="square" />
                <path d="M14 10.2L23 19.2L32 10.2" stroke="#fff" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" />
                {/* East */}
                <path d="M46 23H26.5" stroke="#fff" strokeWidth="3" strokeLinecap="square" />
                <path d="M35.8 14L26.8 23L35.8 32" stroke="#fff" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" />
                {/* South */}
                <path d="M23 46V26.5" stroke="#fff" strokeWidth="3" strokeLinecap="square" />
                <path d="M32 35.8L23 26.8L14 35.8" stroke="#fff" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" />
                {/* West */}
                <path d="M0 23H19.5" stroke="#fff" strokeWidth="3" strokeLinecap="square" />
                <path d="M10.2 32L19.2 23L10.2 14" stroke="#fff" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" />
              </svg>
            </div>
            <div className="flex flex-col">
              <div className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5 font-['SG',sans-serif]">
                CONCORD
                <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#c81b1c]/20 text-[#c81b1c] border border-[#c81b1c]/40 font-bold">
                  OPS
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 font-mono">Merchant Console</div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs font-mono transition rounded-none ${
                    active
                      ? 'bg-[#c81b1c]/15 text-white border-l-2 border-[#c81b1c] font-semibold'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border-l-2 border-transparent'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-[#c81b1c]' : 'text-zinc-500'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom links */}
        <div className="space-y-1.5 pt-4 border-t border-zinc-800 text-xs font-mono">
          <Link
            href="/shop"
            className="flex items-center justify-between px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-900 transition text-[11px]"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="h-3.5 w-3.5 text-zinc-400" /> Demo Store
            </span>
            <ExternalLink className="h-3 w-3 text-zinc-500" />
          </Link>
          <Link
            href="/verify/demo"
            className="flex items-center justify-between px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-900 transition text-[11px]"
          >
            <span className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-zinc-400" /> Public Verifier
            </span>
            <ExternalLink className="h-3 w-3 text-zinc-500" />
          </Link>
          <a
            href="http://localhost:3001/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-900 transition text-[11px]"
          >
            <span className="flex items-center gap-2">
              <FileCode className="h-3.5 w-3.5 text-zinc-400" /> Scalar API Docs
            </span>
            <ExternalLink className="h-3 w-3 text-zinc-500" />
          </a>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-1 overflow-y-auto bg-black p-8">{children}</main>
    </div>
  );
}

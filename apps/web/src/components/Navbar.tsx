'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();
  const isLandingOrConsole = pathname === '/' || pathname.startsWith('/console');

  // Landing page has its own dedicated transparent cyber stage header; Console has its own sidebar
  if (isLandingOrConsole) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-black/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand with Inward 4-Chevron Logo */}
        <Link href="/" className="flex items-center gap-3 group text-decoration-none">
          <div className="w-8 h-8 flex items-center justify-center transition-transform group-hover:scale-105">
            <svg viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
              {/* North Arm */}
              <path d="M23 0V19.5" stroke="#fff" strokeWidth="3" strokeLinecap="square" />
              <path d="M14 10.2L23 19.2L32 10.2" stroke="#fff" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" />
              {/* East Arm */}
              <path d="M46 23H26.5" stroke="#fff" strokeWidth="3" strokeLinecap="square" />
              <path d="M35.8 14L26.8 23L35.8 32" stroke="#fff" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" />
              {/* South Arm */}
              <path d="M23 46V26.5" stroke="#fff" strokeWidth="3" strokeLinecap="square" />
              <path d="M32 35.8L23 26.8L14 35.8" stroke="#fff" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" />
              {/* West Arm */}
              <path d="M0 23H19.5" stroke="#fff" strokeWidth="3" strokeLinecap="square" />
              <path d="M10.2 32L19.2 23L10.2 14" stroke="#fff" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-white flex items-center gap-1.5 text-base font-['SG',sans-serif]">
              CONCORD
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-zinc-900 text-zinc-300 border border-zinc-700">
                v1.0
              </span>
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">Agent Order Verification API</span>
          </div>
        </Link>

        {/* Unified Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/"
            className={`px-3 py-1.5 text-sm transition font-mono ${
              pathname === '/' ? 'text-[#c81b1c] font-bold' : 'text-zinc-300 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            Overview
          </Link>
          <Link
            href="/shop"
            className={`px-3 py-1.5 text-sm transition font-mono ${
              pathname.startsWith('/shop') ? 'text-[#c81b1c] font-bold' : 'text-zinc-300 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            Demo Store
          </Link>
          <Link
            href="/console"
            className="px-3 py-1.5 text-sm transition text-zinc-300 hover:text-white hover:bg-zinc-900/50 font-mono"
          >
            Merchant Console
          </Link>
          <Link
            href="/verify/demo"
            className="px-3 py-1.5 text-sm transition text-zinc-300 hover:text-white hover:bg-zinc-900/50 font-mono"
          >
            Public Verifier
          </Link>
        </nav>

        {/* Sharp Red CTA Button */}
        <div className="flex items-center gap-3">
          <Link
            href="/shop"
            className="group inline-flex items-center gap-2.5 px-5 py-2.5 bg-[#c81b1c] hover:bg-[#b01617] text-white font-['SG',sans-serif] font-medium text-sm transition-colors rounded-none"
          >
            <span>Secure system</span>
            <svg
              className="w-4 h-3.5 stroke-white stroke-2 fill-none transition-transform group-hover:translate-x-1"
              viewBox="0 0 22 18"
            >
              <path d="M0 9H20.1" />
              <path d="M12.1 1L20.1 9L12.1 17" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}

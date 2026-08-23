'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Github, Mail, Linkedin, ExternalLink, GitBranch } from 'lucide-react';

export function Footer() {
  const pathname = usePathname();

  // Hide on fixed landing page stage and dense console ops view
  if (pathname === '/' || pathname.startsWith('/console')) {
    return null;
  }

  return (
    <footer className="w-full border-t border-zinc-800 bg-[#09090b] text-zinc-400 font-['SG',sans-serif] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand & Made By */}
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <Link href="/" className="flex items-center gap-2.5 text-white group">
            <svg viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 transition-transform group-hover:scale-105">
              <path d="M23 0V19.5" stroke="#fff" strokeWidth="3" strokeLinecap="square" />
              <path d="M14 10.2L23 19.2L32 10.2" stroke="#fff" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" />
              <path d="M46 23H26.5" stroke="#fff" strokeWidth="3" strokeLinecap="square" />
              <path d="M35.8 14L26.8 23L35.8 32" stroke="#fff" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" />
              <path d="M23 46V26.5" stroke="#fff" strokeWidth="3" strokeLinecap="square" />
              <path d="M32 35.8L23 26.8L14 35.8" stroke="#fff" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" />
              <path d="M0 23H19.5" stroke="#fff" strokeWidth="3" strokeLinecap="square" />
              <path d="M10.2 32L19.2 23L10.2 14" stroke="#fff" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" />
            </svg>
            <span className="font-bold tracking-tight text-sm font-['SG',sans-serif]">
              CONCORD
            </span>
          </Link>

          <span className="hidden sm:inline-block text-zinc-700">|</span>

          <div className="text-xs font-mono text-zinc-300">
            Made by{' '}
            <span className="text-white font-bold font-['SG',sans-serif]">
              Kritika Benjwal
            </span>
          </div>
        </div>

        {/* Social / Repo / Contact Links */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 text-xs font-mono">
          <a
            href="https://github.com/Kritika11052005/Concord"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black border border-zinc-800 hover:border-[#c81b1c] hover:text-white transition rounded-none text-zinc-300"
          >
            <GitBranch className="w-3.5 h-3.5 text-[#c81b1c]" />
            <span>Kritika11052005/Concord</span>
            <ExternalLink className="w-2.5 h-2.5 text-zinc-500" />
          </a>

          <a
            href="https://github.com/Kritika11052005"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black border border-zinc-800 hover:border-[#c81b1c] hover:text-white transition rounded-none text-zinc-300"
          >
            <Github className="w-3.5 h-3.5 text-[#c81b1c]" />
            <span>GitHub Profile</span>
            <ExternalLink className="w-2.5 h-2.5 text-zinc-500" />
          </a>

          <a
            href="https://www.linkedin.com/in/kritika-benjwal"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black border border-zinc-800 hover:border-[#c81b1c] hover:text-white transition rounded-none text-zinc-300"
          >
            <Linkedin className="w-3.5 h-3.5 text-[#c81b1c]" />
            <span>LinkedIn</span>
            <ExternalLink className="w-2.5 h-2.5 text-zinc-500" />
          </a>

          <a
            href="mailto:ananya.benjwal@gmail.com"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black border border-zinc-800 hover:border-[#c81b1c] hover:text-white transition rounded-none text-zinc-300"
          >
            <Mail className="w-3.5 h-3.5 text-[#c81b1c]" />
            <span>ananya.benjwal@gmail.com</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

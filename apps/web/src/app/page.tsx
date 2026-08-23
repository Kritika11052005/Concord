'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [navOpen, setNavOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const v1Ref = useRef<HTMLVideoElement>(null);
  const v2Ref = useRef<HTMLVideoElement>(null);
  const v3Ref = useRef<HTMLVideoElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);

  // 1. Triple Video Synchronization & Motion Preferences
  useEffect(() => {
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const v1 = v1Ref.current;
    const v2 = v2Ref.current;
    const v3 = v3Ref.current;
    const videos = [v1, v2, v3].filter(Boolean) as HTMLVideoElement[];

    if (prefersReduced) {
      videos.forEach((v) => {
        v.pause();
        v.removeAttribute('autoplay');
      });
    } else if (v1) {
      const handleTimeUpdate = () => {
        const t = v1.currentTime;
        [v2, v3].forEach((other) => {
          if (other && Math.abs(other.currentTime - t) > 0.12) {
            other.currentTime = t;
          }
        });
      };
      v1.addEventListener('timeupdate', handleTimeUpdate);
      return () => {
        v1.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, []);

  // 2. Keyboard & Resize Listeners for Mobile Menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && navOpen) {
        setNavOpen(false);
      }
    };
    const handleResize = () => {
      if (window.innerWidth > 1023 && navOpen) {
        setNavOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [navOpen]);

  // 3. Web Animations API (WAAPI) Master Entrance Timeline
  useEffect(() => {
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || typeof Element === 'undefined' || typeof Element.prototype.animate !== 'function') {
      document.documentElement.classList.remove('intro');
      return;
    }

    const EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)';
    const QUINT = 'cubic-bezier(0.22, 1, 0.36, 1)';
    const QUART = 'cubic-bezier(0.25, 1, 0.5, 1)';
    const TYPE = 'cubic-bezier(0.22, 0.85, 0.24, 1)';

    const isPhone = window.innerWidth <= 599;
    const speedMultiplier = isPhone ? 0.86 : 1.0;

    const probe = probeRef.current;
    const s = probe ? probe.getBoundingClientRect().width / 100 : 1;

    const activeAnimations: Animation[] = [];

    const animateElem = (
      selector: string | HTMLElement[],
      keyframes: Keyframe[],
      timing: { duration?: number; delay?: number; stagger?: number; easing?: string }
    ) => {
      const elems = Array.isArray(selector)
        ? selector
        : (Array.from(document.querySelectorAll(selector)) as HTMLElement[]);

      elems.forEach((el, idx) => {
        if (!el) return;
        const staggerDelay = (timing.stagger || 0) * idx;
        const totalDelay = ((timing.delay || 0) + staggerDelay) * speedMultiplier * 1000;
        const duration = (timing.duration || 0.6) * speedMultiplier * 1000;

        const anim = el.animate(keyframes, {
          duration,
          delay: totalDelay,
          easing: timing.easing || 'ease-out',
          fill: 'forwards',
        });
        activeAnimations.push(anim);
      });
    };

    const runChoreography = () => {
      // t=0.00: Logo & Brand opacity 0->1 + scale .9->1
      animateElem('.cyber-brand-lockup', [
        { opacity: 0, transform: 'scale(0.9)' },
        { opacity: 1, transform: 'scale(1)' },
      ], { duration: 0.70, delay: 0.00, easing: EXPO });

      // t=0.12: Nav links rise 7px
      animateElem('nav.cyber-nav .cyber-nav-link', [
        { opacity: 0, transform: `translateY(${7 * s}px)` },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 0.62, delay: 0.12, stagger: 0.055, easing: QUINT });

      // t=0.18: Burger fade
      animateElem('.cyber-burger', [
        { opacity: 0 },
        { opacity: 1 },
      ], { duration: 0.55, delay: 0.18, easing: QUART });

      // t=0.28: Top button wipe clip
      animateElem('.cyber-btn-top', [
        { clipPath: 'inset(0 100% 0 0)' },
        { clipPath: 'inset(0 0% 0 0)' },
      ], { duration: 0.66, delay: 0.28, easing: EXPO });

      // t=0.34: Headline lines rise from 120%
      animateElem('h1.cyber-hero-title .ln > span', [
        { transform: 'translateY(120%)' },
        { transform: 'translateY(0%)' },
      ], { duration: 0.98, delay: 0.34, stagger: 0.09, easing: TYPE });

      // t=0.74: Subtitle rise 14px
      animateElem('p.cyber-hero-sub', [
        { opacity: 0, transform: `translateY(${14 * s}px)` },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 0.72, delay: 0.74, easing: QUINT });

      // t=0.90: Hero CTA wipe
      animateElem('.cyber-btn-cta', [
        { clipPath: 'inset(0 100% 0 0)' },
        { clipPath: 'inset(0 0% 0 0)' },
      ], { duration: 0.70, delay: 0.90, easing: EXPO });

      // t=0.98: Vertical divider rules scaleY 0->1
      animateElem('.cyber-v-rule', [
        { transform: 'scaleY(0)' },
        { transform: 'scaleY(1)' },
      ], { duration: 0.60, delay: 0.98, stagger: 0.07, easing: QUART });

      // t=1.04: Stat numbers rise 12px
      animateElem('.cyber-stat-num', [
        { opacity: 0, transform: `translateY(${12 * s}px)` },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 0.66, delay: 1.04, stagger: 0.085, easing: QUINT });

      // t=1.10: Stat labels rise 10px
      animateElem('.cyber-stat-lab', [
        { opacity: 0, transform: `translateY(${10 * s}px)` },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 0.62, delay: 1.10, stagger: 0.085, easing: QUINT });

      // Cleanup
      const cleanupTimer = setTimeout(() => {
        document.documentElement.classList.remove('intro');
        activeAnimations.forEach((anim) => {
          try {
            anim.cancel();
          } catch {}
        });
      }, 2800 * speedMultiplier);

      const hardSafetyTimer = setTimeout(() => {
        clearTimeout(cleanupTimer);
        document.documentElement.classList.remove('intro');
      }, 4000);

      return () => {
        clearTimeout(cleanupTimer);
        clearTimeout(hardSafetyTimer);
      };
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        requestAnimationFrame(runChoreography);
      }).catch(() => {
        setTimeout(runChoreography, 200);
      });
    } else {
      setTimeout(runChoreography, 200);
    }
  }, []);

  return (
    <div className={`cyber-stage ${navOpen ? 'nav-open' : ''}`}>
      {/* Dynamic Scoped CSS for Pixel-Faithful Canvas Scaling & Tokens */}
      <style jsx global>{`
        :root {
          --s: min(100vw / 1505, 100vh / 700);
          --red: #c81b1c;
          --ink: #fff;
          --sub: #e6e6e6;
          --lab: #949494;
          --bx: 60;
          --by: 36;
          --bs: 44;
          --h1y: -12.5;
          --suby: 167.5;
          --numy: 19;
          --laby: 74;
        }

        @media (max-width: 1023px) and (max-aspect-ratio: 1/1) {
          :root {
            --s: clamp(0.82px, min(100vw / 900, 100vh / 1200), 1.25px);
            --bx: 56;
            --by: 33;
            --bs: 40;
            --h1y: -10.25;
            --suby: 137.4;
            --numy: 15.6;
            --laby: 60.7;
          }
        }

        @media (max-width: 599px) {
          :root {
            --s: min(100vw / 430, 100vh / 620, 1.02px);
            --bx: 26;
            --by: 21;
            --bs: 34;
            --h1y: -7.1;
            --suby: 108;
            --numy: 13;
            --laby: 50;
          }
        }

        .cyber-stage {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: #000;
          color: #fff;
          user-select: none;
          font-family: 'SG', 'Space Grotesk', -apple-system, sans-serif;
        }

        /* Video Plates */
        .cyber-bg, .cyber-bg2 {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 1;
        }

        .cyber-bg {
          filter: url(#grade);
        }

        .cyber-bg video, .cyber-bg2 video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          display: block;
        }

        .cyber-bg2 {
          filter: url(#grade2);
          mix-blend-mode: plus-lighter;
          opacity: 0.35;
          -webkit-mask-image: linear-gradient(180deg, transparent 21.5%, #000 100%);
          mask-image: linear-gradient(180deg, transparent 21.5%, #000 100%);
        }

        .cyber-scrim {
          display: none;
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 2;
        }

        @media (max-width: 1023px) and (max-aspect-ratio: 1/1) {
          .cyber-bg2 { display: none; }
          .cyber-bg video {
            object-position: right top;
            transform: scale(1.18);
            transform-origin: right top;
          }
          .cyber-bg {
            -webkit-mask-image: linear-gradient(180deg, #000 0% 40%, transparent 64%);
            mask-image: linear-gradient(180deg, #000 0% 40%, transparent 64%);
          }
          .cyber-scrim {
            display: block;
            background: linear-gradient(100deg, #000 26%, rgba(0,0,0,0.74) 50%, rgba(0,0,0,0.18) 76%, transparent 92%);
          }
        }

        @media (max-width: 599px) {
          .cyber-bg video, .cyber-bg2 video {
            object-position: 78% top;
          }
          .cyber-bg2 {
            display: block;
            -webkit-mask-image: linear-gradient(180deg, transparent 10%, #000 60%);
            mask-image: linear-gradient(180deg, transparent 10%, #000 60%);
          }
          .cyber-scrim {
            display: block;
            background: linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.50) 24%, rgba(0,0,0,0.86) 42%, #000 66%);
          }
        }

        /* Layout Frame */
        .cyber-frame {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          z-index: 10;
          pointer-events: none;
        }

        .cyber-frame > * {
          pointer-events: auto;
        }

        /* Spacers */
        .cyber-sp { flex-shrink: 0; }
        .cyber-sp-a { flex: 239; }
        .cyber-sp-b { flex: 194; }
        .cyber-sp-c { flex: 115; }

        @media (max-width: 1023px) and (max-aspect-ratio: 1/1) {
          .cyber-sp-a { flex: 340; }
          .cyber-sp-b { flex: 276; }
          .cyber-sp-c { flex: 163; }
        }

        @media (max-width: 599px) {
          .cyber-sp-a { flex: 106; }
          .cyber-sp-b { flex: 92; }
          .cyber-sp-c { flex: 56; }
        }

        /* Header */
        header.cyber-header {
          position: relative;
          width: 100%;
          height: calc(100 * var(--s));
          flex-shrink: 0;
        }

        .cyber-brand-lockup {
          position: absolute;
          left: calc(60 * var(--s));
          top: calc(28 * var(--s));
          display: flex;
          align-items: center;
          gap: calc(14 * var(--s));
          text-decoration: none;
          z-index: 12;
        }

        .cyber-logo-icon {
          width: calc(44 * var(--s));
          height: calc(44 * var(--s));
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cyber-logo-icon svg {
          width: 100%;
          height: 100%;
          display: block;
        }

        .cyber-brand-meta {
          display: flex;
          flex-direction: column;
        }

        .cyber-brand-title {
          font-family: 'SG', 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: calc(20 * var(--s));
          line-height: 1.1;
          color: #fff;
          display: flex;
          align-items: center;
          gap: calc(6 * var(--s));
        }

        .cyber-brand-tag {
          font-family: 'JB', 'JetBrains Mono', monospace;
          font-size: calc(11 * var(--s));
          padding: calc(1 * var(--s)) calc(5 * var(--s));
          background: #18181b;
          border: 1px solid #3f3f46;
          color: #d4d4d8;
        }

        .cyber-brand-sub {
          font-family: 'JB', 'JetBrains Mono', monospace;
          font-size: calc(11.5 * var(--s));
          color: var(--lab);
          margin-top: calc(2 * var(--s));
        }

        nav.cyber-nav {
          position: absolute;
          left: calc(520 * var(--s));
          top: calc(32 * var(--s));
          height: calc(58 * var(--s));
          display: flex;
          align-items: center;
          font-family: 'JB', 'JetBrains Mono', monospace;
          font-weight: 400;
          font-size: calc(18.5 * var(--s));
          color: #fff;
          z-index: 12;
        }

        nav.cyber-nav .cyber-nav-link {
          display: inline-flex;
          align-items: center;
          gap: calc(6 * var(--s));
          margin-right: calc(36 * var(--s));
          transition: color 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          white-space: nowrap;
          text-decoration: none;
          color: #e4e4e7;
        }

        nav.cyber-nav .cyber-nav-link:last-child {
          margin-right: 0;
        }

        nav.cyber-nav .cyber-nav-link.active {
          color: var(--red);
          font-weight: 500;
        }

        @media (hover: hover) {
          nav.cyber-nav .cyber-nav-link:hover {
            color: var(--red);
          }
        }

        /* Sharp Buttons */
        .cyber-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--red);
          color: #fff;
          font-family: 'SG', 'Space Grotesk', sans-serif;
          font-weight: 480;
          border-radius: 0;
          border: none;
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .cyber-btn .cyber-btn-label {
          font-size: calc(20.85 * var(--s));
          letter-spacing: calc(-0.62 * var(--s));
          transform: translateY(calc(1.5 * var(--s)));
        }

        .cyber-btn .cyber-btn-arrow {
          width: calc(21.5 * var(--s));
          height: calc(18 * var(--s));
          stroke: #fff;
          stroke-width: 2;
          fill: none;
          stroke-linecap: square;
          stroke-linejoin: miter;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @media (hover: hover) {
          .cyber-btn:hover {
            background: #b01617;
          }
          .cyber-btn:hover .cyber-btn-arrow {
            transform: translateX(calc(3 * var(--s)));
          }
        }

        .cyber-btn-top {
          position: absolute;
          left: calc(1232 * var(--s));
          top: calc(30 * var(--s));
          width: calc(212 * var(--s));
          height: calc(58 * var(--s));
          padding-left: calc(18 * var(--s));
          padding-right: calc(22 * var(--s));
          gap: calc(11 * var(--s));
          z-index: 12;
        }

        /* Burger */
        .cyber-burger {
          display: none;
          position: absolute;
          left: calc(var(--bx) * var(--s));
          top: calc(var(--by) * var(--s));
          width: calc(var(--bs) * var(--s));
          height: calc(var(--bs) * var(--s));
          z-index: 50;
          flex-direction: column;
          justify-content: center;
          gap: calc(7 * var(--s));
          cursor: pointer;
          background: none;
          border: none;
        }

        .cyber-burger span {
          display: block;
          height: calc(2.5 * var(--s));
          background: #fff;
          transform-origin: center;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease, width 0.25s ease;
        }

        .cyber-burger span:nth-child(1) { width: 100%; }
        .cyber-burger span:nth-child(2) { width: 100%; }
        .cyber-burger span:nth-child(3) { width: 47%; }

        .nav-open .cyber-burger span:nth-child(1) {
          transform: translateY(calc(9.5 * var(--s))) rotate(45deg);
        }
        .nav-open .cyber-burger span:nth-child(2) {
          opacity: 0;
        }
        .nav-open .cyber-burger span:nth-child(3) {
          width: 100%;
          transform: translateY(calc(-9.5 * var(--s))) rotate(-45deg);
        }

        @media (max-width: 1023px) {
          nav.cyber-nav { display: none; }
          .cyber-btn-top { display: none; }
          .cyber-burger { display: flex; }
        }

        /* Hero */
        section.cyber-hero {
          position: relative;
          width: 100%;
          min-height: calc(340 * var(--s));
          flex-shrink: 0;
        }

        h1.cyber-hero-title {
          position: absolute;
          left: calc(73 * var(--s));
          top: calc(var(--h1y) * var(--s));
          font-family: 'SG', 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: calc(68.7 * var(--s));
          line-height: calc(76 * var(--s));
          letter-spacing: calc(-2.4 * var(--s));
          color: #fff;
          text-transform: none;
        }

        h1.cyber-hero-title .ln {
          display: block;
          overflow: hidden;
          padding-bottom: calc(6 * var(--s));
          margin-bottom: calc(-6 * var(--s));
        }

        h1.cyber-hero-title .ln > span {
          display: block;
          will-change: transform;
        }

        p.cyber-hero-sub {
          position: absolute;
          left: calc(73 * var(--s));
          top: calc(var(--suby) * var(--s));
          font-family: 'JB', 'JetBrains Mono', monospace;
          font-weight: 400;
          font-size: calc(18.7 * var(--s));
          line-height: calc(26 * var(--s));
          letter-spacing: calc(-0.87 * var(--s));
          color: var(--sub);
          max-width: calc(600 * var(--s));
        }

        .cyber-btn-cta {
          position: absolute;
          left: calc(73 * var(--s));
          top: calc(248 * var(--s));
          width: calc(212 * var(--s));
          height: calc(58 * var(--s));
          padding-left: calc(18 * var(--s));
          padding-right: calc(22 * var(--s));
          gap: calc(11 * var(--s));
        }

        @media (max-width: 1023px) and (max-aspect-ratio: 1/1) {
          .cyber-btn-cta {
            width: calc(174 * var(--s));
            height: calc(47.6 * var(--s));
            padding-left: calc(14.8 * var(--s));
            padding-right: calc(18 * var(--s));
            gap: calc(9 * var(--s));
          }
          .cyber-btn-cta .cyber-btn-label {
            font-size: calc(17.1 * var(--s));
          }
        }

        @media (max-width: 599px) {
          .cyber-btn-cta {
            width: calc(185 * var(--s));
            height: calc(50 * var(--s));
            padding-left: calc(15.7 * var(--s));
            padding-right: calc(19.1 * var(--s));
            gap: calc(9.6 * var(--s));
          }
          .cyber-btn-cta .cyber-btn-label {
            font-size: calc(17.5 * var(--s));
          }
        }

        /* Stats */
        section.cyber-stats {
          position: relative;
          width: 100%;
          padding-left: calc(73 * var(--s));
          display: flex;
          align-items: center;
          gap: calc(36 * var(--s));
          flex-shrink: 0;
        }

        .cyber-stat-item {
          display: flex;
          flex-direction: column;
          gap: calc(8 * var(--s));
        }

        .cyber-stat-num {
          font-family: 'JB', 'JetBrains Mono', monospace;
          font-weight: 480;
          font-size: calc(33.45 * var(--s));
          line-height: 1;
          color: #fff;
          white-space: nowrap;
        }

        .cyber-stat-lab {
          font-family: 'SG', 'Space Grotesk', sans-serif;
          font-weight: 400;
          font-size: calc(19 * var(--s));
          line-height: 1.1;
          letter-spacing: calc(-0.5 * var(--s));
          color: var(--lab);
          white-space: nowrap;
        }

        .cyber-v-rule {
          width: calc(1.5 * var(--s));
          height: calc(64 * var(--s));
          background: linear-gradient(180deg, rgba(255,255,255,0.085), rgba(255,255,255,0.21) 50%, rgba(255,255,255,0.085));
          transform-origin: center;
          flex-shrink: 0;
        }

        @media (max-width: 1023px) and (max-aspect-ratio: 1/1) {
          section.cyber-stats {
            padding-left: calc(56 * var(--s));
            gap: calc(24 * var(--s));
          }
          .cyber-stat-num {
            font-size: calc(28 * var(--s));
          }
          .cyber-stat-lab {
            font-size: calc(16 * var(--s));
          }
          .cyber-v-rule {
            height: calc(52 * var(--s));
          }
        }

        @media (max-width: 599px) {
          section.cyber-stats {
            padding-left: calc(26 * var(--s));
            gap: calc(14 * var(--s));
          }
          .cyber-stat-item {
            gap: calc(5 * var(--s));
          }
          .cyber-stat-num {
            font-size: calc(19 * var(--s));
          }
          .cyber-stat-lab {
            font-size: calc(12 * var(--s));
          }
          .cyber-v-rule {
            height: calc(36 * var(--s));
          }
        }

        /* Mobile Menu */
        .cyber-menu {
          display: none;
          position: fixed;
          inset: 0;
          background: #000;
          z-index: 40;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .nav-open .cyber-menu {
          display: block;
          opacity: 1;
          pointer-events: auto;
        }

        .cyber-menu-tex {
          position: absolute;
          inset: 0;
          opacity: 0.4;
          pointer-events: none;
          overflow: hidden;
          -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 40%);
          mask-image: linear-gradient(180deg, transparent 0%, #000 40%);
        }

        .cyber-menu-tex video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cyber-menu-rule {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: var(--red);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.55s 0.04s cubic-bezier(0.2, 0.7, 0.2, 1);
        }

        .nav-open .cyber-menu-rule {
          transform: scaleX(1);
        }

        .cyber-menu-inner {
          position: relative;
          width: 100%;
          min-height: 100%;
          padding: calc(90 * var(--s)) calc(28 * var(--s)) calc(40 * var(--s));
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          z-index: 2;
        }

        .cyber-menu-eyebrow {
          font-family: 'JB', 'JetBrains Mono', monospace;
          font-size: 11.5px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--lab);
          margin-bottom: calc(24 * var(--s));
        }

        .cyber-menu-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: calc(18 * var(--s));
        }

        .cyber-mrow {
          font-family: 'SG', 'Space Grotesk', sans-serif;
          font-size: calc(32 * var(--s));
          font-weight: 700;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          cursor: pointer;
          padding: calc(6 * var(--s)) 0;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          text-decoration: none;
        }

        .cyber-mrow .m-chevron {
          width: 14px;
          height: 9px;
          stroke: #fff;
          stroke-width: 2;
          fill: none;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .m-acc.open .cyber-mrow .m-chevron {
          transform: rotate(180deg);
        }

        .cyber-m-sublist {
          display: none;
          list-style: none;
          padding: calc(12 * var(--s)) 0 calc(12 * var(--s)) calc(12 * var(--s));
          flex-direction: column;
          gap: calc(10 * var(--s));
        }

        .m-acc.open .cyber-m-sublist {
          display: flex;
        }

        .cyber-m-sublink {
          font-family: 'JB', 'JetBrains Mono', monospace;
          font-size: calc(16 * var(--s));
          color: var(--sub);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .cyber-menu-footer {
          margin-top: calc(40 * var(--s));
          display: flex;
          flex-direction: column;
          gap: calc(16 * var(--s));
        }

        .cyber-btn-menu {
          width: 100%;
          height: calc(52 * var(--s));
          padding: 0 calc(20 * var(--s));
          gap: calc(12 * var(--s));
        }

        .cyber-menu-note {
          font-family: 'JB', 'JetBrains Mono', monospace;
          font-size: calc(13 * var(--s));
          color: var(--lab);
          text-align: center;
        }

        /* Probe */
        #cyber-s-probe {
          position: absolute;
          visibility: hidden;
          pointer-events: none;
          width: calc(100 * var(--s));
          height: 0;
        }

        /* Initial Intro State */
        html.intro .cyber-brand-lockup,
        html.intro nav.cyber-nav .cyber-nav-link,
        html.intro .cyber-burger,
        html.intro p.cyber-hero-sub,
        html.intro .cyber-stat-num,
        html.intro .cyber-stat-lab {
          opacity: 0;
        }

        html.intro .cyber-brand-lockup {
          transform: scale(0.9);
        }

        html.intro nav.cyber-nav .cyber-nav-link {
          transform: translateY(calc(7 * var(--s)));
        }

        html.intro p.cyber-hero-sub {
          transform: translateY(calc(14 * var(--s)));
        }

        html.intro .cyber-stat-num {
          transform: translateY(calc(12 * var(--s)));
        }

        html.intro .cyber-stat-lab {
          transform: translateY(calc(10 * var(--s)));
        }

        html.intro .cyber-v-rule {
          transform: scaleY(0);
        }

        html.intro .cyber-btn-top,
        html.intro .cyber-btn-cta {
          clip-path: inset(0 100% 0 0);
        }

        html.intro h1.cyber-hero-title .ln > span {
          transform: translateY(120%);
        }
      `}</style>

      {/* Measurement Probe */}
      <div id="cyber-s-probe" ref={probeRef}></div>

      {/* Video Atmosphere: Layer 1 */}
      <div className="cyber-bg">
        <video
          ref={v1Ref}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_132544_b6ef0174-ed95-45ad-9a2f-ccb8acfbdce8.mp4"
        />
      </div>

      {/* Video Atmosphere: Layer 2 */}
      <div className="cyber-bg2">
        <video
          ref={v2Ref}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_132544_b6ef0174-ed95-45ad-9a2f-ccb8acfbdce8.mp4"
        />
      </div>

      {/* Scrim Overlay */}
      <div className="cyber-scrim"></div>

      {/* Primary Layout Frame */}
      <div className="cyber-frame">
        {/* Header */}
        <header className="cyber-header">
          {/* Inward 4-Chevron SVG Logo + Brand Lockup */}
          <Link href="/" className="cyber-brand-lockup" aria-label="Concord Home">
            <div className="cyber-logo-icon">
              <svg viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            <div className="cyber-brand-meta">
              <div className="cyber-brand-title">
                CONCORD
                <span className="cyber-brand-tag">v1.0</span>
              </div>
              <div className="cyber-brand-sub">Agent Order Verification API</div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="cyber-nav" aria-label="Primary Navigation">
            <Link href="/" className="cyber-nav-link active">Overview</Link>
            <Link href="/shop" className="cyber-nav-link">Demo Store</Link>
            <Link href="/console" className="cyber-nav-link">Merchant Console</Link>
            <Link href="/verify/demo" className="cyber-nav-link">Public Verifier</Link>
          </nav>

          {/* Mobile Burger Toggle */}
          <button
            className="cyber-burger"
            onClick={() => setNavOpen(!navOpen)}
            aria-label={navOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={navOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          {/* Top CTA */}
          <Link href="/shop" className="cyber-btn cyber-btn-top">
            <span className="cyber-btn-label">Secure system</span>
            <svg className="cyber-btn-arrow" viewBox="0 0 22 18">
              <path d="M0 9H20.1" />
              <path d="M12.1 1L20.1 9L12.1 17" />
            </svg>
          </Link>
        </header>

        {/* Spacer A */}
        <div className="cyber-sp cyber-sp-a"></div>

        {/* Hero Section */}
        <section className="cyber-hero">
          <h1 className="cyber-hero-title">
            <span className="ln"><span>Security built into</span></span>
            <span className="ln"><span>every system layer</span></span>
          </h1>

          <p className="cyber-hero-sub">
            Engineered to stay resilient, controlled,<br />
            and uncompromised under pressure.
          </p>

          <Link href="/shop" className="cyber-btn cyber-btn-cta">
            <span className="cyber-btn-label">Secure system</span>
            <svg className="cyber-btn-arrow" viewBox="0 0 22 18">
              <path d="M0 9H20.1" />
              <path d="M12.1 1L20.1 9L12.1 17" />
            </svg>
          </Link>
        </section>

        {/* Spacer B */}
        <div className="cyber-sp cyber-sp-b"></div>

        {/* Stats Matrix Section */}
        <section className="cyber-stats">
          {/* Stat 1 */}
          <div className="cyber-stat-item s1">
            <div className="cyber-stat-num">&lt;15ms</div>
            <div className="cyber-stat-lab">Deterministic Latency</div>
          </div>

          {/* Divider Rule 1 */}
          <div className="cyber-v-rule r1"></div>

          {/* Stat 2 */}
          <div className="cyber-stat-item s2">
            <div className="cyber-stat-num">94.2%</div>
            <div className="cyber-stat-lab">Intent Recall</div>
          </div>

          {/* Divider Rule 2 */}
          <div className="cyber-v-rule r2"></div>

          {/* Stat 3 */}
          <div className="cyber-stat-item s3">
            <div className="cyber-stat-num">100%</div>
            <div className="cyber-stat-lab">Ed25519 Verified</div>
          </div>
        </section>

        {/* Spacer C */}
        <div className="cyber-sp cyber-sp-c"></div>
      </div>

      {/* Mobile Menu Overlay */}
      <div id="menu" className="cyber-menu" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
        <div className="cyber-menu-tex">
          <video
            ref={v3Ref}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_132544_b6ef0174-ed95-45ad-9a2f-ccb8acfbdce8.mp4"
          />
        </div>

        <div className="cyber-menu-rule"></div>

        <div className="cyber-menu-inner">
          <div>
            <div className="cyber-menu-eyebrow">MENU</div>
            <ul className="cyber-menu-list">
              <li className="m-item">
                <Link href="/" className="cyber-mrow" onClick={() => setNavOpen(false)}>
                  Overview
                </Link>
              </li>
              <li className="m-item">
                <Link href="/shop" className="cyber-mrow" onClick={() => setNavOpen(false)}>
                  Demo Store
                </Link>
              </li>
              <li className="m-item">
                <Link href="/console" className="cyber-mrow" onClick={() => setNavOpen(false)}>
                  Merchant Console
                </Link>
              </li>
              <li className="m-item">
                <Link href="/verify/demo" className="cyber-mrow" onClick={() => setNavOpen(false)}>
                  Public Verifier
                </Link>
              </li>
            </ul>
          </div>

          <div className="cyber-menu-footer">
            <Link href="/shop" className="cyber-btn cyber-btn-menu" onClick={() => setNavOpen(false)}>
              <span className="cyber-btn-label">Secure system</span>
              <svg className="cyber-btn-arrow" viewBox="0 0 22 18">
                <path d="M0 9H20.1" />
                <path d="M12.1 1L20.1 9L12.1 17" />
              </svg>
            </Link>
            <div className="cyber-menu-note">&lt;15ms latency &nbsp;/&nbsp; 94.2% intent recall</div>
          </div>
        </div>
      </div>

      {/* SVG Filters */}
      <svg className="svgdefs" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
        <defs>
          <filter id="grade" colorInterpolationFilters="sRGB">
            <feComponentTransfer>
              <feFuncR type="table" tableValues="0.0018 0.0105 0.0154 0.0228 0.0307 0.0404 0.0485 0.0585 0.0719 0.0923 0.1205 0.1466 0.1657 0.1866 0.2197 0.2405 0.2485 0.2921 0.3362 0.3465 0.3472 0.3781 0.3781 0.4078 0.4199 0.4391 0.4604 0.4763 0.4798 0.5197 0.5473 0.5720 0.5995 0.6048 0.6232 0.6322 0.6483 0.6734 0.7201 0.7201 0.7410 0.7707 0.7707 0.7790 0.8084 0.8084 0.8390 0.8595 0.8707 0.8870 0.8993 0.9085 0.9132 0.9132 0.9162 0.9162 0.9162 0.9162 0.9162 0.9162 0.9162 0.9162 0.9162 0.9238 0.9300" />
              <feFuncG type="table" tableValues="0.0023 0.0106 0.0159 0.0250 0.0333 0.0445 0.0535 0.0620 0.0707 0.0827 0.0936 0.1063 0.1214 0.1402 0.1678 0.1727 0.2029 0.2176 0.2461 0.2757 0.2814 0.3050 0.3415 0.3692 0.3826 0.3884 0.4617 0.4617 0.4617 0.4643 0.4643 0.4808 0.5706 0.6005 0.6005 0.6390 0.6390 0.6390 0.6390 0.6390 0.6390 0.6390 0.6390 0.6390 0.6524 0.6664 0.6805 0.6945 0.7086 0.7227 0.7367 0.7508 0.7648 0.7789 0.7929 0.8070 0.8211 0.8351 0.8492 0.8632 0.8773 0.8913 0.9054 0.9195 0.9300" />
              <feFuncB type="table" tableValues="0.0021 0.0110 0.0187 0.0311 0.0377 0.0466 0.0584 0.0706 0.0791 0.0924 0.1039 0.1145 0.1316 0.1464 0.1614 0.1719 0.1887 0.2014 0.2247 0.2458 0.2954 0.2954 0.3089 0.3938 0.3938 0.3988 0.3988 0.4581 0.4581 0.4762 0.4762 0.4763 0.5374 0.5560 0.5813 0.5813 0.5813 0.5813 0.5835 0.5969 0.6104 0.6238 0.6373 0.6507 0.6642 0.6777 0.6911 0.7046 0.7181 0.7315 0.7449 0.7584 0.7719 0.7853 0.7988 0.8123 0.8257 0.8391 0.8526 0.8661 0.8795 0.8930 0.9065 0.9199 0.9300" />
            </feComponentTransfer>
          </filter>

          <filter id="grade2" colorInterpolationFilters="sRGB">
            <feComponentTransfer>
              <feFuncR type="table" tableValues="0.0016 0.0092 0.0136 0.0201 0.0270 0.0356 0.0427 0.0515 0.0633 0.0812 0.1060 0.1290 0.1458 0.1642 0.1933 0.2116 0.2187 0.2570 0.2959 0.3049 0.3055 0.3327 0.3327 0.3589 0.3695 0.3864 0.4052 0.4191 0.4222 0.4573 0.4816 0.5034 0.5276 0.5322 0.5484 0.5563 0.5705 0.5926 0.6337 0.6337 0.6521 0.6782 0.6782 0.6855 0.7114 0.7114 0.7383 0.7564 0.7662 0.7806 0.7914 0.7995 0.8036 0.8036 0.8063 0.8063 0.8063 0.8063 0.8063 0.8063 0.8063 0.8063 0.8063 0.8129 0.8184" />
              <feFuncG type="table" tableValues="0.0015 0.0069 0.0103 0.0163 0.0216 0.0289 0.0348 0.0403 0.0460 0.0538 0.0608 0.0691 0.0789 0.0911 0.1091 0.1123 0.1319 0.1414 0.1600 0.1792 0.1829 0.1983 0.2220 0.2400 0.2487 0.2525 0.3001 0.3001 0.3001 0.3018 0.3018 0.3125 0.3709 0.3903 0.3903 0.4153 0.4153 0.4153 0.4153 0.4153 0.4153 0.4153 0.4153 0.4153 0.4241 0.4332 0.4423 0.4514 0.4606 0.4698 0.4789 0.4880 0.4971 0.5063 0.5154 0.5246 0.5337 0.5428 0.5520 0.5611 0.5702 0.5793 0.5885 0.5977 0.6045" />
              <feFuncB type="table" tableValues="0.0013 0.0066 0.0112 0.0187 0.0226 0.0280 0.0350 0.0424 0.0475 0.0554 0.0623 0.0687 0.0790 0.0878 0.0968 0.1031 0.1132 0.1208 0.1348 0.1475 0.1772 0.1772 0.1853 0.2363 0.2363 0.2393 0.2393 0.2749 0.2749 0.2857 0.2857 0.2858 0.3224 0.3336 0.3488 0.3488 0.3488 0.3488 0.3501 0.3581 0.3662 0.3743 0.3824 0.3904 0.3985 0.4066 0.4147 0.4228 0.4309 0.4389 0.4469 0.4550 0.4631 0.4712 0.4793 0.4874 0.4954 0.5035 0.5116 0.5197 0.5277 0.5358 0.5439 0.5519 0.5580" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
    </div>
  );
}

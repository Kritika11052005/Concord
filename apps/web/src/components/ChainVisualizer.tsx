'use client';

import React, { useEffect, useRef } from 'react';

interface BlockNode {
  id: string;
  seq: number;
  hash: string;
  decision: 'pass' | 'step_up' | 'decline';
  x: number;
  y: number;
  targetX: number;
}

export function ChainVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = 240);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = 240;
    };
    window.addEventListener('resize', handleResize);

    const blocks: BlockNode[] = [
      { id: 'b1', seq: 101, hash: '7f9a...3b21', decision: 'pass', x: 80, y: 120, targetX: 80 },
      { id: 'b2', seq: 102, hash: 'c4e2...8a09', decision: 'pass', x: 260, y: 120, targetX: 260 },
      { id: 'b3', seq: 103, hash: '9b11...fa44', decision: 'step_up', x: 440, y: 120, targetX: 440 },
      { id: 'b4', seq: 104, hash: '3e05...1d7a', decision: 'decline', x: 620, y: 120, targetX: 620 },
      { id: 'b5', seq: 105, hash: 'a872...990c', decision: 'pass', x: 800, y: 120, targetX: 800 },
    ];

    let pulse = 0;

    const render = () => {
      pulse += 0.03;
      ctx.clearRect(0, 0, width, height);

      // Draw connecting hash chain lines
      for (let i = 0; i < blocks.length - 1; i++) {
        const b1 = blocks[i];
        const b2 = blocks[i + 1];

        const grad = ctx.createLinearGradient(b1.x, b1.y, b2.x, b2.y);
        grad.addColorStop(0, '#3b82f6');
        grad.addColorStop(1, '#8b5cf6');

        ctx.strokeStyle = grad;
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.lineDashOffset = -pulse * 10;

        ctx.beginPath();
        ctx.moveTo(b1.x + 65, b1.y);
        ctx.lineTo(b2.x - 65, b2.y);
        ctx.stroke();

        // Draw animated hash particle
        const t = (Math.sin(pulse + i) + 1) / 2;
        const px = b1.x + 65 + (b2.x - 65 - (b1.x + 65)) * t;
        const py = b1.y;

        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.setLineDash([]);

      // Draw Blocks
      blocks.forEach((b) => {
        const w = 130;
        const h = 80;
        const rx = b.x - w / 2;
        const ry = b.y - h / 2;

        // Card background
        ctx.fillStyle = '#0f141c';
        ctx.strokeStyle =
          b.decision === 'pass' ? '#10b981' : b.decision === 'step_up' ? '#f59e0b' : '#ef4444';
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.roundRect(rx, ry, w, h, 8);
        ctx.fill();
        ctx.stroke();

        // Sequence badge
        ctx.fillStyle = '#64748b';
        ctx.font = '10px ui-monospace, monospace';
        ctx.fillText(`SEQ #${b.seq}`, rx + 10, ry + 20);

        // Decision pill
        ctx.fillStyle =
          b.decision === 'pass' ? '#10b981' : b.decision === 'step_up' ? '#f59e0b' : '#ef4444';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(b.decision.toUpperCase(), rx + 10, ry + 42);

        // Hash
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px ui-monospace, monospace';
        ctx.fillText(`SHA: ${b.hash}`, rx + 10, ry + 62);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="w-full relative overflow-hidden rounded-xl border border-slate-800 bg-[#090d14]/80 p-4 backdrop-blur">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono text-slate-400">
            CRYPTOGRAPHIC PROVENANCE LEDGER · ED25519 HASH CHAIN
          </span>
        </div>
        <span className="text-[11px] font-mono text-blue-400">Zero Forks · Lock Synchronized</span>
      </div>
      <canvas ref={canvasRef} className="w-full h-[240px] block" />
    </div>
  );
}

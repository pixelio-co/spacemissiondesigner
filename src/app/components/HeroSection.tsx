'use client';

import React, { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { Rocket, BookOpen, HelpCircle, ChevronDown } from 'lucide-react';

interface Star {
  x: number;
  y: number;
  r: number;
  alpha: number;
  speed: number;
}

interface Planet {
  x: number;
  y: number;
  r: number;
  color: string;
  orbitR: number;
  angle: number;
  speed: number;
  label: string;
}

export default function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const starsRef = useRef<Star[]>([]);
  const planetsRef = useRef<Planet[]>([]);
  const craftAngleRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initStars();
    };

    const initStars = () => {
      starsRef.current = Array.from({ length: 200 }, (_, i) => ({
        x: (i * 137.5) % canvas.width,
        y: (i * 97.3) % canvas.height,
        r: 0.3 + (i % 5) * 0.3,
        alpha: 0.3 + (i % 7) * 0.1,
        speed: 0.001 + (i % 3) * 0.0005,
      }));

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      planetsRef.current = [
        { x: cx, y: cy, r: 28, color: '#3b82f6', orbitR: 0, angle: 0, speed: 0, label: 'Earth' },
        { x: cx, y: cy, r: 8, color: '#94a3b8', orbitR: 70, angle: 0.5, speed: 0.008, label: 'Moon' },
        { x: cx, y: cy, r: 14, color: '#ef4444', orbitR: 160, angle: 1.2, speed: 0.004, label: 'Mars' },
        { x: cx, y: cy, r: 22, color: '#f97316', orbitR: 260, angle: 2.5, speed: 0.002, label: 'Jupiter' },
        { x: cx, y: cy, r: 18, color: '#eab308', orbitR: 360, angle: 4.0, speed: 0.0012, label: 'Saturn' },
      ];
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Stars
      starsRef.current.forEach((star, i) => {
        star.alpha = 0.3 + Math.abs(Math.sin(Date.now() * star.speed + i)) * 0.7;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(226, 232, 240, ${star.alpha})`;
        ctx.fill();
      });

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Orbital paths
      planetsRef.current.forEach(planet => {
        if (planet.orbitR === 0) return;
        ctx.beginPath();
        ctx.arc(cx, cy, planet.orbitR, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(30, 58, 95, 0.6)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Planets
      planetsRef.current.forEach(planet => {
        const t = Date.now();
        const px = planet.orbitR === 0 ? cx : cx + Math.cos(planet.angle + t * planet.speed) * planet.orbitR;
        const py = planet.orbitR === 0 ? cy : cy + Math.sin(planet.angle + t * planet.speed) * planet.orbitR * 0.3;

        // Glow
        if (planet.label === 'Earth') {
          const grd = ctx.createRadialGradient(px, py, 0, px, py, planet.r * 2.5);
          grd.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
          grd.addColorStop(1, 'rgba(59, 130, 246, 0)');
          ctx.beginPath();
          ctx.arc(px, py, planet.r * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
        }

        const grd2 = ctx.createRadialGradient(px - planet.r * 0.3, py - planet.r * 0.3, planet.r * 0.1, px, py, planet.r);
        grd2.addColorStop(0, lightenColor(planet.color));
        grd2.addColorStop(1, planet.color);
        ctx.beginPath();
        ctx.arc(px, py, planet.r, 0, Math.PI * 2);
        ctx.fillStyle = grd2;
        ctx.fill();

        // Saturn rings
        if (planet.label === 'Saturn') {
          ctx.beginPath();
          ctx.ellipse(px, py, planet.r * 1.8, planet.r * 0.4, 0, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(234, 179, 8, 0.5)';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      });

      // Spacecraft (small probe traveling orbit)
      craftAngleRef.current += 0.012;
      const craftOrbitR = 110;
      const craftX = cx + Math.cos(craftAngleRef.current) * craftOrbitR;
      const craftY = cy + Math.sin(craftAngleRef.current) * craftOrbitR * 0.3;

      // Engine trail
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const ta = craftAngleRef.current - i * 0.05;
        const tx = cx + Math.cos(ta) * craftOrbitR;
        const ty = cy + Math.sin(ta) * craftOrbitR * 0.3;
        ctx.lineTo(tx, ty);
      }
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Spacecraft body
      ctx.save();
      ctx.translate(craftX, craftY);
      ctx.rotate(craftAngleRef.current + Math.PI / 2);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-4, -6, 8, 12);
      ctx.fillStyle = '#1d6ef5';
      ctx.fillRect(-10, -2, 6, 4);
      ctx.fillRect(4, -2, 6, 4);
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Space canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background/90 pointer-events-none" />

      {/* Hero content */}
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto pt-24 pb-16">
        <div className="badge badge-info mb-6 inline-flex mx-auto">
          <Rocket size={10} />
          NASA Space Apps Challenge 2026
        </div>

        <h1 className="text-hero-xl gradient-text-primary mb-4 leading-tight">
          ꜱᴘᴀᴄᴇ ᴍɪꜱꜱɪᴏɴ
          <br />
          ᴅᴇꜱɪɢɴᴇʀ
        </h1>

        <p className="text-hero-sm text-muted-foreground mb-4 font-mono tracking-widest uppercase">
          Design. Plan. Explore.
        </p>

        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Build your spacecraft, choose your mission, explore the Solar System, and discover
          whether your decisions can lead your mission to success.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/mission-designer" className="btn-accent text-base px-8 py-3">
            <Rocket size={18} />
            Start Mission
          </Link>
          <Link href="#learn-section" className="btn-secondary text-base px-8 py-3">
            <BookOpen size={18} />
            Learn
          </Link>
          <Link href="#how-it-works" className="btn-secondary text-base px-8 py-3">
            <HelpCircle size={18} />
            How It Works
          </Link>
        </div>

        <div className="mt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground">
          {[
            { value: '10', label: 'Destinations' },
            { value: '10', label: 'Scenarios' },
            { value: '6', label: 'Spacecraft Types' },
            { value: '9', label: 'Instruments' },
          ].map((stat) => (
            <div key={`hero-stat-${stat.label}`} className="text-center">
              <div className="text-2xl font-bold font-mono text-primary">{stat.value}</div>
              <div className="text-xs uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown size={24} className="text-muted-foreground" />
      </div>
    </section>
  );
}

function lightenColor(hex: string): string {
  const map: Record<string, string> = {
    '#3b82f6': '#93c5fd',
    '#94a3b8': '#cbd5e1',
    '#ef4444': '#fca5a5',
    '#f97316': '#fdba74',
    '#eab308': '#fde047',
  };
  return map[hex] ?? '#fff';
}
'use client';

import React from 'react';
import Link from 'next/link';
import { SPACE_DATA_SOURCES, REFERENCE_MISSIONS, ASTEROID_REFERENCE } from '@/lib/spaceData';
import {
  Rocket, Database, ExternalLink, Info, Target, Repeat, GitCompare, FlaskConical, Dna,
} from 'lucide-react';

const FLOW = [
  { step: 'DESIGN', desc: 'Build your mission step by step with explanations at every choice.' },
  { step: 'UNDERSTAND', desc: 'Mission DNA shows your trade-off profile with transparent rules.' },
  { step: 'COMPARE', desc: 'The What-If Lab tests one alternative and shows gains AND losses.' },
  { step: 'LAUNCH', desc: 'Fly the mission with real light-time delays and config-driven events.' },
  { step: 'OPERATE', desc: 'Respond to challenges; choose autonomous behaviors during comm gaps.' },
  { step: 'DISCOVER', desc: 'Your instruments determine which science is possible — nothing is guaranteed.' },
  { step: 'ANALYZE', desc: 'Science Return quantifies what your mission achieved, with reasons.' },
  { step: 'LEARN', desc: 'The Failure Investigator explains what happened without blame.' },
  { step: 'REPLAY', desc: 'Change one decision and compare — that is the whole point.' },
];

export default function AboutClient() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-10">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="badge badge-info mb-4 inline-flex mx-auto">About</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
          A Miniature Mission-Design Laboratory
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          ꜱᴘᴀᴄᴇ ᴍɪꜱꜱɪᴏɴ ᴅᴇꜱɪɢɴᴇʀ is an independent educational project built for the NASA Space
          Apps Challenge 2026. Its core idea: space missions are systems of interconnected
          decisions — and understanding those connections is the real mission.
        </p>
      </div>

      {/* Experience flow */}
      <div className="space-card p-6 mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
          <Target size={14} className="text-primary" />
          The experience
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {FLOW.map((f, i) => (
            <div key={`flow-${f.step}`} className="p-3 rounded-lg bg-muted/20 border border-border">
              <div className="text-xs font-bold font-mono text-primary mb-1">
                {String(i + 1).padStart(2, '0')} · {f.step}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Core features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {[
          { icon: Dna, title: 'Mission DNA', text: 'A trade-off profile of your design — scientific value, power efficiency, communication reliability, complexity, risk, and exploration capability — each explained by the rules that produced it.' },
          { icon: GitCompare, title: 'What-If Lab', text: 'Take your current mission and test one alternative at a time. The comparison shows objective trade-offs — never a declared winner.' },
          { icon: Repeat, title: 'Replay', text: 'After a mission, change exactly one major decision and re-fly. The original-vs-replay comparison shows that decision\u2019s true effect.' },
          { icon: FlaskConical, title: 'Science Return', text: 'Observations, findings, and data returned are based on what actually happened during flight — driven by the instruments you selected.' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="space-card p-5">
              <div className="flex items-center gap-2.5 mb-2">
                <Icon size={16} className="text-accent" />
                <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
            </div>
          );
        })}
      </div>

      {/* DATA SOURCES */}
      <div className="space-card p-6 mb-8 border-info/30 border">
        <div className="flex items-center gap-2 mb-2">
          <Database size={18} className="text-info" />
          <h2 className="text-base font-bold text-foreground">Data Sources</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
          Every external dataset used by this application is listed here with what it is used for.
          Simple physics (like light-time) is computed from verified data; teaching models are
          labelled as such. This project never implies NASA endorsement.
        </p>
        <div className="space-y-3">
          {SPACE_DATA_SOURCES.map(src => (
            <div key={src.id} className="p-4 rounded-lg bg-muted/20 border border-border">
              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="badge badge-info text-[9px]">{src.provider}</span>
                  <span className="text-xs font-semibold text-foreground">{src.dataset}</span>
                </div>
                <span className={`badge text-[8px] ${src.nature === 'educational estimate' ? 'badge-warning' : src.nature === 'computed from verified data' ? 'badge-success' : 'badge-neutral'}`}>
                  {src.nature}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-1.5">
                <span className="text-info font-semibold">Used for: </span>{src.usedFor}
              </p>
              {src.sourceUrl && (
                <a
                  href={src.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-primary hover:text-primary/80 inline-flex items-center gap-1"
                >
                  <ExternalLink size={10} />
                  {src.sourceUrl.replace('https://', '').replace('http://', '')}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Real missions referenced */}
      <div className="space-card p-6 mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Real missions referenced in the app
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {REFERENCE_MISSIONS.map(m => (
            <div key={m.id} className="p-3 rounded-lg bg-muted/20 border border-border">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-bold text-foreground">{m.name}</span>
                <span className="badge badge-neutral text-[8px]">{m.launchYear}</span>
              </div>
              <div className="text-[10px] text-muted-foreground mb-1">{m.destinationLabel} · {m.power}</div>
              <p className="text-[11px] text-muted-foreground leading-snug">{m.lesson}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Asteroid reference */}
      <div className="space-card p-6 mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Asteroid reference data (JPL Small-Body Database snapshots)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ASTEROID_REFERENCE.map(a => (
            <div key={a.id} className="p-3 rounded-lg bg-muted/20 border border-border">
              <div className="text-xs font-bold text-foreground mb-0.5">{a.name}</div>
              <div className="text-[10px] text-muted-foreground mb-1">{a.class} · {a.meanDiameterKm} km · {a.au} AU</div>
              <p className="text-[11px] text-muted-foreground leading-snug">{a.note}</p>
              <p className="text-[10px] text-info/80 mt-1">Visited by: {a.visitedBy}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="p-4 rounded-lg bg-warning/5 border border-warning/25 mb-8 flex items-start gap-3">
        <Info size={16} className="text-warning mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm text-foreground font-medium mb-1">
            This is an independent educational project inspired by real space mission concepts.
            It is not an official NASA website, application, or engineering tool.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            NASA data is used from public datasets with attribution. Mission scores, probabilities,
            and outcomes are simplified teaching models — never professional engineering calculations.
          </p>
        </div>
      </div>

      {/* Credits */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-1">
          Built by <span className="text-accent font-semibold">Ralph Sean</span> for{' '}
          <span className="text-foreground font-medium">NASA Space Apps Challenge 2026</span>
        </p>
        <Link href="/mission-designer" className="btn-accent text-sm px-6 py-2.5 mt-4 inline-flex">
          <Rocket size={16} />
          Start Designing
        </Link>
      </div>
    </div>
  );
}

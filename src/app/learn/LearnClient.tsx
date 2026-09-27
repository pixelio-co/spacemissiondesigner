'use client';

/**
 * LearnClient — the "What Did You Learn?" page.
 *
 * Section 1 (EARNED LESSONS): lessons written by completed missions
 * (missionArchive → loadLearnedLessons). Each links back to the concept
 * section that explains it. Empty state guides users to fly a mission.
 *
 * Section 2 (CONCEPT LIBRARY): permanent educational content for every
 * anchor the app already links to (power, communication, autonomy,
 * instruments, destinations, trade-offs, missions).
 *
 * Section 3 (REAL MISSIONS): the REAL_MISSIONS dataset from spaceData.ts —
 * real NASA/ESA mission architectures for comparison. Previously defined
 * but never displayed anywhere.
 *
 * Educational content only — not an official NASA resource.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen, Rocket, Zap, Radio, Bot, FlaskConical, Globe2, Scale, Satellite,
  ExternalLink, ChevronDown, ChevronRight, Lightbulb, Target,
} from 'lucide-react';
import { loadLearnedLessons, type LearnedLesson } from '@/lib/missionArchive';
import { REAL_MISSIONS, DATA_NOTE } from '@/lib/spaceData';
import { useHydrated } from '@/lib/useHydrated';

// ── Concept library content ─────────────────────────────────────────────────
// Keys must match the anchors used by buildLessons() in simulationEngine.ts
// (/learn#power, /learn#communication, /learn#autonomy, /learn#instruments,
//  /learn#destinations, /learn#missions) and missionData lessons
// (/learn#trade-offs). Note: result-screen lessons also emit legacy anchors
// (#power, #communication, #propulsion, #trade-offs, #missions) — those fall
// through to page top, which is acceptable.

interface ConceptSection {
  id: string;
  icon: React.ElementType;
  title: string;
  intro: string;
  points: { label: string; text: string }[];
}

const CONCEPTS: ConceptSection[] = [
  {
    id: 'power',
    icon: Zap,
    title: 'Power Systems',
    intro: 'Every watt a spacecraft uses must be generated somewhere: sunlight, radioactive decay, or a combination.',
    points: [
      { label: 'Solar', text: 'Clean and scalable, but output falls with the square of distance from the Sun — at Saturn it is roughly 1% of Earth levels, which is why Cassini needed nuclear power and Juno needed basketball-court-sized arrays.' },
      { label: 'RPS / RTG', text: 'Radioisotope power converts heat from plutonium-238 decay into electricity. It works day and night, near or far, but delivers limited total power and has a finite life.' },
      { label: 'Hybrid', text: 'Solar plus batteries or an RPS unit adds redundancy for eclipses, nights, and dust — at the cost of mass, complexity, and more failure points.' },
      { label: 'Budgets', text: 'Instruments, heaters, computers, and transmitters all draw from the same finite supply. Duty-cycling instruments is a real operational technique, not a failure.' },
    ],
  },
  {
    id: 'communication',
    icon: Radio,
    title: 'Communication',
    intro: 'A spacecraft that cannot talk to Earth cannot deliver its discoveries — and signal strength falls with the square of distance.',
    points: [
      { label: 'Antenna classes', text: 'Low-gain omnidirectional antennas work at any orientation but carry only kilobits; high-gain dishes concentrate signal for megabit-class rates; deep-space systems add power and redundancy for the full solar system.' },
      { label: 'Light-time', text: 'Radio signals travel at light speed, yet Mars is 3–22 minutes away one-way and Neptune over 4 hours. No link is ever "real-time" beyond the Moon.' },
      { label: 'Data return', text: 'Science return is capped by the data-rate class of your downlink. A brilliant instrument suite behind a weak antenna returns only a fraction of its data.' },
      { label: 'The DSN', text: "NASA's Deep Space Network — giant dishes in California, Spain, and Australia — is the ground segment that makes interplanetary communication possible." },
    ],
  },
  {
    id: 'autonomy',
    icon: Bot,
    title: 'Autonomy & Safe Mode',
    intro: 'When Earth is minutes-to-hours away, the spacecraft must protect itself without asking.',
    points: [
      { label: 'Safe mode', text: 'Star-point, shut down science, protect resources. Survival first, science second — exactly what real spacecraft do when uncertain.' },
      { label: 'Autonomous science', text: 'Continuing observations during comm loss is a calculated risk: data accumulates onboard, and the payoff can be large if the spacecraft stays healthy.' },
      { label: 'The dilemma', text: 'There is no universally right answer — missions pre-plan contingency behaviors because designers know the question will come.' },
    ],
  },
  {
    id: 'instruments',
    icon: FlaskConical,
    title: 'Instruments Drive Discovery',
    intro: 'Instruments are the spacecraft\'s senses: each turns a physical phenomenon into data we can study.',
    points: [
      { label: 'Capability gates', text: 'A camera images surfaces; only a spectrometer identifies composition; only a radar sees beneath them; only a seismometer feels quakes. No instrument, no discovery of that class.' },
      { label: 'Match to goal', text: 'Search-for-life objectives lean on spectrometers; ocean-world questions need radar; magnetic-field science needs a magnetometer on a boom.' },
      { label: 'Focus vs. stuffing', text: 'Beyond roughly five instruments, added capability stops growing proportionally while mass, power, and complexity keep rising. Real missions famously debate this trade.' },
    ],
  },
  {
    id: 'destinations',
    icon: Globe2,
    title: 'Destination Conditions',
    intro: 'Distance from the Sun controls power; distance from Earth controls communication. These constraints cannot be waived by engineering.',
    points: [
      { label: 'Inner system', text: 'Abundant sunlight and short light-times, but heat near Mercury and dust storms on Mars.' },
      { label: 'Outer system', text: 'Jupiter\'s radiation belts are the most severe in the solar system; Saturn and beyond demand nuclear power.' },
      { label: 'Surface worlds', text: 'Venus crushes landers with 92-bar pressure and 464 °C; the Moon swings from −173 °C to +127 °C.' },
      { label: 'Airless rocks', text: 'Asteroids have microgravity and no shielding — landing and long exposure are the challenges.' },
    ],
  },
  {
    id: 'trade-offs',
    icon: Scale,
    title: 'Mission Trade-offs',
    intro: 'Every design decision buys something and pays for it. That balance is the skill of mission design.',
    points: [
      { label: 'Capability vs. mass', text: 'More instruments mean more science potential but more mass, power draw, and complexity.' },
      { label: 'Speed vs. efficiency', text: 'Chemical propulsion is fast but fuel-hungry; ion drives are 10× more efficient but take months. Distance decides.' },
      { label: 'Reach vs. reliability', text: 'The most ambitious destinations cost the longest cruise times and the weakest links home.' },
    ],
  },
  {
    id: 'missions',
    icon: Satellite,
    title: 'Mission Planning',
    intro: 'Real missions start with a science question, then size every system to answer it within real constraints.',
    points: [
      { label: 'Question first', text: 'The Decadal Survey ranks science questions before hardware — the same order your mission designer follows (objective → destination → spacecraft → systems).' },
      { label: 'Margin', text: 'Failures are usually systemic: a configuration that leaves no margin for the unexpected. Add margin in one system rather than maximizing every capability.' },
      { label: 'Operations', text: 'Missions are flown, not just designed — duty-cycling, safe modes, and partial corrections are normal operations, not failures.' },
    ],
  },
];

export default function LearnClient() {
  const hydrated = useHydrated();
  const [lessons, setLessons] = useState<LearnedLesson[]>([]);
  const [openConcept, setOpenConcept] = useState<string | null>('power');

  useEffect(() => {
    setLessons(loadLearnedLessons());
  }, []);

  // Deep links (/learn#power etc.) open the matching concept section.
  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
    if (hash && CONCEPTS.some(c => c.id === hash)) {
      setOpenConcept(hash);
    }
  }, []);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <BookOpen size={22} className="text-info" />
          <h1 className="text-2xl font-bold text-foreground">What Did You Learn?</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Lessons earned from your own missions, followed by the core concepts behind every
          mission-design decision — grounded in real NASA data and mission history.
        </p>
      </div>

      {/* ── Earned lessons ── */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Earned from your missions
        </h2>
        {!hydrated ? (
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        ) : lessons.length === 0 ? (
          <div className="space-card p-8 max-w-xl text-center border-warning/25">
            <Rocket size={32} className="text-warning mx-auto mb-3" />
            <p className="text-sm text-foreground font-medium mb-1">No lessons earned yet</p>
            <p className="text-xs text-muted-foreground mb-5">
              Design and fly a mission — your report will write personalized lessons here.
            </p>
            <Link href="/mission-designer" className="btn-accent inline-flex items-center gap-2">
              <Rocket size={14} />
              Design a Mission
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {lessons.map(l => (
              <div key={l.id} className="space-card p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-info uppercase tracking-wider">{l.concept}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {l.missionName || 'Mission Alpha'} · {new Date(l.earnedAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-foreground leading-relaxed mb-2">{l.lesson}</p>
                <Link
                  href={l.learnHref}
                  className="text-[11px] text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1"
                >
                  <ChevronRight size={10} />
                  Explore this concept
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Concept library ── */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Core concepts
        </h2>
        <div className="space-y-3">
          {CONCEPTS.map(section => {
            const Icon = section.icon;
            const open = openConcept === section.id;
            return (
              <div key={section.id} id={section.id} className="space-card overflow-hidden scroll-mt-20">
                <button
                  type="button"
                  onClick={() => setOpenConcept(open ? null : section.id)}
                  className="flex items-center gap-3 w-full p-4 text-left hover:bg-muted/30 transition-colors"
                  aria-expanded={open}
                >
                  <Icon size={16} className="text-primary flex-shrink-0" />
                  <span className="text-sm font-bold text-foreground flex-1">{section.title}</span>
                  <ChevronDown
                    size={16}
                    className={`text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                  />
                </button>
                {open && (
                  <div className="px-4 pb-4 animate-fadeIn">
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">{section.intro}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {section.points.map(p => (
                        <div key={p.label} className="p-3 rounded-lg bg-muted/40 border border-border">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">{p.label}</div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{p.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Real missions comparison ── */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Real missions to compare with
        </h2>
        <p className="text-xs text-muted-foreground mb-3 max-w-3xl">
          How did real mission designers solve the same trade-offs you faced? Each entry shows the
          target, spacecraft class, power, and propulsion choices — and what made the design special.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {REAL_MISSIONS.map(m => (
            <div key={m.name} className="space-card p-4">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="text-sm font-bold text-foreground">{m.name}</span>
                <span className="badge badge-neutral text-[9px] flex-shrink-0">{m.years}</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-mono mb-2">
                {m.agency} · {m.target}
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                <span className="badge badge-info text-[9px] normal-case">{m.craftType}</span>
                <span className="badge badge-success text-[9px] normal-case">{m.power}</span>
                <span className="badge badge-warning text-[9px] normal-case">{m.propulsion}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{m.highlight}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer notes */}
      <div className="space-y-3">
        <div className="space-card p-4 border-accent/25 flex items-start gap-2">
          <Target size={14} className="text-accent mt-0.5 flex-shrink-0" />
          <p className="text-xs text-foreground leading-relaxed">
            <strong>Try it yourself:</strong> after reading a concept, open the{' '}
            <Link href="/what-if-lab" className="text-primary hover:underline">What-If Lab</Link> to
            test the trade-off on your own mission, or{' '}
            <Link href="/replay" className="text-primary hover:underline">Replay</Link> a completed
            mission with a different decision.
          </p>
        </div>
        <div className="space-card p-4 flex items-start gap-2">
          <Lightbulb size={14} className="text-warning mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">{DATA_NOTE}</p>
        </div>
        <div className="text-center pt-2">
          <p className="text-[11px] text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Educational content for an independent student project — see{' '}
            <Link href="/about" className="text-primary hover:underline inline-flex items-center gap-1">
              Data Sources <ExternalLink size={9} />
            </Link>{' '}
            for the NASA datasets behind these concepts.
          </p>
        </div>
      </div>
    </div>
  );
}

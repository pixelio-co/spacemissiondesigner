'use client';

import React from 'react';
import Link from 'next/link';
import {
  Zap, Radio, Scale, Shield, Fuel, Rocket, ArrowRight, Lightbulb,
} from 'lucide-react';

interface ConceptSection {
  id: string;
  icon: React.ElementType;
  title: string;
  intro: string;
  points: { heading: string; text: string }[];
  realMission: string;
  takeaway: string;
}

const CONCEPTS: ConceptSection[] = [
  {
    id: 'power',
    icon: Zap,
    title: 'Power Systems',
    intro: 'Every spacecraft is a power budget in motion. Science instruments, heaters, radios, and computers all draw from the same limited supply.',
    points: [
      { heading: 'Solar power follows the inverse-square law', text: 'Light spreads out as it travels, so a panel at 5.2 AU (Jupiter) receives only ~3.7% of the sunlight it would at Earth. At Saturn it is ~1%; at Neptune, ~0.11%.' },
      { heading: 'Radioisotope power works anywhere', text: 'RPS units convert heat from decaying plutonium-238 into electricity. Output barely changes with distance — which is why every mission beyond Jupiter has used them.' },
      { heading: 'A power budget is a science budget', text: 'When demand approaches supply, missions must duty-cycle instruments — running some only during key windows.' },
    ],
    realMission: 'Juno reached Jupiter on solar power — but needed three school-bus-sized arrays and a special orbit that keeps them in sunlight. Cassini at Saturn used RTGs instead.',
    takeaway: 'Match your power source to your destination\u2019s sunlight, then make sure your instruments fit inside it.',
  },
  {
    id: 'communication',
    icon: Radio,
    title: 'Communication & Signal Delay',
    intro: 'Radio signals travel at the speed of light — and interplanetary distances are so vast that even light takes minutes to hours.',
    points: [
      { heading: 'Delay = distance ÷ 299,792 km/s', text: 'The Moon is ~1.3 seconds away. Mars ranges 3–22 minutes. Neptune is more than 4 hours. No technology can beat this — it is a law of physics.' },
      { heading: 'Antennas trade coverage for bandwidth', text: 'Low-gain antennas point everywhere and carry almost nothing; high-gain dishes concentrate power into a tight beam that must be pointed precisely at Earth.' },
      { heading: 'Autonomy fills the gaps', text: 'Because ground control cannot react in real time, spacecraft pre-plan their own behavior for out-of-contact periods.' },
    ],
    realMission: 'Perseverance drives itself between command uploads. New Horizons\u2019 Pluto flyby was fully autonomous — the encounter geometry left no time to wait for Earth\u2019s advice.',
    takeaway: 'The farther your destination, the more your spacecraft must think for itself.',
  },
  {
    id: 'trade-offs',
    icon: Scale,
    title: 'Mission Trade-offs',
    intro: 'Mission design is the art of balancing competing demands under strict limits: mass, power, money, and time.',
    points: [
      { heading: 'More instruments ≠ more mission', text: 'Each instrument adds scientific capability — and also mass, power draw, data volume, pointing conflicts, and failure modes.' },
      { heading: 'Every kilogram competes', text: 'Launch capacity is finite. Instrument mass competes with propellant, power hardware, and shielding.' },
      { heading: 'Objective trade-offs are explicit', text: 'Real missions rank objectives before launch so that, when something must give, the decision is already made calmly on the ground.' },
    ],
    realMission: 'The Voyager spacecraft carried only about 10 instruments — but each was chosen so the total suite could answer the big questions with minimal mass.',
    takeaway: 'The best payload is not the biggest one — it is the one whose parts support each other.',
  },
  {
    id: 'redundancy',
    icon: Shield,
    title: 'Redundancy & Margin',
    intro: 'Space cannot be repaired. Missions survive by carrying spare capability and by sizing systems for more than the expected worst case.',
    points: [
      { heading: 'Redundancy: two of everything critical', text: 'Critical electronics often fly in pairs or more — if one string fails, the other takes over.' },
      { heading: 'Margin: the quiet hero', text: 'A system sized exactly to the plan has nothing left for reality. Margin absorbs surprises without ending the mission.' },
      { heading: 'Graceful degradation', text: 'Well-designed missions lose capability gradually, not suddenly — dropping to a smaller science plan instead of dying.' },
    ],
    realMission: 'Cassini survived multiple safe-mode entries and a stuck steer-once mode; its team re-planned science around the failure and kept discovering for 13 years.',
    takeaway: 'Reserves are not waste — they are the difference between a problem and a mission-ending anomaly.',
  },
  {
    id: 'propulsion',
    icon: Fuel,
    title: 'Propulsion & Reach',
    intro: 'How fast and how far a spacecraft can go is set by the rocket equation — a hard limit that shapes every trajectory.',
    points: [
      { heading: 'Chemical: strong but thirsty', text: 'High thrust is essential for launch and orbit insertion, but chemical fuel runs out quickly. Distances beyond Mars strain chemical-only designs.' },
      { heading: 'Electric: slow but efficient', text: 'Ion and hall-effect thrusters produce gentle thrust for months or years, reaching ~10× the efficiency — ideal for deep space when time allows.' },
      { heading: 'Gravity assists: borrowed momentum', text: 'Flying past a planet at just the right angle steals a tiny slice of its orbital energy. Voyager 2 used four assists in a alignment that recurs every 175 years.' },
    ],
    realMission: 'Dawn\u2019s ion drive let it orbit Vesta AND Ceres — two worlds, one spacecraft. On chemical fuel, the trip was physically impossible.',
    takeaway: 'Match propulsion to the journey: thrust for arrival, efficiency for distance.',
  },
  {
    id: 'missions',
    icon: Rocket,
    title: 'Systems Thinking',
    intro: 'A spacecraft is not a collection of parts — it is a web of interacting decisions. Change one, and the others feel it.',
    points: [
      { heading: 'Everything couples', text: 'Instruments draw power; power suits the destination; the destination sets light-time; light-time demands autonomy; autonomy needs power… every choice echoes.' },
      { heading: 'Failures cascade', text: 'When a design has thin margins in several places, one anomaly can trigger another. That is why the simulator treats multi-system failures differently.' },
      { heading: 'Mission design is iterative', text: 'Real teams design, simulate, find the weakness, and redesign — exactly the loop this app invites you into with What-If and Replay.' },
    ],
    realMission: 'Europa Clipper\u2019s design was reshaped repeatedly by one fact — Jupiter\u2019s radiation — affecting orbit, shielding, electronics, and even instrument sequencing.',
    takeaway: 'To understand a mission, trace how its decisions connect — not just what they are.',
  },
];

export default function LearnClient() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-10">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="badge badge-info mb-4 inline-flex mx-auto">Learn</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
          The Science Behind the Simulation
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Each concept below connects directly to what you experienced — or will experience — in
          your missions. Real examples come from public NASA mission archives.
        </p>
      </div>

      {/* Quick navigation */}
      <div className="flex flex-wrap justify-center gap-2 mb-12">
        {CONCEPTS.map(c => (
          <a
            key={`nav-${c.id}`}
            href={`#${c.id}`}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/40 border border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
          >
            {c.title}
          </a>
        ))}
      </div>

      {/* Concept sections */}
      <div className="space-y-8">
        {CONCEPTS.map(concept => {
          const Icon = concept.icon;
          return (
            <section key={concept.id} id={concept.id} className="scroll-mt-24">
              <div className="space-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{concept.title}</h2>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{concept.intro}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                  {concept.points.map((p, i) => (
                    <div key={`${concept.id}-point-${i}`} className="p-4 rounded-lg bg-muted/20 border border-border">
                      <div className="text-xs font-semibold text-foreground mb-1.5">{p.heading}</div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{p.text}</p>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-lg bg-info/5 border border-info/20 mb-3">
                  <div className="text-[10px] font-semibold text-info uppercase tracking-wider mb-1">Real mission example</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">🛰️ {concept.realMission}</p>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/5 border border-accent/20">
                  <Lightbulb size={13} className="text-accent mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-foreground leading-relaxed"><strong>Key takeaway:</strong> {concept.takeaway}</p>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* CTA */}
      <div className="text-center mt-12">
        <Link href="/mission-designer" className="btn-accent text-base px-8 py-3">
          <Rocket size={18} />
          Apply What You Learned
        </Link>
      </div>
    </div>
  );
}

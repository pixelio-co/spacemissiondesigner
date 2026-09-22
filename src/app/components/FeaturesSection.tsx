import React from 'react';
import {
  Rocket, Globe, Zap, Radio, FlaskConical, Shield
} from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


const features = [
  {
    id: 'feature-design',
    icon: Rocket,
    title: 'Design Your Spacecraft',
    description: 'Choose from 6 spacecraft types — orbiters, landers, rovers, flyby probes, telescopes, and CubeSats. Configure instruments, mass, and payload.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    id: 'feature-destinations',
    icon: Globe,
    title: 'Explore 10 Destinations',
    description: 'From Earth orbit to Neptune — each destination has unique environmental challenges, power constraints, and communication delays.',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    id: 'feature-decisions',
    icon: Zap,
    title: 'Real-Time Decisions',
    description: 'During mission simulation, react to unexpected events. Power failures, communication dropouts, and instrument anomalies require your choices.',
    color: 'text-success',
    bg: 'bg-success/10',
  },
  {
    id: 'feature-comms',
    icon: Radio,
    title: 'Communication Science',
    description: 'Experience the reality of signal delays — from 0.1 seconds in Earth orbit to over 4 hours at Neptune. Choose the right antenna system.',
    color: 'text-info',
    bg: 'bg-info/10',
  },
  {
    id: 'feature-science',
    icon: FlaskConical,
    title: 'Scientific Instruments',
    description: 'Select from 9 scientific instruments. Each adds scientific value but increases mass and power requirements — balance is key.',
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
  {
    id: 'feature-learn',
    icon: Shield,
    title: 'Learn From Outcomes',
    description: 'Every mission ends with an educational debrief. Understand why your decisions succeeded or failed, linked directly to scientific concepts.',
    color: 'text-danger',
    bg: 'bg-danger/10',
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 xl:px-10 max-w-screen-2xl mx-auto">
      <div className="text-center mb-12">
        <div className="badge badge-neutral mb-4 inline-flex mx-auto">
          Core Features
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
          A Complete Mission Experience
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Every decision you make — from spacecraft type to power system — has real consequences
          in your mission simulation.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features?.map((feature) => {
          const Icon = feature?.icon;
          return (
            <div key={feature?.id} className="space-card p-6 hover:border-primary/50 transition-colors group">
              <div className={`${feature?.bg} w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon size={22} className={feature?.color} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature?.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature?.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
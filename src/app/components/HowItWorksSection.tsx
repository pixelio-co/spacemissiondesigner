import React from 'react';
import { Target, Wrench, Settings, Rocket, Zap, BookOpen } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


const steps = [
  {
    id: 'step-design',
    number: '01',
    icon: Target,
    title: 'Design',
    description: 'Choose your mission objective and destination. Define what your mission aims to achieve and where it will go.',
    color: 'text-primary',
    border: 'border-primary/30',
  },
  {
    id: 'step-build',
    number: '02',
    icon: Wrench,
    title: 'Build',
    description: 'Design your spacecraft and select scientific instruments. Balance scientific capability against mass and power constraints.',
    color: 'text-accent',
    border: 'border-accent/30',
  },
  {
    id: 'step-prepare',
    number: '03',
    icon: Settings,
    title: 'Prepare',
    description: 'Choose propulsion, power, and communication systems. Each choice must be compatible with your destination.',
    color: 'text-success',
    border: 'border-success/30',
  },
  {
    id: 'step-launch',
    number: '04',
    icon: Rocket,
    title: 'Launch',
    description: 'Launch your spacecraft and begin the mission. Watch the mission control dashboard as your spacecraft travels.',
    color: 'text-info',
    border: 'border-info/30',
  },
  {
    id: 'step-adapt',
    number: '05',
    icon: Zap,
    title: 'Adapt',
    description: 'React to events and challenges during the mission. Power failures, communication loss, and radiation require decisions.',
    color: 'text-warning',
    border: 'border-warning/30',
  },
  {
    id: 'step-discover',
    number: '06',
    icon: BookOpen,
    title: 'Discover',
    description: 'Receive your final mission report and learn what happened. Understand the science behind every decision.',
    color: 'text-danger',
    border: 'border-danger/30',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 xl:px-10 bg-muted/30">
      <div className="max-w-screen-2xl mx-auto">
        <div className="text-center mb-12">
          <div className="badge badge-neutral mb-4 inline-flex mx-auto">
            How It Works
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Six Steps to Mission Success
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Follow the same process real mission designers use — from concept to scientific discovery.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps?.map((step, idx) => {
            const Icon = step?.icon;
            return (
              <div key={step?.id} className={`space-card p-6 border ${step?.border} relative overflow-hidden`}>
                <div className="absolute top-4 right-4 font-mono text-4xl font-bold text-muted/60 select-none">
                  {step?.number}
                </div>
                <div className="mb-4">
                  <Icon size={24} className={step?.color} />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  STEP {idx + 1} — {step?.title?.toUpperCase()}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step?.description}</p>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <a href="/mission-designer" className="btn-accent text-base px-10 py-3">
            <Rocket size={18} />
            Begin Your Mission
          </a>
        </div>
      </div>
    </section>
  );
}
import React from 'react';
import AppNav from '@/components/AppNav';
import AppFooter from '@/components/AppFooter';
import { BookOpen, ExternalLink, Database, ShieldAlert, Satellite, FlaskConical, Radio } from 'lucide-react';
import { DATA_SOURCES, DATA_NOTE, DISCLAIMER, DESTINATION_FACTS, REAL_MISSIONS } from '@/lib/spaceData';
import { DESTINATIONS } from '@/lib/missionData';

export const metadata = {
  title: 'About & Data Sources — ꜱᴘᴀᴄᴇ ᴍɪꜱꜱɪᴏɴ ᴅᴇꜱɪɢɴᴇʀ',
  description: 'Project background and the public NASA datasets used by this educational project.',
};

const usageIcons: Record<string, React.ElementType> = {
  destinations: Satellite,
  science: FlaskConical,
  communication: Radio,
};

function usageIcon(usedFor: string): React.ElementType {
  const u = usedFor.toLowerCase();
  if (u.includes('destination') || u.includes('planetary')) return usageIcons.destinations;
  if (u.includes('mission')) return usageIcons.science;
  return usageIcons.communication;
}

export default function AboutPage() {
  const destinationCount = Object.keys(DESTINATION_FACTS).length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppNav />
      <main className="flex-1 pt-16">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <Database size={22} className="text-info" />
              <h1 className="text-2xl font-bold text-foreground">About & Data Sources</h1>
            </div>
            <p className="text-sm text-muted-foreground max-w-3xl">
              Where this project&rsquo;s space data comes from, and how it is used. The application
              works fully offline — all datasets are bundled, cached educational constants.
            </p>
          </div>

          {/* Project statement */}
          <div className="space-card p-6 mb-6">
            <h2 className="text-base font-bold text-foreground mb-2">About this project</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              ꜱᴘᴀᴄᴇ ᴍɪꜱꜱɪᴏɴ ᴅᴇꜱɪɢɴᴇʀ (Design. Plan. Explore.) is an independent educational
              project developed for the NASA Space Apps Challenge 2026. It teaches space-mission
              design through transparent, rule-based models: you configure a mission, fly a
              simplified simulation, and see how every choice — power, propulsion, antennas,
              instruments — interacts with real physical constraints like distance, sunlight,
              gravity, and light-time.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Mission outcomes are simplified educational simulations, not professional engineering
              calculations. Every score and dimension in the app traces to a readable rule, and the
              destination data shown in the designer, trajectory view, and mission reports comes
              from the public datasets listed below.
            </p>
          </div>

          {/* Data sources table */}
          <div className="space-card p-6 mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Database size={16} className="text-info" />
              <h2 className="text-base font-bold text-foreground">Data Sources</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              All data is used for education only. Approximate values; source pages are authoritative.
            </p>
            <div className="space-y-3">
              {DATA_SOURCES.map(src => {
                const Icon = usageIcon(src.usedFor);
                return (
                  <div key={src.id} className="p-4 rounded-lg bg-muted/40 border border-border">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon size={14} className="text-primary flex-shrink-0" />
                        <span className="text-sm font-semibold text-foreground">{src.dataset}</span>
                      </div>
                      <span className="badge badge-info text-[9px] flex-shrink-0 normal-case">{src.organization}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">{src.usedFor}</p>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:text-primary/80 inline-flex items-center gap-1 font-mono break-all"
                    >
                      {src.url}
                      <ExternalLink size={10} className="flex-shrink-0" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>

          {/* How the data is used */}
          <div className="space-card p-6 mb-6">
            <h2 className="text-base font-bold text-foreground mb-3">How the data is used</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  label: 'Destination facts',
                  text: `${destinationCount} destinations carry gravity, temperature, atmosphere, radiation, sunlight, and light-time values drawn from the NASA Planetary Fact Sheet.`,
                },
                {
                  label: 'Communication delay',
                  text: 'One-way light-time in Mission Control is computed as distance ÷ speed of light from the fact-sheet distances — transparently labeled in the UI.',
                },
                {
                  label: 'Power realism',
                  text: 'Solar suitability uses real solar irradiance per destination ("Sunlight here ≈ X% of Earth levels").',
                },
                {
                  label: 'Mission context',
                  text: `${REAL_MISSIONS.length} real NASA/ESA mission architectures (Voyager → Europa Clipper) appear on the Learn page for comparison with your design.`,
                },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-lg bg-muted/40 border border-border">
                  <div className="text-xs font-bold text-foreground mb-1">{item.label}</div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Destination dataset preview */}
          <div className="space-card p-6 mb-6">
            <h2 className="text-base font-bold text-foreground mb-1">Destination dataset (summary)</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Compiled from the NASA Planetary Fact Sheet. Values are approximate averages.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="py-2 pr-3 font-medium">Destination</th>
                    <th className="py-2 pr-3 font-medium">Distance from Sun</th>
                    <th className="py-2 pr-3 font-medium">Gravity (m/s²)</th>
                    <th className="py-2 pr-3 font-medium">Mean temp (°C)</th>
                    <th className="py-2 pr-3 font-medium">Sunlight vs Earth</th>
                    <th className="py-2 font-medium">One-way light time</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(DESTINATION_FACTS).map(f => (
                    <tr key={f.key} className="border-b border-border/50">
                      <td className="py-2 pr-3 font-semibold text-foreground">{f.label}</td>
                      <td className="py-2 pr-3 font-mono text-muted-foreground">
                        {f.distanceFromSunAu ? `${f.distanceFromSunAu} AU` : '—'}
                      </td>
                      <td className="py-2 pr-3 font-mono text-muted-foreground">{f.gravityMs2 ?? '—'}</td>
                      <td className="py-2 pr-3 font-mono text-muted-foreground">{f.meanTempC ?? '—'}</td>
                      <td className="py-2 pr-3 font-mono text-muted-foreground">
                        {f.solarIrradianceWm2 ? `${Math.round((f.solarIrradianceWm2 / 1361) * 100)}%` : '—'}
                      </td>
                      <td className="py-2 font-mono text-muted-foreground">
                        {f.avgOneWayDelaySeconds < 60
                          ? `${f.avgOneWayDelaySeconds} s`
                          : `≈ ${Math.round(f.avgOneWayDelaySeconds / 60)} min`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes & disclaimer */}
          <div className="space-y-3">
            <div className="space-card p-4 border-info/25 flex items-start gap-2">
              <BookOpen size={14} className="text-info mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">{DATA_NOTE}</p>
            </div>
            <div className="space-card p-4 border-warning/25 flex items-start gap-2">
              <ShieldAlert size={14} className="text-warning mt-0.5 flex-shrink-0" />
              <p className="text-xs text-foreground leading-relaxed">{DISCLAIMER}</p>
            </div>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}

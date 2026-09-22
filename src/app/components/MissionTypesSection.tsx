import React from 'react';

const missionTypes = [
  { id: 'mt-mars', emoji: '🔴', name: 'Mars Rover', desc: 'Surface exploration with a mobile laboratory', badge: 'Popular', badgeClass: 'badge-success' },
  { id: 'mt-europa', emoji: '🟠', name: 'Jupiter Orbiter', desc: 'Study Europa\'s subsurface ocean potential', badge: 'Advanced', badgeClass: 'badge-warning' },
  { id: 'mt-asteroid', emoji: '☄️', name: 'Asteroid Probe', desc: 'Characterize a near-Earth asteroid', badge: 'Challenging', badgeClass: 'badge-info' },
  { id: 'mt-telescope', emoji: '🔭', name: 'Space Telescope', desc: 'Observe distant galaxies from Earth orbit', badge: 'Beginner', badgeClass: 'badge-neutral' },
  { id: 'mt-neptune', emoji: '🔵', name: 'Neptune Flyby', desc: 'First deep-space probe to the ice giants', badge: 'Expert', badgeClass: 'badge-danger' },
  { id: 'mt-moon', emoji: '🌕', name: 'Lunar Lander', desc: 'Soft landing and surface science on the Moon', badge: 'Classic', badgeClass: 'badge-neutral' },
];

export default function MissionTypesSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 xl:px-10 max-w-screen-2xl mx-auto" id="learn-section">
      <div className="text-center mb-12">
        <div className="badge badge-neutral mb-4 inline-flex mx-auto">
          Mission Ideas
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
          What Will You Explore?
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Each mission type offers different challenges and scientific rewards.
          The choices you make will determine your outcome.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {missionTypes?.map((mt) => (
          <div key={mt?.id} className="space-card p-6 hover:border-primary/50 transition-all group cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <span className="text-4xl">{mt?.emoji}</span>
              <span className={`badge ${mt?.badgeClass}`}>{mt?.badge}</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">{mt?.name}</h3>
            <p className="text-sm text-muted-foreground">{mt?.desc}</p>
          </div>
        ))}
      </div>

      <div className="space-card p-6 border-warning/30 border text-center">
        <p className="text-sm text-muted-foreground mb-1">
          <span className="badge badge-warning mr-2">Independent Educational Project</span>
          This simulation is not an official NASA product. Science values are simplified for educational gameplay.
        </p>
      </div>
    </section>
  );
}
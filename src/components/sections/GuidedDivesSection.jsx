const SITES = [
  {
    id: 'cathedral',
    name: 'The Cathedral',
    depth: '22 m',
    type: 'Cave / Arch',
    description:
      'A vast underwater chamber where beams of Mediterranean light pierce down from the surface above — the closest thing to a spiritual experience you can have in a wetsuit.',
  },
  {
    id: 'grotto',
    name: 'The Blue Grotto',
    depth: '16 m',
    type: 'Grotto / Wall',
    description:
      'Bioluminescent plankton cling to the walls at night. Resident moray eels patrol the lower tunnels. A site that rewards patience and stillness.',
  },
  {
    id: 'gardens',
    name: "Poseidon's Gardens",
    depth: '18 m',
    type: 'Reef / Garden',
    description:
      'Lush Mediterranean reef teeming with grouper, octopus, and endless nudibranchs. Perfect for underwater photography and relaxed exploration.',
  },
];

export function GuidedDivesSection() {
  return (
    <section
      className="guided-section sticky-panel"
      id="scene-underwater"
      aria-label="Guided dive experiences"
    >
      {/* Overlay photo — tinted behind the content */}
      <div
        className="guided-photo-bg"
        role="img"
        aria-label="Underwater scene at Happy Divers"
        style={{
          backgroundImage:
            'url(/assets/overlays/359833235_113426048482678_3516234080709392544_n.jpg)',
        }}
      />
      <div className="guided-photo-vignette" aria-hidden="true" />

      <div className="guided-inner">
        <header className="section-header">
          <div className="chapter-label">
            <span className="chapter-num">IV</span>
            <span className="chapter-dash" />
            <span>Our Waters</span>
          </div>
          <h2 className="section-title heading-main">Guided Dives</h2>
          <p className="section-sub body-text">
            Small groups. Maximum six divers per guide. Every experience level
            welcome.
          </p>
        </header>

        <div className="sites-list" role="list">
          {SITES.map((site) => (
            <article key={site.id} className="site-card" role="listitem">
              <div className="site-card-header">
                <h3 className="site-name">{site.name}</h3>
                <span className="site-type">{site.type}</span>
              </div>
              <p className="site-desc body-text">{site.description}</p>
              <div className="site-depth">
                <span className="meta-label">Max depth</span>
                <span className="meta-val">{site.depth}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="guided-note body-text">
          Equipment included &nbsp;·&nbsp; Nitrox available &nbsp;·&nbsp;
          Guided photography dives on request
        </div>
      </div>
    </section>
  );
}

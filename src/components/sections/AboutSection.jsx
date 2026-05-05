const TEAM = [
  {
    name: 'Captain Yiannis',
    role: 'PADI Course Director',
    years: '20 yrs diving',
    bio: 'Born on the coast, Yiannis has been underwater since he could walk. He built Happy Divers from a single boat and a passion for sharing the sea.',
  },
  {
    name: 'Maria',
    role: 'SSI Instructor / Divemaster Trainer',
    years: '14 yrs teaching',
    bio: 'Specialist in rescue diving and underwater navigation. Maria has introduced over 800 students to their first open-water dive.',
  },
  {
    name: 'Kostas',
    role: 'Divemaster & Equipment Technician',
    years: '9 yrs on the water',
    bio: 'Kostas keeps every piece of kit in perfect condition and knows every inch of the local reefs. He is the person you want behind you underwater.',
  },
];

export function AboutSection() {
  return (
    <section
      className="about-section sticky-panel"
      id="about"
      aria-label="About Happy Divers"
    >
      <div className="about-inner">
        <div className="about-text-col">
          <div className="chapter-label">
            <span className="chapter-num">V</span>
            <span className="chapter-dash" />
            <span>Who We Are</span>
          </div>

          <h2 className="section-title heading-main">Family&nbsp;&amp;<br />Sea</h2>

          <p className="body-text about-body">
            We started as a family business in 2004 on a stretch of Mediterranean
            coastline that had barely been touched by tourism. Twenty years later,
            that is still true.
          </p>
          <p className="body-text about-body">
            Happy Divers is a PADI 5-Star Instructor Development Center and SSI
            Training Facility. But titles aside — what matters to us is the moment
            a student surfaces after their first dive, speechless, and asks when
            they can go back down.
          </p>
          <p className="body-text about-body about-quote">
            "We started as a family, and we remain one — along with every diver
            who passes through our school."
          </p>
        </div>

        <div className="about-team-col">
          {TEAM.map((member) => (
            <div key={member.name} className="team-card">
              <div className="team-card-top">
                <span className="team-name">{member.name}</span>
                <span className="team-years">{member.years}</span>
              </div>
              <span className="team-role">{member.role}</span>
              <p className="body-text team-bio">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

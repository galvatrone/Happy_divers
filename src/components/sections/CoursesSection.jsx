const COURSES = [
  {
    id: 'owd',
    code: 'OWD',
    title: 'Open Water Diver',
    duration: '4 days',
    depth: '18 m',
    body: 'Your first breath underwater. A four-day journey into a world most people never see. Theory, pool sessions, and four open-water dives.',
    level: 'Beginner',
  },
  {
    id: 'aow',
    code: 'AOW',
    title: 'Advanced Open Water',
    duration: '3 days',
    depth: '30 m',
    body: 'Deeper, bolder, further. Unlock night dives, navigation, and wreck exploration. Five speciality adventure dives.',
    level: 'Intermediate',
  },
  {
    id: 'rescue',
    code: 'RES',
    title: 'Rescue Diver',
    duration: '4 days',
    depth: '30 m',
    body: 'Become the diver others trust. Master emergency response, self-rescue, and managing stressful situations underwater.',
    level: 'Advanced',
  },
  {
    id: 'dm',
    code: 'DM',
    title: 'Divemaster',
    duration: '2 weeks',
    depth: '40 m',
    body: 'Cross the threshold from diver to leader. Guide others into the blue, assist instructors, and earn the first professional-level certification.',
    level: 'Professional',
  },
  {
    id: 'nitrox',
    code: 'EAD',
    title: 'Enriched Air Nitrox',
    duration: '1 day',
    depth: '40 m',
    body: 'More bottom time, less fatigue. Learn to plan and execute dives with up to 40% oxygen — certified in a single day.',
    level: 'Speciality',
  },
  {
    id: 'rental',
    code: 'EQP',
    title: 'Equipment & Rental',
    duration: 'Any day',
    depth: '—',
    body: 'Full kit available daily: BCD, regulator, wetsuit, mask, fins, computer. Everything serviced and ready to dive.',
    level: 'Service',
  },
];

export function CoursesSection() {
  return (
    <section
      className="courses-section sticky-panel"
      id="courses"
      aria-label="SCUBA courses"
    >
      <div className="courses-inner">
        <header className="section-header">
          <div className="chapter-label">
            <span className="chapter-num">III</span>
            <span className="chapter-dash" />
            <span>Learning to Breathe Below</span>
          </div>
          <h2 className="section-title heading-main">Courses</h2>
          <p className="section-sub body-text">
            From your first breath to professional certification — every level,
            every pace.
          </p>
        </header>

        <div className="courses-grid" role="list">
          {COURSES.map((c) => (
            <article key={c.id} className="course-card" role="listitem">
              <div className="course-card-top">
                <span className="course-code">{c.code}</span>
                <span className="course-level">{c.level}</span>
              </div>
              <h3 className="course-title">{c.title}</h3>
              <p className="course-body body-text">{c.body}</p>
              <div className="course-meta">
                <span className="course-meta-item">
                  <span className="meta-label">Duration</span>
                  <span className="meta-val">{c.duration}</span>
                </span>
                <span className="course-meta-dot" aria-hidden="true" />
                <span className="course-meta-item">
                  <span className="meta-label">Max Depth</span>
                  <span className="meta-val">{c.depth}</span>
                </span>
              </div>
              <a href="#contact" className="course-link" aria-label={`Enquire about ${c.title}`}>
                Enquire
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

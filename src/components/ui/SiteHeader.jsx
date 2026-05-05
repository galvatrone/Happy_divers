import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function SiteHeader() {
  const ref = useRef();

  useEffect(() => {
    gsap.from(ref.current, {
      y: -24, autoAlpha: 0, duration: 1.0, delay: 0.3, ease: 'power2.out',
    });
  }, []);

  return (
    <header className="site-header" ref={ref} role="banner">
      <a href="#" className="site-logo" aria-label="Happy Divers — home">
        Happy Divers
      </a>
      <nav className="site-nav" aria-label="Primary navigation">
        <a href="#courses">Courses</a>
        <a href="#scene-underwater">Guided Dives</a>
        <a href="#about">About</a>
        <a href="#contact">Book a Dive</a>
      </nav>
    </header>
  );
}

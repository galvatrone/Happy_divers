import { useEffect, useState } from 'react';
import { DiveCanvas }    from './world/DiveCanvas';
import { Overlay }       from './components/ui/Overlay';
import { DepthHUD }      from './components/ui/DepthHUD';
import { AudioToggle }   from './components/ui/AudioToggle';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { WaypointNav }   from './components/ui/WaypointNav';
import { useDiveScroll } from './hooks/useDiveScroll';
import { DEBUG_P }       from './world/quality';

export default function App() {
  const [loaded, setLoaded] = useState(DEBUG_P !== null);
  useDiveScroll(loaded);

  useEffect(() => {
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <DiveCanvas />
      <Overlay />

      <a
        href="#"
        className="site-logo"
        aria-label="Happy Divers — к поверхности"
        onClick={e => { e.preventDefault(); window.dispatchEvent(new CustomEvent('dive:goto', { detail: 0 })); }}
      >
        HAPPY DIVERS
      </a>

      <WaypointNav />
      <DepthHUD />
      <AudioToggle />

      {!loaded && <LoadingScreen onComplete={() => setLoaded(true)} />}
    </>
  );
}

import { useState } from 'react';
import { Howler } from 'howler';
import { sceneState } from '../../store/sceneState';

export function AudioToggle() {
  const [on, setOn] = useState(false);

  function toggle() {
    const next = !on;
    sceneState.audioEnabled = next;
    Howler.mute(!next);
    setOn(next);
  }

  return (
    <button
      className={`audio-toggle${on ? ' on' : ''}`}
      onClick={toggle}
      aria-label={on ? 'Mute audio' : 'Unmute audio'}
      title={on ? 'Audio on' : 'Audio off'}
    >
      {on ? '◉' : '○'}
    </button>
  );
}

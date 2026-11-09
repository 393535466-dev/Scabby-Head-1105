import { useEffect, useState } from 'react';

const REST = { type: 'idle', gaze: [0, 0], duration: 2400 };
const SEQUENCE = [
  REST,
  { type: 'surprise', gaze: [.7, -.7], duration: 3500 },
  { type: 'idle', gaze: [-.6, .1], duration: 1500 },
  { type: 'question', gaze: [.2, -.7], duration: 3800 },
  { type: 'idle', gaze: [0, 0], duration: 1600 },
  { type: 'thought', gaze: [.55, -.9], duration: 4700 },
  { type: 'idle', gaze: [.6, .2], duration: 2400 },
  { type: 'idle', gaze: [-.55, .1], duration: 2200 },
];

export default function useAvatarMotion({ ready = true, replay = 0, paused = false } = {}) {
  const [step, setStep] = useState(REST);
  const [visible, setVisible] = useState(!document.hidden);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const changeMotion = () => setReduced(media.matches);
    const changeVisibility = () => setVisible(!document.hidden);
    media.addEventListener('change', changeMotion);
    document.addEventListener('visibilitychange', changeVisibility);
    return () => { media.removeEventListener('change', changeMotion); document.removeEventListener('visibilitychange', changeVisibility); };
  }, []);
  const running = ready && visible && !paused && !reduced;
  useEffect(() => {
    let timer;
    setStep(REST);
    if (!running) return;
    let index = 0;
    const advance = () => {
      index = (index + 1) % SEQUENCE.length;
      setStep(SEQUENCE[index]);
      timer = setTimeout(advance, SEQUENCE[index].duration);
    };
    timer = setTimeout(advance, REST.duration);
    return () => clearTimeout(timer);
  }, [running, replay]);
  return { ...step, running, reduced };
}

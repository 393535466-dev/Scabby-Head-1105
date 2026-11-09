import React, { useEffect, useRef } from 'react';
import Icon from '../Icons.jsx';
import { useStore } from '../../lib/store.jsx';

export default function IdleSpinningPlus() {
  const iconRef = useRef(null);
  const entered = useRef(false);
  const { composerOpen, selectedId } = useStore();
  const blocked = composerOpen || Boolean(selectedId);

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let timer, animation;
    const allowed = () => !blocked && !document.hidden && !media.matches;
    const spin = () => {
      if (!allowed()) return;
      animation?.cancel();
      animation = iconRef.current.animate(
        [{ transform: 'rotate(-1440deg)' }, { transform: 'rotate(0deg)' }],
        { duration: 2400, easing: 'cubic-bezier(.12,.72,.18,1)' },
      );
    };
    // 每段闲置只提示一次；下一次点击或按键后，重新计算 10 秒。
    const armIdle = () => {
      clearTimeout(timer);
      if (allowed()) timer = setTimeout(spin, 10000);
    };
    const syncVisibility = () => {
      animation?.cancel();
      armIdle();
    };
    if (allowed() && !entered.current) {
      spin();
      entered.current = true;
    }
    armIdle();
    window.addEventListener('pointerdown', armIdle, true);
    window.addEventListener('click', armIdle, true);
    window.addEventListener('keydown', armIdle, true);
    document.addEventListener('visibilitychange', syncVisibility);
    media.addEventListener('change', syncVisibility);
    return () => {
      clearTimeout(timer);
      animation?.cancel();
      window.removeEventListener('pointerdown', armIdle, true);
      window.removeEventListener('click', armIdle, true);
      window.removeEventListener('keydown', armIdle, true);
      document.removeEventListener('visibilitychange', syncVisibility);
      media.removeEventListener('change', syncVisibility);
    };
  }, [blocked]);

  return <span className="record-plus" ref={iconRef} aria-hidden="true"><Icon name="plus" size={32} /></span>;
}

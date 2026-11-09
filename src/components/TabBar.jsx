import React, { useLayoutEffect, useRef, useState } from 'react';
import { TABS } from '../lib/constants.js';
import { useStore } from '../lib/store.jsx';
import Icon from './Icons.jsx';

export default function TabBar({ RecordIcon }) {
  const { tab, setTab, setComposerOpen } = useStore();
  const navRef = useRef(null);
  const [size, setSize] = useState({ width: 500, height: 80 });
  useLayoutEffect(() => {
    const nav = navRef.current;
    const measure = () => setSize({ width: nav.clientWidth, height: nav.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    return () => observer.disconnect();
  }, []);
  const { width: w, height: h } = size;
  const c = w / 2;
  const outline = `M0 26 Q0 4 22 4 H${c - 78} C${c - 57} 4 ${c - 51} 7 ${c - 43} 24 C${c - 34} 43 ${c - 21} 50 ${c} 50 C${c + 21} 50 ${c + 34} 43 ${c + 43} 24 C${c + 51} 7 ${c + 57} 4 ${c + 78} 4 H${w - 22} Q${w} 4 ${w} 26 V${h - 20} Q${w} ${h} ${w - 20} ${h} H20 Q0 ${h} 0 ${h - 20} Z`;
  return (
    <nav className="tabbar" aria-label="主导航" ref={navRef}>
      <span className="tabbar-surface" aria-hidden="true">
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          <path d={outline} fill="white" />
        </svg>
      </span>
      {TABS.map((t, index) => (
        <React.Fragment key={t.id}>
          {index === 1 && (
            <button
              type="button"
              className="record-fab"
              aria-label="记一笔"
              onClick={() => setComposerOpen(true)}
            >
              {RecordIcon ? <RecordIcon /> : <Icon name="plus" size={32} />}
            </button>
          )}
          <button
            type="button"
            className={`tab-item ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}
          >
            <Icon name={t.icon} size={22} />
            <span>{t.label}</span>
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
}

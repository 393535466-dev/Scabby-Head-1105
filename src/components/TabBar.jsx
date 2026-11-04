import React from 'react';
import { TABS } from '../lib/constants.js';
import { useStore } from '../lib/store.jsx';
import Icon from './Icons.jsx';

export default function TabBar() {
  const { tab, setTab } = useStore();
  return (
    <nav className="tabbar" aria-label="主导航">
      {TABS.map((t) => (
        <button
          type="button"
          key={t.id}
          className={`tab-item ${tab === t.id ? 'active' : ''}`}
          onClick={() => setTab(t.id)}
          aria-current={tab === t.id ? 'page' : undefined}
        >
          <Icon name={t.icon} size={22} />
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

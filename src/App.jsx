import React, { useEffect } from 'react';
import { StoreProvider, useStore } from './lib/store.jsx';
import TabBar from './components/TabBar.jsx';
import RecordTab from './pages/RecordTab.jsx';
import StudioTab from './pages/StudioTab.jsx';
import CalendarTab from './pages/CalendarTab.jsx';
import MineTab from './pages/MineTab.jsx';
import { todayChipLabel } from './lib/time.js';
import { clip } from './lib/utils.js';

function Shell() {
  const { tab, toast, aiSource, records, markNotified } = useStore();

  // 提醒：页面打开期间每 30 秒检查一次，到期只通知一次，列表高亮由「记一下」负责
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return undefined;
    const tick = () => {
      const now = Date.now();
      const due = records.filter((r) => r.remindAt && !r.notified && !r.remindDone && new Date(r.remindAt).getTime() <= now);
      if (!due.length) return;
      if (Notification.permission === 'granted') {
        due.forEach((r) => {
          try {
            new Notification('臭脑子 · 该记一笔了', {
              body: clip(r.text || r.caption || '你设的提醒到点啦', 40),
              tag: r.id,
            });
          } catch { /* 部分浏览器在非激活态会抛错，忽略 */ }
        });
      }
      markNotified(due.map((r) => r.id));
    };
    tick();
    const timer = setInterval(tick, 30000);
    return () => clearInterval(timer);
  }, [records, markNotified]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">臭</div>
          <div className="brand-text">
            <h1>臭脑子</h1>
            <p>随手记 · 慢慢发酵</p>
          </div>
        </div>
        <div className="header-meta">
          <span className="date-chip">{todayChipLabel()}</span>
          {aiSource === 'demo' && <span className="demo-chip">演示模式</span>}
        </div>
      </header>

      <main className="app-main">
        {tab === 'record' && <RecordTab />}
        {tab === 'studio' && <StudioTab />}
        {tab === 'calendar' && <CalendarTab />}
        {tab === 'mine' && <MineTab />}
      </main>

      <TabBar />
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}

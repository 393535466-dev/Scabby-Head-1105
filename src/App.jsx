import React, { useCallback, useEffect, useState } from 'react';
import { StoreProvider, useStore } from './lib/store.jsx';
import TabBar from './components/TabBar.jsx';
import RecordComposer from './components/RecordComposer.jsx';
import Sheet from './components/Sheet.jsx';
import Icon from './components/Icons.jsx';
import RecordTab from './pages/RecordTab.jsx';
import StudioTab from './pages/StudioTab.jsx';
import LibraryTab from './pages/LibraryTab.jsx';
import MineTab from './pages/MineTab.jsx';
import WelcomeScreen from './components/WelcomeScreen.jsx';
import ProfileEditor from './components/ProfileEditor.jsx';
import Avatar from './components/Avatar.jsx';
import BrandMark from './components/BrandMark.jsx';
import BrandWordmark from './components/BrandWordmark.jsx';
import { normalizeProfile } from './lib/profile.js';
import { todayChipLabel } from './lib/time.js';
import { clip } from './lib/utils.js';

function Shell() {
  const {
    tab,
    setTab,
    toast,
    records,
    markNotified,
    ready,
    saveState,
    selectedId,
    setSelectedId,
    composerOpen,
    settings,
  } = useStore();
  const [, setClock] = useState(Date.now());
  const [welcomeOpen, setWelcomeOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const userProfile = normalizeProfile(settings.profile);
  const record = records.find((item) => item.id === selectedId);
  const closeRecord = useCallback(() => setSelectedId(''), [setSelectedId]);
  useEffect(() => {
    setQuery('');
    setSearchOpen(false);
  }, [tab]);
  const due = records.filter(
    (item) => item.remindAt && !item.remindDone && new Date(item.remindAt).getTime() <= Date.now(),
  );

  useEffect(() => {
    const tick = () => {
      setClock(Date.now());
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      const dueRecords = records.filter(
        (item) =>
          item.remindAt &&
          !item.notified &&
          !item.remindDone &&
          new Date(item.remindAt).getTime() <= Date.now(),
      );
      const notified = [];
      dueRecords.forEach((item) => {
        try {
          new Notification('臭脑子 · 别忘了', {
            body: clip(item.text || item.caption || '你设的提醒到点啦', 40),
            tag: item.id,
          });
          notified.push(item.id);
        } catch {
          /* 浏览器不允许通知时，页面内仍展示到期列表 */
        }
      });
      if (notified.length) markNotified(notified);
    };
    tick();
    const timer = setInterval(tick, 30000);
    return () => clearInterval(timer);
  }, [records, markNotified]);

  const profileEditor = profileEditorOpen && (
    <ProfileEditor
      creating={!userProfile.created}
      onClose={() => {
        setProfileEditorOpen(false);
        setWelcomeOpen(false);
      }}
      onSaved={() => {
        setProfileEditorOpen(false);
        setWelcomeOpen(false);
      }}
    />
  );
  if (welcomeOpen)
    return (
      <>
        <WelcomeScreen
          creating={!userProfile.created}
          onEnter={() => {
            if (userProfile.created) setWelcomeOpen(false);
            else setProfileEditorOpen(true);
          }}
        />
        {profileEditor}
        {toast && (
          <div className="toast" role="status">
            {toast}
          </div>
        )}
      </>
    );

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">
            <BrandMark decorative />
          </div>
          <div className="brand-text">
            <h1>
              <BrandWordmark decorative />
              <span className="sr-only">臭脑子</span>
            </h1>
            <p>{todayChipLabel()}</p>
          </div>
        </div>
        <div className="header-meta">
          <button
            type="button"
            className={`header-icon ${searchOpen ? 'active' : ''}`}
            aria-label={tab === 'library' ? '搜索灵感库' : '搜索记录'}
            aria-expanded={searchOpen}
            onClick={() => {
              if (!['record', 'library'].includes(tab)) setTab('record');
              else setSearchOpen(!searchOpen);
            }}
          >
            <Icon name="search" size={21} />
          </button>
          <button
            type="button"
            className="header-icon"
            aria-label={`提醒${due.length ? `，${due.length} 条到期` : ''}`}
            onClick={() => setTab('reminders')}
          >
            <Icon name="bell" size={22} />
            {due.length > 0 && <span className="notification-dot" />}
          </button>
          <button
            type="button"
            className="profile-button"
            aria-label="个人设置"
            onClick={() => setTab('mine')}
          >
            <Avatar profile={userProfile} decorative />
          </button>
        </div>
      </header>
      <main
        className="app-main"
        aria-hidden={composerOpen || Boolean(record) || profileEditorOpen ? true : undefined}
      >
        {saveState === 'error' && (
          <p className="save-error" role="alert">
            本机保存失败，请在个人设置里导出备份。
          </p>
        )}
        {searchOpen && (
          <label className="search-field header-search">
            <Icon name="search" size={18} />
            <input
              type="search"
              autoFocus
              aria-label="搜索内容"
              placeholder={tab === 'library' ? '搜索点子、改写和封面' : '搜索原文、加工内容或标签'}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button
              type="button"
              aria-label="关闭搜索"
              onClick={() => {
                setSearchOpen(false);
                setQuery('');
              }}
            >
              <Icon name="close" size={17} />
            </button>
          </label>
        )}
        {!ready ? (
          <div className="loading-state">正在找回你的念头…</div>
        ) : (
          <>
            {['mine', 'reminders'].includes(tab) && (
              <button
                type="button"
                className="text-back page-back"
                onClick={() => setTab('record')}
              >
                <Icon name="chevronLeft" size={18} />
                回到记录
              </button>
            )}
            {tab === 'record' && (
              <RecordTab query={query} onEditProfile={() => setProfileEditorOpen(true)} />
            )}
            {tab === 'library' && <LibraryTab query={query} />}
            {tab === 'reminders' && <RecordTab remindersOnly query={query} />}
            {tab === 'mine' && (
              <div className="settings-scroll">
                <MineTab onEditProfile={() => setProfileEditorOpen(true)} />
              </div>
            )}
          </>
        )}
      </main>
      {ready && <TabBar />}
      {composerOpen && <RecordComposer />}
      {profileEditor}
      {record && (
        <Sheet title="这条记录" onClose={closeRecord}>
          <StudioTab key={record.id} record={record} onClose={closeRecord} />
        </Sheet>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
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

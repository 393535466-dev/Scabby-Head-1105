import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { nextReminderDelay, reminderState } from './lib/reminders.js';
import { showReminderNotification } from './lib/notifications.js';
import ReminderDetail from './components/ReminderDetail.jsx';

function Shell({ WelcomeComponent, RecordIcon, skipLaunch = false }) {
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
    showToast,
  } = useStore();
  const [, setClock] = useState(Date.now());
  const notifying = useRef(new Set());
  const announced = useRef(new Set());
  const liveRecords = useRef(records);
  liveRecords.current = records;
  const [welcomeOpen, setWelcomeOpen] = useState(!skipLaunch);
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
    (item) => reminderState(item) === 'due',
  );

  useEffect(() => {
    let stopped = false, timer;
    const tick = () => {
      if (stopped) return;
      clearTimeout(timer);
      setClock(Date.now());
      const fresh = records.filter((item) => reminderState(item) === 'due' && !announced.current.has(`${item.id}:${item.remindAt}`));
      if (fresh.length) {
        fresh.forEach((item) => announced.current.add(`${item.id}:${item.remindAt}`));
        showToast(`提醒到点了 · ${(fresh[0].text || '有件事别忘了').slice(0, 45)}${fresh.length > 1 ? `（共 ${fresh.length} 件）` : ''}`, 8000);
      }
      records.filter((item) => !item.notified && reminderState(item) === 'due').forEach((item) => {
        const key = `${item.id}:${item.remindAt}`;
        if (notifying.current.has(key)) return;
        notifying.current.add(key);
        const stillDue = () => liveRecords.current.some((latest) => latest.id === item.id && latest.remindAt === item.remindAt && !latest.notified && reminderState(latest) === 'due');
        showReminderNotification(item, stillDue).then((shown) => { if (shown) markNotified([item]); }).finally(() => notifying.current.delete(key));
      });
      timer = setTimeout(tick, nextReminderDelay(records));
    };
    tick();
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => { stopped = true; clearTimeout(timer); document.removeEventListener('visibilitychange', tick); window.removeEventListener('focus', tick); };
  }, [records, markNotified, showToast]);

  useEffect(() => {
    const openReminder = (event) => {
      if (event.data?.type !== 'OPEN_REMINDER') return;
      setWelcomeOpen(false); setTab('reminders'); setSelectedId(event.data.recordId || '');
    };
    if (new URLSearchParams(window.location.search).get('reminders') === '1') { setWelcomeOpen(false); setTab('reminders'); }
    navigator.serviceWorker?.addEventListener('message', openReminder);
    return () => navigator.serviceWorker?.removeEventListener('message', openReminder);
  }, [setTab, setSelectedId]);

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
              <RecordTab query={query} onEditProfile={() => setProfileEditorOpen(true)} WelcomeComponent={WelcomeComponent} />
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
      {ready && <TabBar RecordIcon={RecordIcon} />}
      {composerOpen && <RecordComposer />}
      {profileEditor}
      {record && (
        <Sheet title={record.entryType === 'reminder' ? '这条提醒' : '这条记录'} onClose={closeRecord}>
          {record.entryType === 'reminder' ? <ReminderDetail key={record.id} record={record} /> : <StudioTab key={record.id} record={record} onClose={closeRecord} />}
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

export default function App({ WelcomeComponent, RecordIcon, skipLaunch = false }) {
  return (
    <StoreProvider>
      <Shell WelcomeComponent={WelcomeComponent} RecordIcon={RecordIcon} skipLaunch={skipLaunch} />
    </StoreProvider>
  );
}

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { loadRecords, replaceRecords } from './db.js';
import { loadSettings, saveSettings } from './settings.js';
import { TZ, todayKey } from './time.js';
import { downloadJSON } from './utils.js';

const StoreContext = createContext(null);

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useStore 必须在 StoreProvider 内使用');
  return value;
}

export function StoreProvider({ children }) {
  const [records, setRecords] = useState([]);
  const [settings, setSettings] = useState(loadSettings);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState('record');
  const [selectedId, setSelectedId] = useState('');
  const [toast, setToast] = useState('');
  const [aiSource, setAiSource] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2800);
  }, []);

  useEffect(() => {
    let alive = true;
    loadRecords()
      .then((list) => { if (alive) { setRecords(Array.isArray(list) ? list : []); setReady(true); } })
      .catch(() => { if (alive) setReady(true); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    replaceRecords(records).catch(() => showToast('保存失败：本地空间可能不足，删掉几张照片再试'));
  }, [records, ready, showToast]);

  useEffect(() => { saveSettings(settings); }, [settings]);

  const addRecord = useCallback((rec) => { setRecords((prev) => [rec, ...prev]); }, []);
  const updateRecord = useCallback((id, patch) => {
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...(typeof patch === 'function' ? patch(r) : patch) } : r)));
  }, []);
  const removeRecord = useCallback((id) => { setRecords((prev) => prev.filter((r) => r.id !== id)); }, []);
  const markNotified = useCallback((ids) => {
    const set = new Set(ids);
    setRecords((prev) => prev.map((r) => (set.has(r.id) ? { ...r, notified: true } : r)));
  }, []);
  const clearRecords = useCallback(() => {
    setRecords([]);
    setSettings((prev) => ({ ...prev, dailyPoster: {} }));
  }, []);
  const updateSettings = useCallback((patch) => {
    setSettings((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }));
  }, []);

  const addTag = useCallback((name) => {
    const t = String(name || '').trim().slice(0, 12);
    if (!t) return;
    setSettings((prev) => (prev.tags.includes(t) ? prev : { ...prev, tags: [...prev.tags, t] }));
  }, []);
  const renameTag = useCallback((oldName, newName) => {
    const n = String(newName || '').trim().slice(0, 12);
    if (!n || n === oldName) return;
    setSettings((prev) => ({ ...prev, tags: prev.tags.map((t) => (t === oldName ? n : t)) }));
    setRecords((prev) => prev.map((r) => ({ ...r, tags: (r.tags || []).map((t) => (t === oldName ? n : t)) })));
  }, []);
  const removeTag = useCallback((name) => {
    setSettings((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== name) }));
    setRecords((prev) => prev.map((r) => ({ ...r, tags: (r.tags || []).filter((t) => t !== name) })));
  }, []);
  const setPosterOfDay = useCallback((dateKey, info) => {
    setSettings((prev) => ({ ...prev, dailyPoster: { ...(prev.dailyPoster || {}), [dateKey]: info } }));
  }, []);

  const exportJSON = useCallback(() => {
    const data = {
      app: '臭脑子',
      version: '0.1.0',
      exportedAt: new Date().toISOString(),
      timezone: TZ,
      settings,
      records,
    };
    downloadJSON(data, `臭脑子-备份-${todayKey()}.json`);
    showToast('已导出 JSON 备份');
  }, [settings, records, showToast]);

  const value = {
    records, settings, ready, tab, setTab, selectedId, setSelectedId,
    toast, showToast, aiSource, setAiSource,
    addRecord, updateRecord, removeRecord, markNotified, clearRecords,
    updateSettings, addTag, renameTag, removeTag, setPosterOfDay, exportJSON,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

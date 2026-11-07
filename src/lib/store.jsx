import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { loadRecords, replaceRecords } from './db.js';
import { loadSettings, saveSettings } from './settings.js';
import { TZ, todayKey } from './time.js';
import { downloadJSON, uid } from './utils.js';
import { normalizeRecord, selectedOutput, exampleRecords } from './records.js';
import { callAI } from './ai.js';

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
  const [composerOpen, setComposerOpen] = useState(false);
  const [processing, setProcessing] = useState({});
  const [saveState, setSaveState] = useState('saved');
  const recordsRef = useRef(records);
  const activeRequests = useRef(new Set());
  const saveVersion = useRef(0);
  recordsRef.current = records;
  const toastTimer = useRef(null);

  const showToast = useCallback((msg, duration = 2800) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), duration);
  }, []);

  useEffect(() => {
    let alive = true;
    loadRecords()
      .then((list) => {
        if (alive) {
          setRecords(
            (Array.isArray(list) ? list : [])
              .map(normalizeRecord)
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
          );
          setReady(true);
        }
      })
      .catch(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const version = ++saveVersion.current;
    setSaveState('saving');
    replaceRecords(records)
      .then(() => {
        if (version === saveVersion.current) setSaveState('saved');
      })
      .catch(() => {
        if (version === saveVersion.current) setSaveState('error');
        showToast('本机保存失败，请先导出记录备份');
      });
  }, [records, ready, showToast]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const addRecord = useCallback((rec) => {
    setRecords((prev) => [normalizeRecord(rec), ...prev]);
  }, []);
  const updateRecord = useCallback((id, patch) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              ...(typeof patch === 'function' ? patch(r) : patch),
              updatedAt: new Date().toISOString(),
            }
          : r,
      ),
    );
  }, []);
  const removeRecord = useCallback((id) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setSettings((prev) => ({
      ...prev,
      dailyPoster: Object.fromEntries(
        Object.entries(prev.dailyPoster).filter(([, poster]) => poster.recordId !== id),
      ),
    }));
  }, []);
  const markNotified = useCallback((reminders) => {
    const times = new Map(reminders.map((item) => [item.id, item.remindAt]));
    setRecords((prev) => prev.map((r) => (!r.remindDone && times.get(r.id) === r.remindAt && times.has(r.id) ? { ...r, notified: true } : r)));
  }, []);
  const clearRecords = useCallback(() => {
    setRecords([]);
    setSettings((prev) => ({ ...prev, dailyPoster: {} }));
  }, []);
  const updateSettings = useCallback((patch) => {
    setSettings((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }));
  }, []);

  const addTag = useCallback((name) => {
    const t = String(name || '')
      .trim()
      .slice(0, 12);
    if (!t) return;
    setSettings((prev) => (prev.tags.includes(t) ? prev : { ...prev, tags: [...prev.tags, t] }));
  }, []);
  const renameTag = useCallback((oldName, newName) => {
    const n = String(newName || '')
      .trim()
      .slice(0, 12);
    if (!n || n === oldName) return;
    setSettings((prev) => ({
      ...prev,
      tags: [...new Set(prev.tags.map((t) => (t === oldName ? n : t)))],
    }));
    setRecords((prev) =>
      prev.map((r) => ({
        ...r,
        tags: [...new Set((r.tags || []).map((t) => (t === oldName ? n : t)))],
      })),
    );
  }, []);
  const removeTag = useCallback((name) => {
    setSettings((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== name) }));
    setRecords((prev) =>
      prev.map((r) => ({ ...r, tags: (r.tags || []).filter((t) => t !== name) })),
    );
  }, []);
  const setPosterOfDay = useCallback((dateKey, info) => {
    setSettings((prev) => ({
      ...prev,
      dailyPoster: { ...(prev.dailyPoster || {}), [dateKey]: info },
    }));
  }, []);

  const exportJSON = useCallback(() => {
    const data = {
      app: '臭脑子',
      version: '0.2.0',
      exportedAt: new Date().toISOString(),
      timezone: TZ,
      settings,
      records,
    };
    downloadJSON(data, `臭脑子-备份-${todayKey()}.json`);
    showToast('已导出 JSON 备份');
  }, [settings, records, showToast]);

  const loadExamples = () => {
    setRecords((prev) => [
      ...prev,
      ...exampleRecords().filter((record) => !prev.some((r) => r.id === record.id)),
    ]);
    showToast('已放入两条示例，可以自己试着加工');
  };

  const processRecord = async (id, action, { tone, direction, initialRecord }) => {
    if (activeRequests.current.has(id)) return;
    const record =
      recordsRef.current.find((r) => r.id === id) ||
      (initialRecord ? normalizeRecord(initialRecord) : null);
    if (!record) return;
    activeRequests.current.add(id);
    setProcessing((prev) => ({ ...prev, [id]: action }));
    updateRecord(id, { processError: null });
    try {
      const result = await callAI(action, {
        text: record.text || '',
        note: record.text || '',
        photoDataUrl: record.photoDataUrl || '',
        tone,
        direction,
        selectedText: selectedOutput(record)?.text || '',
        question: record.continuationQuestion || '',
        notes: record.notes.slice(-10).map((note) => note.text),
      });
      if (!recordsRef.current.some((r) => r.id === id)) return;
      setAiSource(result.source);
      const createdAt = new Date().toISOString();
      const outputs = (result.data.items || [])
        .filter((text) => typeof text === 'string' && text.trim())
        .map((text) => ({
          id: uid('o'),
          text,
          kind: action,
          tone,
          direction,
          source: result.source,
          createdAt,
        }));
      if (!outputs.length) throw new Error('这次没有生成可用内容，可以换个方向重试');
      updateRecord(id, (latest) => ({
        outputs: [...latest.outputs, ...outputs],
        tone,
        direction,
        processError: null,
      }));
      showToast(
        result.source === 'demo' ? '已生成演示文案，接通模型后可真实加工' : '加工好了，挑一版留下',
      );
    } catch (error) {
      updateRecord(id, { processError: { action, message: error.message || '加工失败，请重试' } });
      showToast(error.message || '加工失败，原文已留着');
    } finally {
      activeRequests.current.delete(id);
      setProcessing((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const value = {
    records,
    settings,
    ready,
    tab,
    setTab,
    selectedId,
    setSelectedId,
    composerOpen,
    setComposerOpen,
    processing,
    processRecord,
    saveState,
    loadExamples,
    toast,
    showToast,
    aiSource,
    setAiSource,
    addRecord,
    updateRecord,
    removeRecord,
    markNotified,
    clearRecords,
    updateSettings,
    addTag,
    renameTag,
    removeTag,
    setPosterOfDay,
    exportJSON,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

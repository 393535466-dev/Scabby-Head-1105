import React, { useEffect, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { TONES, DIRECTIONS, DIRECTION_HINT } from '../lib/constants.js';
import { uid, clip, fileToCompressedDataUrl } from '../lib/utils.js';
import { localInputToISO, quickReminderLocal, dateTimeLabel, todayKey } from '../lib/time.js';
import ChipGroup from '../components/ChipGroup.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Icon from '../components/Icons.jsx';

export default function RecordTab() {
  const { records, settings, addRecord, removeRecord, updateRecord, setTab, setSelectedId, showToast } = useStore();
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState('');
  const [tone, setTone] = useState(settings.defaultTone);
  const [direction, setDirection] = useState(settings.defaultDirection);
  const [remindLocal, setRemindLocal] = useState('');
  const [busyPhoto, setBusyPhoto] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => { setTone(settings.defaultTone); }, [settings.defaultTone]);
  useEffect(() => { setDirection(settings.defaultDirection); }, [settings.defaultDirection]);

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusyPhoto(true);
    try {
      const url = await fileToCompressedDataUrl(file);
      setPhoto(url);
    } catch {
      showToast('这张照片读不出来，换一张试试');
    } finally {
      setBusyPhoto(false);
      e.target.value = '';
    }
  };

  const save = (goStudio) => {
    if (!text.trim() && !photo) {
      showToast('先写点什么，或传张照片');
      return;
    }
    const rec = {
      id: uid(),
      kind: photo ? 'photo' : 'text',
      text: text.trim(),
      photoDataUrl: photo || '',
      createdAt: new Date().toISOString(),
      dateKey: todayKey(),
      tone,
      direction,
      outputs: [],
      caption: '',
      tags: [],
      remindAt: remindLocal ? localInputToISO(remindLocal) : '',
      notified: false,
      remindDone: false,
      poster: null,
    };
    addRecord(rec);
    setText('');
    setPhoto('');
    setRemindLocal('');
    if (goStudio) {
      setSelectedId(rec.id);
      setTab('studio');
      showToast('已存下，去加工台');
    } else {
      showToast('存好了，想法先放着');
    }
  };

  const openStudio = (id) => { setSelectedId(id); setTab('studio'); };

  const now = Date.now();
  const due = records
    .filter((r) => r.remindAt && !r.remindDone && new Date(r.remindAt).getTime() <= now + 3600000)
    .sort((a, b) => new Date(a.remindAt) - new Date(b.remindAt));

  return (
    <div className="page">
      <section className="card composer">
        <div className="section-head">
          <h2>写点什么</h2>
          <span className="muted small">文字为主，照片可选</span>
        </div>
        <textarea
          className="note-input"
          rows={4}
          maxLength={1000}
          placeholder="刚想到的、刚看到的、刚吃到的…随手写一句就行"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="composer-foot">
          <span className="counter">{text.length} / 1000</span>
          <label className="photo-btn">
            <Icon name="image" size={18} />
            {busyPhoto ? '处理中…' : '加张照片'}
            <input type="file" accept="image/*" onChange={handlePhoto} hidden />
          </label>
        </div>
        {photo && (
          <div className="photo-preview">
            <img src={photo} alt="待保存的照片" />
            <button type="button" className="icon-btn" onClick={() => setPhoto('')} aria-label="移除照片">
              <Icon name="close" size={18} />
            </button>
          </div>
        )}

        <div className="field">
          <label>语气</label>
          <ChipGroup options={TONES} value={tone} onChange={setTone} />
        </div>
        <div className="field">
          <label>本次推演方向</label>
          <ChipGroup options={DIRECTIONS} value={direction} onChange={setDirection} />
          <p className="hint">{DIRECTION_HINT[direction]} · 只影响这一次加工，不是气味标签</p>
        </div>
        <div className="field">
          <label>提醒（可选）</label>
          <div className="row">
            <input
              className="text-input"
              type="datetime-local"
              value={remindLocal}
              onChange={(e) => setRemindLocal(e.target.value)}
            />
            {remindLocal && <button type="button" className="link-btn" onClick={() => setRemindLocal('')}>清除</button>}
          </div>
          <div className="quick-row">
            <button type="button" onClick={() => setRemindLocal(quickReminderLocal('1h'))}>1 小时后</button>
            <button type="button" onClick={() => setRemindLocal(quickReminderLocal('tonight'))}>今晚 21:00</button>
            <button type="button" onClick={() => setRemindLocal(quickReminderLocal('morning'))}>明早 9:00</button>
          </div>
          <p className="hint">到点会在下面高亮；页面开着且已授权通知时会弹一条浏览器提醒。</p>
        </div>

        <div className="actions">
          <button type="button" className="btn ghost" onClick={() => save(false)}>存一条</button>
          <button type="button" className="btn primary" onClick={() => save(true)}>
            存下并去加工 <Icon name="arrowRight" size={18} />
          </button>
        </div>
      </section>

      {due.length > 0 && (
        <section className="due-section">
          <div className="section-head">
            <h2>到期提醒</h2>
            <span className="muted small">{due.length} 条</span>
          </div>
          {due.map((r) => {
            const overdue = new Date(r.remindAt).getTime() <= now;
            return (
              <div className="due-card" key={r.id}>
                <div className="due-main" onClick={() => openStudio(r.id)} role="button" tabIndex={0}>
                  <span className={`due-badge ${overdue ? 'overdue' : ''}`}>
                    <Icon name="bell" size={14} />{overdue ? '已到期' : '即将到期'}
                  </span>
                  <span className="due-time">{dateTimeLabel(r.remindAt)}</span>
                  <p>{clip(r.text || '一张照片', 50)}</p>
                </div>
                <button type="button" className="btn tiny" onClick={() => updateRecord(r.id, { remindDone: true })}>标记完成</button>
              </div>
            );
          })}
        </section>
      )}

      <section className="list-section">
        <div className="section-head">
          <h2>最近记录</h2>
          {records.length > 0 && <span className="muted small">共 {records.length} 条 · 点卡片去加工</span>}
        </div>
        {records.length === 0 ? (
          <EmptyState icon="note" title="还没有记录" desc="随手写一句，之后可以延展、配文、贴标签，也能在日历里回看。" />
        ) : (
          <div className="record-list">
            {records.slice(0, 20).map((r) => (
              <div className="record-card" key={r.id} onClick={() => openStudio(r.id)} role="button" tabIndex={0}>
                <div className="record-top">
                  <span className="time">{dateTimeLabel(r.createdAt)}</span>
                  <span className="pill">{r.tone || '温和'}</span>
                  <span className="pill alt">{r.direction || '正经好用'}</span>
                  <button
                    type="button"
                    className="icon-btn danger"
                    aria-label="删除这条记录"
                    onClick={(e) => { e.stopPropagation(); setPendingDelete(r); }}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
                {r.photoDataUrl && <img className="thumb" src={r.photoDataUrl} alt="记录照片" />}
                <p className="record-text">{clip(r.text || '（只有一张照片）', 80)}</p>
                <div className="record-bottom">
                  {(r.tags || []).map((t) => <span className="tag" key={t}>{t}</span>)}
                  <span className="muted small">{(r.outputs || []).length} 条加工</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={!!pendingDelete}
        title="删掉这条记录？"
        message={`「${clip(pendingDelete?.text || '一张照片', 30)}」会从本机永久删除，建议先导出 JSON 备份。`}
        confirmText="删除"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => { removeRecord(pendingDelete.id); setPendingDelete(null); showToast('已删除'); }}
      />
    </div>
  );
}

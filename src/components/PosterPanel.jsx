import React, { useEffect, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { callAI } from '../lib/ai.js';
import { composePoster } from '../lib/canvas.js';
import { clip, downloadDataUrl } from '../lib/utils.js';
import { todayKey, dayLabel } from '../lib/time.js';
import ConfirmDialog from './ConfirmDialog.jsx';
import EmptyState from './EmptyState.jsx';
import Icon from './Icons.jsx';

/** 今日最臭：选一条当日记录 → 用户确认 → 生成文案 → Canvas 海报可保存 */
export default function PosterPanel({ tone, direction }) {
  const { records, settings, setPosterOfDay, updateRecord, showToast, setAiSource, setTab } = useStore();
  const day = todayKey();
  const todayRecords = records.filter((r) => r.dateKey === day);
  const saved = settings.dailyPoster?.[day];
  const [picked, setPicked] = useState(saved?.recordId || '');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [posterUrl, setPosterUrl] = useState('');
  const [copy, setCopy] = useState(saved || null);

  useEffect(() => {
    if (!picked && todayRecords.length) setPicked(todayRecords[0].id);
  }, [picked, todayRecords.length]);

  useEffect(() => {
    if (!saved || posterUrl) return;
    const rec = records.find((r) => r.id === saved.recordId);
    composePoster({
      ...saved,
      dateText: day.replace(/-/g, ' / '),
      recordText: rec?.text || '',
      photoDataUrl: rec?.photoDataUrl || '',
    }).then(setPosterUrl).catch(() => {});
  }, [saved, posterUrl, records, day]);

  const generate = async () => {
    const rec = todayRecords.find((r) => r.id === picked) || todayRecords[0];
    if (!rec) return;
    setConfirmOpen(false);
    setBusy(true);
    try {
      const result = await callAI('poster', { text: rec.text || '', tone, direction });
      setAiSource(result.source);
      if (result.degraded) showToast('AI 暂不可用，已用演示文案顶上');
      const data = {
        recordId: rec.id,
        title: result.data.title,
        body: result.data.body,
        footer: result.data.footer,
        tone,
        direction,
        createdAt: new Date().toISOString(),
      };
      setCopy(data);
      setPosterOfDay(day, data);
      updateRecord(rec.id, { poster: data });
      const url = await composePoster({
        ...data,
        dateText: day.replace(/-/g, ' / '),
        recordText: rec.text || '',
        photoDataUrl: rec.photoDataUrl || '',
      });
      setPosterUrl(url);
      showToast('海报已生成，可以保存了');
    } catch (err) {
      showToast(err.message || '海报生成失败');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card poster-panel">
      <div className="section-head">
        <h2>今日最臭</h2>
        <span className="muted small">{dayLabel(day)}</span>
      </div>
      <p className="hint">从今天的记录里挑一条，确认后生成打卡海报文案并合成图片。语气与推演方向沿用本次加工设置。</p>

      {todayRecords.length === 0 ? (
        <EmptyState icon="sun" title="今天还没记" desc="先去「记一下」写一条，回来就能打卡。" actionText="去记一条" onAction={() => setTab('record')} />
      ) : (
        <>
          <div className="picker-list">
            {todayRecords.map((r) => (
              <button type="button" key={r.id} className={`picker-row ${picked === r.id ? 'active' : ''}`} onClick={() => setPicked(r.id)}>
                <span className="radio">{picked === r.id && <Icon name="check" size={14} />}</span>
                {r.photoDataUrl && <img className="picker-thumb" src={r.photoDataUrl} alt="" />}
                <span className="picker-text">{clip(r.text || '一张照片', 46)}</span>
              </button>
            ))}
          </div>
          <button type="button" className="btn primary full" disabled={busy} onClick={() => setConfirmOpen(true)}>
            {busy ? '生成中…' : saved ? '换一条，重新生成' : '确认选它，生成海报'}
          </button>

          {copy && (
            <div className="poster-copy">
              <div className="poster-title">{copy.title}</div>
              <p>{copy.body}</p>
              <span className="muted small">{copy.footer} · {copy.tone} / {copy.direction}</span>
            </div>
          )}
          {posterUrl && (
            <>
              <img className="preview-img" src={posterUrl} alt="今日最臭海报预览" />
              <button type="button" className="btn ghost full" onClick={() => downloadDataUrl(posterUrl, `臭脑子-今日最臭-${day}.png`)}>
                <Icon name="download" size={18} />保存海报 PNG
              </button>
            </>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="用这条做今日最臭？"
        message="会按当前语气与推演方向生成海报文案，并合成一张可保存的打卡海报。"
        confirmText="确认生成"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={generate}
      />
    </section>
  );
}

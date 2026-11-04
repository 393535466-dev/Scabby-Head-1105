import React, { useEffect, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { TONES, DIRECTIONS, DIRECTION_HINT } from '../lib/constants.js';
import { callAI } from '../lib/ai.js';
import { composePostcard } from '../lib/canvas.js';
import { uid, clip, copyText, downloadDataUrl } from '../lib/utils.js';
import { dateTimeLabel, todayKey } from '../lib/time.js';
import ChipGroup from '../components/ChipGroup.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Icon from '../components/Icons.jsx';
import PosterPanel from '../components/PosterPanel.jsx';

export default function StudioTab() {
  const { records, settings, selectedId, setSelectedId, updateRecord, addTag, showToast, setAiSource, setTab } = useStore();
  const record = records.find((r) => r.id === selectedId) || records[0] || null;

  const [tone, setTone] = useState(settings.defaultTone);
  const [direction, setDirection] = useState(settings.defaultDirection);
  const [busy, setBusy] = useState('');
  const [caption, setCaption] = useState('');
  const [postcardUrl, setPostcardUrl] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    setTone(record?.tone || settings.defaultTone);
    setDirection(record?.direction || settings.defaultDirection);
    setCaption(record?.caption || '');
    setPostcardUrl('');
    setSuggestions([]);
  }, [record?.id]); // 切换记录时重置本次加工设置

  if (!record) {
    return (
      <div className="page">
        <EmptyState icon="sparkles" title="加工台还空着" desc="先去「记一下」写一条随手记或传张照片，再回来延展、配文、贴标签。" actionText="去记一条" onAction={() => setTab('record')} />
      </div>
    );
  }

  const run = async (action) => {
    setBusy(action);
    try {
      const result = await callAI(action, {
        text: record.text || '',
        note: record.text || '',
        tone,
        direction,
        photoDataUrl: record.photoDataUrl || '',
      });
      setAiSource(result.source);
      if (result.degraded) showToast('AI 暂不可用，已用演示文案顶上');
      const list = (result.data.items || []).filter(Boolean).slice(0, action === 'extend' ? 5 : 3);
      const stamp = new Date().toISOString();
      updateRecord(record.id, {
        outputs: [
          ...(record.outputs || []),
          ...list.map((t) => ({ id: uid('o'), text: t, kind: action, tone, direction, createdAt: stamp })),
        ],
      });
      if (action === 'caption') {
        setCaption(list[0] || '');
        updateRecord(record.id, { caption: list[0] || '' });
        setPostcardUrl('');
      }
      showToast(action === 'extend' ? `已生成并保存 ${list.length} 条延展` : '配文已生成并保存');
    } catch (err) {
      showToast(err.message || '加工失败，稍后再试');
    } finally {
      setBusy('');
    }
  };

  const suggest = async () => {
    setBusy('tags');
    try {
      const result = await callAI('suggestTags', {
        existing: settings.tags,
        recent: records.slice(0, 15).map((r) => r.text || '（照片）'),
      });
      setAiSource(result.source);
      const list = (result.data.tags || []).filter((t) => !settings.tags.includes(t));
      setSuggestions(list);
      showToast(list.length ? '挑一个加进你的气味标签' : '暂时没有新建议');
    } catch (err) {
      showToast(err.message || '建议失败');
    } finally {
      setBusy('');
    }
  };

  const toggleTag = (t) => {
    const has = (record.tags || []).includes(t);
    updateRecord(record.id, { tags: has ? (record.tags || []).filter((x) => x !== t) : [...(record.tags || []), t] });
  };

  const acceptTag = (t) => {
    addTag(t);
    if (!(record.tags || []).includes(t)) updateRecord(record.id, { tags: [...(record.tags || []), t] });
    setSuggestions((prev) => prev.filter((x) => x !== t));
    showToast(`已添加「${t}」`);
  };

  const removeOutput = (id) => updateRecord(record.id, { outputs: (record.outputs || []).filter((o) => o.id !== id) });

  const makePostcard = async () => {
    if (!caption) { showToast('先生成或选一条配文'); return; }
    setBusy('postcard');
    try {
      const url = await composePostcard({
        photoDataUrl: record.photoDataUrl || '',
        caption,
        dateText: todayKey().replace(/-/g, ' / '),
        tone,
        direction,
      });
      setPostcardUrl(url);
      showToast('明信片已合成，可以下载了');
    } catch {
      showToast('合成失败，换张照片试试');
    } finally {
      setBusy('');
    }
  };

  const outputs = (record.outputs || []).slice().reverse();

  return (
    <div className="page">
      <div className="picker-scroll" aria-label="选择记录">
        {records.slice(0, 12).map((r) => (
          <button type="button" key={r.id} className={`picker-chip ${r.id === record.id ? 'active' : ''}`} onClick={() => setSelectedId(r.id)}>
            {r.photoDataUrl && <img src={r.photoDataUrl} alt="" />}
            {clip(r.text || '一张照片', 14)}
          </button>
        ))}
      </div>

      <section className="card">
        <div className="section-head">
          <h2>正在加工</h2>
          <span className="muted small">{dateTimeLabel(record.createdAt)}</span>
        </div>
        {record.photoDataUrl && <img className="hero-photo" src={record.photoDataUrl} alt="记录照片" />}
        <p className="hero-text">{record.text || '（只有一张照片，没写文字）'}</p>
        <div className="meta-row">
          <span className="pill">{record.tone}</span>
          <span className="pill alt">{record.direction}</span>
          {(record.tags || []).map((t) => <span className="tag" key={t}>{t}</span>)}
        </div>
      </section>

      <section className="card">
        <div className="section-head"><h2>这次怎么加工</h2></div>
        <div className="field">
          <label>语气（本次覆盖默认值）</label>
          <ChipGroup options={TONES} value={tone} onChange={setTone} />
        </div>
        <div className="field">
          <label>推演方向（只影响这一次）</label>
          <ChipGroup options={DIRECTIONS} value={direction} onChange={setDirection} />
          <p className="hint">{DIRECTION_HINT[direction]} · 气味标签是长期画像，两者分开</p>
        </div>
        <div className="actions">
          <button type="button" className="btn primary" disabled={!!busy} onClick={() => run('extend')}>
            {busy === 'extend' ? '延展中…' : '延展点子（3~5 条）'}
          </button>
          <button type="button" className="btn ghost" disabled={!!busy} onClick={() => run('caption')}>
            {busy === 'caption' ? '配文中…' : '生成配文'}
          </button>
        </div>
      </section>

      <section className="card">
        <div className="section-head">
          <h2>已保存的加工</h2>
          <span className="muted small">{outputs.length} 条</span>
        </div>
        {outputs.length === 0 ? (
          <EmptyState icon="sparkles" title="还没有加工结果" desc="点上面的「延展点子」或「生成配文」，结果会自动存进这条记录。" />
        ) : (
          <div className="output-list">
            {outputs.map((o) => (
              <div className={`output-row ${o.kind === 'caption' && caption === o.text ? 'selected' : ''}`} key={o.id}>
                <div className="output-meta">
                  <span className={`pill ${o.kind === 'caption' ? 'alt' : ''}`}>{o.kind === 'caption' ? '配文' : '延展'}</span>
                  <span className="muted small">{o.tone} · {o.direction}</span>
                </div>
                <p>{o.text}</p>
                <div className="output-actions">
                  <button type="button" className="link-btn" onClick={() => copyText(o.text).then((ok) => showToast(ok ? '已复制' : '复制失败'))}>复制</button>
                  {o.kind === 'caption' && (
                    <button type="button" className="link-btn" onClick={() => { setCaption(o.text); updateRecord(record.id, { caption: o.text }); setPostcardUrl(''); }}>设为配文</button>
                  )}
                  <button type="button" className="link-btn danger" onClick={() => removeOutput(o.id)}>删除</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {caption && (
        <section className="card">
          <div className="section-head"><h2>图文明信片</h2><Icon name="image" size={20} /></div>
          <p className="hint">当前配文：{clip(caption, 60)}</p>
          <button type="button" className="btn ghost full" disabled={!!busy} onClick={makePostcard}>
            {busy === 'postcard' ? '合成中…' : '合成明信片'}
          </button>
          {postcardUrl && (
            <>
              <img className="preview-img" src={postcardUrl} alt="明信片预览" />
              <button type="button" className="btn primary full" onClick={() => downloadDataUrl(postcardUrl, `臭脑子-明信片-${record.id}.png`)}>
                <Icon name="download" size={18} />下载明信片 PNG
              </button>
            </>
          )}
        </section>
      )}

      <section className="card">
        <div className="section-head"><h2>气味标签</h2><Icon name="tag" size={20} /></div>
        <p className="hint">长期个人画像标签，可以打在记录上，日历里能按它筛选。跟本次推演方向无关。</p>
        <div className="chip-group">
          {settings.tags.map((t) => (
            <button type="button" key={t} className={`chip ${(record.tags || []).includes(t) ? 'active' : ''}`} onClick={() => toggleTag(t)}>{t}</button>
          ))}
        </div>
        <button type="button" className="btn ghost full" disabled={!!busy} onClick={suggest}>
          <Icon name="refresh" size={18} />{busy === 'tags' ? '建议中…' : '根据历史记录自动建议'}
        </button>
        {suggestions.length > 0 && (
          <div className="suggest-box">
            <span className="muted small">点一下就加进标签库并打在这条记录上：</span>
            <div className="chip-group">
              {suggestions.map((t) => (
                <button type="button" key={t} className="chip suggest" onClick={() => acceptTag(t)}>+ {t}</button>
              ))}
            </div>
          </div>
        )}
      </section>

      <PosterPanel tone={tone} direction={direction} />
    </div>
  );
}

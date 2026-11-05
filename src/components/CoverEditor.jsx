import React, { useEffect, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { selectedOutput } from '../lib/records.js';
import { composeCover } from '../lib/canvas.js';
import { callAI } from '../lib/ai.js';
import { todayKey } from '../lib/time.js';
import { clip, downloadDataUrl } from '../lib/utils.js';
import Icon from './Icons.jsx';

export default function CoverEditor({ record, tone, direction, onBack, onDone }) {
  const { updateRecord, setPosterOfDay, setAiSource, showToast } = useStore();
  const output = selectedOutput(record);
  const [title, setTitle] = useState(
    record.cover?.title ||
      output?.text ||
      record.poster?.title ||
      record.caption ||
      clip(record.text, 45),
  );
  const [body, setBody] = useState(record.cover?.body || record.poster?.body || '');
  const [includeOriginal, setIncludeOriginal] = useState(record.cover?.includeOriginal || false);
  const [includePhoto, setIncludePhoto] = useState(
    record.cover?.includePhoto ?? Boolean(record.photoDataUrl),
  );
  const [source, setSource] = useState(record.cover?.source || output?.source || 'manual');
  const [preview, setPreview] = useState('');
  const [rendering, setRendering] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [renderError, setRenderError] = useState('');
  const day = todayKey();

  useEffect(() => {
    let active = true;
    setRendering(true);
    setRenderError('');
    composeCover({
      title: title.trim() || '想留哪一句？',
      body,
      dateText: day.replaceAll('-', '.'),
      recordText: includeOriginal ? clip(record.text, 240) : '',
      photoDataUrl: includePhoto ? record.photoDataUrl : '',
      tag: record.tags[0] || '',
    })
      .then((url) => {
        if (active) setPreview(url);
      })
      .catch(() => {
        if (active) setRenderError('封面没合成成功，可以先关闭照片后重试');
      })
      .finally(() => {
        if (active) setRendering(false);
      });
    return () => {
      active = false;
    };
  }, [
    title,
    body,
    includeOriginal,
    includePhoto,
    record.text,
    record.photoDataUrl,
    record.tags,
    day,
  ]);

  const generate = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await callAI('poster', {
        text: record.text || '',
        tone,
        direction,
        selectedText: output?.text || '',
        notes: record.notes.slice(-10).map((note) => note.text),
      });
      setAiSource(result.source);
      setSource(result.source);
      setTitle(result.data.title || '今天记了一笔');
      setBody(result.data.body || '');
      if (result.source === 'demo') showToast('本次使用演示文案');
    } catch (err) {
      setError(err.message || '标题暂时没生成出来，可以直接自己写');
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    if (!title.trim()) {
      setError('给封面留一句话吧');
      return;
    }
    const cover = {
      title: title.trim(),
      body: body.trim(),
      includeOriginal,
      includePhoto,
      tone,
      direction,
      source,
      dateKey: day,
      createdAt: new Date().toISOString(),
      sourceOutputId: record.selectedOutputId || '',
    };
    updateRecord(record.id, { cover });
    setPosterOfDay(day, { ...cover, recordId: record.id });
    showToast('今天的封面选好了，原文也留着');
    onDone();
  };

  return (
    <div className="cover-editor">
      <button type="button" className="text-back" onClick={onBack}>
        <Icon name="chevronLeft" size={17} />
        回到记录
      </button>
      <div className="cover-intro">
        <p className="eyebrow">THIS LITTLE MOMENT</p>
        <h3>今天，留这一句。</h3>
        <p>挑一句喜欢的，也可以自己改。</p>
      </div>
      <div className="cover-preview-wrap">
        {preview ? (
          <img className="cover-preview" src={preview} alt="封面预览" />
        ) : (
          <div className="cover-loading">正在合成封面…</div>
        )}
        {source === 'demo' && <span className="demo-chip">演示文案</span>}
      </div>
      <label className="field">
        封面上的话
        <textarea
          className="text-input"
          aria-label="封面上的话"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={120}
          rows={3}
          disabled={busy}
        />
      </label>
      <label className="field">
        再补一句，可留空
        <textarea
          className="text-input"
          aria-label="封面副文案"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={180}
          rows={2}
          disabled={busy}
        />
      </label>
      <div className="cover-options">
        <label>
          <input
            type="checkbox"
            checked={includeOriginal}
            onChange={(event) => setIncludeOriginal(event.target.checked)}
          />
          带上原文摘要
        </label>
        {record.photoDataUrl && (
          <label>
            <input
              type="checkbox"
              checked={includePhoto}
              onChange={(event) => setIncludePhoto(event.target.checked)}
            />
            带上照片
          </label>
        )}
        <button type="button" className="link-btn" disabled={busy} onClick={generate}>
          {busy ? '正在想…' : '帮我换个标题'}
        </button>
      </div>
      {(error || renderError) && (
        <p className="form-error" role="alert">
          {renderError || error}
        </p>
      )}
      <div className="cover-submit">
        <button
          type="button"
          className="btn primary"
          disabled={!title.trim() || busy || rendering || Boolean(renderError)}
          onClick={save}
        >
          选作今天的封面 <Icon name="check" size={17} />
        </button>
        <button
          type="button"
          className="btn ghost"
          disabled={!preview || rendering || busy || Boolean(renderError)}
          onClick={() => downloadDataUrl(preview, `臭脑子-封面-${day}.png`)}
        >
          <Icon name="download" size={17} />
          保存图片
        </button>
      </div>
    </div>
  );
}

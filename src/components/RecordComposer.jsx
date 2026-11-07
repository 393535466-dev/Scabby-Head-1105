import React, { useCallback, useRef, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { fileToCompressedDataUrl, uid } from '../lib/utils.js';
import { todayKey } from '../lib/time.js';
import { validateReminder } from '../lib/reminders.js';
import Sheet from './Sheet.jsx';
import Icon from './Icons.jsx';
import TonePicker from './TonePicker.jsx';
import ReminderTimeField from './ReminderTimeField.jsx';
import useVoiceInput from '../lib/useVoiceInput.js';

export default function RecordComposer() {
  const { settings, addRecord, setComposerOpen, setSelectedId, showToast, processRecord } =
    useStore();
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState('');
  const [reminder, setReminder] = useState('');
  const [mode, setMode] = useState('record');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);
  const [tone, setTone] = useState(settings.defaultTone);
  const direction = settings.defaultDirection;
  const [action, setAction] = useState('rewrite');
  const [tags, setTags] = useState([]);
  const [inputMethod, setInputMethod] = useState('text');
  const voice = useVoiceInput({
    text,
    onText: setText,
    onRecognized: () => setInputMethod('voice'),
  });
  const fileRef = useRef(null);
  const submitted = useRef(false);
  const close = useCallback(() => {
    voice.stop();
    if (text.trim() || photo || reminder || busy || voice.active) setConfirmClose(true);
    else setComposerOpen(false);
  }, [text, photo, reminder, busy, setComposerOpen, voice.stop, voice.active]);

  const pickPhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('选一张图片试试');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('照片有点大，换一张 20 MB 以内的吧');
      return;
    }
    setBusy(true);
    setError('');
    try {
      setPhoto(await fileToCompressedDataUrl(file));
    } catch {
      setError('照片读不出来，换一张试试');
    } finally {
      setBusy(false);
      event.target.value = '';
    }
  };

  const save = (withAI = false) => {
    if (busy || voice.active || submitted.current) return;
    let remindAt = '';
    if (mode === 'reminder') {
      if (!text.trim()) { setError('写一句要提醒的事，或用语音输入。'); return; }
      const result = validateReminder(reminder);
      if (result.error) { setError(result.error); return; }
      remindAt = result.iso;
      withAI = false;
    }
    if (!text.trim() && !photo) {
      setError('先写一句，或者加张照片');
      return;
    }
    const id = uid();
    submitted.current = true;
    const record = {
      id,
      entryType: mode,
      kind: photo ? 'photo' : 'text',
      text: text.trim(),
      photoDataUrl: photo,
      createdAt: new Date().toISOString(),
      dateKey: todayKey(),
      tone,
      direction,
      tags,
      inputMethod,
      outputs: [],
      remindAt,
      remindDone: false,
      notified: false,
    };
    addRecord(record);
    setComposerOpen(false);
    setSelectedId(id);
    showToast(mode === 'reminder' ? '提醒设好了，已放进对应日期的日历' : withAI ? '原文记下了，正在按你的语气加工' : '记下了，想加工时再回来');
    if (withAI)
      processRecord(id, photo ? 'caption' : action, { tone, direction, initialRecord: record });
  };

  return (
    <Sheet title="记一笔" onClose={close} className="composer-sheet">
      {confirmClose ? (
        <div className="draft-confirm">
          <h3>这条还没记下</h3>
          <p>可以接着写，也可以放弃这次输入。</p>
          <div className="actions">
            <button type="button" className="btn ghost" onClick={() => setConfirmClose(false)}>
              接着写
            </button>
            <button
              type="button"
              className="btn danger-outline"
              onClick={() => setComposerOpen(false)}
            >
              放弃输入
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save(true);
          }}
        >
          <label className="sr-only" htmlFor="record-input">
            {mode === 'reminder' ? '提醒内容' : '随手记'}
          </label>
          <textarea
            id="record-input"
            className="capture-input"
            data-initial-focus
            autoFocus
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={1000}
            placeholder={mode === 'reminder' ? '到了时间，要提醒自己做什么？' : '不用想好，先从这句话开始…'}
            rows={3}
            readOnly={voice.active}
          />
          {photo && (
            <div className="photo-preview">
              <img src={photo} alt="待保存的照片" />
              <button
                type="button"
                className="icon-btn"
                aria-label="移除照片"
                onClick={() => setPhoto('')}
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          )}
          <div className="capture-tools">
            <button
              type="button"
              className={`capture-tool voice-tool ${voice.active ? 'listening' : ''}`}
              aria-pressed={voice.active}
              disabled={!voice.supported || busy || voice.phase === 'stopping'}
              onClick={voice.active ? voice.stop : voice.start}
            >
              <Icon name="mic" size={20} />
              {voice.phase === 'starting'
                ? '正在打开麦克风…'
                : voice.phase === 'stopping'
                  ? '识别收尾中…'
                  : voice.active
                    ? '停止说话'
                    : '语音输入'}
            </button>
            <button
              type="button"
              className="capture-tool"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              <Icon name="image" size={20} />
              {busy ? '读取中…' : '加照片'}
            </button>
            <span className="muted small">{text.length} / 1000</span>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickPhoto} />
          </div>
          <div className="voice-feedback" aria-live="polite">
            {voice.interim ||
              voice.message ||
              (voice.active
                ? '正在听，结束后文字会留在上面。'
                : !voice.supported
                  ? '当前浏览器未开放语音识别。可换用支持语音识别的浏览器，或使用手机键盘的麦克风输入。'
                  : '使用浏览器的语音识别服务，转成文字后可修改。')}
          </div>
          <div className="capture-mode" role="group" aria-label="记录类型">
            {[['record', '记录', 'note'], ['reminder', '提醒', 'bell']].map(([value, label, icon]) => (
              <button key={value} type="button" aria-pressed={mode === value} className={mode === value ? 'active' : ''}
                onClick={() => { setMode(value); setError(''); }}><Icon name={icon} size={18} />{label}</button>
            ))}
          </div>
          {mode === 'record' ? <section className="capture-personality">
            <div className="section-head">
              <h3>这次，想怎么说？</h3>
              <span>随时能改</span>
            </div>
            <TonePicker value={tone} onChange={setTone} />
            {!photo && (
              <div className="capture-task" role="group" aria-label="加工方式">
                <button
                  type="button"
                  aria-pressed={action === 'rewrite'}
                  className={action === 'rewrite' ? 'active' : ''}
                  onClick={() => setAction('rewrite')}
                >
                  换个说法
                </button>
                <button
                  type="button"
                  aria-pressed={action === 'extend'}
                  className={action === 'extend' ? 'active' : ''}
                  onClick={() => setAction('extend')}
                >
                  延展点子
                </button>
              </div>
            )}
          </section> : <section className="capture-schedule" aria-label="设置提醒">
            <ReminderTimeField value={reminder} onChange={(value) => { setReminder(value); setError(''); }} />
            <p className="hint">会放进应用日历，在页面打开时到点提醒。离开网页也要提醒，保存后可添加到手机日历。</p>
          </section>}
          <details className="capture-labels">
            <summary>
              加标签 <span>{tags.length ? `已选 ${tags.length} 个` : '可选'}</span>
            </summary>
            <div className="chip-group">
              {settings.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`chip ${tags.includes(tag) ? 'active' : ''}`}
                  aria-pressed={tags.includes(tag)}
                  onClick={() =>
                    setTags((prev) =>
                      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
                    )
                  }
                >
                  {tag}
                </button>
              ))}
            </div>
          </details>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="capture-submit">
            {mode === 'reminder' ? <button type="submit" className="btn primary" disabled={busy || voice.active}><Icon name="bell" size={17} />保存提醒</button> : <>
            <button
              type="button"
              className="btn ghost"
              disabled={busy || voice.active}
              onClick={() => save(false)}
            >
              只记下
            </button>
            <button type="submit" className="btn primary" disabled={busy || voice.active}>
              记下并加工 <Icon name="sparkles" size={17} />
            </button>
            </>}
          </div>
        </form>
      )}
    </Sheet>
  );
}

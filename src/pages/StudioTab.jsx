import React, { useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { DIRECTIONS, DIRECTION_HINT } from '../lib/constants.js';
import { selectedOutput } from '../lib/records.js';
import TonePicker from '../components/TonePicker.jsx';
import { copyText, uid } from '../lib/utils.js';
import { dateTimeLabel } from '../lib/time.js';
import ChipGroup from '../components/ChipGroup.jsx';
import CoverEditor from '../components/CoverEditor.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Icon from '../components/Icons.jsx';

export default function StudioTab({ record, onClose }) {
  const { settings, updateRecord, removeRecord, processing, processRecord, showToast } = useStore();
  const [tone, setTone] = useState(record.tone || settings.defaultTone);
  const [direction, setDirection] = useState(record.direction || settings.defaultDirection);
  const [question, setQuestion] = useState(record.continuationQuestion);
  const [note, setNote] = useState('');
  const [view, setView] = useState('detail');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState('');
  const [allOutputs, setAllOutputs] = useState(false);
  const busy = processing[record.id];
  const chosen = selectedOutput(record);
  const outputs = record.outputs.slice().reverse();
  const visibleOutputs = allOutputs ? outputs : outputs.slice(0, 5);
  const run = (action) => processRecord(record.id, action, { tone, direction });

  const keep = () => {
    if (!chosen) {
      setError('先在加工结果里选中一版，再留待继续');
      return;
    }
    updateRecord(record.id, {
      pending: true,
      continuationQuestion: question.trim(),
      collection: record.collection === 'archives' ? 'projects' : record.collection,
    });
    setError('');
    showToast('已收进「再思」，下次从这里继续');
  };

  const addNote = (event) => {
    event.preventDefault();
    if (!note.trim()) return;
    const savedNote = { id: uid('n'), text: note.trim(), createdAt: new Date().toISOString() };
    updateRecord(record.id, (latest) => ({ notes: [...latest.notes, savedNote] }));
    setNote('');
    showToast('补记已接在原记录后，下次加工会一起参考');
  };

  if (view === 'cover')
    return (
      <CoverEditor
        record={record}
        tone={tone}
        direction={direction}
        onBack={() => setView('detail')}
        onDone={onClose}
      />
    );

  return (
    <div className="record-detail">
      <div className="detail-meta">
        <span>{dateTimeLabel(record.createdAt)}</span>
        <div>
          {record.isExample && <span className="example-label">示例</span>}
          <span className="detail-status">
            {record.pending ? '还想接着想' : record.collection === 'archives' ? '已归档' : '已记下'}
          </span>
        </div>
      </div>
      {record.photoDataUrl && (
        <img className="detail-photo" src={record.photoDataUrl} alt="原始照片" />
      )}
      <div className="original-record">
        <span className="eyebrow">原来记下的</span>
        <p>{record.text || '一张随手拍，先留着。'}</p>
      </div>
      <div className="detail-location">
        <span className="detail-input-type">
          <Icon
            name={record.inputMethod === 'voice' ? 'mic' : record.photoDataUrl ? 'image' : 'note'}
            size={16}
          />
          {record.inputMethod === 'voice'
            ? '语音转文字'
            : record.photoDataUrl
              ? '照片记录'
              : '文字记录'}
        </span>
        <button type="button" className="link-btn" onClick={() => setView('cover')}>
          <Icon name="image" size={15} />
          {record.cover ? '看看封面' : '做张封面'}
        </button>
      </div>
      <section className="detail-section">
        <div className="section-head">
          <h3>
            <Icon name="sparkles" size={18} />
            按你的语气加工
          </h3>
          <span className="muted small">你来定调</span>
        </div>
        <TonePicker value={tone} onChange={setTone} />
        <div className="direction-picker">
          <ChipGroup options={DIRECTIONS} value={direction} onChange={setDirection} />
          <span>{DIRECTION_HINT[direction]}</span>
        </div>
        <div className="process-actions">
          <button
            type="button"
            className="btn primary"
            disabled={Boolean(busy)}
            onClick={() => run(record.photoDataUrl ? 'caption' : 'rewrite')}
          >
            <Icon
              name={busy ? 'refresh' : 'sparkles'}
              className={busy ? 'spinning' : ''}
              size={17}
            />
            {busy === 'rewrite' || busy === 'caption'
              ? '正在加工…'
              : record.photoDataUrl
                ? '给照片配文'
                : '换个说法'}
          </button>
          <button
            type="button"
            className="btn ghost"
            disabled={Boolean(busy)}
            onClick={() => run('extend')}
          >
            {busy === 'extend' ? '正在延展…' : '延展点子'}
          </button>
        </div>
        {record.processError && (
          <div className="process-error" role="alert">
            <p>{record.processError.message}</p>
            <button
              type="button"
              className="link-btn"
              disabled={Boolean(busy)}
              onClick={() => run(record.processError.action)}
            >
              再试一次
            </button>
          </div>
        )}
        {record.outputs.length === 0 && !busy && (
          <p className="quiet-note">先存着也很好，有空再来加工。</p>
        )}
        {record.notes.length > 0 && (
          <p className="context-hint">
            <Icon name="check" size={13} />
            下次加工会参考原文、选中版本和 {record.notes.length} 条补记。
          </p>
        )}
        <div className="output-list" aria-live="polite">
          {visibleOutputs.map((output) => (
            <article
              key={output.id}
              className={`output-row ${record.selectedOutputId === output.id ? 'selected' : ''}`}
            >
              <div className="output-meta">
                <span>
                  {output.kind === 'caption' ? '配文' : output.kind === 'rewrite' ? '改写' : '点子'}{' '}
                  · {output.direction} · {output.tone}
                </span>
                {['demo', 'example'].includes(output.source) && (
                  <span className="example-label">
                    {output.source === 'demo' ? '演示文案' : '示例'}
                  </span>
                )}
                {record.selectedOutputId === output.id && (
                  <span className="output-picked">
                    <Icon name="check" size={12} />
                    选中的版本
                  </span>
                )}
              </div>
              <p>{output.text}</p>
              <div className="output-actions">
                <button
                  type="button"
                  className={record.selectedOutputId === output.id ? 'selected-action' : ''}
                  onClick={() => {
                    updateRecord(record.id, {
                      selectedOutputId: output.id,
                      ...(output.kind === 'caption' ? { caption: output.text } : {}),
                    });
                    setError('');
                  }}
                >
                  {record.selectedOutputId === output.id ? '已选中' : '选这一版'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateRecord(record.id, { selectedOutputId: output.id });
                    setView('cover');
                  }}
                >
                  做成封面
                </button>
                <button
                  type="button"
                  aria-label="复制这版内容"
                  onClick={() =>
                    copyText(output.text).then((ok) => showToast(ok ? '已复制' : '复制失败'))
                  }
                >
                  复制
                </button>
              </div>
            </article>
          ))}
        </div>
        {outputs.length > 5 && (
          <button type="button" className="more-outputs" onClick={() => setAllOutputs(!allOutputs)}>
            {allOutputs ? '收起以前的版本' : `看看全部 ${outputs.length} 个版本`}
          </button>
        )}
      </section>
      <section className="detail-section continue-section">
        <div className="section-head">
          <h3>
            <Icon name="clock" size={18} />
            留到下次接着想
          </h3>
          {record.pending && <span className="pill">已放好</span>}
        </div>
        {chosen ? (
          <p className="chosen-summary">{chosen.text}</p>
        ) : (
          <p className="hint">在上面选中一版，给下次的自己留个起点。</p>
        )}
        <label className="field">
          还想弄清楚什么，可留空
          <textarea
            aria-label="下次继续的问题"
            className="text-input"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={200}
            rows={2}
            placeholder="我还想知道…"
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="actions">
          <button type="button" className="btn primary" onClick={keep}>
            {record.pending ? '保存这个问题' : '留着接着想'}
          </button>
          {record.pending && (
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                updateRecord(record.id, {
                  pending: false,
                  collection: 'archives',
                  continuationQuestion: question.trim(),
                });
                showToast('这条先收好了，随时可以再打开');
              }}
            >
              先告一段落
            </button>
          )}
        </div>
      </section>
      <section className="detail-section">
        <div className="section-head">
          <h3>
            <Icon name="edit" size={17} />
            后来又想到
          </h3>
          <span className="muted small">{record.notes.length} 条补记</span>
        </div>
        {record.notes.length ? (
          <div className="note-timeline">
            {record.notes.map((item) => (
              <div className="note-entry" key={item.id}>
                <time>{dateTimeLabel(item.createdAt)}</time>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="hint">新发现、改主意，都可以接在这里。</p>
        )}
        <form onSubmit={addNote}>
          <label className="sr-only" htmlFor="follow-up-note">
            补记
          </label>
          <textarea
            id="follow-up-note"
            className="text-input"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="我现在觉得…"
          />
          <button type="submit" className="btn ghost full" disabled={!note.trim()}>
            补一句 <Icon name="plus" size={16} />
          </button>
        </form>
      </section>
      <section className="detail-section">
        <div className="section-head">
          <h3>
            <Icon name="tag" size={17} />
            这条的标签
          </h3>
          <span className="muted small">只用于收纳与查找</span>
        </div>
        <div className="chip-group">
          {settings.tags.map((tag) => (
            <button
              type="button"
              key={tag}
              className={`chip ${record.tags.includes(tag) ? 'active' : ''}`}
              aria-pressed={record.tags.includes(tag)}
              onClick={() =>
                updateRecord(record.id, (latest) => ({
                  tags: latest.tags.includes(tag)
                    ? latest.tags.filter((name) => name !== tag)
                    : [...latest.tags, tag],
                }))
              }
            >
              {tag}
            </button>
          ))}
        </div>
        {!settings.tags.length && <p className="hint">在个人设置里可以添加自己的标签。</p>}
      </section>
      <div className="detail-bottom">
        <span>原文和每次选择，都好好留着。</span>
        <button
          type="button"
          className="icon-btn danger"
          aria-label="删除这条记录"
          onClick={() => setDeleteOpen(true)}
        >
          <Icon name="trash" size={17} />
        </button>
      </div>
      <ConfirmDialog
        open={deleteOpen}
        title="删除这条记录？"
        message="原文、加工版本、补记和封面会一并删除。可以先在个人设置里导出备份。"
        confirmText="删除记录"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          removeRecord(record.id);
          onClose();
          showToast('已删除这条记录');
        }}
      />
    </div>
  );
}

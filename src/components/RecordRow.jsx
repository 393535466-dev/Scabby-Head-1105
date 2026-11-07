import React from 'react';
import { useStore } from '../lib/store.jsx';
import { selectedOutput, recordTitle } from '../lib/records.js';
import { outputToneLabel } from '../lib/constants.js';
import { reminderState } from '../lib/reminders.js';
import { clip } from '../lib/utils.js';
import { timeLabel, dateTimeLabel } from '../lib/time.js';
import Icon from './Icons.jsx';

export default function RecordRow({ record, showDate = false, scheduled = false }) {
  const { setSelectedId, processing } = useStore();
  const chosen = selectedOutput(record);
  const latest = chosen || record.outputs.at(-1);
  const state = reminderState(record);
  const isReminder = Boolean(state && (scheduled || record.entryType === 'reminder'));
  const timestamp = scheduled && state ? record.remindAt : record.createdAt;
  return (
    <button
      type="button"
      className={`entry-row ${record.cover ? 'entry-cover' : ''} ${isReminder ? `entry-reminder ${state}` : ''}`}
      aria-label={`打开${record.entryType === 'reminder' ? '提醒' : '记录'} ${clip(record.text || recordTitle(record), 35)}`}
      onClick={() => setSelectedId(record.id)}
    >
      <span className="entry-rail">
        <time dateTime={timestamp}>{showDate ? dateTimeLabel(timestamp) : timeLabel(timestamp)}</time>
        <span className="entry-dot" />
      </span>
      <span className="entry-body">
        <span className="entry-meta">
          {record.isExample && <span className="example-label">示例</span>}
          {isReminder ? '提醒' : record.inputMethod === 'voice' ? '语音转文字' : record.photoDataUrl ? '照片' : '文字'}
          {record.pending && <span className="pending-mark">待继续</span>}
        </span>
        {(record.cover?.imageDataUrl || record.photoDataUrl) && (
          <img className="entry-photo" src={record.cover?.imageDataUrl || record.photoDataUrl} alt={record.cover?.imageDataUrl ? record.cover.tone + '风格生成的图片' : '记录照片'} loading="lazy" />
        )}
        <span className="entry-original">{clip(record.text || '一张随手拍', 140)}</span>
        {record.cover?.imageDataUrl ? (
          <span className="entry-result"><span>{record.cover.tone}</span>生成图片</span>
        ) : record.cover ? (
          <span className="entry-cover-text">{record.cover.title}</span>
        ) : (
          latest && (
            <span className="entry-result">
              <span>{outputToneLabel(latest.tone)}</span>
              {clip(latest.text, 100)}
            </span>
          )
        )}
        {state && <span className={`entry-reminder-time ${state}`}><Icon name={state === 'done' ? 'check' : 'bell'} size={13} />{state === 'done' ? '已完成' : `${dateTimeLabel(record.remindAt)} · ${state === 'due' ? '已到时间' : '待提醒'}`}</span>}
        <span className="entry-footer">
          {record.tags.slice(0, 2).map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
          <span className="entry-state">
            {processing[record.id]
              ? '正在加工…'
              : record.outputs.length
                ? `${record.outputs.length} 版`
                : ''}
            <Icon name="chevronRight" size={13} />
          </span>
        </span>
      </span>
    </button>
  );
}

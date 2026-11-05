import React from 'react';
import { useStore } from '../lib/store.jsx';
import { selectedOutput, recordTitle } from '../lib/records.js';
import { normalizeTone } from '../lib/constants.js';
import { clip } from '../lib/utils.js';
import { timeLabel, dateTimeLabel } from '../lib/time.js';
import Icon from './Icons.jsx';

export default function RecordRow({ record, showDate = false }) {
  const { setSelectedId, processing } = useStore();
  const chosen = selectedOutput(record);
  const latest = chosen || record.outputs.at(-1);
  return (
    <button
      type="button"
      className={`entry-row ${record.cover ? 'entry-cover' : ''}`}
      aria-label={`打开记录 ${clip(record.text || recordTitle(record), 35)}`}
      onClick={() => setSelectedId(record.id)}
    >
      <span className="entry-rail">
        <time>{showDate ? dateTimeLabel(record.createdAt) : timeLabel(record.createdAt)}</time>
        <span className="entry-dot" />
      </span>
      <span className="entry-body">
        <span className="entry-meta">
          {record.isExample && <span className="example-label">示例</span>}
          {record.inputMethod === 'voice' ? '语音转文字' : record.photoDataUrl ? '照片' : '文字'}
          {record.pending && <span className="pending-mark">待继续</span>}
        </span>
        {record.photoDataUrl && (
          <img className="entry-photo" src={record.photoDataUrl} alt="记录照片" loading="lazy" />
        )}
        <span className="entry-original">{clip(record.text || '一张随手拍', 140)}</span>
        {record.cover ? (
          <span className="entry-cover-text">{record.cover.title}</span>
        ) : (
          latest && (
            <span className="entry-result">
              <span>{normalizeTone(latest.tone)}</span>
              {clip(latest.text, 100)}
            </span>
          )
        )}
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

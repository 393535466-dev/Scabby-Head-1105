import React from 'react';
import { useStore } from '../lib/store.jsx';
import { clip } from '../lib/utils.js';
import { timeLabel, dateTimeLabel, todayKey } from '../lib/time.js';
import { recordTitle, selectedOutput, COLLECTIONS } from '../lib/records.js';
import Icon from './Icons.jsx';

export default function RecordCard({ record, showDate = false }) {
  const { setSelectedId, processing, settings } = useStore();
  const output = selectedOutput(record);
  const collection = COLLECTIONS.find((c) => c.id === record.collection);
  const cover = record.cover;
  const isTodayCover = settings.dailyPoster[todayKey()]?.recordId === record.id;
  return (
    <button
      type="button"
      className={`timeline-card ${cover ? 'has-cover' : ''}`}
      onClick={() => setSelectedId(record.id)}
      aria-label={`打开记录 ${clip(record.text || recordTitle(record), 35)}`}
    >
      <div className="timeline-card-top">
        <span>{showDate ? dateTimeLabel(record.createdAt) : timeLabel(record.createdAt)}</span>
        <div>
          {record.isExample && <span className="example-label">示例</span>}
          <span className="card-type">
            <Icon name={cover ? 'image' : record.photoDataUrl ? 'image' : 'note'} size={12} />
            {cover ? (isTodayCover ? '今日封面' : '封面') : record.photoDataUrl ? '随手拍' : '随手记'}
          </span>
        </div>
      </div>
      {record.photoDataUrl && (!cover || cover.includePhoto !== false) && (
        <img
          className="timeline-photo"
          src={record.photoDataUrl}
          alt="记录中的照片"
          loading="lazy"
        />
      )}
      {cover ? (
        <div className="timeline-cover">
          <span className="eyebrow">留 下 今 天</span>
          <h3>{cover.title}</h3>
          {cover.body && <p>{clip(cover.body, 75)}</p>}
          <div className="cover-signature">
            臭脑子 <span>✦</span>
          </div>
        </div>
      ) : (
        <p className={`timeline-text ${output ? 'selected-text' : ''}`}>
          {clip(recordTitle(record), 180)}
        </p>
      )}
      {output && (
        <p className="original-excerpt">原来记下的 · {clip(record.text || '一张照片', 65)}</p>
      )}
      {record.pending && (
        <div className="continue-hint">
          <Icon name="sparkles" size={14} />
          <span>{clip(record.continuationQuestion || '这个念头，还想接着想', 60)}</span>
          <Icon name="arrowRight" size={15} />
        </div>
      )}
      {record.notes.length > 0 && (
        <p className="last-note">
          后来补了 · {clip(record.notes[record.notes.length - 1].text, 65)}
        </p>
      )}
      <div className="timeline-card-footer">
        <div className="card-tags">
          {record.tags.slice(0, 3).map((tag) => (
            <span key={tag}># {tag}</span>
          ))}
        </div>
        <span className="card-footnote">
          {processing[record.id] ? '正在加工…' : record.pending ? '待继续' : collection?.name}
          {record.outputs.length > 0 && ` · ${record.outputs.length} 版`}
        </span>
      </div>
    </button>
  );
}

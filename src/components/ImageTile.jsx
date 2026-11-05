import React from 'react';
import { useStore } from '../lib/store.jsx';
import { clip } from '../lib/utils.js';
import { timeLabel } from '../lib/time.js';

export default function ImageTile({ record }) {
  const { setSelectedId } = useStore();
  return (
    <button
      type="button"
      className="image-tile"
      aria-label={`打开记录 ${clip(record.text || record.cover?.title, 35)}`}
      onClick={() => setSelectedId(record.id)}
    >
      {record.photoDataUrl ? (
        <img src={record.photoDataUrl} alt="记录照片" loading="lazy" />
      ) : (
        <span className="image-cover-preview">
          <span>臭脑子</span>
          <strong>{record.cover?.title}</strong>
          <span>留 下 今 天</span>
        </span>
      )}
      <span className="image-tile-text">{clip(record.text || record.cover?.title, 34)}</span>
      <span className="image-tile-time">
        {timeLabel(record.createdAt)}
        {record.cover ? ' · 封面' : ''}
        {record.isExample ? ' · 示例' : ''}
      </span>
    </button>
  );
}

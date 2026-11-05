import React from 'react';
import { recordTags } from '../lib/records.js';

export default function TagFilter({ records, value, onChange }) {
  const tags = recordTags(records);
  if (!tags.length) return null;
  return (
    <div className="tag-filter">
      <span className="tag-filter-label">按标签选择</span>
      <div className="tag-filter-options" role="group" aria-label="按标签选择">
        <button
          type="button"
          aria-pressed={!value}
          className={!value ? 'active' : ''}
          onClick={() => onChange('')}
        >
          全部
        </button>
        {tags.map(([name, count]) => (
          <button
            type="button"
            key={name}
            aria-pressed={name === value}
            className={name === value ? 'active' : ''}
            onClick={() => onChange(name === value ? '' : name)}
          >
            {name}
            <small>{count}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

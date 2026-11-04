import React from 'react';

export default function ChipGroup({ options = [], value, onChange, size = 'md' }) {
  return (
    <div className="chip-group" role="group">
      {options.map((o) => (
        <button
          type="button"
          key={o}
          className={`chip ${value === o ? 'active' : ''} ${size === 'sm' ? 'chip-sm' : ''}`}
          onClick={() => onChange(o)}
          aria-pressed={value === o}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

import React from 'react';
import Icon from './Icons.jsx';

export default function RecordModePicker({ value, onChange, disabled = false }) {
  return <div className="capture-mode" role="group" aria-label="记录类型">
    {[['record', '记录', 'note'], ['reminder', '提醒', 'bell']].map(([mode, label, icon]) => (
      <button key={mode} type="button" aria-pressed={value === mode}
        className={value === mode ? 'active' : ''} disabled={disabled}
        onClick={() => onChange(mode)}><Icon name={icon} size={18} />{label}</button>
    ))}
  </div>;
}

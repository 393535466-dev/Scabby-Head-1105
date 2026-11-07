import React from 'react';
import { formatLocalInput, quickReminderLocal } from '../lib/time.js';

export default function ReminderTimeField({ value, onChange }) {
  return <div className="reminder-time-field">
    <label className="field">
      <span>提醒日期与时间 <small>北京时间</small></span>
      <input className="text-input" type="datetime-local" aria-label="提醒日期与时间"
        value={value} min={formatLocalInput(new Date())} step="60"
        onInput={(event) => onChange(event.currentTarget.value)}
        onChange={(event) => onChange(event.target.value)} />
    </label>
    <div className="quick-row">
      <button type="button" onClick={() => onChange(quickReminderLocal('1h'))}>1 小时后</button>
      <button type="button" onClick={() => onChange(quickReminderLocal('tomorrow'))}>明天 9 点</button>
    </div>
  </div>;
}

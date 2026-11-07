import React, { useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { fullDateTimeLabel, isoToLocalInput } from '../lib/time.js';
import { downloadReminderCalendar, reminderState, validateReminder } from '../lib/reminders.js';
import ReminderTimeField from './ReminderTimeField.jsx';
import Icon from './Icons.jsx';

export default function ReminderPanel({ record }) {
  const { updateRecord, showToast } = useStore();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const state = reminderState(record);
  if (!state) return null;
  const save = () => {
    const result = validateReminder(value);
    if (result.error) { setError(result.error); return; }
    updateRecord(record.id, { remindAt: result.iso, remindDone: false, notified: false });
    setEditing(false); setError('');
    showToast('提醒时间已更新，日历也一起改好了');
  };
  return <section className="reminder-panel" aria-label="提醒安排">
    <div className="section-head"><h3><Icon name="bell" size={18} />提醒安排</h3><span className={`reminder-status ${state}`}>{state === 'done' ? '已完成' : state === 'due' ? '已到时间' : '待提醒'}</span></div>
    <p className="reminder-datetime">{fullDateTimeLabel(record.remindAt)}<small>北京时间</small></p>
    {editing ? <div className="reminder-edit">
      <ReminderTimeField value={value} onChange={(next) => { setValue(next); setError(''); }} />
      {error && <p role="alert" className="form-error">{error}</p>}
      <div className="actions"><button type="button" className="btn primary" onClick={save}>保存时间</button><button type="button" className="btn ghost" onClick={() => { setEditing(false); setError(''); }}>取消修改</button></div>
    </div> : <div className="actions">
      <button type="button" className="btn primary" onClick={() => { updateRecord(record.id, { remindDone: !record.remindDone, notified: false }); showToast(record.remindDone ? '已恢复提醒' : '完成了，日历里会保留这件事'); }}><Icon name="check" size={17} />{record.remindDone ? '恢复提醒' : '标为完成'}</button>
      <button type="button" className="btn ghost" onClick={() => { setValue(isoToLocalInput(record.remindAt)); setEditing(true); }}>修改时间</button>
    </div>}
    {!record.remindDone && <button type="button" className="btn ghost full calendar-export" onClick={() => {
      try { downloadReminderCalendar(record); showToast('已导出日历文件，打开后确认添加即可'); }
      catch (err) { showToast(err.message || '导出失败，请重试'); }
    }}><Icon name="calendar" size={17} />添加到手机日历</button>}
    <p className="hint reminder-delivery-note">页面打开时到点提醒。离开网页也要收到提醒，可打开导出的日历文件并确认添加；若微信不能打开，可在系统浏览器中操作。之后修改或取消时，也需同步调整手机日历。</p>
    <button type="button" className="link-btn cancel-reminder" onClick={() => {
      updateRecord(record.id, { entryType: 'record', remindAt: '', remindDone: false, notified: false });
      showToast('已取消提醒，内容作为记录保留');
    }}>取消提醒，保留记录</button>
  </section>;
}

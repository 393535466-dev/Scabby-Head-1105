import React from 'react';
import ReminderPanel from './ReminderPanel.jsx';
import { dateTimeLabel } from '../lib/time.js';
import RecordModePicker from './RecordModePicker.jsx';
import { useStore } from '../lib/store.jsx';

export default function ReminderDetail({ record }) {
  const { updateRecord, showToast } = useStore();
  return <div className="record-detail reminder-detail">
    <div className="detail-meta"><span>{dateTimeLabel(record.createdAt)} 创建</span></div>
    <div className="original-record"><span className="eyebrow">要提醒的事</span><p>{record.text}</p></div>
    {record.photoDataUrl && <img className="detail-photo" src={record.photoDataUrl} alt="提醒中的照片" />}
    <RecordModePicker value="reminder" onChange={(value) => {
      if (value !== 'record') return;
      updateRecord(record.id, { entryType: 'record', remindAt: '', remindDone: false, notified: false });
      showToast('已切回记录，原文和加工版本已保留，提醒已取消');
    }} />
    <ReminderPanel record={record} />
    {record.tags.length > 0 && <p className="reminder-tags">{record.tags.map((tag) => <span key={tag}>#{tag}</span>)}</p>}
  </div>;
}

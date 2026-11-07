import React from 'react';
import ReminderPanel from './ReminderPanel.jsx';
import { dateTimeLabel } from '../lib/time.js';

export default function ReminderDetail({ record }) {
  return <div className="record-detail reminder-detail">
    <div className="detail-meta"><span>{dateTimeLabel(record.createdAt)} 创建</span></div>
    <div className="original-record"><span className="eyebrow">要提醒的事</span><p>{record.text}</p></div>
    {record.photoDataUrl && <img className="detail-photo" src={record.photoDataUrl} alt="提醒中的照片" />}
    <ReminderPanel record={record} />
    {record.tags.length > 0 && <p className="reminder-tags">{record.tags.map((tag) => <span key={tag}>#{tag}</span>)}</p>}
  </div>;
}

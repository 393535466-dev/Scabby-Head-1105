import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { todayKey, dayLabel } from '../lib/time.js';
import { recordMatches } from '../lib/records.js';
import RecordRow from '../components/RecordRow.jsx';
import ImageTile from '../components/ImageTile.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Icon from '../components/Icons.jsx';
import CalendarTab from './CalendarTab.jsx';
import PersonalWelcome from '../components/PersonalWelcome.jsx';
import BrandMark from '../components/BrandMark.jsx';

export default function RecordTab({ remindersOnly = false, query = '', onEditProfile }) {
  const { records, setComposerOpen, loadExamples, updateRecord } = useStore();
  const [selection, setFilter] = useState('');
  const filter = selection || (query.trim() ? 'all' : '');
  const scrollRef = useRef(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [filter, query]);
  const today = todayKey();
  const due = records.filter(
    (r) => r.remindAt && !r.remindDone && new Date(r.remindAt).getTime() <= Date.now(),
  );
  const visible = useMemo(
    () =>
      records.filter((r) => {
        if (remindersOnly && (!r.remindAt || r.remindDone)) return false;
        if (filter === 'text' && (!r.text || r.photoDataUrl)) return false;
        if (filter === 'images' && !r.photoDataUrl && !r.cover) return false;
        return recordMatches(r, query);
      }),
    [records, filter, query, remindersOnly],
  );
  const groups = useMemo(() => {
    const result = new Map();
    visible.forEach((r) => result.set(r.dateKey, [...(result.get(r.dateKey) || []), r]));
    return [...result.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [visible]);

  return (
    <div className="page timeline-page">
      {remindersOnly ? (
        <h2 className="page-title">提醒</h2>
      ) : (
        <nav className="feed-filters" aria-label="记录筛选">
          {[
            ['all', '全部', 'ALL'],
            ['text', '文字', 'TEXT'],
            ['images', '图片', 'PHOTOS'],
            ['calendar', '日历', 'CALENDAR'],
          ].map(([id, name, english]) => (
            <button
              type="button"
              key={id}
              aria-pressed={filter === id}
              className={filter === id ? 'active' : ''}
              onClick={() => setFilter(selection === id ? '' : id)}
            >
              <span>{name}</span>
              <small>{english}</small>
            </button>
          ))}
        </nav>
      )}
      <div
        className={`record-scroll ${!filter && !remindersOnly ? 'is-welcome' : ''}`}
        ref={scrollRef}
      >
        {!filter && !remindersOnly ? (
          <PersonalWelcome onEditProfile={onEditProfile} />
        ) : filter === 'calendar' && !remindersOnly ? (
          <CalendarTab query={query} />
        ) : (
          <>
            {due.length > 0 && (
              <section className="due-banner">
                <div>
                  <Icon name="bell" size={17} />
                  <strong>{due.length} 件事到时间了</strong>
                </div>
                {due.slice(0, remindersOnly ? 20 : 2).map((r) => (
                  <div className="due-banner-row" key={r.id}>
                    <span>{r.text || '照片里的那件事'}</span>
                    <button type="button" onClick={() => updateRecord(r.id, { remindDone: true })}>
                      完成 <Icon name="check" size={13} />
                    </button>
                  </div>
                ))}
              </section>
            )}
            {records.length === 0 && !query && !remindersOnly ? (
              <div className="first-record">
                <BrandMark decorative />
                <h2>今天想记点什么？</h2>
                <p>一句吐槽、一张照片，或者一个还没想好的点子。</p>
                <button type="button" className="btn primary" onClick={() => setComposerOpen(true)}>
                  记第一笔 <Icon name="plus" size={17} />
                </button>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => {
                    loadExamples();
                    scrollRef.current?.scrollTo({ top: 0 });
                  }}
                >
                  用两条示例试试看
                </button>
              </div>
            ) : groups.length === 0 ? (
              <EmptyState
                icon={filter === 'images' ? 'image' : 'note'}
                title={
                  query
                    ? '没有找到相关记录'
                    : filter === 'images'
                      ? '还没有图片'
                      : remindersOnly
                        ? '没有待办提醒'
                        : '还没有文字记录'
                }
                desc={
                  query
                    ? '试试原文、加工内容或标签里的词。'
                    : filter === 'images'
                      ? '记一笔时加照片，或把喜欢的文字做成封面。'
                      : '想到什么，就先记下来。'
                }
              />
            ) : (
              groups.map(([date, items]) => (
                <section className="timeline-day" key={date}>
                  <div className="timeline-day-label">
                    <span>{date === today ? '今天' : dayLabel(date)}</span>
                    <span>{items.length} 条</span>
                  </div>
                  <div className={filter === 'images' ? 'image-grid' : 'entry-list'}>
                    {items.map((record) =>
                      filter === 'images' ? (
                        <ImageTile key={record.id} record={record} />
                      ) : (
                        <RecordRow key={record.id} record={record} />
                      ),
                    )}
                  </div>
                </section>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}

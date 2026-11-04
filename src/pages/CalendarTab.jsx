import React, { useMemo, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { calendarMatrix, dayLabel, monthTitle, shiftMonth, todayKey, timeLabel } from '../lib/time.js';
import { clip } from '../lib/utils.js';
import EmptyState from '../components/EmptyState.jsx';
import Icon from '../components/Icons.jsx';

const WEEK = ['一', '二', '三', '四', '五', '六', '日'];

export default function CalendarTab() {
  const { records, settings, setTab, setSelectedId } = useStore();
  const [cursor, setCursor] = useState(() => {
    const [y, m] = todayKey().split('-').map(Number);
    return { year: y, month: m };
  });
  const [selected, setSelected] = useState(todayKey());
  const [filter, setFilter] = useState('全部');

  const filtered = useMemo(
    () => (filter === '全部' ? records : records.filter((r) => (r.tags || []).includes(filter))),
    [records, filter],
  );
  const countMap = useMemo(() => {
    const map = {};
    filtered.forEach((r) => { map[r.dateKey] = (map[r.dateKey] || 0) + 1; });
    return map;
  }, [filtered]);
  const cells = useMemo(() => calendarMatrix(cursor.year, cursor.month), [cursor]);
  const dayRecords = filtered.filter((r) => r.dateKey === selected);
  const today = todayKey();

  const goToday = () => {
    const [y, m] = today.split('-').map(Number);
    setCursor({ year: y, month: m });
    setSelected(today);
  };

  return (
    <div className="page">
      <section className="card">
        <div className="calendar-head">
          <div>
            <h2>{monthTitle(cursor.year, cursor.month)}</h2>
            <span className="muted small">按日聚合 · 共 {filtered.length} 条</span>
          </div>
          <div className="cal-nav">
            <button type="button" className="icon-btn" aria-label="上个月" onClick={() => setCursor((c) => shiftMonth(c.year, c.month, -1))}><Icon name="chevronLeft" size={20} /></button>
            <button type="button" className="btn tiny" onClick={goToday}>今天</button>
            <button type="button" className="icon-btn" aria-label="下个月" onClick={() => setCursor((c) => shiftMonth(c.year, c.month, 1))}><Icon name="chevronRight" size={20} /></button>
          </div>
        </div>
        <div className="week-row">{WEEK.map((w) => <span key={w}>{w}</span>)}</div>
        <div className="day-grid">
          {cells.map((cell) => (
            <button
              type="button"
              key={cell.key}
              className={`day-cell ${cell.inMonth ? '' : 'out'} ${selected === cell.key ? 'selected' : ''} ${cell.key === today ? 'today' : ''}`}
              onClick={() => {
                setSelected(cell.key);
                if (!cell.inMonth) {
                  const [y, m] = cell.key.split('-').map(Number);
                  setCursor({ year: y, month: m });
                }
              }}
            >
              <span>{cell.day}</span>
              {countMap[cell.key] > 0 && <span className="day-dot">{countMap[cell.key]}</span>}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="section-head"><h2>按气味标签筛选</h2></div>
        <div className="chip-group">
          {['全部', ...settings.tags].map((t) => (
            <button type="button" key={t} className={`chip chip-sm ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>{t}</button>
          ))}
        </div>
      </section>

      <section className="list-section">
        <div className="section-head">
          <h2>{dayLabel(selected)}</h2>
          <span className="muted small">{dayRecords.length} 条</span>
        </div>
        {dayRecords.length === 0 ? (
          <EmptyState
            icon="calendar"
            title={records.length === 0 ? '还没有记录' : filter === '全部' ? '这天没有记录' : '这天没有这个标签的记录'}
            desc={records.length === 0 ? '去「记一下」写第一条，日历会自动按天聚合。' : '换个日期或切换筛选条件看看。'}
            actionText={records.length === 0 ? '去记一条' : ''}
            onAction={records.length === 0 ? () => setTab('record') : undefined}
          />
        ) : (
          <div className="record-list">
            {dayRecords.map((r) => (
              <div className="record-card" key={r.id} onClick={() => { setSelectedId(r.id); setTab('studio'); }} role="button" tabIndex={0}>
                <div className="record-top">
                  <span className="time">{timeLabel(r.createdAt)}</span>
                  <span className="pill">{r.tone}</span>
                  <span className="pill alt">{r.direction}</span>
                </div>
                {r.photoDataUrl && <img className="thumb" src={r.photoDataUrl} alt="记录照片" />}
                <p className="record-text">{clip(r.text || '（只有一张照片）', 80)}</p>
                <div className="record-bottom">
                  {(r.tags || []).map((t) => <span className="tag" key={t}>{t}</span>)}
                  <span className="muted small">{(r.outputs || []).length} 条加工</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="placeholder-card">
        <div>
          <strong>年度报告</strong>
          <p>放进 V1.0，本次 Demo 不做完整版</p>
        </div>
        <span className="placeholder-badge">V1.0 规划</span>
      </div>
    </div>
  );
}

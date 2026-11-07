import React, { useMemo, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import {
  calendarMatrix,
  dayLabel,
  shiftMonth,
  todayKey,
  weekForDate,
  shiftDateKey,
} from '../lib/time.js';
import { recordMatches } from '../lib/records.js';
import { calendarEntries } from '../lib/reminders.js';
import RecordRow from '../components/RecordRow.jsx';
import TagFilter from '../components/TagFilter.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Icon from '../components/Icons.jsx';

const WEEK = ['一', '二', '三', '四', '五', '六', '日'];
export default function CalendarTab({ query = '' }) {
  const { records, setComposerOpen, settings, updateSettings } = useStore();
  const [selected, setSelected] = useState(todayKey());
  const [mode, setMode] = useState(settings.calendarView || 'week');
  const changeMode = (value) => {
    setMode(value);
    updateSettings({ calendarView: value });
  };
  const [tag, setTag] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(Number(todayKey().slice(0, 4)));
  const [year, month] = selected.split('-').map(Number);
  const base = records.filter((r) => recordMatches(r, query));
  const filtered = base.filter((r) => !tag || r.tags.includes(tag));
  const entries = calendarEntries(filtered);
  const counts = new Map();
  const reminderDays = new Set(entries.filter((entry) => entry.reminder).map((entry) => entry.dateKey));
  entries.forEach((entry) => counts.set(entry.dateKey, (counts.get(entry.dateKey) || 0) + 1));
  const cells = useMemo(
    () => (mode === 'week' ? weekForDate(selected) : calendarMatrix(year, month)),
    [mode, selected, year, month],
  );
  const dayRecords = entries.filter((entry) => entry.dateKey === selected);
  const navigate = (delta) => {
    setPickerOpen(false);
    if (mode === 'week') return setSelected(shiftDateKey(selected, delta * 7));
    const next = shiftMonth(year, month, delta);
    const day = Math.min(
      Number(selected.slice(-2)),
      new Date(Date.UTC(next.year, next.month, 0)).getUTCDate(),
    );
    setSelected(
      `${next.year}-${String(next.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    );
  };
  return (
    <div className="calendar-page">
      <section className="calendar-panel" aria-label="记录日历">
        <div className="calendar-toolbar">
          <div className="month-picker">
            <button
              type="button"
              className="month-trigger"
              aria-label="选择月份"
              aria-expanded={pickerOpen}
              onClick={() => {
                setPickerYear(year);
                setPickerOpen(!pickerOpen);
              }}
            >
              {year}年{month}月 <span aria-hidden="true">⌄</span>
            </button>
            {pickerOpen && (
              <div
                className="month-menu"
                role="group"
                aria-label="月份选择"
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setPickerOpen(false);
                }}
              >
                <label>
                  年份
                  <select
                    aria-label="年份"
                    value={pickerYear}
                    onChange={(event) => setPickerYear(Number(event.target.value))}
                  >
                    {[
                      ...new Set([
                        ...Array.from(
                          { length: 26 },
                          (_, i) => Number(todayKey().slice(0, 4)) - 20 + i,
                        ),
                        year,
                        ...calendarEntries(records).map((entry) => Number(entry.dateKey.slice(0, 4))),
                      ]),
                    ]
                      .sort((a, b) => a - b)
                      .map((value) => (
                        <option key={value} value={value}>
                          {value}年
                        </option>
                      ))}
                  </select>
                </label>
                <div>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((value) => (
                    <button
                      type="button"
                      key={value}
                      aria-label={`${pickerYear}年${value}月`}
                      className={pickerYear === year && value === month ? 'active' : ''}
                      onClick={() => {
                        setSelected(`${pickerYear}-${String(value).padStart(2, '0')}-01`);
                        setPickerOpen(false);
                      }}
                    >
                      {value}月
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="calendar-controls">
            <button
              type="button"
              className="icon-btn"
              aria-label={mode === 'month' ? '上个月' : '上一周'}
              onClick={() => navigate(-1)}
            >
              <Icon name="chevronLeft" size={18} />
            </button>
            <div className="calendar-mode" role="group" aria-label="日历视图">
              <button
                type="button"
                aria-pressed={mode === 'month'}
                className={mode === 'month' ? 'active' : ''}
                onClick={() => changeMode('month')}
              >
                月
              </button>
              <button
                type="button"
                aria-pressed={mode === 'week'}
                className={mode === 'week' ? 'active' : ''}
                onClick={() => changeMode('week')}
              >
                周
              </button>
            </div>
            <button
              type="button"
              className="icon-btn"
              aria-label={mode === 'month' ? '下个月' : '下一周'}
              onClick={() => navigate(1)}
            >
              <Icon name="chevronRight" size={18} />
            </button>
          </div>
        </div>
        <div className="week-row">
          {WEEK.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
        <div className={`day-grid ${mode === 'week' ? 'week-view' : ''}`}>
          {cells.map((cell) => (
            <button
              type="button"
              key={cell.key}
              className={`day-cell ${cell.inMonth ? '' : 'out'} ${selected === cell.key ? 'selected' : ''} ${cell.key === todayKey() ? 'today' : ''}`}
              aria-label={`${cell.key}，${counts.get(cell.key) || 0} 条${reminderDays.has(cell.key) ? '，含提醒' : '记录'}`}
              aria-pressed={selected === cell.key}
              onClick={() => {
                setSelected(cell.key);
                setPickerOpen(false);
              }}
            >
              <span>{cell.day}</span>
              <i className={`${counts.get(cell.key) ? 'has-records' : ''} ${reminderDays.has(cell.key) ? 'has-reminders' : ''}`} />
            </button>
          ))}
        </div>
        <p className="calendar-legend"><i />记录 <i className="reminder" />提醒</p>
      </section>
      <TagFilter records={base} value={tag} onChange={setTag} />
      <section className="calendar-entries">
        <div className="section-head">
          <h2>
            {dayLabel(selected)}
            <small>{dayRecords.length} 条</small>
          </h2>
          <div className="calendar-entry-actions">
            <button type="button" className="today-link" onClick={() => setSelected(todayKey())}>
              回到今天
            </button>
            <button
              type="button"
              className="calendar-add"
              aria-label="记一笔"
              onClick={() => setComposerOpen(true)}
            >
              <Icon name="plus" size={20} />
            </button>
          </div>
        </div>
        {dayRecords.length ? (
          <div className="entry-list">
            {dayRecords.map((entry) => (
              <RecordRow key={entry.record.id} record={entry.record} scheduled={entry.reminder} />
            ))}
          </div>
        ) : (
          <EmptyState icon="calendar" title="这天还没有相关记录" desc="换个日期，或用标签找找。" />
        )}
      </section>
    </div>
  );
}

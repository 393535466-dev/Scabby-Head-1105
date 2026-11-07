import { dateKeyOf, localInputToISO } from './time.js';
import { downloadDataUrl } from './utils.js';

export function validateReminder(value, now = Date.now()) {
  const iso = localInputToISO(value);
  if (!iso) return { error: '请选择完整的提醒日期和时间。' };
  if (new Date(iso).getTime() <= now) return { error: '这个时间已经过去了，请选一个未来的时间。' };
  return { iso };
}

export function reminderState(record, now = Date.now()) {
  if (!record.remindAt || !Number.isFinite(Date.parse(record.remindAt))) return '';
  return record.remindDone ? 'done' : Date.parse(record.remindAt) <= now ? 'due' : 'upcoming';
}

export function nextReminderDelay(records, now = Date.now()) {
  const future = records.filter((r) => reminderState(r, now) === 'upcoming').map((r) => Date.parse(r.remindAt) - now);
  return Math.max(100, Math.min(60000, ...future));
}

// Reminders belong to their scheduled date. Legacy notes with an attached reminder
// also remain on their original day, but are never counted twice on the same day.
export function calendarEntries(records) {
  return records.flatMap((record) => {
    const reminderDay = reminderState(record) ? dateKeyOf(record.remindAt) : '';
    const entries = [];
    if (record.entryType !== 'reminder' && record.dateKey !== reminderDay) entries.push({ record, dateKey: record.dateKey, at: record.createdAt, reminder: false });
    if (reminderDay) entries.push({ record, dateKey: reminderDay, at: record.remindAt, reminder: true });
    return entries;
  }).sort((a, b) => new Date(a.at) - new Date(b.at));
}

const escapeICS = (text) => String(text || '').replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
const stamp = (value) => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
function foldLine(line) {
  const encoder = new TextEncoder();
  let result = '', length = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    if (length + bytes > 75) { result += '\r\n '; length = 1; }
    result += char; length += bytes;
  }
  return result;
}

export function reminderCalendar(record, now = new Date()) {
  if (!reminderState(record) || record.remindDone) throw new Error('这条提醒已完成或已取消。');
  const title = record.text || '臭脑子的提醒';
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Chounaozi//Reminders//ZH', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', `UID:${encodeURIComponent(record.id)}@chounaozi`, `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(record.remindAt)}`, `DTEND:${stamp(Date.parse(record.remindAt) + 60000)}`,
    `SUMMARY:${escapeICS(title.slice(0, 80))}`, `DESCRIPTION:${escapeICS(title)}`, 'STATUS:CONFIRMED',
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:PT0S', `DESCRIPTION:${escapeICS(title.slice(0, 80))}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR', '',
  ].map(foldLine).join('\r\n');
}

export function downloadReminderCalendar(record) {
  const blob = new Blob([reminderCalendar(record)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, `臭脑子-提醒-${dateKeyOf(record.remindAt)}.ics`);
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

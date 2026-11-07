export const TZ = 'Asia/Shanghai';

const partsFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function shParts(d) {
  const out = {};
  for (const p of partsFmt.formatToParts(d)) {
    if (p.type !== 'literal') out[p.type] = p.value;
  }
  return out;
}

export function dateKeyOf(iso) {
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = shParts(d);
  return `${p.year}-${p.month}-${p.day}`;
}

export function todayKey() {
  return dateKeyOf(new Date());
}

/** 把任意时刻格式化成 Asia/Shanghai 下 <input type="datetime-local"> 需要的值 */
export function formatLocalInput(d) {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  const p = shParts(date);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** datetime-local 的值按 Asia/Shanghai 墙钟时间解释，转成 ISO */
export function localInputToISO(v) {
  if (!v) return '';
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!m) return '';
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00+08:00`);
  return Number.isNaN(d.getTime()) || formatLocalInput(d) !== v ? '' : d.toISOString();
}

export function isoToLocalInput(iso) {
  return iso ? formatLocalInput(new Date(iso)) : '';
}

export function quickReminderLocal(kind, now = new Date()) {
  const p = shParts(now);
  const base = new Date(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00+08:00`);
  const at = (h, mi) => new Date(`${p.year}-${p.month}-${p.day}T${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}:00+08:00`);
  if (kind === '1h') return formatLocalInput(new Date(base.getTime() + 3600000));
  if (kind === 'tomorrow') return formatLocalInput(new Date(at(9, 0).getTime() + 86400000));
  const t = kind === 'tonight' ? at(21, 0) : at(9, 0);
  if (t.getTime() <= base.getTime()) t.setTime(t.getTime() + 86400000);
  return formatLocalInput(t);
}

export function timeLabel(iso) {
  if (!iso) return '';
  const p = shParts(new Date(iso));
  return `${p.hour}:${p.minute}`;
}

export function dateTimeLabel(iso) {
  if (!iso) return '';
  const p = shParts(new Date(iso));
  return `${Number(p.month)}月${Number(p.day)}日 ${p.hour}:${p.minute}`;
}

export function fullDateTimeLabel(iso) {
  if (!iso || Number.isNaN(new Date(iso).getTime())) return '';
  const p = shParts(new Date(iso));
  return `${p.year}年${Number(p.month)}月${Number(p.day)}日 ${p.hour}:${p.minute}`;
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function todayChipLabel() {
  const p = shParts(new Date());
  const w = WEEKDAYS[new Date(Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day))).getUTCDay()];
  return `${Number(p.month)}月${Number(p.day)}日 · ${w}`;
}

export function dayLabel(key) {
  const [y, m, d] = String(key || '').split('-').map(Number);
  if (!y || !m || !d) return '';
  const w = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${m}月${d}日 · ${w}`;
}

export function monthTitle(year, month) {
  return `${year}年${month}月`;
}

export function shiftMonth(year, month, delta) {
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

export function shiftDateKey(key, days) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function weekForDate(key) {
  const [year, month, day] = key.split('-').map(Number);
  const weekday = (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
  return Array.from({ length: 7 }, (_, index) => {
    const date = shiftDateKey(key, index - weekday);
    return { key: date, day: Number(date.slice(-2)), inMonth: date.slice(0, 7) === key.slice(0, 7) };
  });
}

/** 周一开头的月历格子，只返回实际需要的整周行数 */
export function calendarMatrix(year, month) {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const rows = Math.ceil((lead + daysInMonth) / 7);
  const cells = [];
  for (let i = 0; i < rows * 7; i += 1) {
    const d = new Date(Date.UTC(year, month - 1, 1 - lead + i));
    cells.push({
      key: d.toISOString().slice(0, 10),
      day: d.getUTCDate(),
      inMonth: d.getUTCMonth() === month - 1,
    });
  }
  return cells;
}

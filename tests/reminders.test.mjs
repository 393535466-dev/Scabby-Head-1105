import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarEntries, nextReminderDelay, reminderCalendar, reminderState, validateReminder } from '../src/lib/reminders.js';
import { localInputToISO, quickReminderLocal } from '../src/lib/time.js';
import { normalizeRecord } from '../src/lib/records.js';

const now = Date.parse('2026-11-07T14:30:00Z');
const note = normalizeRecord({ id: 'r1', text: '去公园散步', createdAt: new Date(now).toISOString(), entryType: 'record' });
const reminder = { ...note, entryType: 'reminder', remindAt: '2026-12-31T16:05:00Z' };

test('reminder input uses Shanghai wall time, rejects invalid and past dates', () => {
  assert.equal(validateReminder('2026-11-08T09:30', now).iso, '2026-11-08T01:30:00.000Z');
  for (const value of ['', '2026-02-30T09:00', '2026-11-07T22:30', '2026-11-07T21:30', '2026-11-08T25:00', '2026-13-01T08:00']) assert.ok(validateReminder(value, now).error, value);
  assert.equal(localInputToISO('2028-02-29T12:00'), '2028-02-29T04:00:00.000Z');
});

test('quick reminders handle midnight and year boundaries', () => {
  const end = new Date('2026-12-31T15:40:00Z');
  assert.equal(quickReminderLocal('1h', end), '2027-01-01T00:40');
  assert.equal(quickReminderLocal('tomorrow', end), '2027-01-01T09:00');
});

test('a reminder appears once on its scheduled day, not its creation day', () => {
  const entries = calendarEntries([reminder]);
  assert.deepEqual(entries.map(({ dateKey, at, reminder: scheduled }) => ({ dateKey, at, scheduled })), [{ dateKey: '2027-01-01', at: reminder.remindAt, scheduled: true }]);
  assert.equal(calendarEntries([{ ...reminder, remindAt: '2027-01-05T01:00:00Z' }])[0].dateKey, '2027-01-05');
});

test('legacy notes keep creation and reminder dates without double counting a day', () => {
  assert.equal(calendarEntries([{ ...reminder, entryType: 'record' }]).length, 2);
  assert.equal(calendarEntries([{ ...note, remindAt: '2026-11-07T15:00:00Z' }]).length, 1);
  const loaded = normalizeRecord({ ...reminder, entryType: undefined, tone: '极简' });
  assert.equal(loaded.entryType, 'record');
  assert.equal(loaded.tone, '古风');
});

test('completed reminders stay on the calendar, cancelled ones become normal notes', () => {
  const completed = { ...reminder, remindDone: true };
  assert.equal(reminderState(completed, now), 'done');
  assert.equal(calendarEntries([completed])[0].dateKey, '2027-01-01');
  const cancelled = normalizeRecord({ ...reminder, remindAt: '' });
  assert.equal(cancelled.entryType, 'record');
  assert.equal(calendarEntries([cancelled])[0].dateKey, note.dateKey);
  assert.equal(reminderState({ remindAt: 'invalid' }, now), '');
});

test('deadline scheduling is precise and ignores completed or invalid reminders', () => {
  const soon = { remindAt: new Date(now + 1200).toISOString() };
  assert.equal(reminderState(soon, now), 'upcoming');
  assert.equal(reminderState(soon, now + 1200), 'due');
  assert.equal(nextReminderDelay([soon], now), 1200);
  assert.equal(nextReminderDelay([{ ...soon, remindDone: true }, { remindAt: 'invalid' }], now), 60000);
});

test('calendar export uses UTC, an alarm, safe text and RFC line folding', () => {
  const text = '散步,买花;带伞\\回家\n' + '今日微风正好'.repeat(30);
  const ics = reminderCalendar({ ...reminder, text }, new Date(now));
  assert.match(ics, /DTSTART:20261231T160500Z/);
  assert.match(ics, /TRIGGER:PT0S/);
  assert.match(ics, /SUMMARY:散步\\,买花\\;带伞\\\\回家\\n/);
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 1);
  for (const line of ics.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75);
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
  assert.throws(() => reminderCalendar({ ...reminder, remindDone: true }));
  assert.throws(() => reminderCalendar(note));
});

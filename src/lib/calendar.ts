import type { ScheduleBlock, Task } from '../types';

/** ISO → ICS UTC stamp (YYYYMMDDTHHMMSSZ). */
function icsDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function esc(s: string): string {
  return s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
}

/** Build an .ics calendar from focus blocks + open task deadlines. */
export function scheduleToICS(blocks: ScheduleBlock[], tasks: Task[]): string {
  const stamp = icsDate(new Date().toISOString());
  const events: string[] = [];

  for (const b of blocks) {
    events.push(
      [
        'BEGIN:VEVENT',
        `UID:${b.id}@clutch`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${icsDate(b.start)}`,
        `DTEND:${icsDate(b.end)}`,
        `SUMMARY:${esc('Focus · ' + b.taskTitle)}`,
        `DESCRIPTION:${esc(b.reason)}`,
        'END:VEVENT',
      ].join('\r\n'),
    );
  }

  for (const t of tasks) {
    if (!t.deadline || t.status === 'done') continue;
    const start = icsDate(t.deadline);
    const end = icsDate(new Date(Date.parse(t.deadline) + 30 * 60000).toISOString());
    events.push(
      [
        'BEGIN:VEVENT',
        `UID:deadline-${t.id}@clutch`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${esc('⏰ Deadline · ' + t.title)}`,
        `DESCRIPTION:${esc(t.notes || 'Tracked by Clutch')}`,
        'BEGIN:VALARM',
        'TRIGGER:-PT2H',
        'ACTION:DISPLAY',
        `DESCRIPTION:${esc('Due soon: ' + t.title)}`,
        'END:VALARM',
        'END:VEVENT',
      ].join('\r\n'),
    );
  }

  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Clutch//Plan//EN', 'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR'].join(
    '\r\n',
  );
}

export function downloadICS(content: string, filename = 'clutch-plan.ics'): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** One-click "Add to Google Calendar" link for a single block. */
export function googleCalendarUrl(title: string, start: string, end: string, details = ''): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${icsDate(start)}/${icsDate(end)}`,
    details,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

import { useEffect, useRef } from 'react';
import type { ScheduleBlock, Task } from '../types';

// Context-aware browser notifications: fires when a deadline is approaching, a
// scheduled focus block is starting, or it's time for the daily standup.
// De-dupes via a per-session id set. `standupHour` is the user's day-start hour.
export function useReminders(tasks: Task[], schedule: ScheduleBlock[], enabled: boolean, standupHour = 9) {
  const notified = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    const notify = (key: string, title: string, body: string) => {
      if (notified.current.has(key)) return;
      notified.current.add(key);
      try {
        new Notification(title, { body, icon: '/favicon.svg', badge: '/favicon.svg', tag: key });
      } catch {
        /* ignore */
      }
    };

    const check = () => {
      const now = Date.now();
      // Daily standup: once, after the user's day-start hour.
      const d = new Date();
      const dayKey = `standup-${d.toISOString().slice(0, 10)}`;
      const open = tasks.filter((t) => t.status !== 'done');
      if (d.getHours() >= standupHour && open.length > 0) {
        const dueToday = open.filter(
          (t) => t.deadline && new Date(t.deadline).toDateString() === d.toDateString(),
        ).length;
        notify(
          dayKey,
          '☀️ Your Clutch standup',
          `${open.length} open${dueToday ? `, ${dueToday} due today` : ''}. Open Clutch to plan your day.`,
        );
      }
      for (const t of tasks) {
        if (t.status === 'done' || !t.deadline) continue;
        const ms = Date.parse(t.deadline) - now;
        if (ms > 0 && ms <= 60 * 60000) {
          notify(`due-${t.id}`, `⏰ Due soon · ${t.title}`, `Due in about ${Math.max(1, Math.round(ms / 60000))} min.`);
        }
      }
      for (const b of schedule) {
        const ms = Date.parse(b.start) - now;
        if (ms <= 30000 && ms > -90000) {
          notify(`block-${b.id}`, `Focus time · ${b.taskTitle}`, b.reason || 'Your scheduled focus block is starting.');
        }
      }
    };

    check();
    const id = window.setInterval(check, 30000);
    return () => window.clearInterval(id);
  }, [enabled, tasks, schedule, standupHour]);
}

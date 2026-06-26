import { useEffect, useRef } from 'react';
import type { ScheduleBlock, Task } from '../types';

// Context-aware browser notifications: fires when a deadline is approaching or a
// scheduled focus block is starting. De-dupes via a per-session id set.
export function useReminders(tasks: Task[], schedule: ScheduleBlock[], enabled: boolean) {
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
  }, [enabled, tasks, schedule]);
}

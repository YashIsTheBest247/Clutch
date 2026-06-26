import { useState } from 'react';
import type { UserProfile } from '../types';
import { ClockPicker } from './ClockPicker';
import { Clock, X } from './icons';

/** 24h integer → "9:00 AM" style label. */
function hourLabel(h: number): string {
  const period = h < 12 ? 'AM' : 'PM';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:00 ${period}`;
}

function TimeField({ value, onChange }: { value: number; onChange: (h: number) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="input flex w-full items-center gap-2 text-left">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mint-100 text-mint-600">
          <Clock className="h-3.5 w-3.5" />
        </span>
        <span className="flex-1 text-ink-900">{hourLabel(value)}</span>
      </button>
      {open && <ClockPicker value={value} onChange={onChange} onClose={() => setOpen(false)} />}
    </>
  );
}

export function Settings({
  profile,
  onSave,
  onClose,
  onClear,
}: {
  profile: UserProfile;
  onSave: (p: Partial<UserProfile>) => void;
  onClose: () => void;
  onClear: () => void;
}) {
  const [p, setP] = useState(profile);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-md animate-fade-up p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between border-b border-black/10 pb-3">
          <h3 className="font-display text-sm font-semibold text-ink-900">Your profile</h3>
          <button onClick={onClose} className="btn-ghost !px-2.5 !py-1.5">
            <X />
          </button>
        </div>
        <div className="space-y-3">
          <label className="block">
            <span className="label mb-1 block text-ink-600">Name</span>
            <input className="input" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
          </label>
          <label className="block">
            <span className="label mb-1 block text-ink-600">Role</span>
            <input
              className="input"
              value={p.role}
              placeholder="Student / Founder / PM…"
              onChange={(e) => setP({ ...p, role: e.target.value })}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="label mb-1 block text-ink-600">Day starts</span>
              <TimeField value={p.dayStartHour} onChange={(h) => setP({ ...p, dayStartHour: h })} />
            </label>
            <label className="block">
              <span className="label mb-1 block text-ink-600">Day ends</span>
              <TimeField value={p.dayEndHour} onChange={(h) => setP({ ...p, dayEndHour: h })} />
            </label>
          </div>
          <label className="block">
            <span className="label mb-1 block text-ink-600">How you work</span>
            <textarea
              className="input resize-none"
              rows={3}
              value={p.workStyle}
              onChange={(e) => setP({ ...p, workStyle: e.target.value })}
            />
          </label>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-black/10 pt-4">
          <button
            onClick={() => {
              if (confirm('Clear all tasks, schedule and history?')) {
                onClear();
                onClose();
              }
            }}
            className="btn-ghost !text-xs text-signal-red"
          >
            Reset everything
          </button>
          <button
            onClick={() => {
              onSave(p);
              onClose();
            }}
            className="btn-primary"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

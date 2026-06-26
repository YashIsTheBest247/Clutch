import { useState } from 'react';
import type { UserProfile } from '../types';
import { X } from './icons';

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
              <input
                type="number"
                min={0}
                max={23}
                className="input"
                value={p.dayStartHour}
                onChange={(e) => setP({ ...p, dayStartHour: Number(e.target.value) })}
              />
            </label>
            <label className="block">
              <span className="label mb-1 block text-ink-600">Day ends</span>
              <input
                type="number"
                min={1}
                max={24}
                className="input"
                value={p.dayEndHour}
                onChange={(e) => setP({ ...p, dayEndHour: Number(e.target.value) })}
              />
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

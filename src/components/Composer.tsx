import { useState } from 'react';
import { useVoice } from '../lib/useVoice';
import { Mic, Send, Sparkle } from './icons';

const SUGGESTIONS = [
  'I have a CS101 essay due Friday 5pm, a dentist bill to pay, and a job interview Monday morning.',
  'Plan my whole day around my deadlines.',
  'Draft the email asking my professor for a 2-day extension.',
  'Break my thesis literature review into steps and schedule them.',
];

export function Composer({
  onSend,
  thinking,
  empty,
}: {
  onSend: (text: string) => void;
  thinking: boolean;
  empty: boolean;
}) {
  const [text, setText] = useState('');
  const { supported, listening, toggle } = useVoice((t) => setText(t));

  const submit = () => {
    if (!text.trim() || thinking) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="label text-ink-500">Tell Clutch what's on your plate</span>
      </div>
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                submit();
              }
            }}
            rows={text.split('\n').length > 2 ? 4 : 2}
            placeholder="Paste an email or syllabus, type your commitments, or just talk…"
            className="input resize-none pr-10"
          />
          {listening && (
            <span className="pointer-events-none absolute right-3 top-3 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full rounded-full bg-ink-900 opacity-60 animate-pulse-ring" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-ink-900" />
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {supported && (
            <button
              onClick={toggle}
              title="Voice input"
              className={`btn !px-3 ${listening ? 'bg-ink-900 text-paper-50' : 'btn-ghost'}`}
            >
              <Mic />
            </button>
          )}
          <button onClick={submit} disabled={thinking || !text.trim()} className="btn-primary !px-3">
            {thinking ? <Sparkle className="h-4 w-4 animate-spin" /> : <Send />}
          </button>
        </div>
      </div>

      {empty && (
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onSend(s)}
              disabled={thinking}
              className="rounded-full border border-ink-900/12 bg-stone-50 px-3 py-1.5 text-left text-xs text-ink-700 transition-colors hover:border-ink-900/40 hover:text-ink-900"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import { useRef, useState } from 'react';
import { useVoice } from '../lib/useVoice';
import type { AgentImage } from '../lib/agent';
import { ThinkingStatus } from './ThinkingStatus';
import { Image as ImageIcon, Mic, Send, Sparkle, X } from './icons';

const SUGGESTIONS = [
  'I have a CS101 essay due Friday 5pm, a dentist bill to pay, and a job interview Monday morning.',
  'Plan my whole day around my deadlines.',
  'Draft the email asking my professor for a 2-day extension.',
  'Break my thesis literature review into steps and schedule them.',
];

function fileToImage(file: File): Promise<{ image: AgentImage; preview: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const data = dataUrl.split(',')[1] ?? '';
      resolve({ image: { data, mimeType: file.type || 'image/png' }, preview: dataUrl });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function Composer({
  onSend,
  thinking,
  empty,
}: {
  onSend: (text: string, image?: AgentImage) => void;
  thinking: boolean;
  empty: boolean;
}) {
  const [text, setText] = useState('');
  const [attached, setAttached] = useState<{ image: AgentImage; preview: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { supported, listening, toggle } = useVoice((t) => setText(t));

  const addFile = async (file?: File | null) => {
    if (file && file.type.startsWith('image/')) setAttached(await fileToImage(file));
  };

  const submit = () => {
    if ((!text.trim() && !attached) || thinking) return;
    onSend(text.trim(), attached?.image);
    setText('');
    setAttached(null);
  };

  return (
    <div
      className="card p-4"
      onPaste={(e) => {
        const f = Array.from(e.clipboardData.files).find((x) => x.type.startsWith('image/'));
        if (f) addFile(f);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        addFile(e.dataTransfer.files?.[0]);
      }}
    >
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="label text-ink-500">Tell Clutch what's on your plate</span>
        <span className="ml-auto hidden items-center gap-2 text-[11px] text-ink-400 sm:flex">
          <span>type</span>
          <span className="text-ink-300">·</span>
          <span>paste</span>
          <span className="text-ink-300">·</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-ink-600">
            <ImageIcon className="h-3 w-3" /> photo
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-ink-600">
            <Mic className="h-3 w-3" /> voice
          </span>
        </span>
      </div>

      {attached && (
        <div className="mb-2 flex items-center gap-3 rounded-2xl border border-ink-900/10 bg-stone-50 p-2">
          <img src={attached.preview} alt="attachment" className="h-14 w-14 rounded-xl object-cover" />
          <span className="text-xs text-ink-600">Image attached — Clutch will read it for tasks.</span>
          <button onClick={() => setAttached(null)} className="btn-ghost ml-auto !px-2.5 !py-1.5">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

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
            placeholder="Paste an email or syllabus, drop a photo of your notes, type, or just talk…"
            className="input resize-none pr-10"
          />
          {listening && (
            <span className="pointer-events-none absolute right-3 top-3 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full rounded-full bg-ink-900 opacity-60 animate-pulse-ring" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-ink-900" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => addFile(e.target.files?.[0])}
          />
          <button onClick={() => fileRef.current?.click()} title="Attach photo" className="btn-ghost !px-3">
            <ImageIcon />
          </button>
          {supported && (
            <button
              onClick={toggle}
              title="Voice input"
              className={`btn !px-3 ${listening ? 'bg-ink-900 text-paper-50' : 'btn-ghost'}`}
            >
              <Mic />
            </button>
          )}
          <button onClick={submit} disabled={thinking || (!text.trim() && !attached)} className="btn-primary !px-3">
            {thinking ? <Sparkle className="h-4 w-4 animate-spin" /> : <Send />}
          </button>
        </div>
      </div>

      {thinking && <ThinkingStatus />}

      {!thinking && empty && !attached && (
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

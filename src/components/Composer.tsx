import { useRef, useState } from 'react';
import { useVoice } from '../lib/useVoice';
import type { AgentImage } from '../lib/agent';
import { ThinkingStatus } from './ThinkingStatus';
import { Bolt, Doc, Image as ImageIcon, Mic, Send, Sparkle, X } from './icons';

const SUGGESTIONS = [
  'I have a CS101 essay due Friday 5pm, a dentist bill to pay, and a job interview Monday morning.',
  'Plan my whole day around my deadlines.',
  'Draft the email asking my professor for a 2-day extension.',
  'Break my thesis literature review into steps and schedule them.',
];

type Attachment = { image: AgentImage; kind: 'image' | 'pdf'; name: string; preview?: string };

function fileToAttachment(file: File): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const data = dataUrl.split(',')[1] ?? '';
      const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
      resolve({
        image: { data, mimeType: file.type || (isPdf ? 'application/pdf' : 'image/png') },
        kind: isPdf ? 'pdf' : 'image',
        name: file.name || (isPdf ? 'document.pdf' : 'image'),
        preview: isPdf ? undefined : dataUrl,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function Composer({
  onSend,
  onAutopilot,
  thinking,
  empty,
}: {
  onSend: (text: string, image?: AgentImage) => void;
  onAutopilot?: (text: string, image?: AgentImage) => void;
  thinking: boolean;
  empty: boolean;
}) {
  const [text, setText] = useState('');
  const [attached, setAttached] = useState<Attachment | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const { supported, listening, toggle } = useVoice((t) => setText(t));

  const addFile = async (file?: File | null) => {
    if (!file) return;
    if (file.type.startsWith('image/') || file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
      setAttached(await fileToAttachment(file));
    }
  };

  const hasContent = !!text.trim() || !!attached;

  const submit = () => {
    if (!hasContent || thinking) return;
    onSend(text.trim(), attached?.image);
    setText('');
    setAttached(null);
  };

  const autopilot = () => {
    if (!hasContent || thinking || !onAutopilot) return;
    onAutopilot(text.trim(), attached?.image);
    setText('');
    setAttached(null);
  };

  return (
    <div
      className="card p-4"
      onPaste={(e) => {
        const f = Array.from(e.clipboardData.files).find(
          (x) => x.type.startsWith('image/') || x.type === 'application/pdf',
        );
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
        <span className="ml-auto hidden text-[11px] text-ink-400 sm:block">type · paste · photo · PDF · voice</span>
      </div>

      {attached && (
        <div className="mb-2 flex items-center gap-3 rounded-2xl border border-ink-900/10 bg-stone-50 p-2">
          {attached.kind === 'image' ? (
            <img src={attached.preview} alt="attachment" className="h-14 w-14 rounded-xl object-cover" />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
              <Doc className="h-6 w-6" />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-ink-900">{attached.name}</p>
            <p className="text-[11px] text-ink-500">
              {attached.kind === 'pdf'
                ? 'PDF attached — Clutch will extract every deadline.'
                : 'Image attached — Clutch will read it for tasks.'}
            </p>
          </div>
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
            placeholder="Paste an email or syllabus, drop a PDF or photo of your notes, type, or just talk…"
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
            ref={imageRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => addFile(e.target.files?.[0])}
          />
          <input
            ref={pdfRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => addFile(e.target.files?.[0])}
          />
          <button onClick={() => imageRef.current?.click()} title="Attach a photo" className="btn-ghost !px-3">
            <ImageIcon />
          </button>
          <button onClick={() => pdfRef.current?.click()} title="Attach a PDF (syllabus, brief, contract)" className="btn-ghost !px-3">
            <Doc />
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
          <button onClick={submit} disabled={thinking || !hasContent} title="Send" className="btn-primary !px-3">
            {thinking ? <Sparkle className="h-4 w-4 animate-spin" /> : <Send />}
          </button>
        </div>
      </div>

      {/* Autopilot — run the whole pipeline end-to-end on whatever you've given. */}
      {onAutopilot && (
        <div className="mt-2.5 flex items-center gap-2">
          <button
            onClick={autopilot}
            disabled={thinking || !hasContent}
            data-tour="autopilot"
            title="Capture, research, prioritize, schedule AND draft everything — hands-off"
            className="group relative flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-mint-500 to-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-glow transition-all hover:-translate-y-0.5 hover:shadow-panel disabled:translate-y-0 disabled:opacity-40 disabled:shadow-none"
          >
            <Bolt className="h-3.5 w-3.5" />
            Autopilot
            <span className="hidden font-normal text-white/80 sm:inline">— do it all for me</span>
          </button>
          <span className="hidden text-[11px] text-ink-500 sm:block">
            Captures, researches, schedules &amp; drafts every deliverable in one shot.
          </span>
        </div>
      )}

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

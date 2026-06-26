import { useEffect, useRef } from 'react';
import type { AgentAction, AgentMessage } from '../types';
import { Markdown } from './Markdown';
import { Bolt, Sparkle } from './icons';

const toolLabel: Record<string, string> = {
  add_task: 'Captured task',
  decompose_task: 'Broke down task',
  set_priority: 'Re-prioritized',
  generate_deliverable: 'Wrote deliverable',
  update_task_status: 'Updated status',
  build_schedule: 'Built schedule',
};

function ActionRow({ a }: { a: AgentAction }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-ink-900/[0.06] bg-paper-50 px-2.5 py-1.5 text-[11px] text-ink-600 shadow-soft">
      <Bolt className="h-3.5 w-3.5 text-ink-800" />
      <span className="font-semibold text-ink-900">{toolLabel[a.tool] ?? a.tool}</span>
      <span className="truncate text-ink-500">· {a.summary}</span>
    </div>
  );
}

export function ActivityFeed({
  messages,
  thinking,
  liveActions,
}: {
  messages: AgentMessage[];
  thinking: boolean;
  liveActions: AgentAction[];
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, thinking, liveActions.length]);

  return (
    <div className="panel flex h-full min-h-0 flex-col p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkle className="h-4 w-4 text-ink-700" />
        <h2 className="font-display text-sm font-semibold text-ink-900">Agent activity</h2>
        <span className="label ml-auto text-ink-500">Live</span>
      </div>

      <div className="-mr-2 flex-1 space-y-3 overflow-y-auto pr-2">
        {messages.length === 0 && !thinking && (
          <p className="text-xs leading-relaxed text-ink-500">
            Clutch narrates every action it takes here — what it captured, prioritized, scheduled, and drafted.
          </p>
        )}

        {messages.map((m) => {
          if (m.role === 'user') {
            return (
              <div
                key={m.id}
                className="ml-auto max-w-[90%] animate-fade-up rounded-2xl rounded-br-md bg-ink-900 px-3 py-2 text-xs text-paper-50"
              >
                {m.content}
              </div>
            );
          }
          if (m.role === 'system') {
            return (
              <div
                key={m.id}
                className="rounded-2xl border border-signal-red/25 bg-signal-red/10 px-3 py-2 text-xs text-signal-red"
              >
                {m.content}
              </div>
            );
          }
          return (
            <div key={m.id} className="animate-fade-up space-y-2">
              {m.actions && m.actions.length > 0 && (
                <div className="space-y-1">
                  {m.actions.map((a, i) => (
                    <ActionRow key={i} a={a} />
                  ))}
                </div>
              )}
              <div className="max-w-[95%] rounded-2xl rounded-bl-md border border-ink-900/[0.06] bg-paper-50 px-3 py-2 text-xs text-ink-800 shadow-soft">
                <Markdown text={m.content} />
              </div>
            </div>
          );
        })}

        {thinking && (
          <div className="space-y-1">
            {liveActions.map((a, i) => (
              <ActionRow key={i} a={a} />
            ))}
            <div className="flex items-center gap-2 rounded-2xl border border-ink-900/[0.06] bg-paper-50 px-3 py-2 text-xs text-ink-500 shadow-soft">
              <Sparkle className="h-3.5 w-3.5 animate-spin text-ink-700" />
              {liveActions.length ? 'Working through your plan…' : 'Thinking…'}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}

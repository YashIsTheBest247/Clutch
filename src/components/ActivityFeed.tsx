import { useEffect, useRef, type ReactElement } from 'react';
import type { AgentAction, AgentMessage } from '../types';
import { Markdown } from './Markdown';
import { Calendar, Check, Doc, Flame, Layers, Plus, Search, Sparkle } from './icons';

type IconCmp = (p: { className?: string }) => ReactElement;

// ---------------------------------------------------------------------------
// Multi-agent narration. Under the hood Clutch is one Gemini loop, but each
// tool is the work of a named specialist — so the feed reads like a Coordinator
// delegating to a Planner, a Researcher, and a Writer. Cosmetic, but it makes
// the agentic depth legible.
// ---------------------------------------------------------------------------

type RoleKey = 'coordinator' | 'planner' | 'researcher' | 'writer';

const ROLES: Record<RoleKey, { name: string; Icon: IconCmp; dot: string; avatar: string; text: string }> = {
  coordinator: { name: 'Coordinator', Icon: Sparkle, dot: 'bg-lilac-500', avatar: 'bg-lilac-100 text-lilac-700', text: 'text-lilac-700' },
  planner: { name: 'Planner', Icon: Calendar, dot: 'bg-mint-500', avatar: 'bg-mint-100 text-mint-700', text: 'text-mint-700' },
  researcher: { name: 'Researcher', Icon: Search, dot: 'bg-sky-500', avatar: 'bg-sky-100 text-sky-700', text: 'text-sky-700' },
  writer: { name: 'Writer', Icon: Doc, dot: 'bg-butter-500', avatar: 'bg-butter-100 text-butter-700', text: 'text-butter-700' },
};

const tool: Record<string, { label: string; Icon: IconCmp; role: RoleKey }> = {
  add_task: { label: 'Captured task', Icon: Plus, role: 'planner' },
  decompose_task: { label: 'Broke down task', Icon: Layers, role: 'planner' },
  set_priority: { label: 'Re-prioritized', Icon: Flame, role: 'planner' },
  build_schedule: { label: 'Built schedule', Icon: Calendar, role: 'planner' },
  add_commitment: { label: 'Blocked time', Icon: Calendar, role: 'planner' },
  update_task_status: { label: 'Updated status', Icon: Check, role: 'planner' },
  research_web: { label: 'Searched the web', Icon: Search, role: 'researcher' },
  generate_deliverable: { label: 'Wrote deliverable', Icon: Doc, role: 'writer' },
};

function ActionRow({ a }: { a: AgentAction }) {
  const meta = tool[a.tool];
  const role = ROLES[meta?.role ?? 'planner'];
  const Icon = meta?.Icon ?? Sparkle;
  return (
    <div className="flex items-center gap-2 rounded-xl border border-ink-900/[0.06] bg-paper-50 px-2.5 py-1.5 text-[11px] text-ink-600 shadow-soft">
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${role.avatar}`}>
        <role.Icon className="h-3 w-3" />
      </span>
      <span className={`shrink-0 font-semibold ${role.text}`}>{role.name}</span>
      <span className="shrink-0 text-stone-300">·</span>
      <Icon className="h-3.5 w-3.5 shrink-0 text-ink-700" />
      <span className="shrink-0 font-medium text-ink-900">{meta?.label ?? a.tool}</span>
      <span className="truncate text-ink-500">· {a.summary}</span>
    </div>
  );
}

/** The little "Coordinator → team" hand-off header shown above a batch of actions. */
function DelegationHeader({ actions }: { actions: AgentAction[] }) {
  const used = Array.from(
    new Set(actions.map((a) => tool[a.tool]?.role).filter(Boolean) as RoleKey[]),
  );
  if (!used.length) return null;
  return (
    <div className="flex items-center gap-1.5 px-0.5 text-[10px] font-medium uppercase tracking-wide text-stone-400">
      <span className={`flex h-4 w-4 items-center justify-center rounded-full ${ROLES.coordinator.avatar}`}>
        <Sparkle className="h-2.5 w-2.5" />
      </span>
      <span>Coordinator delegated to</span>
      <span className="flex items-center gap-1">
        {used.map((r) => (
          <span key={r} className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 normal-case ${ROLES[r].avatar}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${ROLES[r].dot}`} />
            {ROLES[r].name}
          </span>
        ))}
      </span>
    </div>
  );
}

/** Animated roster shown while the Coordinator is still routing the request. */
function RoutingRoster() {
  const team: RoleKey[] = ['planner', 'researcher', 'writer'];
  return (
    <div className="space-y-2 rounded-2xl border border-ink-900/[0.06] bg-paper-50 px-3 py-2.5 shadow-soft">
      <div className="flex items-center gap-2 text-xs text-ink-600">
        <span className={`flex h-5 w-5 items-center justify-center rounded-full ${ROLES.coordinator.avatar}`}>
          <Sparkle className="h-3 w-3 animate-spin [animation-duration:2.5s]" />
        </span>
        <span className="font-semibold text-ink-900">Coordinator</span>
        <span className="text-ink-500">is routing your request to the team…</span>
      </div>
      <div className="flex flex-wrap gap-1.5 pl-7">
        {team.map((r, i) => (
          <span
            key={r}
            className={`inline-flex animate-fade-up items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${ROLES[r].avatar}`}
            style={{ animationDelay: `${i * 120}ms` }}
          >
            <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${ROLES[r].dot}`} />
            {ROLES[r].name}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ActivityFeed({
  messages,
  thinking,
  liveActions,
  streamingText = '',
}: {
  messages: AgentMessage[];
  thinking: boolean;
  liveActions: AgentAction[];
  streamingText?: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Scroll only the feed's own container — never the page/window.
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages.length, thinking, liveActions.length, streamingText]);

  return (
    <div className="panel flex h-full min-h-0 flex-col p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-lilac-100 text-lilac-600">
          <Sparkle className="h-4 w-4 animate-spin [animation-duration:3.5s]" />
        </span>
        <h2 className="font-display text-sm font-semibold text-ink-900">Agent team</h2>
        <span className="label ml-auto text-ink-500">Live</span>
      </div>

      <div ref={listRef} className="-mr-2 flex-1 space-y-3 overflow-y-auto pr-2">
        {messages.length === 0 && !thinking && (
          <p className="text-xs leading-relaxed text-ink-500">
            A <span className="font-semibold text-lilac-700">Coordinator</span> delegates your request to a{' '}
            <span className="font-semibold text-mint-700">Planner</span>,{' '}
            <span className="font-semibold text-sky-700">Researcher</span>, and{' '}
            <span className="font-semibold text-butter-700">Writer</span> — every hand-off shows up here.
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
                <div className="space-y-1.5">
                  <DelegationHeader actions={m.actions} />
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
          <div className="space-y-1.5">
            {liveActions.length > 0 && <DelegationHeader actions={liveActions} />}
            {liveActions.map((a, i) => (
              <ActionRow key={i} a={a} />
            ))}
            {streamingText ? (
              <div className="max-w-[95%] rounded-2xl rounded-bl-md border border-ink-900/[0.06] bg-paper-50 px-3 py-2 text-xs text-ink-800 shadow-soft">
                <Markdown text={streamingText} />
                <span className="ml-0.5 inline-block h-3 w-[2px] translate-y-0.5 animate-pulse bg-ink-900 align-middle" />
              </div>
            ) : liveActions.length ? (
              <div className="flex items-center gap-2 rounded-2xl border border-ink-900/[0.06] bg-paper-50 px-3 py-2 text-xs text-ink-500 shadow-soft">
                <Sparkle className="h-3.5 w-3.5 animate-spin text-ink-700" />
                Specialists are working through your plan…
              </div>
            ) : (
              <RoutingRoster />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

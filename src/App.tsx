import { useMemo, useState } from 'react';
import { useStore } from './lib/store';
import { hasApiKey } from './lib/gemini';
import { formatDeadline } from './lib/scheduler';
import { useCountUp, useInView } from './lib/anim';
import type { Task } from './types';
import { Composer } from './components/Composer';
import { TaskCard } from './components/TaskCard';
import { Agenda } from './components/Agenda';
import { ActivityFeed } from './components/ActivityFeed';
import { DeliverableModal } from './components/DeliverableModal';
import { Settings } from './components/Settings';
import { Reveal } from './components/Reveal';
import { ArrowUpRight, Calendar, Check, Doc, Sparkle } from './components/icons';
import { Logo } from './components/Logo';

function StatCard({
  label,
  caption,
  value,
  highlight,
  delay = 0,
}: {
  label: string;
  caption: string;
  value: number;
  highlight?: boolean;
  delay?: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const shown = useCountUp(value, inView);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal lift flex min-h-[124px] flex-col justify-between rounded-3xl border p-4 sm:min-h-[150px] ${
        inView ? 'in' : ''
      } ${
        highlight
          ? 'border-transparent bg-ink-900 text-paper-50 shadow-glow'
          : 'border-ink-900/[0.06] bg-paper-50 text-ink-900 shadow-soft'
      }`}
    >
      <div className="flex items-start justify-between">
        <span className={`label ${highlight ? 'text-paper-50/70' : 'text-ink-500'}`}>{label}</span>
        <span className={`text-[11px] ${highlight ? 'text-paper-50/50' : 'text-ink-500'}`}>/{value || 0}</span>
      </div>
      <p className={`mt-1 text-[11px] ${highlight ? 'text-paper-50/70' : 'text-ink-500'}`}>{caption}</p>
      <div className="mt-auto font-display text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">{shown}</div>
    </div>
  );
}

export default function App() {
  const store = useStore();
  const { state, thinking, liveActions } = store;
  const [openTask, setOpenTask] = useState<Task | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const open = state.tasks.filter((t) => t.status !== 'done');
  const sorted = useMemo(
    () =>
      [...state.tasks].sort((a, b) => {
        if ((a.status === 'done') !== (b.status === 'done')) return a.status === 'done' ? 1 : -1;
        return (b.urgencyScore ?? 0) - (a.urgencyScore ?? 0);
      }),
    [state.tasks],
  );
  const top = open.length ? [...open].sort((a, b) => (b.urgencyScore ?? 0) - (a.urgencyScore ?? 0))[0] : null;

  const dueSoon = open.filter((t) => t.deadline && Date.parse(t.deadline) - Date.now() < 24 * 3600 * 1000).length;
  const deliverables = state.tasks.filter((t) => t.deliverable).length;
  const done = state.tasks.filter((t) => t.status === 'done').length;
  const noKey = !hasApiKey();

  const nextAction = top?.subtasks.find((s) => !s.done)?.title ?? 'Make a focused start on this.';
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-3 py-4 sm:px-4 sm:py-5 lg:px-6">
      {/* Header — clean pill nav */}
      <header className="sticky top-2 z-30 mb-5">
        <div className="flex items-center justify-between gap-2 rounded-full border border-ink-900/[0.06] bg-paper-50/80 px-3 py-2 shadow-soft backdrop-blur-md sm:px-4 sm:py-2.5">
          <Logo markClassName="h-8 w-8 text-ink-900" />
          <h1 className="sr-only">Clutch</h1>
          <nav className="hidden items-center gap-7 text-sm text-ink-600 md:flex">
            <span className="cursor-default transition-colors hover:text-ink-900">Priorities</span>
            <span className="cursor-default transition-colors hover:text-ink-900">Plan</span>
            <span className="cursor-default transition-colors hover:text-ink-900">Agent</span>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={() => store.sendToAgent('Review everything and build the best plan for me right now.')}
              disabled={thinking || open.length === 0}
              className="btn-primary !px-3 !text-xs sm:!px-4"
            >
              <span className="hidden sm:inline">Plan my day</span>
              <span className="sm:hidden">Plan</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink-900/15 bg-paper-50 text-xs font-bold text-ink-900 transition-colors hover:border-ink-900/40"
            >
              {(state.profile.name?.[0] || 'U').toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      {noKey && (
        <Reveal className="mb-4">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-ink-900/10 bg-paper-50 px-4 py-2.5 text-xs text-ink-700 shadow-soft">
            <span className="label">No Gemini key</span>
            <span>
              Set <code className="rounded bg-ink-900/[0.06] px-1">GEMINI_API_KEY</code> in your environment (or AI
              Studio secret) and rebuild — the agent needs it to think.
            </span>
          </div>
        </Reveal>
      )}

      {/* Hero: Right now */}
      {top && (
        <Reveal className="mb-4">
          <section className="card lift overflow-hidden">
            <div className="flex flex-col gap-4 p-5 sm:p-6 md:flex-row md:items-center">
              <div className="flex-1">
                <span className="chip mb-3 border border-ink-900/10 bg-stone-100 text-ink-600">Right now</span>
                <p className="text-xs text-ink-600">
                  {greet}, {state.profile.name}. This deserves your attention first.
                </p>
                <h2 className="mt-1.5 font-display text-xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-2xl">
                  {top.title}
                </h2>
                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`chip ${
                      formatDeadline(top.deadline).tone === 'red'
                        ? 'bg-signal-red/12 text-signal-red'
                        : 'bg-stone-100 text-ink-700'
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5" /> {formatDeadline(top.deadline).label}
                  </span>
                  <span className="text-ink-600">→ Next: {nextAction}</span>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {top.deliverable ? (
                  <button onClick={() => setOpenTask(top)} className="btn-primary flex-1 md:flex-none">
                    <Doc className="h-4 w-4" /> Open draft
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      store.sendToAgent(
                        `Help me actually do "${top.title}" now — produce whatever deliverable gets me started.`,
                      )
                    }
                    disabled={thinking}
                    className="btn-primary flex-1 md:flex-none"
                  >
                    Do it with me <ArrowUpRight className="h-4 w-4" />
                  </button>
                )}
                <button onClick={() => store.setTaskStatus(top.id, 'done')} className="btn-ghost flex-1 md:flex-none">
                  <Check className="h-4 w-4" /> Done
                </button>
              </div>
            </div>
          </section>
        </Reveal>
      )}

      {/* Stats — count up + stagger in on scroll */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Open tasks" caption="Awaiting action." value={open.length} highlight delay={0} />
        <StatCard label="Due in 24h" caption="Deadline pressure." value={dueSoon} delay={80} />
        <StatCard label="Focus blocks" caption="Scheduled by Clutch." value={state.schedule.length} delay={160} />
        <StatCard label="Drafts ready" caption="Deliverables generated." value={deliverables} delay={240} />
      </div>

      {/* Composer */}
      <Reveal className="mb-4">
        <Composer onSend={store.sendToAgent} thinking={thinking} empty={state.tasks.length === 0} />
      </Reveal>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Tasks */}
        <section className="lg:col-span-5">
          <Reveal>
            <div className="mb-3 flex items-center gap-2 px-1">
              <h2 className="font-display text-sm font-semibold text-ink-900">Priorities</h2>
              <span className="chip ml-auto border border-ink-900/10 bg-paper-50 text-ink-600">
                {open.length} open · {done} done
              </span>
            </div>
          </Reveal>
          {state.tasks.length === 0 ? (
            <Reveal>
              <div className="card flex flex-col items-center justify-center p-8 text-center sm:p-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100">
                  <Sparkle className="h-6 w-6 animate-twinkle text-ink-700" />
                </div>
                <p className="mt-3 font-display text-base font-semibold text-ink-900">Nothing tracked yet</p>
                <p className="mt-1 max-w-xs text-xs leading-relaxed text-ink-600">
                  Tell Clutch what you're juggling — type it, paste an email or syllabus, or use your voice. It'll
                  capture every commitment, prioritize, schedule, and start the work for you.
                </p>
              </div>
            </Reveal>
          ) : (
            <div className="space-y-3">
              {sorted.map((t, i) => (
                <Reveal key={t.id} delay={Math.min(i * 50, 300)}>
                  <TaskCard
                    task={t}
                    onToggleSub={(sid) => store.toggleSubtask(t.id, sid)}
                    onStatus={(s) => store.setTaskStatus(t.id, s)}
                    onOpenDeliverable={() => setOpenTask(t)}
                    onDelete={() => store.deleteTask(t.id)}
                  />
                </Reveal>
              ))}
            </div>
          )}
        </section>

        {/* Agenda */}
        <section className="lg:col-span-3">
          <Reveal>
            <Agenda blocks={state.schedule} />
          </Reveal>
        </section>

        {/* Activity */}
        <section className="lg:col-span-4 lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
          <Reveal className="h-full">
            <div className="h-[420px] sm:h-[520px] lg:h-full">
              <ActivityFeed messages={state.messages} thinking={thinking} liveActions={liveActions} />
            </div>
          </Reveal>
        </section>
      </div>

      {/* Marquee strip — quiet, monochrome, pauses on hover */}
      <Reveal className="mt-8">
        <div className="marquee-wrap overflow-hidden rounded-full bg-ink-900 py-2.5">
          <div className="marquee-track">
            {Array.from({ length: 2 }).map((_, k) => (
              <span key={k} className="flex items-center">
                {Array.from({ length: 8 }).map((__, i) => (
                  <span key={i} className="flex items-center text-sm font-medium text-stone-300">
                    <span className="px-6">Get started</span>
                    <span className="text-stone-500">✳</span>
                    <span className="px-6">Clutch</span>
                    <span className="text-stone-500">✳</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Footer */}
      <footer className="mt-8">
        <Reveal>
          <div className="card grid grid-cols-1 gap-6 p-6 text-xs sm:grid-cols-2 md:grid-cols-3">
            <div className="space-y-1.5">
              <p className="font-display text-sm font-semibold text-ink-900">clutch</p>
              <p className="cursor-pointer text-ink-600 transition-colors hover:text-ink-900" onClick={() => setShowSettings(true)}>
                Profile
              </p>
              <p className="text-ink-600">Privacy</p>
            </div>
            <div className="text-ink-600">
              <p className="label mb-1.5 text-ink-900">Built with</p>
              <p>Gemini 2.5 Flash · Google AI Studio · Cloud Run</p>
            </div>
            <div className="sm:text-right">
              <p className="label mb-1.5 text-ink-900">Mission</p>
              <p className="text-ink-600">Turns last-minute panic into a plan.</p>
            </div>
          </div>
        </Reveal>
        <div className="relative mt-4 overflow-hidden px-1">
          <h2 className="select-none font-display text-[19vw] font-bold leading-[0.85] tracking-tighter text-ink-900/90 lg:text-[150px]">
            clutch
          </h2>
        </div>
        <p className="label mt-3 px-1 pb-4 text-ink-500">©2026 Clutch · All rights reserved</p>
      </footer>

      {openTask && <DeliverableModal task={openTask} onClose={() => setOpenTask(null)} />}
      {showSettings && (
        <Settings
          profile={state.profile}
          onSave={store.setProfile}
          onClose={() => setShowSettings(false)}
          onClear={store.clearAll}
        />
      )}
    </div>
  );
}

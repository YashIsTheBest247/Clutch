import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useStore } from './lib/store';
import { hasApiKey } from './lib/gemini';
import { formatDeadline, realityCheck, slippage } from './lib/scheduler';
import { buildForecast } from './lib/forecast';
import { useCountUp, useInView } from './lib/anim';
import { useTTS } from './lib/useTTS';
import { useReminders } from './lib/useReminders';
import { useConversation } from './lib/useConversation';
import { useToasts } from './lib/useToasts';
import { useTheme } from './lib/useTheme';
import { useGoogleAuth } from './lib/useGoogleAuth';
import type { Task } from './types';
import { Composer } from './components/Composer';
import { TaskCard } from './components/TaskCard';
import { Agenda } from './components/Agenda';
import { ActivityFeed } from './components/ActivityFeed';
import { DeliverableModal } from './components/DeliverableModal';
import { Settings } from './components/Settings';
import { Reveal } from './components/Reveal';
import { FocusTimer } from './components/FocusTimer';
import { ProfileMenu } from './components/ProfileMenu';
import { ControlsMenu } from './components/ControlsMenu';
import { NotesWidget } from './components/NotesWidget';
import { GoogleSignInButton } from './components/GoogleSignInButton';
import { Tour } from './components/Tour';
import { AboutModal } from './components/AboutModal';
import { InsightsModal } from './components/InsightsModal';
import { GoalsHabits } from './components/GoalsHabits';
import { HowItWorks } from './components/HowItWorks';
import { CommandPalette, type Command } from './components/CommandPalette';
import { Toaster } from './components/Toaster';
import { StandupCard } from './components/StandupCard';
import { downloadICS, scheduleToICS } from './lib/calendar';
import { ArrowUpRight, Bell, BellOff, Bolt, Calendar, Chart, Check, Doc, Download, Flame, Gear, Github, Globe, Info, Lifebuoy, Linkedin, Menu, Mic, Moon, Play, Speaker, Sparkle, Sun, Trash, X } from './components/icons';
import { Logo } from './components/Logo';

const TINTS = {
  mint: { bg: 'bg-mint-100', fg: 'text-mint-700', dim: 'text-mint-700/70' },
  sky: { bg: 'bg-sky-100', fg: 'text-sky-700', dim: 'text-sky-700/70' },
  butter: { bg: 'bg-butter-100', fg: 'text-butter-700', dim: 'text-butter-700/70' },
  lilac: { bg: 'bg-lilac-100', fg: 'text-lilac-700', dim: 'text-lilac-700/70' },
} as const;

function MItem({
  icon,
  label,
  onClick,
  active,
  danger,
}: {
  icon: ReactElement;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition-colors ${
        danger ? 'text-signal-red hover:bg-signal-red/10' : 'text-ink-800 hover:bg-stone-100'
      }`}
    >
      <span className={active ? 'text-mint-600' : danger ? 'text-signal-red' : 'text-ink-500'}>{icon}</span>
      <span className="flex-1">{label}</span>
      {active && <span className="chip bg-mint-100 text-mint-700">On</span>}
    </button>
  );
}

function StatCard({
  label,
  caption,
  value,
  tint,
  delay = 0,
  onClick,
}: {
  label: string;
  caption: string;
  value: number;
  tint: keyof typeof TINTS;
  delay?: number;
  onClick?: () => void;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const shown = useCountUp(value, inView);
  const t = TINTS[tint];
  return (
    <button
      ref={ref as any}
      onClick={onClick}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal lift group flex min-h-[124px] flex-col justify-between rounded-3xl border border-black/[0.04] p-4 text-left shadow-soft sm:min-h-[150px] ${
        inView ? 'in' : ''
      } ${t.bg}`}
    >
      <div className="flex items-start justify-between">
        <span className={`label ${t.dim}`}>{label}</span>
        <ArrowUpRight className={`h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100 ${t.dim}`} />
      </div>
      <p className={`mt-1 text-[11px] ${t.dim}`}>{caption}</p>
      <div className={`mt-auto font-display text-3xl font-bold tabular-nums tracking-tight sm:text-4xl ${t.fg}`}>
        {shown}
      </div>
    </button>
  );
}

export default function App() {
  const store = useStore();
  const { state, thinking, liveActions } = store;
  const [openTask, setOpenTask] = useState<Task | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [planning, setPlanning] = useState(false);
  const [rescuing, setRescuing] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const streak = state.streak?.count ?? 0;
  const toasts = useToasts();
  const { theme, toggle: toggleTheme } = useTheme();
  const auth = useGoogleAuth();

  // First-visit onboarding hint pointing at the profile button.
  const [showHint, setShowHint] = useState(() => {
    try {
      return !localStorage.getItem('clutch.onboarded.v1');
    } catch {
      return false;
    }
  });
  const dismissHint = () => {
    setShowHint(false);
    try {
      localStorage.setItem('clutch.onboarded.v1', '1');
    } catch {
      /* noop */
    }
  };

  // Personalize from the Google account on sign-in.
  useEffect(() => {
    if (auth.user) {
      const n = auth.user.given_name || auth.user.name;
      if (n && state.profile.name !== n) store.setProfile({ name: n });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user?.sub]);

  // Undoable task actions.
  const removeTask = (t: Task) => {
    store.deleteTask(t.id);
    toasts.push('Task removed', { actionLabel: 'Undo', onAction: () => store.restoreTask(t) });
  };
  const handleStatus = (t: Task, s: Task['status']) => {
    store.setTaskStatus(t.id, s);
    if (s === 'done') {
      toasts.push('Task completed', { actionLabel: 'Undo', onAction: () => store.setTaskStatus(t.id, 'todo') });
    }
  };
  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clutch-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toasts.push('Backup downloaded');
  };

  const importData = (file: File) => {
    const before = {
      profile: state.profile,
      tasks: state.tasks,
      schedule: state.schedule,
      messages: state.messages,
      goals: state.goals,
      habits: state.habits,
      commitments: state.commitments,
      streak: state.streak,
      calibration: state.calibration,
    };
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!data || typeof data !== 'object' || !Array.isArray(data.tasks)) throw new Error('invalid');
        store.restoreAll(data);
        toasts.push('Backup restored', { actionLabel: 'Undo', onAction: () => store.restoreAll(before) });
      } catch {
        toasts.push("Couldn't read that file — is it a Clutch backup?");
      }
    };
    reader.readAsText(file);
  };

  const resetAll = () => {
    const snap = {
      tasks: state.tasks,
      schedule: state.schedule,
      messages: state.messages,
      goals: state.goals,
      habits: state.habits,
      streak: state.streak,
    };
    store.clearAll();
    toasts.push('Everything cleared', { actionLabel: 'Undo', onAction: () => store.restoreAll(snap) });
  };

  // Proactive: detect slipping work on load (deterministic, no API spend).
  const slip = useMemo(() => slippage(state.tasks, new Date()), [state.tasks]);
  const slipping = slip.overdue.length + slip.atRisk.length;

  // Reality-Check: can the workload actually fit before the deadlines?
  const reality = useMemo(() => realityCheck(state.tasks, state.profile, new Date()), [state.tasks, state.profile]);

  // "Will I make it?" — per-task on-time probability + portfolio verdict.
  const forecast = useMemo(
    () => buildForecast(state.tasks, state.profile, state.calibration, new Date()),
    [state.tasks, state.profile, state.calibration],
  );

  // Proactive daily standup — surfaces once per day on open.
  const todayKey = new Date().toISOString().slice(0, 10);
  const [standupDismissed, setStandupDismissed] = useState(() => {
    try {
      return localStorage.getItem('clutch.standup.' + todayKey) === '1';
    } catch {
      return false;
    }
  });
  const dismissStandup = () => {
    setStandupDismissed(true);
    try {
      localStorage.setItem('clutch.standup.' + todayKey, '1');
    } catch {
      /* noop */
    }
  };
  const nextBlock = useMemo(() => {
    const now = Date.now();
    const up = state.schedule
      .filter((b) => Date.parse(b.start) > now)
      .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))[0];
    return up ? new Date(up.start).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : undefined;
  }, [state.schedule]);
  const [realityDismissed, setRealityDismissed] = useState(false);
  const fmtH = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}` : `${m}m`);
  const fixOvercommit = async () => {
    if (thinking) return;
    setTimeout(() => scrollToId('agent'), 80);
    await store.sendToAgent(
      `Reality check: I'm overcommitted — about ${fmtH(reality.committedMins)} of work but only ~${fmtH(
        reality.availableMins,
      )} of working time before ${reality.horizon}. Decide what to cut, defer, or trim so the essential things actually fit. Re-prioritize, rebuild my schedule, and tell me clearly what you cut/moved and why.`,
    );
  };

  // Context-aware browser reminders.
  const [remindersOn, setRemindersOn] = useState(false);
  useReminders(state.tasks, state.schedule, remindersOn, state.profile.dayStartHour);
  const toggleReminders = async () => {
    if (typeof Notification === 'undefined') return;
    if (remindersOn) {
      setRemindersOn(false);
      return;
    }
    let perm = Notification.permission;
    if (perm === 'default') perm = await Notification.requestPermission();
    if (perm === 'granted') setRemindersOn(true);
    else alert('Allow notifications in your browser to get deadline & focus reminders.');
  };

  // Voice-out: speak the agent's daily briefing (and optionally every reply).
  const tts = useTTS();
  const [voiceOut, setVoiceOut] = useState(false);
  const lastSpokenRef = useRef<string | null>(null);
  const forceSpeakRef = useRef(false);

  useEffect(() => {
    const msgs = state.messages;
    const last = msgs[msgs.length - 1];
    if (!last || last.role !== 'agent' || last.id === lastSpokenRef.current) return;
    lastSpokenRef.current = last.id;
    if (voiceOut || forceSpeakRef.current) {
      forceSpeakRef.current = false;
      tts.speak(last.content);
    }
  }, [state.messages, voiceOut, tts]);

  const requestBriefing = () => {
    const now = new Date();
    const { overdue, atRisk } = slippage(state.tasks, now);
    const slip =
      [
        overdue.length ? `Overdue: ${overdue.map((t) => t.title).join('; ')}.` : '',
        atRisk.length ? `At risk of slipping: ${atRisk.map((t) => t.title).join('; ')}.` : '',
      ]
        .filter(Boolean)
        .join(' ') || 'Nothing is overdue yet.';
    forceSpeakRef.current = true;
    store.sendToAgent(
      `Give me my briefing. Status — ${slip} Review every task against the time right now, call out what's slipping, rebuild my schedule if it helps, then tell me the ONE thing to do next. Keep it to ~4 short sentences I can listen to.`,
    );
  };

  const toggleVoice = () => {
    if (voiceOut) {
      tts.stop();
      setVoiceOut(false);
    } else {
      setVoiceOut(true);
    }
  };

  // Hands-free conversation: speak → agent acts → speaks back → auto-listens again.
  const [converseOn, setConverseOn] = useState(false);
  const convo = useConversation((text) => {
    if (text) store.sendToAgent(text);
  });
  const toggleConverse = () => {
    if (converseOn) {
      setConverseOn(false);
      convo.stop();
      tts.stop();
    } else {
      if (!convo.supported || !tts.supported) {
        alert('Voice conversation needs a browser with speech recognition + synthesis (e.g. Chrome).');
        return;
      }
      setConverseOn(true);
      setVoiceOut(true);
      setTimeout(() => scrollToId('agent'), 80);
      convo.start();
    }
  };
  // Resume listening once the agent has finished thinking and speaking.
  useEffect(() => {
    if (!converseOn || thinking || tts.speaking || convo.listening) return;
    const id = setTimeout(() => {
      if (converseOn && !thinking && !tts.speaking) convo.start();
    }, 450);
    return () => clearTimeout(id);
  }, [converseOn, thinking, tts.speaking, convo.listening, convo]);

  const scrollToId = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Composer send: process, then reveal the Priorities / Plan / Agent area.
  const handleCompose = async (text: string, image?: Parameters<typeof store.sendToAgent>[1]) => {
    await store.sendToAgent(text, image);
    setTimeout(() => scrollToId('priorities'), 150);
  };

  // Autopilot — hand the agent everything and let it run the full pipeline.
  const AUTOPILOT_DIRECTIVE =
    "AUTOPILOT — run the full pipeline end-to-end and don't ask me anything. " +
    "1) Capture every task, fixed commitment and deadline. " +
    "2) Where real-world facts would help (links, opening hours, prices, dates, how-to), research the web. " +
    "3) Decompose anything non-trivial into concrete steps. " +
    "4) Prioritize by deadline proximity and impact. " +
    "5) For every task with a clear work product, GENERATE the complete deliverable now (email, outline, plan, checklist, message). " +
    "6) Build my schedule around fixed commitments. " +
    "7) Finish with one line: 'Start here →' naming the single most important next action.";
  const runAutopilot = async (text?: string, image?: Parameters<typeof store.sendToAgent>[1]) => {
    if (thinking) return;
    const situation = text?.trim()
      ? `Here's my situation:\n${text.trim()}`
      : 'Use my existing tracked tasks and commitments.';
    setTimeout(() => scrollToId('agent'), 80);
    await store.sendToAgent(`${AUTOPILOT_DIRECTIVE}\n\n${situation}`, image);
    setTimeout(() => scrollToId('priorities'), 150);
  };

  const planMyDay = async () => {
    if (thinking || open.length === 0) return;
    setPlanning(true);
    try {
      await store.sendToAgent('Review everything and build the best plan for me right now.');
    } finally {
      setPlanning(false);
      // Let the new message render, then reveal the live agent chat.
      setTimeout(() => scrollToId('agent'), 120);
    }
  };

  const rescueMe = async () => {
    if (thinking || open.length === 0) return;
    setRescuing(true);
    setTimeout(() => scrollToId('agent'), 80);
    try {
      await store.sendToAgent(
        "RESCUE MODE — I'm overwhelmed and short on time. Stay calm and directive. Ruthlessly re-prioritize every task, rebuild my schedule, and then tell me EXACTLY the 3 things to do in the next 60 minutes — a numbered list, nothing else. Cut everything that isn't essential right now.",
      );
    } finally {
      setRescuing(false);
    }
  };

  const exportCalendar = () => downloadICS(scheduleToICS(state.schedule, state.tasks));

  const explainPlan = async () => {
    if (thinking || open.length === 0) return;
    setTimeout(() => scrollToId('agent'), 80);
    await store.sendToAgent(
      'Explain why you ordered and scheduled my tasks the way you did — the reasoning behind the top priorities and the plan. Be concise: a short bullet list.',
    );
  };

  const weeklyRetro = async () => {
    if (thinking) return;
    setShowInsights(false);
    setTimeout(() => scrollToId('agent'), 80);
    await store.sendToAgent(
      "Give me my weekly retrospective. Review what I completed and what's still open, call out 1–2 honest patterns in how I worked this week, then propose a concrete plan for next week — the key priorities and how to set up my days. Keep it tight and motivating.",
    );
  };

  // ⌘K / Ctrl+K command palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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

  // Quick filters for the task board.
  const [taskFilter, setTaskFilter] = useState<'all' | 'today' | 'week' | 'overdue'>('all');
  const matchesFilter = (t: Task, key: typeof taskFilter, now: number, eod: number, weekEnd: number) => {
    if (key === 'all') return true;
    if (t.status === 'done' || !t.deadline) return false;
    const d = Date.parse(t.deadline);
    if (key === 'overdue') return d < now;
    if (key === 'today') return d <= eod;
    return d <= weekEnd; // this week
  };
  const filterCounts = useMemo(() => {
    const now = Date.now();
    const e = new Date();
    e.setHours(23, 59, 59, 999);
    const eod = e.getTime();
    const weekEnd = now + 7 * 24 * 3600 * 1000;
    const c = { all: state.tasks.length, today: 0, week: 0, overdue: 0 };
    for (const t of state.tasks) {
      if (matchesFilter(t, 'today', now, eod, weekEnd)) c.today++;
      if (matchesFilter(t, 'week', now, eod, weekEnd)) c.week++;
      if (matchesFilter(t, 'overdue', now, eod, weekEnd)) c.overdue++;
    }
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.tasks]);
  const filteredTasks = useMemo(() => {
    const now = Date.now();
    const e = new Date();
    e.setHours(23, 59, 59, 999);
    const eod = e.getTime();
    const weekEnd = now + 7 * 24 * 3600 * 1000;
    return sorted.filter((t) => matchesFilter(t, taskFilter, now, eod, weekEnd));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorted, taskFilter]);

  const dueSoon = open.filter((t) => t.deadline && Date.parse(t.deadline) - Date.now() < 24 * 3600 * 1000).length;
  const deliverables = state.tasks.filter((t) => t.deliverable).length;
  const done = state.tasks.filter((t) => t.status === 'done').length;
  const noKey = !hasApiKey();

  const nextAction = top?.subtasks.find((s) => !s.done)?.title ?? 'Make a focused start on this.';
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const commands: Command[] = [
    { id: 'autopilot', label: 'Autopilot — capture, research, schedule & draft everything', icon: <Bolt className="h-4 w-4" />, run: () => runAutopilot(), disabled: open.length === 0 },
    { id: 'plan', label: 'Plan my day', icon: <Sparkle className="h-4 w-4" />, run: planMyDay, disabled: open.length === 0 },
    { id: 'rescue', label: 'Rescue me — triage everything', icon: <Lifebuoy className="h-4 w-4" />, run: rescueMe, disabled: open.length === 0 },
    { id: 'brief', label: 'Spoken daily briefing', icon: <Play className="h-4 w-4" />, run: requestBriefing, disabled: open.length === 0 },
    { id: 'why', label: 'Why this plan? — explain the ordering', icon: <Info className="h-4 w-4" />, run: explainPlan, disabled: open.length === 0 },
    { id: 'cal', label: 'Export plan to calendar (.ics)', icon: <Calendar className="h-4 w-4" />, run: exportCalendar },
    { id: 'export', label: 'Export backup (download JSON)', icon: <Download className="h-4 w-4" />, run: exportData },
    {
      id: 'import',
      label: 'Import backup (restore JSON)',
      icon: <Download className="h-4 w-4 rotate-180" />,
      run: () => {
        const inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = 'application/json,.json';
        inp.onchange = () => {
          const f = inp.files?.[0];
          if (f) importData(f);
        };
        inp.click();
      },
    },
    { id: 'insights', label: 'Open insights', icon: <Chart className="h-4 w-4" />, run: () => setShowInsights(true) },
    { id: 'retro', label: 'Weekly retrospective', icon: <Chart className="h-4 w-4" />, run: weeklyRetro },
    { id: 'theme', label: 'Toggle dark / light theme', icon: theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />, run: toggleTheme },
    { id: 'remind', label: 'Toggle browser reminders', icon: <Bell className="h-4 w-4" />, run: toggleReminders },
    { id: 'voice', label: 'Toggle voice replies', icon: <Speaker className="h-4 w-4" />, run: toggleVoice },
    { id: 'converse', label: converseOn ? 'End hands-free conversation' : 'Talk to Clutch (hands-free)', icon: <Mic className="h-4 w-4" />, run: toggleConverse, disabled: !convo.supported || !tts.supported },
    { id: 'go-pri', label: 'Go to Priorities', hint: 'section', icon: <ArrowUpRight className="h-4 w-4" />, run: () => scrollToId('priorities') },
    { id: 'go-plan', label: 'Go to Plan', hint: 'section', icon: <ArrowUpRight className="h-4 w-4" />, run: () => scrollToId('plan') },
    { id: 'go-goals', label: 'Go to Goals & habits', hint: 'section', icon: <ArrowUpRight className="h-4 w-4" />, run: () => scrollToId('goals') },
    { id: 'profile', label: 'Profile & preferences', icon: <Gear className="h-4 w-4" />, run: () => setShowSettings(true) },
    { id: 'about', label: 'About Clutch', icon: <Info className="h-4 w-4" />, run: () => setShowAbout(true) },
    { id: 'tour', label: 'Replay tutorial', icon: <Play className="h-4 w-4" />, run: () => setShowHint(true) },
    { id: 'reset', label: 'Reset everything', icon: <Trash className="h-4 w-4" />, run: resetAll },
  ];

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-3 py-4 sm:px-4 sm:py-5 lg:px-6">
      {/* Header — clean pill nav */}
      <header className="sticky top-2 z-30 mb-5">
        <div className="flex items-center justify-between gap-2 rounded-full border border-ink-900/[0.06] bg-paper-50/80 px-3 py-2 shadow-soft backdrop-blur-md sm:px-4 sm:py-2.5">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              title="Back to top"
              className="rounded-full transition-transform hover:scale-[1.02] active:scale-95"
            >
              <Logo markClassName="h-8 w-8 text-ink-900" />
            </button>
            <h1 className="sr-only">Clutch</h1>
            {streak > 0 && (
              <span
                className="chip border border-ink-900/10 bg-stone-100 text-ink-700"
                title={`${streak}-day completion streak`}
              >
                <Flame className="h-3.5 w-3.5 text-signal-red" /> {streak}
              </span>
            )}
          </div>
          <nav className="hidden items-center gap-7 text-sm text-ink-600 lg:flex">
            <button onClick={() => scrollToId('priorities')} className="transition-colors hover:text-ink-900">Workspace</button>
            <button onClick={() => scrollToId('goals')} className="transition-colors hover:text-ink-900">Goals</button>
            <button onClick={() => scrollToId('how')} className="transition-colors hover:text-ink-900">How it works</button>
            <button
              onClick={() => setPaletteOpen(true)}
              data-tour="palette"
              title="Command palette"
              className="rounded-lg border border-ink-900/15 px-2 py-1 text-[11px] font-semibold text-ink-500 transition-colors hover:border-ink-900/40 hover:text-ink-900"
            >
              ⌘K
            </button>
          </nav>
          <div className="flex items-center gap-2">
            {/* Theme toggle — visible on all sizes */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-900/15 bg-paper-50 text-ink-900 transition-all hover:-translate-y-0.5 hover:scale-105 hover:bg-stone-100 hover:border-ink-900/40 active:scale-95"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Heavier actions — desktop only (in the hamburger on mobile) */}
            <div className="hidden items-center gap-2 lg:flex">
              <span data-tour="controls" className="inline-flex">
                <ControlsMenu
                  items={[
                    { id: 'remind', icon: <Bell className="h-4 w-4" />, label: 'Browser reminders', active: remindersOn, onClick: toggleReminders },
                    { id: 'voice', icon: <Speaker className="h-4 w-4" />, label: 'Voice replies', active: voiceOut, disabled: !tts.supported, onClick: toggleVoice },
                    { id: 'converse', icon: <Mic className="h-4 w-4" />, label: 'Hands-free conversation', active: converseOn, disabled: !convo.supported || !tts.supported, onClick: toggleConverse },
                    { id: 'brief', icon: <Play className="h-4 w-4" />, label: 'Spoken daily briefing', disabled: thinking || open.length === 0, onClick: requestBriefing },
                  ]}
                />
              </span>
              <button
                onClick={rescueMe}
                data-tour="rescue"
                disabled={thinking || open.length === 0}
                title="I'm overwhelmed — triage everything now"
                className="btn !px-3 !text-xs border border-signal-red/40 bg-signal-red/10 text-signal-red hover:bg-signal-red/15"
              >
                <Lifebuoy className={`h-3.5 w-3.5 ${rescuing ? 'animate-spin' : ''}`} />
                <span>{rescuing ? 'Rescuing…' : 'Rescue me'}</span>
              </button>
              <button
                onClick={planMyDay}
                disabled={thinking || open.length === 0}
                className={`btn-primary !px-3 !text-xs sm:!px-4 ${planning ? 'disabled:!opacity-100' : ''}`}
              >
                {planning ? (
                  <>
                    <Sparkle className="h-3.5 w-3.5 animate-spin" /> Planning…
                  </>
                ) : (
                  <>
                    Plan my day <ArrowUpRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
              {auth.enabled && !auth.user && <GoogleSignInButton render={auth.renderButton} />}
            </div>

            {/* Profile / sign-in — visible on all sizes */}
            <ProfileMenu
              profile={state.profile}
              user={auth.user}
              renderSignIn={auth.enabled && !auth.user ? auth.renderButton : undefined}
              onProfile={() => setShowSettings(true)}
              onInsights={() => setShowInsights(true)}
              onAbout={() => setShowAbout(true)}
              onReset={resetAll}
              onSignOut={auth.enabled ? auth.signOut : undefined}
              onReplayTutorial={() => setShowHint(true)}
            >
              <span data-tour="profile" className="flex shrink-0 items-center gap-1.5 rounded-full border border-ink-900/15 bg-paper-50 py-1 pl-1 pr-2 transition-all hover:-translate-y-0.5 hover:border-ink-900/40 hover:shadow-soft">
                {auth.user?.picture ? (
                  <img src={auth.user.picture} alt="" className="h-7 w-7 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-900 text-[11px] font-bold text-paper-50">
                    {(state.profile.name?.[0] || 'U').toUpperCase()}
                  </span>
                )}
                <Gear className="h-3.5 w-3.5 text-ink-500" />
              </span>
            </ProfileMenu>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={mobileOpen}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-900/15 bg-paper-50 text-ink-900 transition-all hover:border-ink-900/40 active:scale-90 lg:hidden"
          >
            <span className={`transition-transform duration-300 ${mobileOpen ? 'rotate-90' : ''}`}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </span>
          </button>
        </div>

        {/* Mobile menu panel */}
        {mobileOpen && (
          <div className="mt-2 animate-fade-up lg:hidden">
            <div className="max-h-[78vh] overflow-y-auto rounded-3xl border border-ink-900/[0.06] bg-paper-50 p-2 shadow-panel">
              <p className="px-3 pb-1 pt-2 label text-ink-500">Navigate</p>
              <MItem icon={<ArrowUpRight className="h-4 w-4" />} label="Priorities" onClick={() => { scrollToId('priorities'); setMobileOpen(false); }} />
              <MItem icon={<ArrowUpRight className="h-4 w-4" />} label="Plan" onClick={() => { scrollToId('plan'); setMobileOpen(false); }} />
              <MItem icon={<ArrowUpRight className="h-4 w-4" />} label="Agent" onClick={() => { scrollToId('agent'); setMobileOpen(false); }} />
              <MItem icon={<ArrowUpRight className="h-4 w-4" />} label="Goals & habits" onClick={() => { scrollToId('goals'); setMobileOpen(false); }} />
              <MItem icon={<ArrowUpRight className="h-4 w-4" />} label="How it works" onClick={() => { scrollToId('how'); setMobileOpen(false); }} />

              <div className="my-1 h-px bg-ink-900/[0.06]" />
              <p className="px-3 pb-1 pt-1 label text-ink-500">Do</p>
              <MItem icon={<Bolt className="h-4 w-4" />} label="Autopilot — do it all" onClick={() => { runAutopilot(); setMobileOpen(false); }} />
              <MItem icon={<Sparkle className="h-4 w-4" />} label="Plan my day" onClick={() => { planMyDay(); setMobileOpen(false); }} />
              <MItem icon={<Lifebuoy className="h-4 w-4" />} label="Rescue me" danger onClick={() => { rescueMe(); setMobileOpen(false); }} />
              <MItem icon={<Play className="h-4 w-4" />} label="Daily briefing" onClick={() => { requestBriefing(); setMobileOpen(false); }} />
              <MItem icon={<Chart className="h-4 w-4" />} label="Open command palette (⌘K)" onClick={() => { setMobileOpen(false); setPaletteOpen(true); }} />

              <div className="my-1 h-px bg-ink-900/[0.06]" />
              <p className="px-3 pb-1 pt-1 label text-ink-500">Controls</p>
              <MItem icon={remindersOn ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />} label="Browser reminders" active={remindersOn} onClick={toggleReminders} />
              {tts.supported && <MItem icon={<Speaker className="h-4 w-4" />} label="Voice replies" active={voiceOut} onClick={toggleVoice} />}
              {convo.supported && tts.supported && <MItem icon={<Mic className="h-4 w-4" />} label="Hands-free conversation" active={converseOn} onClick={toggleConverse} />}

              <div className="my-1 h-px bg-ink-900/[0.06]" />
              <p className="px-3 pb-1 pt-1 label text-ink-500">More</p>
              <MItem icon={<Chart className="h-4 w-4" />} label="Insights" onClick={() => { setMobileOpen(false); setShowInsights(true); }} />
              <MItem icon={<Info className="h-4 w-4" />} label="About Clutch" onClick={() => { setMobileOpen(false); setShowAbout(true); }} />
              <MItem icon={<Trash className="h-4 w-4" />} label="Reset everything" danger onClick={() => { setMobileOpen(false); resetAll(); }} />
            </div>
          </div>
        )}
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

      {/* Proactive daily standup — the app reaches out first, once per day */}
      {!standupDismissed && !showHint && !thinking && open.length > 0 && (
        <Reveal className="mb-4">
          <StandupCard
            name={state.profile.name}
            greeting={greet}
            dueToday={filterCounts.today}
            slipping={slip.atRisk.length}
            overdue={slip.overdue.length}
            firstBlock={nextBlock}
            topTask={top?.title}
            onTrack={forecast.onTrack}
            forecastTotal={forecast.total}
            thinking={thinking}
            onPlan={() => {
              dismissStandup();
              planMyDay();
            }}
            onBrief={() => {
              dismissStandup();
              requestBriefing();
            }}
            onDismiss={dismissStandup}
          />
        </Reveal>
      )}

      {/* Proactive nudge — appears automatically when work is slipping */}
      {slipping > 0 && !nudgeDismissed && !thinking && (
        <Reveal className="mb-4">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-signal-red/30 bg-signal-red/[0.07] px-4 py-3">
            <Lifebuoy className="h-4 w-4 shrink-0 text-signal-red" />
            <p className="text-xs text-ink-800">
              Heads up — <span className="font-semibold text-signal-red">{slipping}</span>{' '}
              {slipping === 1 ? 'task is' : 'tasks are'} slipping
              {slip.overdue.length ? ` (${slip.overdue.length} overdue)` : ''}. Want me to step in?
            </p>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={rescueMe} disabled={thinking} className="btn !py-1.5 !text-xs bg-signal-red text-white hover:opacity-90">
                <Lifebuoy className="h-3.5 w-3.5" /> Re-plan now
              </button>
              <button
                onClick={() => setNudgeDismissed(true)}
                className="rounded-full p-1.5 text-ink-500 hover:bg-ink-900/5 hover:text-ink-900"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </Reveal>
      )}

      {/* Reality-Check — honest capacity warning */}
      {reality.overcommitted && !realityDismissed && !thinking && (
        <Reveal className="mb-4">
          <div className="rounded-2xl border border-signal-red/30 bg-signal-red/[0.07] p-4">
            <div className="flex items-start gap-3">
              <Lifebuoy className="mt-0.5 h-5 w-5 shrink-0 text-signal-red" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink-900">Reality check — you're overcommitted</p>
                <p className="mt-0.5 text-xs text-ink-700">
                  ~<span className="font-semibold">{fmtH(reality.committedMins)}</span> of work but only ~
                  <span className="font-semibold">{fmtH(reality.availableMins)}</span> before {reality.horizon} —
                  about <span className="font-semibold text-signal-red">{fmtH(reality.deficitMins)}</span> short.
                </p>
                {reality.cut.length > 0 && (
                  <p className="mt-1 text-xs text-ink-600">
                    To make it, consider cutting/moving:{' '}
                    <span className="text-ink-800">{reality.cut.map((t) => t.title).join(', ')}</span>.
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button onClick={fixOvercommit} disabled={thinking} className="btn !py-1.5 !text-xs bg-signal-red text-white hover:opacity-90">
                  <Lifebuoy className="h-3.5 w-3.5" /> Help me fix this
                </button>
                <button
                  onClick={() => setRealityDismissed(true)}
                  className="rounded-full p-1.5 text-ink-500 hover:bg-ink-900/5 hover:text-ink-900"
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {/* Hero: Right now */}
      {top && (
        <Reveal className="mb-4">
          <section className="card lift relative overflow-hidden bg-gradient-to-br from-paper-50 to-mint-100/50">
            <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-sky-200/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-butter-200/30 blur-3xl" />
            <div className="relative flex flex-col gap-4 p-5 sm:p-6 md:flex-row md:items-center">
              <div className="flex-1">
                <span className="chip mb-3 bg-mint-100 text-mint-700">Right now</span>
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
                <button onClick={() => setFocusTask(top)} className="btn-ghost flex-1 md:flex-none">
                  <Play className="h-3.5 w-3.5" /> Focus
                </button>
                <button onClick={() => handleStatus(top, 'done')} className="btn-ghost flex-1 md:flex-none">
                  <Check className="h-4 w-4" /> Done
                </button>
              </div>
            </div>
          </section>
        </Reveal>
      )}

      {/* Stats — count up + stagger in on scroll */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Open tasks" caption="Awaiting action." value={open.length} tint="mint" delay={0} onClick={() => scrollToId('priorities')} />
        <StatCard label="Due in 24h" caption="Deadline pressure." value={dueSoon} tint="butter" delay={80} onClick={() => scrollToId('priorities')} />
        <StatCard label="Focus blocks" caption="Scheduled by Clutch." value={state.schedule.length} tint="sky" delay={160} onClick={() => scrollToId('plan')} />
        <StatCard label="Drafts ready" caption="Deliverables generated." value={deliverables} tint="lilac" delay={240} onClick={() => scrollToId('priorities')} />
      </div>

      {/* Composer */}
      <Reveal className="mb-4">
        <Composer onSend={handleCompose} onAutopilot={runAutopilot} thinking={thinking} empty={state.tasks.length === 0} />
      </Reveal>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Tasks */}
        <section id="priorities" className="scroll-mt-24 lg:col-span-4">
          <Reveal>
            <div className="mb-3 flex items-center gap-2 px-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-mint-100 text-mint-600">
                <Check className="h-4 w-4" />
              </span>
              <h2 className="font-display text-sm font-semibold text-ink-900">Priorities</h2>
              {open.length > 0 && (
                <button
                  onClick={explainPlan}
                  disabled={thinking}
                  title="Ask Clutch to explain its plan"
                  className="btn-ghost ml-auto !px-2.5 !py-1 !text-[11px]"
                >
                  Why this plan?
                </button>
              )}
              <span className={`chip border border-ink-900/10 bg-paper-50 text-ink-600 ${open.length ? '' : 'ml-auto'}`}>
                {open.length} open · {done} done
              </span>
            </div>
          </Reveal>
          {forecast.total > 0 && (
            <Reveal>
              <div
                className={`mb-3 flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs ${
                  forecast.atRisk > 0
                    ? 'border-signal-red/25 bg-signal-red/[0.06] text-ink-700'
                    : 'border-mint-500/30 bg-mint-100/60 text-ink-700'
                }`}
                title="Forecast from your workload, working hours and past pace"
              >
                <Sparkle className={`h-3.5 w-3.5 shrink-0 ${forecast.atRisk > 0 ? 'text-signal-red' : 'text-mint-600'}`} />
                <span>
                  Forecast: you'll finish{' '}
                  <span className="font-semibold text-ink-900">
                    {forecast.onTrack}/{forecast.total}
                  </span>{' '}
                  on time
                  {forecast.atRisk > 0 ? (
                    <>
                      {' '}— <span className="font-semibold text-signal-red">{forecast.atRisk} at risk</span>
                    </>
                  ) : (
                    <> — all on track</>
                  )}
                  .
                </span>
              </div>
            </Reveal>
          )}
          {state.tasks.length > 0 && (
            <Reveal>
              <div className="mb-3 flex flex-wrap items-center gap-1.5 px-1">
                {([
                  { key: 'all', label: 'All', n: filterCounts.all },
                  { key: 'today', label: 'Today', n: filterCounts.today },
                  { key: 'week', label: 'This week', n: filterCounts.week },
                  { key: 'overdue', label: 'Overdue', n: filterCounts.overdue },
                ] as const).map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setTaskFilter(f.key)}
                    className={`chip transition-colors ${
                      taskFilter === f.key
                        ? f.key === 'overdue'
                          ? 'bg-signal-red text-white'
                          : 'bg-ink-900 text-paper-50'
                        : 'border border-ink-900/10 bg-paper-50 text-ink-600 hover:bg-stone-100'
                    }`}
                  >
                    {f.label}
                    <span className={taskFilter === f.key ? 'opacity-70' : 'text-ink-400'}>{f.n}</span>
                  </button>
                ))}
              </div>
            </Reveal>
          )}
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
          ) : filteredTasks.length === 0 ? (
            <Reveal>
              <div className="card flex flex-col items-center justify-center p-8 text-center text-ink-600">
                <p className="text-sm">No tasks match “{taskFilter === 'week' ? 'This week' : taskFilter}”.</p>
                <button onClick={() => setTaskFilter('all')} className="btn-ghost mt-3 !text-xs">
                  Show all tasks
                </button>
              </div>
            </Reveal>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((t, i) => (
                <Reveal key={t.id} delay={Math.min(i * 50, 300)}>
                  <TaskCard
                    task={t}
                    onToggleSub={(sid) => store.toggleSubtask(t.id, sid)}
                    onStatus={(s) => handleStatus(t, s)}
                    onOpenDeliverable={() => setOpenTask(t)}
                    onDelete={() => removeTask(t)}
                    onFocus={() => setFocusTask(t)}
                    goals={state.goals}
                    onAssignGoal={(gid) => store.assignTaskGoal(t.id, gid)}
                    onSetRecur={(r) => store.setTaskRecur(t.id, r)}
                    onSetDeadline={(d) => store.setTaskDeadline(t.id, d)}
                    winChance={forecast.byId[t.id]?.p}
                  />
                </Reveal>
              ))}
            </div>
          )}
        </section>

        {/* Agenda */}
        <section id="plan" className="scroll-mt-24 lg:col-span-4">
          <Reveal>
            <Agenda
              blocks={state.schedule}
              tasks={state.tasks}
              commitments={state.commitments}
              onAddCommitment={store.addCommitment}
              onDeleteCommitment={store.deleteCommitment}
            />
          </Reveal>
        </section>

        {/* Activity */}
        <section id="agent" className="scroll-mt-24 lg:col-span-4 lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
          <Reveal className="h-full">
            <div className="h-[420px] sm:h-[520px] lg:h-full">
              <ActivityFeed
              messages={state.messages}
              thinking={thinking}
              liveActions={liveActions}
              streamingText={store.streamingText}
            />
            </div>
          </Reveal>
        </section>
      </div>

      {/* Goals & Habits */}
      <section id="goals" className="mt-4 scroll-mt-24">
        <Reveal>
          <GoalsHabits
            goals={state.goals ?? []}
            habits={state.habits ?? []}
            tasks={state.tasks}
            onAddGoal={store.addGoal}
            onDeleteGoal={store.deleteGoal}
            onAddHabit={store.addHabit}
            onToggleHabit={store.toggleHabitToday}
            onDeleteHabit={store.deleteHabit}
          />
        </Reveal>
      </section>

      {/* How it works */}
      <HowItWorks />

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
              <button onClick={() => setShowInsights(true)} className="block text-ink-600 transition-colors hover:text-ink-900">
                Insights
              </button>
              <button onClick={() => setShowSettings(true)} className="block text-ink-600 transition-colors hover:text-ink-900">
                Profile
              </button>
              <button onClick={() => setShowAbout(true)} className="block text-ink-600 transition-colors hover:text-ink-900">
                About
              </button>
            </div>
            <div>
              <p className="label mb-1.5 text-ink-900">Mission</p>
              <p className="text-ink-600">Turns last-minute panic into a plan.</p>
            </div>
            <div className="sm:text-right">
              <p className="label mb-2 text-ink-900">Connect with the developer</p>
              <p className="mb-2.5 text-ink-600">Yash Munshi</p>
              <div className="flex items-center gap-2 sm:justify-end">
                {[
                  { href: 'https://yash-munshi.vercel.app/', label: 'Portfolio', Icon: Globe },
                  { href: 'https://github.com/YashIsTheBest247', label: 'GitHub', Icon: Github },
                  { href: 'https://www.linkedin.com/in/yash-munshi-a0408b337/', label: 'LinkedIn', Icon: Linkedin },
                ].map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    title={label}
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-900/15 text-ink-700 transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:border-transparent hover:bg-ink-900 hover:text-paper-50 hover:shadow-glow"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
        <div className="relative mt-4 overflow-hidden px-1">
          <h2 className="select-none font-display text-[19vw] font-bold leading-[0.85] tracking-tighter text-ink-900/90 lg:text-[150px]">
            clutch
          </h2>
        </div>
        <div className="mt-3 flex flex-col gap-1 px-1 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="label text-ink-500">©2026 Clutch · All rights reserved</p>
         
        </div>
      </footer>

      {converseOn && (
        <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink-900 px-4 py-2 text-xs font-medium text-paper-50 shadow-panel">
          <Mic className="h-3.5 w-3.5" />
          {thinking ? 'Clutch is working…' : tts.speaking ? 'Clutch is speaking…' : convo.listening ? 'Listening…' : 'Ready'}
          <button onClick={toggleConverse} className="ml-1 rounded-full bg-white/15 px-2 py-0.5 hover:bg-white/25">
            End
          </button>
        </div>
      )}
      {focusTask && (
        <FocusTimer
          task={focusTask}
          onClose={() => setFocusTask(null)}
          onComplete={(mins) => {
            store.recordActual(focusTask.id, mins);
            handleStatus(focusTask, 'done');
          }}
        />
      )}
      {showHint && <Tour onFinish={dismissHint} />}
      <NotesWidget onCapture={(t) => handleCompose(t)} focusActive={!!focusTask} />
      <Toaster toasts={toasts.toasts} onDismiss={toasts.dismiss} />
      {paletteOpen && <CommandPalette commands={commands} onClose={() => setPaletteOpen(false)} />}
      {showInsights && (
        <InsightsModal
          tasks={state.tasks}
          habits={state.habits ?? []}
          streak={streak}
          calibration={state.calibration}
          onRetro={weeklyRetro}
          onClose={() => setShowInsights(false)}
        />
      )}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      {openTask && <DeliverableModal task={openTask} onClose={() => setOpenTask(null)} />}
      {showSettings && (
        <Settings
          profile={state.profile}
          onSave={store.setProfile}
          onClose={() => setShowSettings(false)}
          onClear={resetAll}
          onExport={exportData}
          onImport={importData}
        />
      )}
    </div>
  );
}

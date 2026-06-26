import type { ReactElement } from 'react';
import { Reveal } from './Reveal';
import { LogoMark } from './Logo';
import { Calendar, Doc, Image as ImageIcon, Lifebuoy, Plus, Sparkle } from './icons';

type Tint = { bg: string; fg: string };
const tints: Record<string, Tint> = {
  mint: { bg: 'bg-mint-100', fg: 'text-mint-600' },
  sky: { bg: 'bg-sky-100', fg: 'text-sky-600' },
  butter: { bg: 'bg-butter-100', fg: 'text-butter-600' },
  lilac: { bg: 'bg-lilac-100', fg: 'text-lilac-600' },
};

interface StepData {
  n: string;
  title: string;
  body: string;
  icon: ReactElement;
  tint: Tint;
}

const STEPS: StepData[] = [
  {
    n: '01',
    title: 'Capture everything',
    body: 'Type it, paste an email or syllabus, snap a photo of your notes, or just talk. Clutch captures every commitment.',
    icon: <ImageIcon className="h-4 w-4" />,
    tint: tints.mint,
  },
  {
    n: '02',
    title: 'It plans & prioritizes',
    body: 'Gemini ranks tasks by deadline and impact, breaks big ones into steps, and schedules focus blocks around your day.',
    icon: <Calendar className="h-4 w-4" />,
    tint: tints.sky,
  },
  {
    n: '03',
    title: 'It does the work',
    body: 'Clutch drafts the email, the outline, the plan — and a focus timer keeps you moving until it’s done.',
    icon: <Doc className="h-4 w-4" />,
    tint: tints.butter,
  },
  {
    n: '04',
    title: 'It keeps you ahead',
    body: 'Proactive nudges, reminders, and Rescue Mode step in before anything slips — so you never miss a deadline.',
    icon: <Lifebuoy className="h-4 w-4" />,
    tint: tints.lilac,
  },
];

function Step({ step, side }: { step: StepData; side?: 'l' | 'r' }) {
  return (
    <div className="relative">
      <div className="card flex items-start gap-3 p-4">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${step.tint.bg} ${step.tint.fg}`}>
          {step.icon}
        </span>
        <div className="min-w-0">
          <p className="label text-ink-400">{step.n}</p>
          <h3 className="font-display text-sm font-semibold text-ink-900">{step.title}</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-600">{step.body}</p>
        </div>
      </div>
      {side === 'r' && (
        <span className="absolute right-0 top-1/2 hidden w-6 translate-x-full border-t-2 border-dashed border-ink-900/20 lg:block" />
      )}
      {side === 'l' && (
        <span className="absolute left-0 top-1/2 hidden w-6 -translate-x-full border-t-2 border-dashed border-ink-900/20 lg:block" />
      )}
    </div>
  );
}

function PhoneMock({ tilt }: { tilt?: boolean }) {
  return (
    <div className={`mx-auto w-[300px] shrink-0 sm:w-[324px] ${tilt ? 'lg:[perspective:1700px]' : ''}`}>
      <div
        className={`rounded-[3rem] border-[10px] border-[#16191d] bg-[#16191d] transition-transform duration-500 will-change-transform ${
          tilt
            ? 'shadow-[0_44px_88px_-26px_rgba(0,0,0,0.55)] lg:[transform:rotateY(-15deg)_rotateX(5deg)_rotate(1.5deg)] lg:hover:[transform:rotateY(-5deg)_rotateX(1deg)_rotate(0deg)]'
            : 'shadow-panel'
        }`}
      >
        <div className="force-light relative flex flex-col overflow-hidden rounded-[2.3rem] bg-paper-50">
          <div className="absolute left-1/2 top-3 z-10 h-6 w-28 -translate-x-1/2 rounded-full bg-[#16191d]" />

          <div className="flex-1 px-6 pb-6 pt-14">
            <div className="flex items-center gap-2">
              <LogoMark className="h-7 w-7" />
              <span className="font-display text-lg font-bold text-ink-900">clutch</span>
            </div>

            <p className="label mt-5 text-mint-700">Right now</p>
            <div className="mt-2 rounded-2xl border border-ink-900/[0.06] bg-stone-50 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint-100 text-mint-600">
                  <Doc className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-900">Submit CS101 essay</p>
                  <p className="text-xs font-semibold text-signal-red">5h left</p>
                </div>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
                <div className="h-full w-2/3 rounded-full bg-mint-500" />
              </div>
            </div>

            <div className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-ink-900 py-3 text-sm font-semibold text-paper-50">
              <Sparkle className="h-4 w-4" /> Plan my day
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-mint-100 py-3">
                <p className="font-display text-xl font-bold text-mint-700">4</p>
                <p className="text-[10px] text-mint-700/70">tasks</p>
              </div>
              <div className="rounded-2xl bg-sky-100 py-3">
                <p className="font-display text-xl font-bold text-sky-700">6</p>
                <p className="text-[10px] text-sky-700/70">blocks</p>
              </div>
              <div className="rounded-2xl bg-butter-100 py-3">
                <p className="font-display text-xl font-bold text-butter-700">2</p>
                <p className="text-[10px] text-butter-700/70">drafts</p>
              </div>
            </div>
          </div>

          {/* bottom nav */}
          <div className="flex items-center justify-between rounded-t-3xl bg-mint-600 px-7 py-4 text-white">
            <span className="text-sm font-semibold">Tasks</span>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-mint-600 shadow-lg">
              <Plus className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold">Agent</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="how" className="mt-4 scroll-mt-24">
      <Reveal>
        <div className="rounded-3xl border border-ink-900/[0.06] bg-mint-100/60 px-5 py-5 sm:px-6 sm:py-6">
          <div className="mx-auto max-w-xl text-center">
            <span className="chip bg-mint-100 text-mint-700">How it works</span>
            <h2 className="mt-2.5 font-display text-xl font-bold text-ink-900 sm:text-2xl">
              From chaos to a plan, in seconds
            </h2>
            <p className="mt-1.5 text-sm text-ink-600">
              Clutch doesn’t just remind you — it plans, prioritizes, and does the work so you beat every deadline.
            </p>
          </div>

          {/* Desktop: callouts flank the phone with dashed connectors */}
          <div className="mt-4 hidden items-center gap-6 lg:grid lg:grid-cols-[1fr_auto_1fr]">
            <div className="space-y-5">
              <Step step={STEPS[0]} side="r" />
              <Step step={STEPS[1]} side="r" />
            </div>
            <PhoneMock tilt />
            <div className="space-y-5">
              <Step step={STEPS[2]} side="l" />
              <Step step={STEPS[3]} side="l" />
            </div>
          </div>

          {/* Mobile / tablet: phone on top, steps stacked */}
          <div className="mt-6 lg:hidden">
            <div className="mb-6">
              <PhoneMock />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {STEPS.map((s) => (
                <Step key={s.n} step={s} />
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

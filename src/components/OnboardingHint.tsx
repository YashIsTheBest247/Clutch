import { CurvedArrow, X } from './icons';

export function OnboardingHint({ onAction, onDismiss }: { onAction: () => void; onDismiss: () => void }) {
  return (
    <div className="fixed right-3 top-[4.7rem] z-30 w-[15.5rem] max-w-[78vw] animate-fade-up sm:right-4 sm:top-[5rem]">
      {/* arrow swooping up toward the profile button */}
      <div className="pointer-events-none absolute -top-9 right-5 animate-bob text-mint-600">
        <CurvedArrow className="h-10 w-10" />
      </div>

      <div className="card relative p-3.5">
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="absolute right-2 top-2 rounded-full p-1 text-ink-400 transition-colors hover:text-ink-900"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <p className="pr-5 font-display text-sm font-semibold text-ink-900">👋 Welcome to Clutch</p>
        <p className="mt-1 text-xs leading-relaxed text-ink-600">
          Sign in with Google or set up your profile to personalize your plan.
        </p>
        <button onClick={onAction} className="btn-primary mt-2.5 w-full !py-1.5 !text-xs">
          Set up your profile
        </button>
      </div>
    </div>
  );
}

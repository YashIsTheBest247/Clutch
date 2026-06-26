// Clutch brand mark: a confident "C" monogram with a ball terminal — reads as
// the letter C and as a focus/target ring, the app's core "right now" idea.
export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" role="img" aria-label="Clutch">
      <rect x="2" y="2" width="96" height="96" rx="26" fill="currentColor" />
      <circle
        cx="50"
        cy="50"
        r="22"
        fill="none"
        stroke="var(--logo-fg, #fff)"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray="97.5 60"
        transform="rotate(52 50 50)"
      />
      <circle cx="63" cy="32" r="6" fill="var(--logo-fg, #fff)" />
    </svg>
  );
}

export function Logo({
  className = '',
  markClassName = 'h-8 w-8 text-ink-900',
  showWordmark = true,
}: {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={markClassName} />
      {showWordmark && (
        <span className="font-display text-lg font-bold tracking-tight text-ink-900">clutch</span>
      )}
    </span>
  );
}

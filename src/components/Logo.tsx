// Clutch brand mark: a sleek dark tile with a white timer ring, a 12-o'clock
// deadline marker, and an emerald check — "done, on time." On-problem (beating
// deadlines) and works on both light and dark backgrounds.
export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" role="img" aria-label="Clutch">
      <defs>
        <linearGradient id="clutchTile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#222826" />
          <stop offset="1" stopColor="#0e1210" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="96" height="96" rx="26" fill="url(#clutchTile)" />
      <circle cx="50" cy="50" r="30" fill="none" stroke="#ffffff" strokeWidth="4.5" opacity="0.92" />
      <path d="M50 20.5 L50 28" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
      <path
        d="M36 52 l8 8 l20 -23"
        fill="none"
        stroke="#34c27a"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  className = '',
  markClassName = 'h-8 w-8',
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

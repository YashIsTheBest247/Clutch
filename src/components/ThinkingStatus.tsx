import { useEffect, useState } from 'react';
import { Sparkle } from './icons';

const STEPS = [
  'Analyzing your request…',
  'Gathering relevant information…',
  'Processing your input…',
  'Generating the best response…',
  'Almost there…',
];

export function ThinkingStatus() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setI((p) => Math.min(p + 1, STEPS.length - 1)), 1500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="mt-3 flex items-center gap-3 rounded-2xl border border-mint-600/20 bg-mint-100/50 px-4 py-3 animate-fade-up">
      <Sparkle className="h-4 w-4 shrink-0 animate-spin text-mint-600 [animation-duration:1.2s]" />
      <div className="min-w-0 flex-1">
        <p key={i} className="text-sm font-medium text-ink-800 animate-fade-up">
          {STEPS[i]}
        </p>
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-mint-600/15">
          <div className="h-full w-1/3 rounded-full bg-mint-500 animate-indeterminate" />
        </div>
      </div>
    </div>
  );
}

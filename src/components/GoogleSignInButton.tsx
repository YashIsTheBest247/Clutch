import { useEffect, useRef } from 'react';

export function GoogleSignInButton({ render }: { render: (el: HTMLElement | null) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    render(ref.current);
  }, [render]);
  return <div ref={ref} className="overflow-hidden" />;
}

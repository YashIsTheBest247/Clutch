import { useCallback, useState } from 'react';
import { uid } from './storage';

export interface Toast {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (message: string, opts?: { actionLabel?: string; onAction?: () => void; duration?: number }) => {
      const id = uid('toast');
      setToasts((t) => [...t, { id, message, actionLabel: opts?.actionLabel, onAction: opts?.onAction }]);
      window.setTimeout(() => dismiss(id), opts?.duration ?? 5000);
      return id;
    },
    [dismiss],
  );

  return { toasts, push, dismiss };
}

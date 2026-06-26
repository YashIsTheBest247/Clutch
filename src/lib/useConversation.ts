import { useCallback, useEffect, useRef, useState } from 'react';

// Captures one spoken utterance at a time and fires onUtterance with the final
// transcript. The caller decides when to start() again (e.g. after the agent
// has finished speaking) — enabling a hands-free back-and-forth conversation.
export function useConversation(onUtterance: (text: string) => void) {
  const [supported] = useState(
    () =>
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window),
  );
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);
  const cbRef = useRef(onUtterance);
  cbRef.current = onUtterance;

  useEffect(() => {
    if (!supported) return;
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new Ctor();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onresult = (e: any) => {
      const last = e.results[e.results.length - 1];
      const text = (last?.[0]?.transcript ?? '').trim();
      if (text) cbRef.current(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    return () => {
      try {
        rec.stop();
      } catch {
        /* noop */
      }
    };
  }, [supported]);

  const start = useCallback(() => {
    const r = recRef.current;
    if (!r) return;
    try {
      r.start();
      setListening(true);
    } catch {
      /* already started */
    }
  }, []);

  const stop = useCallback(() => {
    const r = recRef.current;
    if (!r) return;
    try {
      r.stop();
    } catch {
      /* noop */
    }
    setListening(false);
  }, []);

  return { supported, listening, start, stop };
}

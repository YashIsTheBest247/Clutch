import { useCallback, useEffect, useRef, useState } from 'react';

/** Strip Markdown / emoji-ish noise so speech sounds natural. */
export function speechText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#*_`>~|]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[📎📷🎙✳→•·]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Thin wrapper over the Web Speech Synthesis API for voice-out.
export function useTTS() {
  const [supported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window);
  const [speaking, setSpeaking] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    (text: string) => {
      if (!supported) return;
      const clean = speechText(text);
      if (!clean) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(clean);
      u.rate = 1.05;
      u.pitch = 1;
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      utterRef.current = u;
      setSpeaking(true);
      window.speechSynthesis.speak(u);
    },
    [supported],
  );

  useEffect(() => () => stop(), [stop]);

  return { supported, speaking, speak, stop };
}

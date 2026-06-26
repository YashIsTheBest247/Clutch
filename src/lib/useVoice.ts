import { useEffect, useRef, useState } from 'react';

// Thin wrapper over the browser SpeechRecognition API for voice capture.
type SR = any;

export function useVoice(onResult: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SR | null>(null);

  useEffect(() => {
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Ctor) return;
    setSupported(true);
    const rec: SR = new Ctor();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';
    let finalText = '';
    rec.onresult = (e: any) => {
      let interim = '';
      finalText = '';
      for (let i = 0; i < e.results.length; i++) {
        const tr = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += tr;
        else interim += tr;
      }
      onResult(finalText || interim);
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
  }, [onResult]);

  const toggle = () => {
    const rec = recRef.current;
    if (!rec) return;
    if (listening) {
      rec.stop();
      setListening(false);
    } else {
      try {
        rec.start();
        setListening(true);
      } catch {
        /* already started */
      }
    }
  };

  return { supported, listening, toggle };
}

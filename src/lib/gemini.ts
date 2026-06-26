import { GoogleGenAI } from '@google/genai';

// Key resolution order:
// 1) Runtime — injected by server.js into `window.__ENV__` from the Cloud Run
//    env var (preferred for Cloud Run: no key baked into the image, rotatable).
// 2) Build time — `process.env.API_KEY` is textually replaced by Vite (the
//    AI Studio convention). Do NOT add a `typeof process` guard here — that
//    token isn't replaced and would short-circuit the value to "".
const runtimeKey =
  (typeof window !== 'undefined' && (window as any).__ENV__?.GEMINI_API_KEY) || '';
const API_KEY = runtimeKey || process.env.API_KEY || process.env.GEMINI_API_KEY || '';

export const MODEL = 'gemini-2.5-flash';

let client: GoogleGenAI | null = null;

export function getClient(): GoogleGenAI {
  if (!API_KEY) {
    throw new Error(
      'No Gemini API key configured. Set GEMINI_API_KEY in your environment (or AI Studio secret) and rebuild.',
    );
  }
  if (!client) client = new GoogleGenAI({ apiKey: API_KEY });
  return client;
}

export function hasApiKey(): boolean {
  return Boolean(API_KEY);
}

/** Strip ```json fences and parse, tolerating leading/trailing prose. */
export function parseJSON<T>(text: string): T {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const first = t.search(/[[{]/);
  const last = Math.max(t.lastIndexOf(']'), t.lastIndexOf('}'));
  if (first >= 0 && last > first) t = t.slice(first, last + 1);
  return JSON.parse(t) as T;
}

/** One-shot text generation. Used for parsing captured text and deliverable drafting. */
export async function generateText(
  prompt: string,
  systemInstruction?: string,
): Promise<string> {
  const ai = getClient();
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: systemInstruction ? { systemInstruction } : undefined,
  });
  return res.text ?? '';
}

import { GoogleGenAI } from '@google/genai';

// Resolved at build time by vite.config.ts, which textually replaces these
// `process.env.*` references with string literals (the value, or "" if unset).
// Do NOT add a `typeof process` guard — that token is not replaced and would
// short-circuit the whole expression to "" in the browser.
const API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY || '';

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

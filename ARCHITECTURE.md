# Architecture

How Clutch works under the hood. It's a fully client-side React SPA — no backend — that talks directly to the Gemini API and persists to `localStorage`.

```
┌──────────────────────────────────────────────────────────────┐
│  React UI (App.tsx + components)                               │
│   capture · board · agenda · activity feed · goals · insights  │
└───────────────┬───────────────────────────┬──────────────────┘
                │ actions                    │ renders
                ▼                            ▲
┌──────────────────────────────┐   ┌────────────────────────────┐
│  useStore() (lib/store.ts)    │   │  AppState (lib/types.ts)    │
│   single source of truth      │◄──┤  tasks, schedule, goals,    │
│   + localStorage persistence  │   │  habits, commitments, …     │
└───────────────┬───────────────┘   └────────────────────────────┘
                │ sendToAgent(text, image?)
                ▼
┌──────────────────────────────────────────────────────────────┐
│  runAgent() (lib/agent.ts)  ── the agentic loop               │
│   Gemini 2.5 Flash · streaming · function calling             │
│   tools mutate a working copy of state, then return a reply   │
└───────────────┬──────────────────────────┬───────────────────┘
                │ generateContentStream     │ sub-call: googleSearch grounding
                ▼                            ▼
        Google Gen AI SDK ───────────► Gemini API
```

## 1. The agent loop (`lib/agent.ts`)

`runAgent(state, userText, onStep, image?, onToken?)` runs **one agentic turn**:

1. Builds a **context summary** (current tasks, fixed commitments, learned calibration) + the user's message (and an inline image for multimodal capture).
2. Calls `ai.models.generateContentStream(...)` with a **system instruction** (role, current time, working hours, work style) and a set of **function declarations**.
3. Streams the response:
   - **Text deltas** → `onToken` (live "streaming" bubble in the UI).
   - **Function calls** → executed against a **deep clone** of app state via `executeTool(...)`.
4. Tool results are appended as `functionResponse` parts and the loop continues (up to 8 turns) until the model returns a plain-text reply.
5. Returns `{ state, reply, actions }`; the store commits the mutated state + the agent message.

### Tools (the agent's hands)
| Tool | Effect |
|---|---|
| `add_task` | Create a task (title, deadline→ISO, estimate, priority, category) |
| `decompose_task` | Break a task into ordered subtasks |
| `set_priority` | Re-rank + record reasoning |
| `generate_deliverable` | Write the finished email/outline/plan/checklist |
| `update_task_status` | todo / in_progress / blocked / done |
| `build_schedule` | Lay out focus blocks (around fixed commitments) |
| `add_commitment` | Record a fixed real-life event to schedule around |
| `research_web` | **Sub-call** with `googleSearch` grounding → cited answer |

> **Why a sub-call for research?** Gemini can't combine `googleSearch` grounding with `functionDeclarations` in the same request, so `research_web` issues a *separate* grounded `generateContent` call and feeds the answer back into the loop.

## 2. State & persistence (`lib/store.ts`)

- One `useStore()` hook holds the entire `AppState` and exposes typed mutators (`setTaskStatus`, `addGoal`, `setTaskDeadline`, `recordActual`, …).
- Every change is mirrored to `localStorage` (`clutch.state.v1`). No server, no DB — instant, offline-friendly, and trivially deployable as a static bundle.
- The agent never mutates state directly; it returns a new state object the store commits, keeping a clean unidirectional flow.

## 3. Scheduling & intelligence (`lib/scheduler.ts`)

Deterministic, explainable, and cheap (no extra API calls):

- **`computeUrgency(task)`** — priority weight + deadline-proximity bonus − effort penalty.
- **`autoSchedule(tasks, profile, busy)`** — greedy, earliest-deadline-first packing into working hours, skipping fixed commitments and existing blocks.
- **`realityCheck(tasks, profile)`** — walks deadlines and compares cumulative required minutes vs. available working minutes; flags overcommitment and the lowest-value tasks to cut.
- **`slippage(tasks)`** — overdue / at-risk detection that powers the proactive nudge and briefing.
- **Estimate-learning** — completed focus sessions feed a rolling `calibration.factor` (actual ÷ estimated), injected into the agent prompt so future estimates self-correct.

## 4. Theming (`index.css` + `tailwind.config.js`)

- The whole palette (`ink`, `paper`, `stone`, `mint`, `sky`, `butter`, `lilac`) is defined as **CSS custom properties** and consumed by Tailwind via `rgb(var(--token) / <alpha-value>)`.
- Switching theme = flipping the variables under `[data-theme="dark"]` on `<html>` — **no per-component dark: classes**. One attribute re-themes everything.
- A `.force-light` scope re-declares the light variables locally (used for the phone mockup so it always looks like a lit device, even in dark mode).

## 5. Config injection (build-time + runtime)

- **Build-time:** `vite.config.ts` `define` inlines `GEMINI_API_KEY` and `GOOGLE_CLIENT_ID` from the environment (the AI Studio convention).
- **Runtime:** `server.js` injects `window.__ENV__` into `index.html` from Cloud Run env vars, so the key can be set without rebuilding the image. `lib/gemini.ts` / `lib/useGoogleAuth.ts` prefer the runtime value, then fall back to the build-time one.

## 6. Hosting (`server.js`, `Dockerfile`, `firebase.json`)

- **Cloud Run:** multi-stage Docker build → a zero-dependency Node static server that serves `dist/`, injects runtime env, and handles SPA fallback on `$PORT`.
- **Firebase Hosting:** static `dist/` with SPA rewrites and asset caching — free Spark plan, no card.

## Notable browser APIs

| API | Used for |
|---|---|
| Web Speech **Recognition** | Voice input + hands-free conversation |
| Web Speech **Synthesis** | Spoken briefing / voice replies |
| **Notification** | Deadline & focus-block reminders |
| **IntersectionObserver** | Scroll-reveal animations + count-ups |
| **Web Animations** | Confetti |
| **Service Worker** | Offline PWA shell |
| **Google Identity Services** | OAuth sign-in |

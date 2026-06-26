<div align="center">

# ⏱️ Clutch

### Your autonomous AI Chief of Staff

**Clutch doesn't just remind you — it plans, prioritizes, schedules, and *does the work* so you never miss a deadline.**

Built with **Google Gemini** · Deployed on **Google Cloud**

</div>

---

## The problem

> **The Last-Minute Life Saver** — Students, professionals, and entrepreneurs constantly miss deadlines, assignments, meetings, and commitments. Existing productivity tools rely on *passive reminders* that are easy to ignore and do little to help you actually finish the work.

**Clutch** is an AI-powered productivity companion that proactively helps you plan, prioritize, and **complete** tasks before deadlines slip — moving far beyond reminders into autonomous, meaningful action.

You dump your commitments however you like — **type** them, **paste** an email or syllabus, **snap a photo** of handwritten notes, or just **talk** — and a Gemini-powered agent loop captures every task, ranks them, schedules focus blocks, and even **drafts the deliverables** for you.

---

##  Features

###  The agentic core
- **Streaming Gemini agent** — a multi-step **function-calling** loop (`gemini-2.5-flash`) with 8 real tools that *take action*, not just chat: `add_task`, `decompose_task`, `set_priority`, `generate_deliverable`, `update_task_status`, `build_schedule`, `add_commitment`, `research_web`.
- **Live web research** — Gemini's **Google Search grounding** pulls real-world facts (opening hours, official portals, prices, dates) to actually complete tasks.
- **Deliverable generation** — drafts the extension email, the essay outline, the study plan, the checklist — ready to **copy** or **send** (`mailto:`).

###  Capture, any way you like
- **Natural language** + **paste** an email / syllabus / messy notes
- **Photo capture** — Gemini multimodal reads handwriting, whiteboards, bills, posters (drag, paste, or upload)
- **Voice input** (speech-to-text) and **hands-free conversation mode** (speak → it acts → speaks back → auto-listens)

###  Plan & prioritize
- **Intelligent prioritization** — transparent urgency score = deadline proximity × impact, with the agent's reasoning shown
- **AI scheduling** — packs focus blocks into your working hours, **around fixed commitments** (class, gym, meetings)
- **Manual deadline editor** — click any task's deadline chip to set/change/clear it (date + time)
- **Reality-Check** — honest capacity math: warns when you *physically can't* finish everything in time and suggests what to cut/move
- **Recurring tasks** — daily / weekdays / weekly

###  Get it done
- **Focus timer (Pomodoro)** with a progress ring — and **estimate-learning** that calibrates future time estimates from your real focus sessions
- **Streaks + confetti** on completion
- **Goals** (with progress bars) and **Habits** (daily check-off + per-habit streaks)

###  Proactive, not passive
- **Proactive slippage nudge** the moment you open the app
- **Rescue Mode** — an "I'm overwhelmed" panic button that triages everything into the **3 next actions**
- **Spoken daily briefing** (text-to-speech) that flags what's slipping
- **Browser reminders** — deadline-approaching + "focus block starting" notifications
- **Weekly retrospective** — AI review of what you shipped + next week's plan

###  Calendar & integrations
- **`.ics` export** (focus blocks + deadline reminders with alarms)
- **Add to Google Calendar** one-click links
- Schedules **around** your real fixed commitments

###  Product experience
- **Google Sign-In** (identity) — personalizes greeting + avatar for any user
- **Insights dashboard** — completion rate, workload, streaks, by-category chart, and a **Gemini-written** "how you work" summary
- **Floating Quick Notes** — an always-on scratchpad that auto-saves; **draggable** on desktop, a clean **bottom-sheet** on mobile, and can **turn notes into tasks** in one tap
- **⌘K command palette** for every action
- **Engaging processing UX** — a live "Analyzing → Gathering → Generating…" status while the agent works, then auto-scrolls you to the results
- **Light / Dark mode** (CSS-variable theming) with an in-app toggle
- **Fully responsive** — collapses to a sticky mobile navbar + hamburger menu with smooth animations
- **Custom themed inputs** — analog **clock time picker**, themed dropdowns (no jarring native popups)
- **Installable PWA** — works offline
- **Toasts + Undo** for delete / complete / reset, plus confetti on completion

---

## 🛠️ Tech stack

| Layer | Tech |
|---|---|
| Frontend | **React 19**, **TypeScript**, **Vite 6** |
| Styling | **Tailwind CSS** (custom design system, CSS-variable theming) |
| AI | **`@google/genai`** SDK → Gemini 2.5 Flash (function calling, streaming, multimodal, Search grounding) |
| Voice | Web Speech API (recognition) + Web Speech Synthesis (TTS) |
| Auth | Google Identity Services (OAuth sign-in) |
| Misc | Web Animations API, IntersectionObserver, Notification API, Service Worker (PWA) |
| Persistence | `localStorage` (no backend required) |
| Hosting | **Firebase Hosting** / **Google Cloud Run** (zero-dependency Node server) |

### Google technologies used
- **Gemini 2.5 Flash** via the **Google Gen AI SDK** — function calling, streaming, multimodal vision
- **Gemini + Google Search grounding** — live, cited web research
- **Google AI Studio** — development + deploy
- **Google Cloud Run** / **Firebase Hosting** — public hosting
- **Google Cloud Build** — container builds
- **Google Calendar** — schedule export + event links
- **Google Identity Services** — sign-in

---

## 🚀 Setup

### Prerequisites
- **Node.js 18+**
- A **Gemini API key** → https://aistudio.google.com/apikey

### 1. Install
```bash
npm install
```

### 2. Configure environment
Create `.env.local` (copy from `.env.example`):
```bash
# Required — the agent needs this to think
GEMINI_API_KEY=AIzaSy...your_key...

# Optional — enables "Sign in with Google"
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

### 3. Run
```bash
npm run dev          # http://localhost:5173
```

### Scripts
| Command | Does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Preview the production build |

> ⚠️ Env vars are **baked in at build time**, so after changing `.env.local` you must restart the dev server / rebuild.

---

## ☁️ Deploy

Full instructions in **[DEPLOY.md](DEPLOY.md)**. Quick versions:

**Firebase Hosting (free, no credit card):**
```bash
npm i -g firebase-tools
firebase login
npm run build
firebase deploy --only hosting --project YOUR_PROJECT_ID
```

**Cloud Run (from source):**
```bash
gcloud run deploy clutch --source . --region asia-south1 \
  --allow-unauthenticated --port 8080 --set-env-vars GEMINI_API_KEY=YOUR_KEY
```

> 🔒 The Gemini key ships in the client bundle (standard for AI Studio apps). **Restrict it** in Google Cloud Console (Generative Language API + HTTP-referrer) and set a small billing budget alert.

---

## 🔑 Optional: enable Google Sign-In

1. **Enable** the project's OAuth (Google Cloud Console → APIs & Services → Credentials → **Create OAuth client ID** → Web).
2. Add **Authorized JavaScript origins**: `http://localhost:5173`, your `*.web.app` / `*.run.app` domains.
3. Keep only basic scopes (**email, profile, openid**) and **publish** the consent screen — no verification needed for non-sensitive scopes, so **any** user can sign in.
4. Put the Client ID in `.env.local` as `GOOGLE_CLIENT_ID`, then rebuild.

If `GOOGLE_CLIENT_ID` is unset, sign-in is hidden and the app works fully without it.

---

## 🧩 Project structure

```
src/
  App.tsx                 # Top-level layout, header, sections, wiring
  main.tsx                # Entry, theme + scroll init, service-worker register
  types.ts                # Domain model (Task, Goal, Habit, Commitment, …)
  lib/
    agent.ts              # The Gemini function-calling agent loop + tools
    gemini.ts             # SDK client + key resolution
    scheduler.ts          # Auto-scheduling, urgency, Reality-Check, slippage
    store.ts              # App state hook + persistence + agent runner
    storage.ts            # localStorage + helpers (streaks, dates)
    useTTS / useVoice / useConversation / useReminders / useGoogleAuth / useTheme / anim / useToasts
    calendar.ts           # .ics export + Google Calendar links
    confetti.ts
  components/             # UI (TaskCard, Agenda, ActivityFeed, FocusTimer,
                          #     GoalsHabits, HowItWorks, ClockPicker, …)
server.js                 # Zero-dependency static server for Cloud Run
Dockerfile · firebase.json · vite.config.ts
```

See **[ARCHITECTURE.md](ARCHITECTURE.md)** for how the agent loop, scheduling, and theming work.

---

## 👤 Developer

Built by **Yash Munshi**
- GitHub · https://github.com/YashIsTheBest247
- LinkedIn · https://www.linkedin.com/in/yash-munshi-a0408b337/

<div align="center">

*Clutch — turns last-minute panic into a plan.*

</div>

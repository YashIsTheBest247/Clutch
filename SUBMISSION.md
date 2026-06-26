# Clutch — Project Description

---

## Problem Statement Selected

**The Last-Minute Life Saver** — an AI-powered productivity companion that
*proactively* helps users plan, prioritize, and **complete** tasks before
deadlines are missed, going beyond passive reminders to meaningful action.

## Solution Overview

**Clutch** is an autonomous AI Chief of Staff. Instead of nagging you with
reminders, it does the work *with* you. You dump your commitments however you
like — **type** them, **paste** an email/syllabus, **snap a photo** of notes, or
just **talk** — and a streaming Gemini agent loop captures every task, ranks them
by deadline and impact, schedules focus blocks around your day (and your real
fixed commitments), and **drafts the actual deliverables** (the email, outline,
plan). It proactively flags what's slipping, can triage a panic in one tap, reads
you a spoken briefing, and even learns how long you really take.

Fully client-side (no backend), deployed on Google Cloud, and powered end-to-end
by Gemini.

## Key Features

- **Multimodal capture** — natural language, paste-a-document, **photo capture**
  (Gemini vision), **voice input**, and **hands-free voice conversation**.
- **Streaming agentic core** — Gemini function-calling loop with 8 real tools that
  take action (add/decompose/prioritize tasks, generate deliverables, schedule,
  add commitments, **live web research** via Google Search grounding).
- **Deliverable generation** — finished emails/outlines/plans, with one-click
  **copy** and **send** (`mailto:`).
- **Intelligent prioritization & AI scheduling** — transparent urgency scoring;
  auto-scheduled focus blocks **around fixed commitments**.
- **Manual deadline editor** + **recurring tasks** (daily/weekdays/weekly).
- ** Reality-Check** — warns when you physically can't make all deadlines and
  says what to cut/move.
- ** Rescue Mode** — instant triage into the 3 next actions.
- **Proactive nudges**, **browser reminders**, **spoken daily briefing**, and a
  **weekly retrospective**.
- **Focus timer** with **estimate-learning** (calibrates future estimates),
  **streaks**, and **confetti**.
- **Goals & Habits** tracking with progress and per-habit streaks.
- **Calendar** — `.ics` export (with alarms) + Add-to-Google-Calendar links.
- **Google Sign-In**, **Insights dashboard** (charts + Gemini-written summary),
  **⌘K command palette**, **light/dark theme**, **installable PWA**, **undo**,
  fully responsive design.

## Technologies Used

- **React 19 + TypeScript** (Vite 6), **Tailwind CSS** (CSS-variable theming)
- **`@google/genai`** SDK — Gemini (streaming, function calling, multimodal, grounding)
- Web Speech API (in/out), Notification API, Service Worker (PWA), Google Identity Services
- `localStorage` persistence; zero-dependency Node server for Cloud Run

## Google Technologies Utilized

- **Gemini 2.5 Flash** via the **Google Gen AI SDK** — powers the whole agent
  (reasoning, extraction, prioritization, deliverables) with **function calling**,
  **streaming**, and **multimodal (image)** input.
- **Gemini + Google Search grounding** — live, cited web research.
- **Google AI Studio** — development & deployment.
- **Google Cloud Run / Firebase Hosting** — public deployment.
- **Google Cloud Build** — containerized builds.
- **Google Calendar** — schedule export + event links.
- **Google Identity Services** — Google Sign-In.


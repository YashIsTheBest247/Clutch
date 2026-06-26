# Deploying Clutch to Google Cloud Run

Clutch is a static Vite SPA served by a tiny zero-dependency Node server
(`server.js`). The Gemini API key is read **at runtime** from the
`GEMINI_API_KEY` environment variable and injected into the page by the server —
so the key is **never baked into the image** and can be rotated without a rebuild.

> Get a key at https://aistudio.google.com/apikey

---

## Option A — Firebase Hosting (Google Cloud, **no credit card**)

Firebase Hosting's free **Spark** plan needs **no payment method**, gives a public
`https://YOUR_PROJECT.web.app` URL, and is part of Google Cloud — so it satisfies
the "deployed on Google Cloud" requirement. The key is inlined at **build time**.

```bash
npm i -g firebase-tools
firebase login                       # Google account — no card

# Create a project at https://console.firebase.google.com (Spark plan, no card),
# then build with your key baked in and deploy:
GEMINI_API_KEY=YOUR_GEMINI_API_KEY npm run build
firebase deploy --only hosting --project YOUR_PROJECT_ID
```

(`firebase.json` is already configured: serves `dist/`, SPA rewrites, asset caching.)
The printed `*.web.app` link is your submission URL.

> On Windows PowerShell, set the key like this before building:
> `$env:GEMINI_API_KEY="YOUR_KEY"; npm run build`

---

## Option B — Cloud Run from source (needs billing enabled)

**Prerequisites (one-time):**
1. Install the gcloud CLI: https://cloud.google.com/sdk/docs/install
2. A Google Cloud project with **billing enabled**.

**Deploy:**
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com

gcloud run deploy clutch \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

Cloud Build builds the included `Dockerfile`, ships it to Cloud Run, and prints a
public `https://clutch-xxxxx.run.app` URL — **that's your submission link.**

To rotate the key later (no rebuild needed):
```bash
gcloud run services update clutch --region asia-south1 \
  --set-env-vars GEMINI_API_KEY=NEW_KEY
```

---

## Option C — Google AI Studio (no CLI, deploys to Cloud Run → needs billing)

The project keeps the AI Studio layout (`metadata.json` + Vite + `@google/genai`),
so it also deploys through AI Studio's **Deploy → Cloud Run** flow:

1. https://aistudio.google.com → **Build / Apps** → import this repo.
2. Add your key as the secret `GEMINI_API_KEY`.
3. **Deploy** → AI Studio builds and ships to Cloud Run.

Docs: https://ai.google.dev/gemini-api/docs/aistudio-deploying

---

## Test the production container locally (optional)

With Docker Desktop running:
```bash
docker build -t clutch .
docker run -p 8080:8080 -e GEMINI_API_KEY=YOUR_KEY clutch
# open http://localhost:8080
```

Or without Docker (the container just runs this):
```bash
npm run build
GEMINI_API_KEY=YOUR_KEY node server.js   # http://localhost:8080
```

---

## Local development

```bash
cp .env.example .env.local      # add GEMINI_API_KEY
npm install
npm run dev                     # http://localhost:5173
```

---


# CandidAI | Next.js Frontend & BFF Proxy

This directory hosts the Next.js App Router user interface and Backend-for-Frontend (BFF) proxy routes.

---

## App Router Architecture

The frontend follows standard Next.js App Router structural principles:

* **`/` (Landing Page)**: Sleek SaaS marketing page introducing the CandidAI screening platform and showing latency benchmarks between GPUs and CPUs.
* **`/login` and `/signup`**: Mock SaaS authentication portals displaying clear hackathon bypass labels to allow immediate workspace entry.
* **`/dashboard`**: Core recruiter dashboard layout divided into tab workspaces:
  - **Job Screening Pipeline**: Form models to add role requirements.
  - **Talent Pool Directory**: Detailed profile highlights, email, phone, parsed experiences, and GitHub repository charts.
  - **Ingest Candidates**: Upload interface matching drag-and-drop resume PDFs.
  - **AI Matching & Analytics**: Ranked matching lists with progress ring indicators, AI executive summaries, mismatch gap analyses, custom interview prompts, and cohort cluster definitions.

---

## Backend-for-Frontend (BFF) Design

To ensure optimal infrastructure security and prevent CORS issues, CandidAI enforces a strict separation of concerns:

- The browser client **never** communicates with the FastAPI instance directly on port 8000.
- All requests flow through Next.js server-side Route Handlers located under `/src/app/api/...`.
- These handlers read `process.env.AMD_BACKEND_URL` in the secure server context and proxy requests to the private backend.
- The actual backend VM URL is hidden from the network panel, preventing exposures.

---

## Demo Mode Controls

- Enabled by default for judges (`demoMode = true`).
- Access is filtered behind an administrative confirmation modal. Flipping the toggle to ON prompts for an admin passcode (`admin`).
- Toggling Demo Mode ON exposes deep performance logs (stage timelines, GPU device parameters, matching latencies, queue metrics) in the AI analytics panel.
- Toggling it OFF returns the view to a standard recruiter SaaS UI.

---

## Environment Variables

Create a `.env.local` file inside the `/frontend` directory:

```env
# URL of the private FastAPI container (internal docker bridge or VM local port)
AMD_BACKEND_URL=http://localhost:8000
```

---

## Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Developer Mode
```bash
npm run dev
```
Open `http://localhost:3000` to launch the dashboard.

### 3. Build Production Target
Check TypeScript definitions and optimize builds:
```bash
npm run build
```

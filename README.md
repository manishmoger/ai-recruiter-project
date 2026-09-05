# Flexiple AI Recruiter

A full-stack AI-powered sourcing tool that runs the recruiter refinement loop end to end.

## Setup

### Prerequisites
- Node.js 18+
- A Gemini API key (free tier works — get one at https://aistudio.google.com)

### 1. Set the API key

In `server/.env`:
```
GEMINI_API_KEY=your_key_here
PORT=5000
```

### 2. Install and run the server
```bash
cd server
npm install
npm run dev
```

### 3. Install and run the client
```bash
cd client
npm install
npm run dev
```

The app runs at **http://localhost:5173**

---

## The Loop

1. **Search** — Type a free-text requirement (e.g. "RDS developers with 4-7 years at startups in Bangalore")
2. **AI generates** — Structured filters + a fit rubric, visible in the sidebar
3. **Results** — Top 5 profiles ranked by score, each with a reason citing real profile fields
4. **Refine** — Mark profiles as good/bad matches, type feedback in chat, hit Refine
5. **Repeat** — Filters and rubric update, new results appear, sidebar shows what changed
6. **Freeze** — Click "Freeze Search" to lock the final filters, rubric, and shortlist

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/full-search` | Free text → filters → score → top 5 |
| POST | `/api/refine` | Feedback → adjusted filters/rubric → re-score → top 5 |
| POST | `/api/generate-search` | Free text → filters + rubric only |
| POST | `/api/search` | Apply filters to profiles |
| POST | `/api/rank` | Score profiles against rubric |

---

## LLM Prompts

All prompts are in [`server/prompts/prompts.md`](server/prompts/prompts.md).

Three prompts total:
- **Generate Search** — extracts structured filters and rubric from free text
- **Score Profile** — scores a candidate 0–100 with a reason citing real profile fields
- **Refine Search** — adjusts filters and rubric based on recruiter feedback, returns a `changes` explanation

---

## Decisions

### What I prioritised
- **The refinement loop** — the core of the assignment. Feedback from per-card yes/no votes is merged with the chat message before being sent to the LLM, so the AI has full context.
- **Specific match reasons** — the scoring prompt explicitly forbids generic praise and requires citing actual fields (company names, skills, years). This is what makes the explanations trustworthy.
- **All states designed** — search, thinking (with step-by-step progress), results, empty results, error banners that don't destroy the current results, and a clean frozen summary.
- **Sidebar always visible** — filters and rubric are always on screen during the results phase so the recruiter can see what changed after each refinement.

### What I cut
- **Editable filters UI** — the sidebar shows filters read-only. Direct editing would be useful but the chat-based refinement covers the same need and is faster to use.
- **Pagination** — showing only top 5 per round. The assignment specifies 4–5 profiles at a time.
- **Persistence** — no session storage or database. Each page load starts fresh, as specified.
- **Skills filtering** — the filter logic matches on location, experience, and company type. Skills are passed to the rubric/scoring instead of hard-filtered, because skill matching on free-text arrays is lossy and the LLM scoring handles it better.

### Technical decisions
- **Single `/full-search` call on first load** — avoids a round-trip waterfall (generate → filter → score as three separate calls from the client).
- **`/refine` merges per-card votes into the chat message** — the client builds a natural-language summary ("Good matches: Ananya Rao. Not matches: Rohan Sharma") and appends it to the typed feedback before sending. The LLM gets full context in one prompt.
- **Prompts return structured JSON** — all three prompts return only JSON, stripped of markdown fences before parsing. Malformed responses surface as error banners without crashing the app.

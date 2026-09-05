# Flexiple AI Recruiter

A full-stack sourcing tool built for Flexiple's engineering assignment. A recruiter types what they're looking for in plain English, the app generates structured filters and a scoring rubric using an LLM, ranks matching candidates, and lets the recruiter refine results through a chat feedback loop until they're happy. When the search looks right, they lock it in and get a final shortlist.

---

## Tech Stack

- **Frontend** — React 19 + Vite
- **Backend** — Node.js + Express
- **LLM** — Groq (llama-3.3-70b-versatile) — free, no billing required
- **Data** — 48 candidate profiles loaded from a local JSON file

---

## Setup

### Prerequisites
- Node.js 18+
- A Groq API key — free, no credit card needed. Get one at **console.groq.com**

### 1. Set the API key

Create `server/.env`:
```
GROQ_API_KEY=your_groq_api_key_here
PORT=5000
```

### 2. Run the server
```bash
cd server
npm install
npm run dev
```

### 3. Run the client
```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173**

---

## How it works

1. **Search** — Type a free-text hiring requirement, e.g. *"RDS developers with 4–7 years, worked at startups, based in Bangalore"*
2. **Filters + Rubric** — The LLM extracts structured filters (location, experience, skills, company type) and a fit rubric (what good looks like for this role). Both are visible in the sidebar.
3. **Results** — Filters are applied to the local profiles dataset. Each matching profile is scored 0–100 by the LLM against the rubric, with a reason that cites real details from that profile — not generic praise.
4. **Refine** — Mark profiles as good or not right, type feedback in the chat ("1 is too junior, prefer Node.js only"), hit Update. The LLM adjusts the filters and rubric, re-runs the search, and tells you what changed.
5. **Repeat** — Keep refining until the results look right. The sidebar always shows the current filters and rubric.
6. **Lock** — Hit "Lock in this search" to freeze the final filters, rubric, and ranked shortlist.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/full-search` | Free text → filters + rubric → filter → score → top 5 |
| POST | `/api/refine` | Feedback → adjusted filters/rubric → re-score → top 5 |
| POST | `/api/generate-search` | Free text → filters + rubric only |
| POST | `/api/search` | Apply filters to profiles |
| POST | `/api/rank` | Score profiles against a rubric |

---

## LLM Prompts

All prompts are in [`server/prompts/prompts.md`](server/prompts/prompts.md).

Three prompts:

- **Generate Search** — parses a free-text query into structured filters and a rubric
- **Score Profile** — scores a candidate 0–100, reason must cite actual profile fields (company names, skills, years)
- **Refine Search** — takes current filters, rubric, recruiter feedback, and shown profiles — returns adjusted filters, rubric, and a plain-English explanation of what changed

---

## Decisions

### What I prioritised

- **The refinement loop** — per-card votes (good/not right) are merged with the typed chat message before being sent to the LLM, so it has full context on what the recruiter liked and didn't like
- **Specific match reasons** — the scoring prompt explicitly requires citing real profile fields. Generic praise is not allowed. This is what makes the explanations trustworthy
- **All states handled** — search, loading with step progress, results, empty results, error banners that don't wipe previous results, and a clean locked summary
- **Sidebar always visible** — the recruiter can always see what the current filters and rubric are, and watch them change after each refinement round

### What I cut

- **Editable filters UI** — sidebar is read-only. Chat-based refinement covers the same need and is more natural to use
- **Pagination** — showing top 5 per round as specified
- **Persistence** — no database, no session storage. Each page load starts fresh as specified
- **Hard skill filtering** — skills go to the rubric/scoring rather than hard filters. Skill names in free text rarely match exactly (e.g. "RDS" vs "AWS RDS"), so hard filtering causes false negatives. The LLM scorer handles it better

### Technical decisions

- **Single `/full-search` call on first load** — avoids a waterfall of three separate client-side calls (generate → filter → score)
- **Feedback merging on the client** — the client builds a natural-language summary from per-card votes and appends it to the typed message before sending to `/refine`. The LLM gets everything in one prompt
- **Structured JSON output** — all three prompts return only JSON, stripped of markdown fences before parsing. Malformed responses surface as inline error banners without crashing the app
- **Groq over Gemini** — switched from Gemini to Groq (llama-3.3-70b-versatile) because Groq is free with no billing setup, faster response times, and no daily quota issues

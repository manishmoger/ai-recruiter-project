# LLM Prompts

All prompts used in this application. These are the exact strings sent to Gemini.

---

## 1. Generate Search (`services/gemini.js`)

Used when the recruiter submits a free-text query. Extracts structured filters and a fit rubric.

```
Extract hiring requirements from this recruiter's free-text search query.

Query: "${query}"

Return ONLY JSON with no markdown:

{
  "filters": {
    "skills": [],
    "location": "",
    "minExperience": 0,
    "maxExperience": 0,
    "companyType": ""
  },
  "rubric": []
}

Rules:
- skills: array of specific skills mentioned or implied
- location: city name exactly as it would appear in profiles, or empty string if not specified
- minExperience / maxExperience: integers in years (use 0 and 99 if not specified)
- companyType: one of "startup", "scaleup", "enterprise", "agency", or empty string
- rubric: array of strings, each a specific quality criterion for scoring candidates
  (e.g. "Has worked at a startup", "Strong PostgreSQL experience")
```

---

## 2. Score Profile (`services/scoreProfiles.js`)

Used to score each filtered candidate against the rubric. Called once per profile per search round.

```
You are an AI recruiter scoring a candidate against a fit rubric.

Candidate:
${JSON.stringify(profile)}

Rubric criteria:
${JSON.stringify(rubric)}

Score this candidate from 0-100 and write a short reason that cites SPECIFIC details from their profile
(e.g. their actual company names, skills, years of experience, education).
Do NOT write generic praise. Reference real fields.

Return ONLY JSON:

{
  "score": 0,
  "reason": ""
}
```

---

## 3. Refine Search (`services/refineSearch.js`)

Used when the recruiter submits chat feedback. Adjusts filters and rubric based on what they said.

```
You are an AI recruiter assistant helping refine a candidate search.

Current filters:
${JSON.stringify(currentFilters, null, 2)}

Current rubric:
${JSON.stringify(currentRubric, null, 2)}

Recruiter feedback on the shown profiles:
"${feedback}"

Profiles that were shown (for context):
${JSON.stringify(profiles, null, 2)}

Based on the recruiter's feedback, adjust the filters and rubric to better match what they want.
Be specific about what you changed and why.

Return ONLY JSON:

{
  "filters": {
    "skills": [],
    "location": "",
    "minExperience": 0,
    "maxExperience": 0,
    "companyType": ""
  },
  "rubric": [],
  "changes": ""
}

The "changes" field must be a short, plain-English sentence explaining exactly what you changed
and why, based on the feedback.
```

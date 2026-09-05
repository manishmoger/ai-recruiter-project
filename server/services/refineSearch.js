const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function refineSearch(currentFilters, currentRubric, feedback, profiles) {
  const prompt = `You are helping a recruiter refine a candidate search.

Current filters:
${JSON.stringify(currentFilters, null, 2)}

Current rubric:
${JSON.stringify(currentRubric, null, 2)}

Recruiter feedback:
"${feedback}"

Profiles that were shown (for context):
${JSON.stringify(profiles, null, 2)}

Adjust the filters and rubric based on the feedback. Return ONLY valid JSON:

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

The "changes" field must be a short plain-English sentence explaining exactly what you changed and why.`;

  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  const text = res.choices[0].message.content;
  console.log("GROQ refineSearch:", text);
  return JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());
}

module.exports = { refineSearch };

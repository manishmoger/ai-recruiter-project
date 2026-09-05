const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

async function refineSearch(currentFilters, currentRubric, feedback, profiles) {
  const prompt = `
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

The "changes" field must be a short, plain-English sentence explaining exactly what you changed and why, based on the feedback.
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  return JSON.parse(
    text.replace(/```json/g, "").replace(/```/g, "").trim()
  );
}

module.exports = { refineSearch };

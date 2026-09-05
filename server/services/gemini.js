const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-3.6-flash",
});

async function generateSearch(query) {
  const prompt = `
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
- rubric: array of strings, each a specific quality criterion for scoring candidates (e.g. "Has worked at a startup", "Strong PostgreSQL experience")
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  console.log("RAW GEMINI RESPONSE:", text);

  return JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());
}

module.exports = { generateSearch };
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function generateSearch(query) {
  const prompt = `Extract hiring requirements from this recruiter's free-text search query.

Query: "${query}"

Return ONLY valid JSON with no markdown, no explanation:

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
- rubric: array of strings, each a specific quality criterion for scoring candidates`;

  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  const text = res.choices[0].message.content;
  console.log("GROQ generateSearch:", text);
  return JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());
}

module.exports = { generateSearch };

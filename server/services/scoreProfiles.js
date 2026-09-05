const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-3.6-flash",
});

async function scoreProfile(profile, rubric) {
  const prompt = `
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
`;

  const result = await model.generateContent(prompt);

  return JSON.parse(
    result.response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim()
  );
}

module.exports = { scoreProfile };
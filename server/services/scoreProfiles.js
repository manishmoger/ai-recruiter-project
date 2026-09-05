const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function scoreProfile(profile, rubric) {
  const prompt = `You are a recruiter scoring a candidate against a fit rubric.

Candidate:
${JSON.stringify(profile)}

Rubric criteria:
${JSON.stringify(rubric)}

Score this candidate from 0-100 and write a short reason that cites SPECIFIC details from their profile (actual company names, skills, years of experience, education). Do NOT write generic praise.

Return ONLY valid JSON:

{
  "score": 0,
  "reason": ""
}`;

  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  const text = res.choices[0].message.content;
  return JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());
}

module.exports = { scoreProfile };

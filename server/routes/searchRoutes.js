const express = require("express");
const router = express.Router();

const { generateSearch } = require("../services/gemini");
const { filterProfiles } = require("../services/filterProfiles");
const { getProfiles } = require("../services/profileService");
const { scoreProfile } = require("../services/scoreProfiles");
const { refineSearch } = require("../services/refineSearch");

async function runFullSearch(filters, rubric) {
  const profiles = getProfiles();
  const filtered = filterProfiles(profiles, filters);

  const scored = await Promise.all(
    filtered.map(async (profile) => {
      const scoreData = await scoreProfile(profile, rubric);
      return { ...profile, score: scoreData.score, reason: scoreData.reason };
    })
  );

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

router.post("/generate-search", async (req, res) => {
  try {
    const parsed = await generateSearch(req.body.query);
    res.json({ success: true, data: parsed });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/search", async (req, res) => {
  try {
    const profiles = getProfiles();
    const matches = filterProfiles(profiles, req.body.filters);
    res.json({ count: matches.length, profiles: matches });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/rank", async (req, res) => {
  try {
    const { profiles = [], rubric = [] } = req.body;
    if (!profiles.length) return res.status(400).json({ success: false, message: "profiles array is required" });

    const scored = await Promise.all(
      profiles.map(async (p) => {
        const s = await scoreProfile(p, rubric);
        return { ...p, score: s.score, reason: s.reason };
      })
    );
    scored.sort((a, b) => b.score - a.score);
    res.json({ success: true, profiles: scored });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/full-search", async (req, res) => {
  try {
    const { filters, rubric } = await generateSearch(req.body.query);
    const scored = await runFullSearch(filters, rubric);
    res.json({ filters, rubric, totalMatches: scored.length, topProfiles: scored.slice(0, 5) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/refine", async (req, res) => {
  try {
    const { currentFilters, currentRubric, feedback, shownProfiles } = req.body;
    if (!feedback || !currentFilters || !currentRubric)
      return res.status(400).json({ success: false, message: "feedback, currentFilters and currentRubric are required" });

    const refined = await refineSearch(currentFilters, currentRubric, feedback, shownProfiles || []);
    const scored = await runFullSearch(refined.filters, refined.rubric);

    res.json({
      filters: refined.filters,
      rubric: refined.rubric,
      changes: refined.changes,
      totalMatches: scored.length,
      topProfiles: scored.slice(0, 5),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

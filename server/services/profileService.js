const fs = require("fs");
const path = require("path");

const profilesPath = path.join(__dirname, "../data/profiles.json");

function getProfiles() {
  const data = fs.readFileSync(profilesPath, "utf8");

  const profiles = JSON.parse(data);

  return profiles;
}

module.exports = { getProfiles };
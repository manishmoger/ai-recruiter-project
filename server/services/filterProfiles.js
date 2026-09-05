function filterProfiles(profiles, filters) {
  const filtered = profiles.filter((profile) => {
    const locationMatch =
      !filters.location ||
      profile.location?.toLowerCase() ===
        filters.location.toLowerCase();

    const experienceMatch =
      profile.years_experience >= filters.minExperience &&
      profile.years_experience <= filters.maxExperience;

    const companyMatch =
      !filters.companyType ||
      profile.current_company_type?.toLowerCase() ===
        filters.companyType.toLowerCase();

    return (
      locationMatch &&
      experienceMatch &&
      companyMatch
    );
  });

  return filtered;
}

module.exports = { filterProfiles };
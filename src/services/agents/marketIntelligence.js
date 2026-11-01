export function analyseMarket(role, discoveredSkills) {
  const have = new Set(discoveredSkills.map((skill) => skill.name.toLowerCase()));
  const required = role.skills || [];
  const essential = required.filter((skill) => skill.importance === 'essential');
  const gaps = required.filter((skill) => !have.has(skill.name.toLowerCase()));
  return {
    roleId: role.roleId,
    roleTitle: role.title,
    catalogueSource: role.source || 'curated_demo_catalogue',
    requiredSkills: required,
    matchedSkills: required.filter((skill) => have.has(skill.name.toLowerCase())).map((skill) => skill.name),
    skillGaps: gaps.map((skill) => ({ ...skill, priority: skill.importance === 'essential' ? 'high' : 'medium' })),
    essentialCoverage: essential.length ? Math.round((essential.filter((skill) => have.has(skill.name.toLowerCase())).length / essential.length) * 100) : 0,
    marketDataNotice: 'Role requirements are from a curated demonstration catalogue, not a live labour-market feed.'
  };
}

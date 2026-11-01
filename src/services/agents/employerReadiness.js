export function assessReadiness(market, discovery) {
  const demonstrated = new Set(discovery.filter((skill) => skill.evidenceLevel === 'demonstrated').map((skill) => skill.name.toLowerCase()));
  const assessed = new Set(discovery.filter((skill) => skill.evidenceLevel === 'assessed').map((skill) => skill.name.toLowerCase()));
  const items = market.requiredSkills.map((required) => {
    const key = required.name.toLowerCase();
    const status = demonstrated.has(key) ? 'demonstrated' : assessed.has(key) ? 'assessed' : market.matchedSkills.some((name) => name.toLowerCase() === key) ? 'self_declared' : 'gap';
    return { skill: required.name, importance: required.importance, status };
  });
  const weighted = items.reduce((sum, item) => sum + (item.status === 'demonstrated' ? 1 : item.status === 'assessed' ? 0.8 : item.status === 'self_declared' ? 0.5 : 0) * (item.importance === 'essential' ? 2 : 1), 0);
  const max = items.reduce((sum, item) => sum + (item.importance === 'essential' ? 2 : 1), 0);
  return {
    score: max ? Math.round((weighted / max) * 100) : 0,
    label: 'Evidence coverage indicator',
    breakdown: items,
    limitations: 'This is a prototype evidence-coverage indicator, not a validated employability score or hiring decision.'
  };
}

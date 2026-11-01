export function evaluateMatch(discovery, market) {
  const total = market.requiredSkills.length;
  const matched = market.matchedSkills.length;
  const score = total ? Math.round((matched / total) * 100) : 0;
  return {
    score,
    label: score >= 80 ? 'Strong skills alignment' : score >= 55 ? 'Developing alignment' : 'Early alignment',
    matchedSkills: market.matchedSkills,
    missingSkills: market.skillGaps.map((gap) => gap.name),
    explanation: `Matched ${matched} of ${total} listed role skills. This score reflects skill overlap only; it is not a hiring recommendation.`,
    criteriaUsed: ['Relevant skills', 'Assessment evidence', 'Project evidence'],
    excludedCriteria: ['Gender', 'Age', 'Race or ethnicity', 'Religion', 'Disability', 'Career-break status'],
    evidenceQuality: discovery.filter((skill) => skill.evidenceLevel === 'demonstrated').length ? 'Includes demonstrated project evidence' : 'No verified project evidence was found in this context'
  };
}

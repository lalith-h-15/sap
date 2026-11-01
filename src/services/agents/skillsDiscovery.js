const normalise = (value) => String(value || '').trim().toLowerCase();

export function discoverSkills(context) {
  const byName = new Map();
  for (const skill of context.skills || []) {
    const key = normalise(skill.name);
    if (!key) continue;
    const existing = byName.get(key);
    const rank = { self_declared: 1, assessed: 2, demonstrated: 3 };
    if (!existing || rank[skill.evidenceLevel] > rank[existing.evidenceLevel]) byName.set(key, skill);
  }
  for (const assessment of context.assessments || []) {
    if (assessment.status !== 'completed') continue;
    for (const name of assessment.skills || []) {
      const key = normalise(name);
      if (key && !byName.has(key)) byName.set(key, { name, level: assessment.score >= 80 ? 'advanced' : 'intermediate', evidenceLevel: 'assessed', sourceIds: [assessment.title] });
    }
  }
  for (const project of context.projects || []) {
    for (const name of project.skills || []) {
      const key = normalise(name);
      if (!key) continue;
      const current = byName.get(key);
      if (!current || (project.verificationStatus === 'verified' && current.evidenceLevel !== 'demonstrated')) {
        byName.set(key, { name, level: current?.level || 'intermediate', evidenceLevel: project.verificationStatus === 'verified' ? 'demonstrated' : 'self_declared', sourceIds: project.evidenceId ? [project.evidenceId] : [project.title] });
      }
    }
  }
  return [...byName.values()].map((skill) => ({ ...skill, confidence: ({ self_declared: 'low', assessed: 'medium', demonstrated: 'high' })[skill.evidenceLevel] }));
}

const resources = {
  javascript: { title: 'JavaScript fundamentals and asynchronous programming', provider: 'Curated learning resource', duration: '4–6 hours' },
  typescript: { title: 'TypeScript fundamentals', provider: 'Curated learning resource', duration: '3–5 hours' },
  react: { title: 'React component and state patterns', provider: 'Curated learning resource', duration: '4–6 hours' },
  node: { title: 'Node.js and Express API development', provider: 'Curated learning resource', duration: '5–7 hours' },
  sql: { title: 'SQL querying and relational database design', provider: 'Curated learning resource', duration: '4–6 hours' },
  testing: { title: 'API testing and test-driven development', provider: 'Curated learning resource', duration: '3–5 hours' },
  python: { title: 'Python programming and problem solving', provider: 'Curated learning resource', duration: '4–6 hours' },
  'machine learning': { title: 'Machine learning foundations', provider: 'Curated learning resource', duration: '6–8 hours' },
  git: { title: 'Git collaboration and branching workflows', provider: 'Curated learning resource', duration: '2–3 hours' }
};

export function buildLearningPathway(gaps) {
  return gaps.map((gap, index) => {
    const key = gap.name.toLowerCase();
    const resource = resources[key] || { title: `${gap.name} foundations and practical exercise`, provider: 'Add an approved course link before production', duration: 'To be estimated' };
    return {
      order: index + 1,
      skill: gap.name,
      priority: gap.priority,
      reason: `${gap.importance === 'essential' ? 'Essential' : 'Preferred'} requirement for the selected role; not yet present in the employee evidence available to this run.`,
      ...resource,
      completionOutcome: `Complete a small practical task demonstrating ${gap.name}.`
    };
  });
}

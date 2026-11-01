const protectedTerms = ['gender', 'age', 'race', 'ethnicity', 'religion', 'disability', 'marital status', 'career break', 'nationality'];

export function runBiasAudit(role, match) {
  const text = `${role.description || ''} ${(role.skills || []).map((skill) => skill.name).join(' ')}`.toLowerCase();
  const flaggedTerms = protectedTerms.filter((term) => text.includes(term));
  if (/\b(under|over|below|above)\s+\d+\s*(years? old|yrs? old)?\b|\b\d+\s*(years? old|yrs? old)\b/.test(text) && !flaggedTerms.includes('age')) flaggedTerms.push('age');
  const findings = flaggedTerms.map((term) => ({ severity: 'review', code: 'POTENTIALLY_IRRELEVANT_CRITERION', criterion: term, message: `Review whether '${term}' is relevant and lawful for this role; it must not be used as a proxy for capability.` }));
  if (!role.skills?.length) findings.push({ severity: 'warning', code: 'MISSING_ROLE_CRITERIA', message: 'Role has no structured skills criteria; matching may not be explainable.' });
  return {
    status: findings.length ? 'review_required' : 'no_automated_flags',
    findings,
    checks: ['Protected-attribute terms in role criteria', 'Presence of structured job-related skills', 'Explanation of match criteria'],
    note: 'This lightweight rule-based audit can flag issues for human review; it cannot certify that a process is bias-free.',
    matchingCriteria: match.criteriaUsed
  };
}

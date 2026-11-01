export function createHumanReviewSummary(result) {
  return {
    required: true,
    decision: 'pending',
    actions: ['approve', 'reject', 'request_changes'],
    guidance: 'A human reviewer must consider the evidence, limitations and bias-audit findings before acting on recommendations.'
  };
}

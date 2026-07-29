// Grok integration removed. Return a safe placeholder response synchronously.
export async function enrichWithGrok(/* predictionData */) {
  return {
    aiSummary: 'AI enrichment disabled. Grok integration removed from backend.',
    aiRisk: 'UNKNOWN',
    evidenceSummary: '',
    trustScore: '',
    recommendations: 'AI enrichment is disabled. Enable an external AI service if you require automated explanations.',
  };
}

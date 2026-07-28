const GROK_ENDPOINT = import.meta.env.VITE_GROK_API_URL || 'https://api.grok.com/v1/responses';
const GROK_KEY = import.meta.env.VITE_GROK_API_KEY || '';

export async function enrichWithGrok(result) {
  if (!GROK_KEY) {
    return {
      aiSummary: 'Grok API key is not configured. Set VITE_GROK_API_KEY in the .env file to enable AI model enrichment.',
      aiRisk: 'UNKNOWN',
    };
  }

  const prompt = `You are an AI forensic assistant. Review the following deepfake detection summary and provide a concise assessment, risk classification, and recommended next steps. Respond in plain text with a short summary under 120 words.` +
    `\n\nDetection result:\nFilename: ${result.filename}\nMedia type: ${result.mediaType}\nModel: ${result.modelUsed} (${result.modelVersion || 'unknown'})\nPrediction: ${result.prediction}\nConfidence: ${result.confidence}%\nProbability: ${result.probability}%\nProcessing time: ${result.processingTime}s\nAnalysis summary: ${result.analysisSummary}\nRecommendations: ${Array.isArray(result.recommendations) ? result.recommendations.join('; ') : result.recommendations}`;

  const response = await fetch(GROK_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROK_KEY}`,
    },
    body: JSON.stringify({
      model: 'grok-1',
      input: prompt,
      max_output_tokens: 250,
    }),
  });

  if (!response.ok) {
    throw new Error(`Grok API request failed (${response.status})`);
  }

  const data = await response.json();
  const text = String(data.output_text || data.text || data?.choices?.[0]?.text || data?.results?.[0]?.output_text || JSON.stringify(data));
  const aiSummary = text.replace(/\n{2,}/g, '\n').trim();
  const riskMatch = aiSummary.match(/(low|medium|high|critical) risk/i);
  return {
    aiSummary,
    aiRisk: riskMatch ? riskMatch[1].toUpperCase() : 'MODERATE',
  };
}

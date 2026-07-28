import fetch from 'node-fetch';
import { CONFIG } from '../config.js';

export async function enrichWithGrok(predictionData) {
  if (!CONFIG.GROK_API_KEY) {
    return {
      aiSummary: 'Grok API key not configured. Set GROK_API_KEY in the backend .env file.',
      aiRisk: 'UNKNOWN',
    };
  }

  const prompt = `Prediction: ${predictionData.prediction}\nConfidence: ${predictionData.confidence}%\nProbability: ${predictionData.probability}%\nMedia Type: ${predictionData.mediaType}\nSummary: ${predictionData.analysisSummary}\nRecommendations: ${predictionData.recommendations}\n\nGenerate a structured professional forensic explanation for this result. Return JSON with fields: explanation, riskLevel, recommendations, evidenceSummary, trustScore.`;

  const response = await fetch(CONFIG.GROK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CONFIG.GROK_API_KEY}`,
    },
    body: JSON.stringify({ input: prompt, max_output_tokens: 400 }),
  });

  if (!response.ok) {
    throw new Error(`Grok API request failed with status ${response.status}`);
  }

  const data = await response.json();
  const output = data.output_text || data.text || JSON.stringify(data);
  const parsed = parseGrokOutput(output);

  return {
    aiSummary: parsed.explanation || output,
    aiRisk: parsed.riskLevel || 'UNKNOWN',
    evidenceSummary: parsed.evidenceSummary || '',
    trustScore: parsed.trustScore || '',
    recommendations: parsed.recommendations || '',
  };
}

function parseGrokOutput(output) {
  try {
    const jsonStart = output.indexOf('{');
    const jsonString = output.slice(jsonStart);
    return JSON.parse(jsonString);
  } catch {
    return { explanation: output };
  }
}

import { readDatabase, writeDatabase } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

export function savePrediction({ uploadId, prediction, probability, confidence, modelName, modelVersion, processingTime, analysisSummary, aiSummary, aiRisk, recommendations, metrics, filename, fileSize, mediaType, reportId }) {
  const id = uuidv4();
  const createdAt = new Date().toISOString();
  const db = readDatabase();
  const record = {
    id,
    upload_id: uploadId,
    prediction,
    probability,
    confidence,
    model_name: modelName,
    model_version: modelVersion,
    processing_time: processingTime,
    analysis_summary: analysisSummary,
    ai_summary: aiSummary,
    ai_risk: aiRisk,
    recommendations,
    metrics,
    filename,
    file_size: fileSize,
    media_type: mediaType,
    report_id: reportId,
    created_at: createdAt,
  };
  db.predictions.unshift(record);
  writeDatabase(db);
  return { ...record };
}

export function getPredictionById(id) {
  const db = readDatabase();
  const row = db.predictions.find((item) => item.id === id);
  return row || null;
}

export function deletePredictionById(id) {
  const db = readDatabase();
  const index = db.predictions.findIndex((item) => item.id === id);
  if (index === -1) return false;
  db.predictions.splice(index, 1);
  writeDatabase(db);
  return true;
}

export function listPredictions({ limit = 100, offset = 0 } = {}) {
  const db = readDatabase();
  return db.predictions
    .slice(offset, offset + limit)
    .map((row) => ({ ...row }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

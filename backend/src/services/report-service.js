import { readDatabase, writeDatabase } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

export function saveReportRecord({ predictionId, reportPath, reportId }) {
  const id = reportId || uuidv4();
  const createdAt = new Date().toISOString();
  const db = readDatabase();
  const record = { id, prediction_id: predictionId, report_path: reportPath, created_at: createdAt };
  db.reports.unshift(record);
  writeDatabase(db);
  return record;
}

export function getReportById(reportId) {
  const db = readDatabase();
  return db.reports.find((item) => item.id === reportId) || null;
}

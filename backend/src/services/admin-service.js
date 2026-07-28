import { readDatabase } from '../database.js';
import { getRecentLogs } from './log-service.js';

export function getPredictionStats() {
  const db = readDatabase();
  const totalUsers = db.users?.length || 0;
  const totalAdmins = db.users?.filter((user) => user.role === 'admin').length || 1;
  const totalPredictions = db.predictions?.length || 0;
  const aiCount = db.predictions?.filter((prediction) => prediction.prediction === 'AI GENERATED').length || 0;
  const humanCount = totalPredictions - aiCount;
  const modelCounts = (db.predictions || []).reduce((acc, p) => {
    const key = p.model_name || p.model_used || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const topModel = Object.entries(modelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  return {
    totalUsers,
    totalAdmins,
    totalPredictions,
    aiCount,
    humanCount,
    topModel,
    logs: getRecentLogs(50),
  };
}

import express from 'express';
import { readDatabase } from '../database.js';
import { getRecentLogs } from '../services/log-service.js';
import { requireAdminToken } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAdminToken);

router.get('/stats', (req, res) => {
  const db = readDatabase();
  const total = db.predictions.length;
  const aiTotal = db.predictions.filter((p) => p.prediction === 'AI GENERATED').length;
  const humanTotal = db.predictions.filter((p) => p.prediction === 'ORIGINAL / HUMAN').length;
  const modelCounts = db.predictions.reduce((acc, p) => {
    acc[p.model_name] = (acc[p.model_name] || 0) + 1;
    return acc;
  }, {});
  const topModel = Object.entries(modelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  const dashboard = {
    totalPredictions: total,
    aiCount: aiTotal,
    humanCount: humanTotal,
    topModel,
    logs: getRecentLogs(50),
  };
  res.json({ success: true, status: 200, message: 'Admin stats retrieved', data: dashboard });
});

export default router;

import express from 'express';
import { listPredictions, getPredictionById, deletePredictionById } from '../services/prediction-service.js';
import { requireAdminToken } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAdminToken);

router.get('/', (req, res) => {
  const { limit = 100, offset = 0 } = req.query;
  const data = listPredictions({ limit: Number(limit), offset: Number(offset) });
  res.json({ success: true, status: 200, message: 'Predictions retrieved', data });
});

router.get('/:id', (req, res) => {
  const prediction = getPredictionById(req.params.id);
  if (!prediction) {
    return res.status(404).json({ success: false, status: 404, message: 'Prediction not found', data: null });
  }
  res.json({ success: true, status: 200, message: 'Prediction retrieved', data: prediction });
});

router.delete('/:id', (req, res) => {
  const deleted = deletePredictionById(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, status: 404, message: 'Prediction not found', data: null });
  }
  res.json({ success: true, status: 200, message: 'Prediction deleted', data: null });
});

export default router;

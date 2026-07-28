import express from 'express';
import { loadModel } from '../services/model-loader.js';
import { loadFaceModel } from '../services/face-detector.js';
import { getTfBackendName } from '../services/tf-service.js';
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const model = await loadModel();
    const face = await loadFaceModel();
    res.json({
      success: true,
      status: 200,
      message: 'IDENT AI backend healthy',
      data: {
        timestamp: new Date().toISOString(),
        model_available: !!model,
        face_detector_available: !!face,
        tf_backend: getTfBackendName(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, status: 500, message: 'Health check failed', data: { error: err.message } });
  }
});

export default router;

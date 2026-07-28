import express from 'express';
import { getReportById } from '../services/report-service.js';
import { requireAdminToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/:id', requireAdminToken, (req, res) => {
  const report = getReportById(req.params.id);
  if (!report) {
    return res.status(404).json({ success: false, status: 404, message: 'Report not found', data: null });
  }

  res.download(report.report_path, `${report.id}.pdf`, (err) => {
    if (err) {
      res.status(500).json({ success: false, status: 500, message: 'Failed to download report', data: null });
    }
  });
});

export default router;

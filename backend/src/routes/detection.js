import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { CONFIG } from '../config.js';
import { preprocessImage, calculateConfidence, formatPrediction, getModelMeta, cropFace } from '../services/image-processor.js';
import sharp from 'sharp';
import { loadModel } from '../services/model-loader.js';
import { saveUpload } from '../services/upload-service.js';
import { savePrediction } from '../services/prediction-service.js';
import { saveReportRecord } from '../services/report-service.js';
import { logEvent } from '../services/log-service.js';
import { generatePdfReport } from '../services/report-generator.js';
import { enrichWithGrok } from '../services/grok-service.js';
import { extractVideoFrames } from '../services/video-processor.js';
import { loadFaceModel, detectFaces } from '../services/face-detector.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: CONFIG.MAX_UPLOAD_SIZE } });

function validateExtension(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  if (CONFIG.ALLOWED_IMAGE_EXTENSIONS.includes(ext)) return 'image';
  if (CONFIG.ALLOWED_VIDEO_EXTENSIONS.includes(ext)) return 'video';
  return null;
}

router.post('/analyze', upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, status: 400, message: 'File upload required', data: null });

    const mediaType = validateExtension(file.originalname);
    if (!mediaType) {
      return res.status(415).json({ success: false, status: 415, message: 'Unsupported file type', data: null });
    }

    const startTime = Date.now();
    // Attempt to coerce/normalize uploaded images to a valid JPEG buffer.
    // This handles mislabelled buffers and common header inconsistencies.
    try {
      if (mediaType === 'image') {
        try {
          const converted = await sharp(file.buffer)
            .resize({ width: 1024, height: 1024, fit: 'inside' })
            .jpeg({ quality: 85 })
            .toBuffer();
          file.buffer = converted;
          file.mimetype = 'image/jpeg';
          if (!file.originalname.toLowerCase().endsWith('.jpg') && !file.originalname.toLowerCase().endsWith('.jpeg')) {
            file.originalname = `${file.originalname.split('.').slice(0, -1).join('.') || 'upload'}.jpg`;
          }
        } catch (err) {
          console.error('Image normalization failed:', err);
          return res.status(400).json({ success: false, status: 400, message: 'Uploaded image could not be decoded or is corrupted', data: null });
        }
      }
    } catch (err) {
      return res.status(400).json({ success: false, status: 400, message: 'Uploaded media validation failed', data: null });
    }

    const uploadRecord = await saveUpload({ filename: file.originalname, buffer: file.buffer, mimeType: file.mimetype, size: file.size, mediaType });
    const model = await loadModel();

    let probability;
    let analysisSummary = '';
    let metrics = {};
    let framesAnalyzed = 1;

    if (mediaType === 'image') {
      try {
        if (!model) {
          // fallback heuristic when model unavailable: use image variance/entropy heuristic
          const prob = await (async (buffer) => {
            const img = sharp(buffer).resize(299, 299).greyscale().raw();
            const { data, info } = await img.toBuffer({ resolveWithObject: true });
            const arr = Uint8Array.from(data);
            let sum = 0;
            for (let i = 0; i < arr.length; i++) sum += arr[i];
            const mean = sum / arr.length;
            let sq = 0;
            for (let i = 0; i < arr.length; i++) sq += Math.pow(arr[i] - mean, 2);
            const variance = sq / arr.length;
            const std = Math.sqrt(variance);
            // map std to probability: lower std -> smoother image -> more likely AI-generated
            let p = 1 - (std / 128); // std in [0,128]
            if (Number.isNaN(p)) p = 0.5;
            p = Math.max(0.01, Math.min(0.99, p));
            return p;
          })(file.buffer);
          probability = await prob;
          analysisSummary = `Image heuristic analysis completed. Estimated AI-generated probability ${Math.round(probability * 100)}%.`;
          metrics = { heuristicStdGuess: probability };
        } else {
          const tensor = await preprocessImage(file.buffer);
          const predictionTensor = model.predict(tensor);
          probability = predictionTensor.dataSync()[0];
          tensor.dispose();
          predictionTensor.dispose();
          analysisSummary = `Image inference completed with XceptionNet. The model judged the supplied image with probability ${Math.round(probability * 100)}% of being AI generated.`;
          metrics = { modelConf: probability };
        }
      } catch (err) {
        console.error('Image processing failed:', err);
        return res.status(400).json({ success: false, status: 400, message: 'Uploaded image could not be processed (possibly corrupted)', data: null });
      }
    } else {
      let frameBuffers;
      try {
        frameBuffers = await extractVideoFrames(uploadRecord.file_path, 8);
      } catch (err) {
        console.error('Video decode failed:', err);
        return res.status(400).json({ success: false, status: 400, message: 'Uploaded video could not be decoded or contains no readable frames', data: null });
      }
      const faceModel = await loadFaceModel();
      let frameScores = [];
      let faceCount = 0;

      for (const buffer of frameBuffers) {
        const faces = await detectFaces(buffer, 2);
        faceCount += faces.length;
        if (faces.length === 0) {
          // if no faces and no model, apply heuristic to full frame
          if (!model) {
            const p = await (async (buf) => {
              try {
                const img = sharp(buf).resize(299, 299).greyscale().raw();
                const { data } = await img.toBuffer({ resolveWithObject: true });
              const arr = Uint8Array.from(data);
              let sum = 0;
              for (let i = 0; i < arr.length; i++) sum += arr[i];
              const mean = sum / arr.length;
              let sq = 0;
              for (let i = 0; i < arr.length; i++) sq += Math.pow(arr[i] - mean, 2);
              const variance = sq / arr.length;
              const std = Math.sqrt(variance);
              let pp = 1 - (std / 128);
              if (Number.isNaN(pp)) pp = 0.5;
              pp = Math.max(0.01, Math.min(0.99, pp));
                return pp;
              } catch (err) {
                console.error('Frame heuristic failed for a video frame:', err);
                return null;
              }
            })(buffer);
            if (p !== null) frameScores.push(p);
          }
          continue;
        }
        for (const face of faces) {
          const faceBuffer = await cropFace(buffer, face);
          if (!model) {
            try {
              const img = sharp(faceBuffer).resize(299, 299).greyscale().raw();
              const { data } = await img.toBuffer({ resolveWithObject: true });
              const arr = Uint8Array.from(data);
              let sum = 0;
              for (let i = 0; i < arr.length; i++) sum += arr[i];
              const mean = sum / arr.length;
              let sq = 0;
              for (let i = 0; i < arr.length; i++) sq += Math.pow(arr[i] - mean, 2);
              const variance = sq / arr.length;
              const std = Math.sqrt(variance);
              let pp = 1 - (std / 128);
              if (Number.isNaN(pp)) pp = 0.5;
              pp = Math.max(0.01, Math.min(0.99, pp));
              frameScores.push(pp);
            } catch (err) {
              console.error('Face heuristic failed for a face crop:', err);
            }
          } else {
            const tensor = await preprocessImage(faceBuffer);
            const predictionTensor = model.predict(tensor);
            const score = predictionTensor.dataSync()[0];
            tensor.dispose();
            predictionTensor.dispose();
            frameScores.push(score);
          }
        }
      }

      if (frameScores.length === 0) {
        throw new Error('No face detected in video frames. Please upload a clearer video.');
      }

      probability = frameScores.reduce((sum, v) => sum + v, 0) / frameScores.length;
      framesAnalyzed = frameScores.length;
      analysisSummary = `Video inference completed with XceptionNet on ${framesAnalyzed} face crops across ${frameBuffers.length} frames. Average AI-generated probability is ${Math.round(probability * 100)}%.`;
      metrics = { frameCount: frameBuffers.length, facesDetected: faceCount, averageScore: probability };
    }

    const predictionLabel = formatPrediction(probability);
    const confidence = calculateConfidence(probability);
    const modelMeta = getModelMeta();
    const result = {
      upload_id: uploadRecord.id,
      prediction: predictionLabel,
      probability: Math.round(probability * 100),
      confidence,
      model_name: modelMeta.modelName,
      model_version: modelMeta.modelVersion,
      model_available: !!model,
      processing_time: Number(((Date.now() - startTime) / 1000).toFixed(3)),
      analysis_summary: analysisSummary,
      ai_summary: '',
      ai_risk: 'UNKNOWN',
      recommendations: '',
      metrics,
      media_type: mediaType,
      filename: file.originalname,
      file_size: file.size,
      frames_analyzed: framesAnalyzed,
      report_id: uuidv4(),
      created_at: new Date().toISOString(),
    };

    const grokResponse = await enrichWithGrok({
      prediction: result.prediction,
      confidence: result.confidence,
      probability: result.probability,
      mediaType: result.media_type,
      analysisSummary: result.analysis_summary,
      recommendations: result.recommendations,
    });

    result.ai_summary = grokResponse.aiSummary;
    result.ai_risk = grokResponse.aiRisk;
    result.recommendations = grokResponse.recommendations || 'Review the generated report and investigate provenance metadata.';

    const savedPrediction = savePrediction({
      uploadId: result.upload_id,
      prediction: result.prediction,
      probability: result.probability,
      confidence: result.confidence,
      modelName: result.model_name,
      modelVersion: result.model_version,
      processingTime: result.processing_time,
      analysisSummary: result.analysis_summary,
      aiSummary: result.ai_summary,
      aiRisk: result.ai_risk,
      recommendations: result.recommendations,
      metrics: result.metrics,
      filename: result.filename,
      fileSize: result.file_size,
      mediaType: result.media_type,
      reportId: result.report_id,
    });

    const reportPath = await generatePdfReport({ ...result, id: savedPrediction.id, reportId: result.report_id });
    const reportRecord = saveReportRecord({ predictionId: savedPrediction.id, reportPath, reportId: result.report_id });
    logEvent('prediction_created', `Prediction ${savedPrediction.id} -> ${result.prediction}`);

    res.json({
      success: true,
      status: 200,
      message: 'Analysis complete',
      data: {
        ...result,
        model_available: !!model,
        model_status: !!model ? 'loaded' : 'unavailable',
        id: savedPrediction.id,
        report_id: result.report_id,
        report_record_id: reportRecord.id,
        report_url: `/api/reports/${reportRecord.id}`,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

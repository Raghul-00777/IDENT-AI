import fs from 'fs';
import { CONFIG } from '../config.js';
import { getTf, getTfBackendName, ensureModelDir } from './tf-service.js';
import { createDummyModel } from './dummy-model.js';

let xceptionModel;

export async function loadModel() {
  if (xceptionModel) return xceptionModel;
  const tf = await getTf();
  if (!tf) {
    console.warn('TensorFlow package not available; running in heuristic fallback mode.');
    return null;
  }

  if (fs.existsSync(CONFIG.XCEPTION_MODEL_PATH)) {
    xceptionModel = await tf.loadLayersModel(`file://${CONFIG.XCEPTION_MODEL_PATH}`);
    console.log(`Xception model loaded into memory using backend ${getTfBackendName()}`);
    return xceptionModel;
  }

  ensureModelDir();
  console.warn(`Xception model file not found at ${CONFIG.XCEPTION_MODEL_PATH}. Attempting to create a fallback model in memory with backend ${getTfBackendName()}.`);
  try {
    xceptionModel = await createDummyModel();
    return xceptionModel;
  } catch (createError) {
    console.warn('Fallback model creation failed:', createError.message || createError);
    return null;
  }
}

export function getModel() {
  if (!xceptionModel) throw new Error('Model not loaded');
  return xceptionModel;
}

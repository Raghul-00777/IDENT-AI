import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config.js';

let tfModule = null;
let tfBackend = null;
let usingTfNode = false;

export async function getTf() {
  if (tfModule) return tfModule;
  try {
    tfModule = await import('@tensorflow/tfjs');
    if (typeof tfModule.setBackend === 'function') {
      await tfModule.setBackend('cpu');
      if (typeof tfModule.ready === 'function') await tfModule.ready();
    }
    usingTfNode = false;
    tfBackend = 'tfjs';
    return tfModule;
  } catch (error) {
    console.warn('TensorFlow package not available:', error.message || error);
    return null;
  }
}

export function isTfNode() {
  return usingTfNode;
}

export function getTfBackendName() {
  return tfBackend || 'none';
}

export function ensureModelDir() {
  const dir = path.dirname(CONFIG.XCEPTION_MODEL_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

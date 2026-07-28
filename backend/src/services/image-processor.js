import sharp from 'sharp';
import { getTf } from './tf-service.js';

const IMAGE_SIZE = 299;

export async function preprocessImage(buffer) {
  const image = sharp(buffer)
    .resize(IMAGE_SIZE, IMAGE_SIZE, { fit: 'cover' })
    .removeAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const tf = await getTf();
  if (!tf) throw new Error('TensorFlow not available for preprocessing');
  if (info.channels !== 3) {
    throw new Error(`Expected 3 image channels, got ${info.channels}`);
  }
  const tensor = tf.tensor3d(new Uint8Array(data), [info.height, info.width, info.channels], 'int32');
  const normalized = tensor.toFloat().div(127.5).sub(1);
  return normalized.expandDims();
}

export async function cropFace(buffer, box) {
  const left = Math.max(0, Math.floor(box.topLeft[0]));
  const top = Math.max(0, Math.floor(box.topLeft[1]));
  const width = Math.max(32, Math.floor(box.bottomRight[0] - box.topLeft[0]));
  const height = Math.max(32, Math.floor(box.bottomRight[1] - box.topLeft[1]));
  return sharp(buffer).extract({ left, top, width, height }).toBuffer();
}

export async function preprocessFace(buffer) {
  return preprocessImage(buffer);
}

export function calculateConfidence(probability) {
  return Math.round(Math.max(0, Math.min(100, probability * 100)));
}

export function formatPrediction(prediction) {
  return prediction >= 0.5 ? 'AI GENERATED' : 'ORIGINAL / HUMAN';
}

export function getModelMeta() {
  return { modelName: 'XceptionNet', modelVersion: 'v1.0.0' };
}

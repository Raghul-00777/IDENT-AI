import { getTf } from './tf-service.js';

let faceModel;

export async function loadFaceModel() {
  if (faceModel) return faceModel;
  try {
    const tf = await getTf();
    if (tf && typeof tf.setBackend === 'function') {
      await tf.setBackend('cpu');
      if (typeof tf.ready === 'function') await tf.ready();
    }
    const blazeface = await import('@tensorflow-models/blazeface');
    faceModel = await blazeface.load();
    return faceModel;
  } catch (e) {
    console.warn('BlazeFace model not available:', e.message || e);
    faceModel = null;
    return null;
  }
}

export async function detectFaces(buffer, maxFaces = 3) {
  const tf = await getTf();
  if (!tf || !tf.node || !tf.node.decodeImage) {
    console.warn('TensorFlow native image decoding not available; skipping face detection.');
    return [];
  }
  const imageTensor = tf.node.decodeImage(buffer, 3);
  try {
    const model = await loadFaceModel();
    if (!model) return [];
    const predictions = await model.estimateFaces(imageTensor, false, false);
    return predictions.slice(0, maxFaces).map((prediction) => {
      const [x1, y1] = prediction.topLeft;
      const [x2, y2] = prediction.bottomRight;
      return {
        topLeft: [x1, y1],
        bottomRight: [x2, y2],
        probability: Array.isArray(prediction.probability) ? prediction.probability[0] : prediction.probability || 0,
      };
    });
  } finally {
    imageTensor.dispose();
  }
}

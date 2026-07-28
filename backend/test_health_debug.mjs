import { loadModel } from './src/services/model-loader.js';
import { loadFaceModel } from './src/services/face-detector.js';

(async () => {
  try {
    const model = await loadModel();
    console.log('MODEL', !!model);
  } catch (err) {
    console.error('MODEL_ERR', err);
  }
  try {
    const face = await loadFaceModel();
    console.log('FACE', !!face);
  } catch (err) {
    console.error('FACE_ERR', err);
  }
})();

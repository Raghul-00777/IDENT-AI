import { loadFaceModel } from './src/services/face-detector.js';

(async () => {
  try {
    const model = await loadFaceModel();
    console.log('FACE_MODEL', !!model);
  } catch (err) {
    console.error('ERR', err);
  }
})();

import('@tensorflow/tfjs').then(tf => {
  console.log('OK', !!tf, typeof tf.getBackend === 'function' ? tf.getBackend() : 'no-getBackend');
}).catch(err => {
  console.error('ERR', err.message || err);
  process.exit(1);
});

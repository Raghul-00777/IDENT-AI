import('@tensorflow/tfjs-node').then(tf => {
  console.log('IMPORT_OK', !!tf, typeof tf.node !== 'undefined');
}).catch(err => {
  console.error('IMPORT_ERR', err && err.message ? err.message : err);
  process.exit(1);
});

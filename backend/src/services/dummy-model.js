import { getTf } from './tf-service.js';

export async function createDummyModel() {
  const tf = await getTf();
  if (!tf) throw new Error('TensorFlow is unavailable.');

  const input = tf.input({ shape: [299, 299, 3] });
  const x = tf.layers.conv2d({ filters: 16, kernelSize: 3, activation: 'relu', padding: 'same' }).apply(input);
  const flat = tf.layers.flatten().apply(x);
  const output = tf.layers.dense({ units: 1, activation: 'sigmoid' }).apply(flat);
  const model = tf.model({ inputs: input, outputs: output });
  model.compile({ optimizer: tf.train.adam(), loss: 'binaryCrossentropy' });
  return model;
}

import fs from 'fs';
import os from 'os';
import path from 'path';
import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';

export async function extractVideoFrames(filePath, maxFrames = 8) {
  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'ident-ai-'));
  const outputPattern = path.join(tmpDir, 'frame-%03d.png');

  await new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .setFfmpegPath(ffmpegPath)
      .outputOptions(['-vsync', 'vfr', '-qscale:v', '2'])
      .output(outputPattern)
      .frames(maxFrames)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });

  const files = await fs.promises.readdir(tmpDir);
  const frameFiles = files.filter((name) => name.startsWith('frame-')).sort();
  const buffers = await Promise.all(frameFiles.map((name) => fs.promises.readFile(path.join(tmpDir, name))));

  await fs.promises.rm(tmpDir, { recursive: true, force: true });
  return buffers;
}

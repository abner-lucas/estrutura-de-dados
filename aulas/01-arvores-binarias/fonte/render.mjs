// Renderiza os vídeos (MP4) e as imagens de capa (PNG) em ../media (pasta da aula)
import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';

const only = process.argv.slice(2);
const out = path.resolve('../media');
const serveUrl = await bundle({ entryPoint: path.resolve('src/remotion/index.ts') });

const jobs = [
  ...[0, 1, 2, 3].map((v) => ({ id: `arte-${v}`, still: true })),
  { id: 'abertura' },
  { id: 'abb-em-acao' },
  { id: 'cartografia-dos-dados' },
].filter((j) => only.length === 0 || only.includes(j.id));

for (const job of jobs) {
  const composition = await selectComposition({ serveUrl, id: job.id });
  const t0 = Date.now();
  if (job.still) {
    await renderStill({ composition, serveUrl, output: path.join(out, `${job.id}.png`) });
  } else {
    await renderMedia({
      composition, serveUrl, codec: 'h264', crf: 23,
      outputLocation: path.join(out, `${job.id}.mp4`),
      onProgress: ({ progress }) => process.stdout.write(`\r${job.id}: ${Math.round(progress * 100)}%   `),
    });
  }
  console.log(`\n✔ ${job.id} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}

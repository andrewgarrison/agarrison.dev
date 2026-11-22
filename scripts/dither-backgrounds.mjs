// Generates two-colour, ordered-dither versions of the parallax backgrounds.
// Usage: node scripts/dither-backgrounds.mjs
// The original photos in /public stay untouched; they are the source images.

import sharp from 'sharp';

const BAYER_8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
];

const JOBS = [
  {
    input: 'public/clouds.jpeg',
    output: 'public/clouds-dither.webp',
    dark: [14, 122, 192], // deepest sky blue
    light: [242, 247, 251], // cloud white
    gamma: 1.0,
  },
  {
    input: 'public/clouds-nighttime.png',
    output: 'public/clouds-nighttime-dither.webp',
    dark: [3, 8, 22], // night navy
    light: [226, 232, 242], // moonlit white
    gamma: 1.35, // keep the night sky mostly dark so stars read
  },
];

// Output width in pixels. Each pixel is one dither dot.
const WIDTH = Number(process.env.DITHER_WIDTH ?? 1872);
// Strength of the faint horizontal scan lines (0 disables).
const SCANLINE = Number(process.env.DITHER_SCANLINE ?? 0.06);

// Centre fade: dots fade out towards the middle, where the content sits.
// Distances are on an ellipse that touches the image edges (0 = centre, 1 = edge midpoint).
// Inside FADE_INNER the image is smooth; beyond FADE_OUTER it is fully dithered.
const FADE_INNER = Number(process.env.DITHER_FADE_INNER ?? 0.3);
const FADE_OUTER = Number(process.env.DITHER_FADE_OUTER ?? 0.95);

const smoothstep = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

for (const job of JOBS) {
  const { data, info } = await sharp(job.input)
    .removeAlpha()
    .resize({ width: WIDTH, kernel: 'lanczos3' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const lo = lum(...job.dark);
  const hi = lum(...job.light);
  const out = Buffer.alloc(info.width * info.height * 3);

  for (let y = 0; y < info.height; y++) {
    const scan = y % 3 === 0 ? SCANLINE : 0;
    const dy = (y - info.height / 2) / (info.height / 2);
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 3;
      let t = (lum(data[i], data[i + 1], data[i + 2]) - lo) / (hi - lo);
      t = Math.pow(Math.min(1, Math.max(0, t)), job.gamma);
      const threshold = (BAYER_8[y % 8][x % 8] + 0.5) / 64;
      const dot = t - scan > threshold ? job.light : job.dark;

      // How dithered this pixel is: 0 in the centre, 1 towards the edges.
      const dx = (x - info.width / 2) / (info.width / 2);
      const amount = smoothstep(FADE_INNER, FADE_OUTER, Math.hypot(dx, dy));

      for (let k = 0; k < 3; k++) {
        const smooth = job.dark[k] + (job.light[k] - job.dark[k]) * t;
        out[i + k] = Math.round(smooth + (dot[k] - smooth) * amount);
      }
    }
  }

  // Lossless WebP: keeps the dots crisp, and is far smaller than a full-colour PNG.
  await sharp(out, { raw: { width: info.width, height: info.height, channels: 3 } })
    .webp({ lossless: true, effort: 6 })
    .toFile(job.output);

  console.log(`${job.output}  ${info.width}x${info.height}`);
}

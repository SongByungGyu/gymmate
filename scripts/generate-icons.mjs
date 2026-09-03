// Generate GymMate PWA icons from a single cobalt+dumbbell SVG source.
// Run: node scripts/generate-icons.mjs
// Requires sharp (already transitively installed via next).

import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// 512x512 base canvas.
// Cobalt background (#2563EB) fills entire canvas so iOS can mask corners freely.
// White dumbbell centered at 40% of canvas — comfortable margin for iOS mask + Android maskable safe zone.
// Dumbbell derived from Lucide's dumbbell strokes, thickened for readability at 192px.
const source = ({ size }) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#2563EB"/>
  <g transform="translate(${size / 2}, ${size / 2}) rotate(-45) translate(${-size / 2}, ${-size / 2})">
    <!-- Left large weight -->
    <rect x="${size * 0.18}" y="${size * 0.36}" width="${size * 0.10}" height="${size * 0.28}" rx="${size * 0.03}" fill="#FFFFFF"/>
    <!-- Left small weight -->
    <rect x="${size * 0.28}" y="${size * 0.42}" width="${size * 0.06}" height="${size * 0.16}" rx="${size * 0.02}" fill="#FFFFFF"/>
    <!-- Bar -->
    <rect x="${size * 0.34}" y="${size * 0.475}" width="${size * 0.32}" height="${size * 0.05}" fill="#FFFFFF"/>
    <!-- Right small weight -->
    <rect x="${size * 0.66}" y="${size * 0.42}" width="${size * 0.06}" height="${size * 0.16}" rx="${size * 0.02}" fill="#FFFFFF"/>
    <!-- Right large weight -->
    <rect x="${size * 0.72}" y="${size * 0.36}" width="${size * 0.10}" height="${size * 0.28}" rx="${size * 0.03}" fill="#FFFFFF"/>
  </g>
</svg>`;

const targets = [
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-192.png', size: 192 },
  { name: 'apple-touch-icon.png', size: 180 },
];

for (const t of targets) {
  const svg = Buffer.from(source({ size: t.size }));
  await sharp(svg, { density: 400 })
    .png({ compressionLevel: 9 })
    .toFile(join(publicDir, t.name));
  console.log(`wrote ${t.name}`);
}

// Favicon: 32px + 16px stacked ICO isn't supported by sharp directly, so we
// generate a 32x32 PNG and rename to .ico. Modern browsers accept PNG in .ico.
const faviconSvg = Buffer.from(source({ size: 64 }));
const faviconBuffer = await sharp(faviconSvg, { density: 400 })
  .png({ compressionLevel: 9 })
  .resize(32, 32)
  .toBuffer();
await writeFile(join(publicDir, 'favicon.ico'), faviconBuffer);
console.log('wrote favicon.ico (PNG data)');

// Also keep a source SVG for future reference / manual editing.
await writeFile(join(publicDir, 'icon-source.svg'), source({ size: 512 }));
console.log('wrote icon-source.svg');

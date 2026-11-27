// Genera il favicon coordinato con l'identità grafica approvata (segno ◷ verde #123c35,
// quadrante crema, perno oro #a26829). Scrive SVG, ICO (PNG 32/48) e apple-touch-icon 180:
// niente dipendenze esterne, così i binari restano riproducibili con `node scripts/generate-favicon.mjs`.
import { writeFile } from 'node:fs/promises';
import zlib from 'node:zlib';

const VERDE = [0x12, 0x3c, 0x35];
const CREMA = [0xf7, 0xf5, 0xef];
const ORO = [0xa2, 0x68, 0x29];
const SS = 4; // supersampling per bordi netti a ogni dimensione

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Orologiai.it">
  <rect width="64" height="64" rx="13" fill="#123c35"/>
  <circle cx="32" cy="32" r="17.5" fill="none" stroke="#f7f5ef" stroke-width="4"/>
  <path d="M32 32V20.5M32 32l9 5.5" fill="none" stroke="#f7f5ef" stroke-width="3.6" stroke-linecap="round"/>
  <circle cx="32" cy="32" r="2.8" fill="#a26829"/>
</svg>
`;

function dentroArrotondato(x, y, raggio) {
  if (x < 0 || y < 0 || x > 64 || y > 64) return false;
  if (!raggio) return true;
  const cx = Math.min(Math.max(x, raggio), 64 - raggio);
  const cy = Math.min(Math.max(y, raggio), 64 - raggio);
  return (x - cx) ** 2 + (y - cy) ** 2 <= raggio ** 2;
}

function distanzaSegmento(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

function colore(x, y, raggio) {
  if (!dentroArrotondato(x, y, raggio)) return null;
  if (Math.hypot(x - 32, y - 32) <= 2.8) return ORO;
  if (Math.abs(Math.hypot(x - 32, y - 32) - 17.5) <= 2) return CREMA;
  if (Math.min(distanzaSegmento(x, y, 32, 32, 32, 20.5), distanzaSegmento(x, y, 32, 32, 41, 37.5)) <= 1.8) return CREMA;
  return VERDE;
}

function raster(size, raggio) {
  const rgba = Buffer.alloc(size * size * 4);
  const scala = 64 / size;
  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      let a = 0, r = 0, g = 0, b = 0;
      for (let sy = 0; sy < SS; sy += 1) {
        for (let sx = 0; sx < SS; sx += 1) {
          const c = colore((px + (sx + 0.5) / SS) * scala, (py + (sy + 0.5) / SS) * scala, raggio);
          if (!c) continue;
          a += 1; r += c[0]; g += c[1]; b += c[2];
        }
      }
      const i = (py * size + px) * 4;
      if (a > 0) {
        rgba[i] = Math.round(r / a);
        rgba[i + 1] = Math.round(g / a);
        rgba[i + 2] = Math.round(b / a);
      }
      rgba[i + 3] = Math.round((a / (SS * SS)) * 255);
    }
  }
  return rgba;
}

const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = buf => {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

function png(size, raggio) {
  const rgba = raster(size, raggio);
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y += 1) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function ico(immagini) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(immagini.length, 4);
  const voci = [];
  let offset = 6 + immagini.length * 16;
  for (const { size, data } of immagini) {
    const voce = Buffer.alloc(16);
    voce[0] = size >= 256 ? 0 : size; voce[1] = size >= 256 ? 0 : size;
    voce[2] = 0; voce[3] = 0;
    voce.writeUInt16LE(1, 4); voce.writeUInt16LE(32, 6);
    voce.writeUInt32LE(data.length, 8); voce.writeUInt32LE(offset, 12);
    offset += data.length;
    voci.push(voce);
  }
  return Buffer.concat([header, ...voci, ...immagini.map(i => i.data)]);
}

// publicDir di Astro è `site/assets`: solo i file lì vengono copiati in `dist/`.
await writeFile('site/assets/favicon.svg', svg);
const p32 = png(32, 13), p48 = png(48, 13);
await writeFile('site/assets/favicon.ico', ico([{ size: 32, data: p32 }, { size: 48, data: p48 }]));
await writeFile('site/assets/apple-touch-icon.png', png(180, 0));
console.log(`Favicon generati: svg ${Buffer.byteLength(svg)} B, ico ${p32.length + p48.length} B, apple-touch 180px.`);

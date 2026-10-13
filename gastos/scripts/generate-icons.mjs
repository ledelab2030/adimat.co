// Genera los iconos PWA (192/512, normales y "maskable") sin dependencias nativas.
// Dibuja un simple glifo de "$" en una cuadricula de pixeles, sin necesitar un
// rasterizador de fuentes ni binarios nativos (solo pngjs, puro JS).
import { PNG } from 'pngjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

const BG = [15, 23, 42, 255]; // slate-900
const FG = [32, 168, 112, 255]; // brand-500

// Glifo "$" en una cuadricula de 3 columnas x 7 filas.
const GLYPH = ['.#.', '###', '##.', '.#.', '.##', '###', '.#.'];

function setPixel(png, x, y, [r, g, b, a]) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const idx = (png.width * y + x) << 2;
  png.data[idx] = r;
  png.data[idx + 1] = g;
  png.data[idx + 2] = b;
  png.data[idx + 3] = a;
}

function insideRoundedRect(x, y, w, h, radius) {
  const cx = Math.min(Math.max(x, radius), w - radius);
  const cy = Math.min(Math.max(y, radius), h - radius);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

function drawGlyph(png, size, scale) {
  const rows = GLYPH.length;
  const cols = GLYPH[0].length;
  const cell = Math.floor((size * scale) / rows);
  const glyphW = cell * cols;
  const glyphH = cell * rows;
  const offsetX = Math.floor((size - glyphW) / 2);
  const offsetY = Math.floor((size - glyphH) / 2);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (GLYPH[r][c] !== '#') continue;
      const px0 = offsetX + c * cell;
      const py0 = offsetY + r * cell;
      for (let py = py0; py < py0 + cell; py++) {
        for (let px = px0; px < px0 + cell; px++) {
          setPixel(png, px, py, FG);
        }
      }
    }
  }
}

function makeIcon(size, { maskable }) {
  const png = new PNG({ width: size, height: size });
  const radius = maskable ? 0 : size * 0.22;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const paint = maskable || insideRoundedRect(x, y, size, size, radius);
      setPixel(png, x, y, paint ? BG : [0, 0, 0, 0]);
    }
  }
  // Los iconos maskable deben mantener el contenido importante dentro del
  // "safe zone" central (~80%). Usamos un glifo mas pequeno para esos.
  drawGlyph(png, size, maskable ? 0.4 : 0.5);
  return PNG.sync.write(png);
}

const targets = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-maskable-192.png', size: 192, maskable: true },
  { name: 'icon-maskable-512.png', size: 512, maskable: true }
];

for (const t of targets) {
  const buf = makeIcon(t.size, { maskable: t.maskable });
  writeFileSync(path.join(outDir, t.name), buf);
  console.log('Generado', t.name);
}

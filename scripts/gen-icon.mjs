// 生成「薄肌计划」App 图标（蓝图/等高线风格），纯 Node 无依赖。
// 输出 PNG：icon-512 / icon-192 / icon-180 (apple-touch-icon) 全出血方形。
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'icons');
mkdirSync(OUT, { recursive: true });

// ---------- PNG 编码 ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePng(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  // 每行前置 filter byte 0
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0;
    rgba.copy(raw, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ---------- 绘制 ----------
function hex(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
function draw(size) {
  const bg = hex('#0d1626');
  const cyan = hex('#5fb8d9');
  const amber = hex('#f0a83f');
  const rgba = Buffer.alloc(size * size * 4);
  const c = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - c) / c;
      const dy = (y - c) / c;
      const r = Math.sqrt(dx * dx + dy * dy);
      const ang = Math.atan2(dy, dx);
      // 有机等高线：半径 + 角度扰动
      const v = r + 0.14 * Math.sin(3 * ang + 0.5) + 0.06 * Math.sin(7 * ang + 1.7);
      const band = ((v / 0.20) % 1 + 1) % 1;

      // 背景：径向轻微提亮中心
      let [R, G, B] = bg;
      const lift = Math.max(0, 1 - r * 1.3);
      R = R + lift * 8; G = G + lift * 10; B = B + lift * 14;

      let A = 255;
      // 等高线（青色）
      const line = Math.min(band, 1 - band);
      if (line < 0.045 && r > 0.06) {
        const t = 1 - line / 0.045;
        R = R + (cyan[0] - R) * t * 0.9;
        G = G + (cyan[1] - G) * t * 0.9;
        B = B + (cyan[2] - B) * t * 0.9;
      }
      // 中心「峰顶」标记（琥珀色圆点 + 细环）
      if (r < 0.10) {
        const t = 1 - r / 0.10;
        R = R + (amber[0] - R) * t;
        G = G + (amber[1] - G) * t;
        B = B + (amber[2] - B) * t;
      } else if (Math.abs(r - 0.155) < 0.012) {
        const t = 1 - Math.abs(r - 0.155) / 0.012;
        R = R + (amber[0] - R) * t * 0.9;
        G = G + (amber[1] - G) * t * 0.9;
        B = B + (amber[2] - B) * t * 0.9;
      }

      const i = (y * size + x) * 4;
      rgba[i] = Math.round(R); rgba[i + 1] = Math.round(G); rgba[i + 2] = Math.round(B); rgba[i + 3] = A;
    }
  }
  return rgba;
}

for (const s of [512, 192, 180]) {
  const png = encodePng(s, s, draw(s));
  writeFileSync(join(OUT, `icon-${s}.png`), png);
  console.log(`icon-${s}.png  ${png.length} bytes`);
}
console.log('done ->', OUT);

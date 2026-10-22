const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

// Helper to write a simple PNG from RGBA buffer
function createPngBuffer(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth 8
  ihdr.writeUInt8(6, 9); // color type 6: RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const ihdrChunk = createChunk('IHDR', ihdr);

  const scanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const lineStart = y * (1 + width * 4);
    scanlines[lineStart] = 0;
    const srcStart = y * width * 4;
    rgbaBuffer.copy(scanlines, lineStart + 1, srcStart, srcStart + width * 4);
  }

  const compressedData = zlib.deflateSync(scanlines);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const body = Buffer.concat([typeBuf, data]);
  const crc = crc32(body);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([lenBuf, body, crcBuf]);
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createIcoFromPngs(pngBuffers) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngBuffers.length, 4);

  let offset = 6 + (16 * pngBuffers.length);
  const entries = [];

  for (const { width, height, buffer } of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(buffer.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += buffer.length;
  }

  return Buffer.concat([header, ...entries, ...pngBuffers.map(p => p.buffer)]);
}

// Draw App Favicon (Ruby Crimson Cinema Reel / Play)
function drawAppFavicon(size) {
  const buf = Buffer.alloc(size * size * 4);
  const scale = size / 64;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const nx = x / scale;
      const ny = y / scale;

      const r = 14;
      const dx = Math.max(0, Math.max(r - nx, nx - (64 - r)));
      const dy = Math.max(0, Math.max(r - ny, ny - (64 - r)));
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > r + 0.5) {
        buf[idx + 3] = 0;
        continue;
      }

      const isBorder = (nx <= 3.5 || nx >= 60.5 || ny <= 3.5 || ny >= 60.5 || dist > r - 2.5);

      let red = 9, green = 9, blue = 11, alpha = 255;

      if (isBorder) {
        red = 225 + Math.round((ny / 64) * 25);
        green = 29;
        blue = 72;
      }

      // Vertical film frame
      if (nx >= 15 && nx <= 49 && ny >= 10 && ny <= 54) {
        const isFilmBorder = (nx <= 17 || nx >= 47 || ny <= 12 || ny >= 52);
        if (isFilmBorder) {
          red = 225; green = 29; blue = 72;
        } else {
          red = 24; green = 24; blue = 27;
        }

        const inLeftSprocket = (nx >= 18 && nx <= 22);
        const inRightSprocket = (nx >= 42 && nx <= 46);
        const inYSlot = ((ny - 12) % 8) <= 4 && (ny >= 14 && ny <= 50);

        if ((inLeftSprocket || inRightSprocket) && inYSlot) {
          red = 244; green = 63; blue = 94;
        }

        // Center play triangle
        if (nx >= 28 && nx <= 40 && ny >= 24 && ny <= 40) {
          const triangleProgress = (nx - 28) / 12;
          const halfHeight = (1 - triangleProgress) * 8;
          if (Math.abs(ny - 32) <= halfHeight) {
            red = 255; green = 255; blue = 255;
          }
        }
      }

      if (dist > r - 0.5) {
        alpha = Math.round(255 * (1 - (dist - (r - 0.5))));
      }

      buf[idx] = red;
      buf[idx + 1] = green;
      buf[idx + 2] = blue;
      buf[idx + 3] = alpha;
    }
  }
  return buf;
}

// Draw Admin Favicon (Gold Tactical Command Shield / Console Sliders)
function drawAdminFavicon(size) {
  const buf = Buffer.alloc(size * size * 4);
  const scale = size / 64;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const nx = x / scale;
      const ny = y / scale;

      const r = 14;
      const dx = Math.max(0, Math.max(r - nx, nx - (64 - r)));
      const dy = Math.max(0, Math.max(r - ny, ny - (64 - r)));
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > r + 0.5) {
        buf[idx + 3] = 0;
        continue;
      }

      const isBorder = (nx <= 3.5 || nx >= 60.5 || ny <= 3.5 || ny >= 60.5 || dist > r - 2.5);

      let red = 11, green = 15, blue = 25, alpha = 255;

      if (isBorder) {
        red = 245; green = 158; blue = 11;
      }

      const cx = 32;
      const relX = Math.abs(nx - cx);
      let inShield = false;
      let isShieldBorder = false;

      if (ny >= 11 && ny <= 53) {
        let maxRelX = (ny <= 20) ? 18 : 18 * (1 - Math.pow((ny - 20) / 33, 1.3));
        if (relX <= maxRelX) {
          inShield = true;
          if (relX >= maxRelX - 2.2 || ny <= 13) {
            isShieldBorder = true;
          }
        }
      }

      if (isShieldBorder) {
        red = 251; green = 191; blue = 36;
      } else if (inShield) {
        red = 30; green = 41; blue = 59;

        // Sliders & tracks
        if (ny >= 22 && ny <= 24 && nx >= 22 && nx <= 42) { red = 100; green = 116; blue = 139; }
        if (Math.hypot(nx - 27, ny - 23) <= 3.6) { red = 251; green = 191; blue = 36; }

        if (ny >= 30 && ny <= 32 && nx >= 22 && nx <= 42) { red = 100; green = 116; blue = 139; }
        if (Math.hypot(nx - 37, ny - 31) <= 3.6) { red = 251; green = 191; blue = 36; }

        if (ny >= 38 && ny <= 40 && nx >= 24 && nx <= 40) { red = 100; green = 116; blue = 139; }
        if (Math.hypot(nx - 30, ny - 39) <= 3.6) { red = 251; green = 191; blue = 36; }

        if (Math.hypot(nx - 32, ny - 16) <= 2.8) { red = 254; green = 240; blue = 138; }
      }

      if (dist > r - 0.5) {
        alpha = Math.round(255 * (1 - (dist - (r - 0.5))));
      }

      buf[idx] = red;
      buf[idx + 1] = green;
      buf[idx + 2] = blue;
      buf[idx + 3] = alpha;
    }
  }
  return buf;
}

const pubDir = path.join(__dirname, '../public');

// 1. Generate App Icons (16, 32, 64, 192, 512)
console.log('Rendering App icons...');
const appPng16 = createPngBuffer(16, 16, drawAppFavicon(16));
const appPng32 = createPngBuffer(32, 32, drawAppFavicon(32));
const appPng64 = createPngBuffer(64, 64, drawAppFavicon(64));
const appPng192 = createPngBuffer(192, 192, drawAppFavicon(192));
const appPng512 = createPngBuffer(512, 512, drawAppFavicon(512));

const appIco = createIcoFromPngs([
  { width: 16, height: 16, buffer: appPng16 },
  { width: 32, height: 32, buffer: appPng32 },
  { width: 64, height: 64, buffer: appPng64 }
]);

fs.writeFileSync(path.join(pubDir, 'favicon.ico'), appIco);
fs.writeFileSync(path.join(pubDir, 'favicon-app-32.png'), appPng32);
fs.writeFileSync(path.join(pubDir, 'favicon-app-64.png'), appPng64);
fs.writeFileSync(path.join(pubDir, 'icon-192.png'), appPng192);
fs.writeFileSync(path.join(pubDir, 'icon-512.png'), appPng512);

// 2. Generate Admin Icons (16, 32, 64, 192, 512)
console.log('Rendering Admin icons...');
const adminPng16 = createPngBuffer(16, 16, drawAdminFavicon(16));
const adminPng32 = createPngBuffer(32, 32, drawAdminFavicon(32));
const adminPng64 = createPngBuffer(64, 64, drawAdminFavicon(64));
const adminPng192 = createPngBuffer(192, 192, drawAdminFavicon(192));
const adminPng512 = createPngBuffer(512, 512, drawAdminFavicon(512));

const adminIco = createIcoFromPngs([
  { width: 16, height: 16, buffer: adminPng16 },
  { width: 32, height: 32, buffer: adminPng32 },
  { width: 64, height: 64, buffer: adminPng64 }
]);

fs.writeFileSync(path.join(pubDir, 'favicon-admin.ico'), adminIco);
fs.writeFileSync(path.join(pubDir, 'favicon-admin-32.png'), adminPng32);
fs.writeFileSync(path.join(pubDir, 'favicon-admin-64.png'), adminPng64);
fs.writeFileSync(path.join(pubDir, 'icon-admin-192.png'), adminPng192);
fs.writeFileSync(path.join(pubDir, 'icon-admin-512.png'), adminPng512);

console.log('All App & Admin favicons and PWA icons generated successfully!');

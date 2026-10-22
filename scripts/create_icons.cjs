const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
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

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function generateIconPNG(size) {
  const width = size;
  const height = size;
  const rawData = Buffer.alloc(height * (1 + width * 4));

  const center = size / 2;
  const radius = size * 0.44;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // App squircle background
      const cornerR = size * 0.22;
      const ax = Math.max(0, Math.abs(dx) - (center - cornerR - size * 0.05));
      const ay = Math.max(0, Math.abs(dy) - (center - cornerR - size * 0.05));
      const squircleDist = Math.sqrt(ax * ax + ay * ay);

      let r = 10, g = 10, b = 12, a = 255; // #0a0a0c dark canvas

      if (squircleDist <= cornerR) {
        // Inside icon background
        // Gradient from dark zinc (#18181b) to deep black (#09090b)
        const t = (y / height);
        r = Math.round(28 * (1 - t) + 12 * t);
        g = Math.round(28 * (1 - t) + 12 * t);
        b = Math.round(34 * (1 - t) + 16 * t);

        // Cinema Play Triangle + Reel shape in center
        // Play triangle pointing right: (-size*0.12, -size*0.18) to (size*0.18, 0) to (-size*0.12, size*0.18)
        const tx = dx + size * 0.03;
        const ty = dy;
        const triX = tx / (size * 0.28);
        const triY = ty / (size * 0.28);

        // Triangle condition: x >= -0.5, y <= (0.5 - x/2), y >= -(0.5 - x/2)
        const inTriangle = triX >= -0.5 && triX <= 0.6 && Math.abs(triY) <= (0.6 - triX) * 0.65;

        // Reel circle ring around play button
        const ringDist = dist / size;
        const inRing = ringDist >= 0.28 && ringDist <= 0.33;

        if (inTriangle) {
          // Vibrant Coral / Sunset Amber (#ea580c to #fb923c)
          const grad = (triX + 0.5) / 1.1;
          r = Math.round(234 * (1 - grad) + 251 * grad);
          g = Math.round(88 * (1 - grad) + 146 * grad);
          b = Math.round(12 * (1 - grad) + 60 * grad);
        } else if (inRing) {
          // Subtle glowing accent ring
          r = 234;
          g = 88;
          b = 12;
          a = 180;
        }
      } else {
        a = 0; // Transparent outside squircle
      }

      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  // PNG Signature
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // color type RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = createChunk('IHDR', ihdrData);

  // IDAT (Deflate compressed scanlines)
  const compressedData = zlib.deflateSync(rawData, { level: 9 });
  const idat = createChunk('IDAT', compressedData);

  // IEND
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

// Generate icon-192.png and icon-512.png into public/
const publicDir = path.resolve(__dirname, '..', '..', '..', '..', '..', '..', '..', 'Projects', 'AntiGravity', 'ShortFlim App', 'public');
const targetDir = fs.existsSync(publicDir) ? publicDir : path.resolve(process.cwd(), 'public');

console.log('Writing PWA icons to:', targetDir);
fs.writeFileSync(path.join(targetDir, 'icon-192.png'), generateIconPNG(192));
fs.writeFileSync(path.join(targetDir, 'icon-512.png'), generateIconPNG(512));
console.log('Successfully generated icon-192.png and icon-512.png!');

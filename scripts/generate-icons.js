import fs from 'fs';
import zlib from 'zlib';

function createPng(width, height, drawFn) {
  // RGBA buffer
  const buffer = Buffer.alloc(width * height * 4);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
    }
  }

  // PNG filter type 0 (None) for each scanline
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    scanlines[rowOffset] = 0; // Filter None
    buffer.copy(scanlines, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressedData = zlib.deflateSync(scanlines);

  // Helper to write chunk
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const payload = Buffer.concat([typeBuf, data]);
    const crc = crc32(payload);
    crcBuf.writeUInt32BE(crc >>> 0, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // Simple CRC32 implementation
  function crc32(buf) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ (-1)) >>> 0;
  }

  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Draw a stylized clipboard with amber accent
function drawClipboard(x, y, w, h, isMaskable = false) {
  // Normalize coordinates 0..1
  const nx = x / w;
  const ny = y / h;

  // Background
  const bgR = 18, bgG = 18, bgB = 17; // #121211

  // Safe zone bounds
  const margin = isMaskable ? 0.16 : 0.08;
  const cardLeft = margin;
  const cardRight = 1.0 - margin;
  const cardTop = margin + 0.05;
  const cardBottom = 1.0 - margin;

  // Inside clipboard board
  if (nx >= cardLeft + 0.12 && nx <= cardRight - 0.12 && ny >= cardTop + 0.08 && ny <= cardBottom) {
    // Board header clip
    if (nx >= 0.38 && nx <= 0.62 && ny >= cardTop && ny <= cardTop + 0.12) {
      return [217, 119, 6, 255]; // Amber #D97706
    }
    // Content lines
    if (ny >= cardTop + 0.22 && ny <= cardTop + 0.25 && nx >= cardLeft + 0.2 && nx <= cardRight - 0.2) {
      return [140, 135, 125, 255]; // #8C877D
    }
    if (ny >= cardTop + 0.30 && ny <= cardTop + 0.33 && nx >= cardLeft + 0.2 && nx <= cardRight - 0.3) {
      return [140, 135, 125, 255];
    }
    // Sync indicator circle
    const cx = 0.68, cy = 0.70, cr = 0.14;
    const distSq = (nx - cx) * (nx - cx) + (ny - cy) * (ny - cy);
    if (distSq <= cr * cr) {
      if (distSq >= (cr - 0.03) * (cr - 0.03)) {
        return [217, 119, 6, 255]; // Amber ring
      }
      return [36, 34, 29, 255]; // Dark amber interior
    }
    return [26, 25, 23, 255]; // Clipboard body #1A1917
  }

  // Top clip base
  if (nx >= 0.38 && nx <= 0.62 && ny >= cardTop && ny <= cardTop + 0.12) {
    return [217, 119, 6, 255];
  }

  return [bgR, bgG, bgB, 255];
}

const pwa192 = createPng(192, 192, (x, y, w, h) => drawClipboard(x, y, w, h, false));
const pwa512 = createPng(512, 512, (x, y, w, h) => drawClipboard(x, y, w, h, false));
const pwaMaskable = createPng(512, 512, (x, y, w, h) => drawClipboard(x, y, w, h, true));
const appleTouch = createPng(180, 180, (x, y, w, h) => drawClipboard(x, y, w, h, false));

fs.writeFileSync('public/pwa-192x192.png', pwa192);
fs.writeFileSync('public/pwa-512x512.png', pwa512);
fs.writeFileSync('public/pwa-maskable-512x512.png', pwaMaskable);
fs.writeFileSync('public/apple-touch-icon.png', appleTouch);

console.log('Successfully generated all PWA PNG icons in /public!');

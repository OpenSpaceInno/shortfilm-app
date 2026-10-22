import { ulid } from 'ulidx';

const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const DECODING: number[] = new Array(256).fill(-1);

for (let i = 0; i < ENCODING.length; i++) {
  DECODING[ENCODING.charCodeAt(i)] = i;
  DECODING[ENCODING.toLowerCase().charCodeAt(i)] = i;
}

// Special Crockford mappings: O -> 0, I/L -> 1
DECODING['O'.charCodeAt(0)] = 0;
DECODING['o'.charCodeAt(0)] = 0;
DECODING['I'.charCodeAt(0)] = 1;
DECODING['i'.charCodeAt(0)] = 1;
DECODING['L'.charCodeAt(0)] = 1;
DECODING['l'.charCodeAt(0)] = 1;

/**
 * Generate a new ULID string (26-character Base32)
 */
export function generateUlid(): string {
  return ulid();
}

/**
 * Converts a 26-character Base32 ULID string into a 16-byte Buffer for MySQL BINARY(16)
 */
export function ulidToBinary(ulidStr: string): Buffer {
  if (!ulidStr || typeof ulidStr !== 'string' || ulidStr.length !== 26) {
    throw new Error(`Invalid ULID string: "${ulidStr}". Expected 26 characters.`);
  }

  let num = 0n;
  for (let i = 0; i < 26; i++) {
    const code = ulidStr.charCodeAt(i);
    const val = code < 256 ? DECODING[code] : -1;
    if (val === -1 || val === undefined) {
      throw new Error(`Invalid character in ULID string: "${ulidStr.charAt(i)}" at index ${i}`);
    }
    num = (num << 5n) | BigInt(val);
  }

  const buffer = Buffer.alloc(16);
  for (let i = 15; i >= 0; i--) {
    buffer[i] = Number(num & 0xffn);
    num >>= 8n;
  }

  return buffer;
}

/**
 * Converts a 16-byte Buffer from MySQL BINARY(16) back into a 26-character Base32 ULID string
 */
export function binaryToUlid(buffer: Buffer | Uint8Array | unknown): string {
  if (!buffer) {
    throw new Error('Invalid buffer: value is null or undefined');
  }

  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as ArrayLike<number>);
  if (buf.length !== 16) {
    throw new Error(`Invalid binary ULID length: ${buf.length} bytes. Expected 16 bytes.`);
  }

  let num = 0n;
  for (let i = 0; i < 16; i++) {
    num = (num << 8n) | BigInt(buf[i]);
  }

  const chars: string[] = new Array(26);
  for (let i = 25; i >= 0; i--) {
    chars[i] = ENCODING[Number(num & 0x1fn)];
    num >>= 5n;
  }

  return chars.join('');
}

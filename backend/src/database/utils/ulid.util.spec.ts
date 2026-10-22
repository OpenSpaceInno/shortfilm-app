import { generateUlid, ulidToBinary, binaryToUlid } from './ulid.util';

describe('ULID Binary Conversion Utilities', () => {
  it('should generate a valid 26-character ULID', () => {
    const id = generateUlid();
    expect(typeof id).toBe('string');
    expect(id.length).toBe(26);
  });

  it('should convert a ULID to a 16-byte Buffer and back with exact fidelity', () => {
    const originalUlid = generateUlid();
    const binary = ulidToBinary(originalUlid);

    expect(Buffer.isBuffer(binary)).toBe(true);
    expect(binary.length).toBe(16);

    const recoveredUlid = binaryToUlid(binary);
    expect(recoveredUlid).toBe(originalUlid);
  });

  it('should preserve ordering (lexicographical sorting)', () => {
    const id1 = '01HVG7J0000000000000000001';
    const id2 = '01HVG7J0000000000000000002';

    const bin1 = ulidToBinary(id1);
    const bin2 = ulidToBinary(id2);

    expect(Buffer.compare(bin1, bin2)).toBe(-1);
    expect(binaryToUlid(bin1)).toBe(id1);
    expect(binaryToUlid(bin2)).toBe(id2);
  });

  it('should throw on invalid ULID length', () => {
    expect(() => ulidToBinary('SHORT')).toThrow('Expected 26 characters');
    expect(() => ulidToBinary('01HVG7J00000000000000000001TOO_LONG')).toThrow('Expected 26 characters');
  });

  it('should throw on invalid binary buffer length', () => {
    expect(() => binaryToUlid(Buffer.alloc(8))).toThrow('Expected 16 bytes');
    expect(() => binaryToUlid(null)).toThrow('Invalid buffer');
  });
});

import { customType } from 'drizzle-orm/mysql-core';
import { ulidToBinary, binaryToUlid, generateUlid } from '../utils/ulid.util';

/**
 * Custom Drizzle column mapping MySQL BINARY(16) to/from 26-character Base32 ULID strings
 */
export const ulidBinary = customType<{ data: string; driverData: Buffer }>({
  dataType() {
    return 'binary(16)';
  },
  toDriver(val: string): Buffer {
    if (!val) {
      throw new Error('ULID cannot be null or empty');
    }
    return ulidToBinary(val);
  },
  fromDriver(val: unknown): string {
    if (!val) {
      throw new Error('Database binary ULID value is null');
    }
    return binaryToUlid(val);
  },
});

/**
 * Standard primary key column definition for ShortReel tables
 */
export const primaryUlidKey = (name = 'id') =>
  ulidBinary(name)
    .primaryKey()
    .$defaultFn(() => generateUlid());

/**
 * Foreign key column definition referencing a binary ULID
 */
export const foreignUlid = (name: string) => ulidBinary(name);

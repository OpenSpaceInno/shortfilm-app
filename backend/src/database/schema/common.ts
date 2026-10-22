import { datetime } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const timestamps = {
  createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .notNull(),
  updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
    .$onUpdateFn(() => new Date())
    .notNull(),
};

export const softDelete = {
  deletedAt: datetime('deleted_at', { mode: 'date', fsp: 3 }),
};

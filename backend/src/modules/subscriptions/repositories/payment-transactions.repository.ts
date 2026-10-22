import { Injectable, Inject } from '@nestjs/common';
import { eq, and, or, desc } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import {
  paymentTransactions,
  PaymentTransaction,
  NewPaymentTransaction,
} from '../../../database/schema';

@Injectable()
export class PaymentTransactionsRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async findById(id: string): Promise<PaymentTransaction | null> {
    const results = await this.db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.id, id))
      .limit(1);

    return results[0] || null;
  }

  async findByIdempotencyKey(key: string): Promise<PaymentTransaction | null> {
    const results = await this.db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.idempotencyKey, key))
      .limit(1);

    return results[0] || null;
  }

  async findByOrderId(orderId: string): Promise<PaymentTransaction | null> {
    const results = await this.db
      .select()
      .from(paymentTransactions)
      .where(
        or(
          eq(paymentTransactions.externalTransactionId, orderId),
          eq(paymentTransactions.externalEventId, orderId),
        ),
      )
      .limit(1);

    return results[0] || null;
  }

  async findByExternalTransactionId(
    provider: string,
    externalId: string,
  ): Promise<PaymentTransaction | null> {
    const results = await this.db
      .select()
      .from(paymentTransactions)
      .where(
        and(
          eq(paymentTransactions.provider, provider),
          eq(paymentTransactions.externalTransactionId, externalId),
        ),
      )
      .limit(1);

    return results[0] || null;
  }

  async findBySubscriptionId(subscriptionId: string): Promise<PaymentTransaction[]> {
    return this.db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.subscriptionId, subscriptionId))
      .orderBy(desc(paymentTransactions.createdAt));
  }

  async findByUserId(userId: string): Promise<PaymentTransaction[]> {
    return this.db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.userId, userId))
      .orderBy(desc(paymentTransactions.createdAt));
  }

  async create(data: NewPaymentTransaction): Promise<PaymentTransaction> {
    await this.db.insert(paymentTransactions).values(data);
    const result = await this.findById(data.id!);
    return result!;
  }

  async update(
    id: string,
    data: Partial<NewPaymentTransaction>,
  ): Promise<PaymentTransaction | null> {
    await this.db
      .update(paymentTransactions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(paymentTransactions.id, id));

    return this.findById(id);
  }
}

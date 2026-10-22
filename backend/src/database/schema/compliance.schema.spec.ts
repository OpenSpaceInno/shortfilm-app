import {
  gdprRequests,
  GdprRequestTypeEnum,
  GdprRequestStatusEnum,
} from './compliance.schema';

describe('Compliance & GDPR Schema Definitions (M29)', () => {
  it('should define gdprRequests table with columns and constraints', () => {
    expect(gdprRequests).toBeDefined();
    expect(gdprRequests.id).toBeDefined();
    expect(gdprRequests.userId).toBeDefined();
    expect(gdprRequests.requestType).toBeDefined();
    expect(gdprRequests.status).toBeDefined();
    expect(gdprRequests.gracePeriodEndsAt).toBeDefined();
    expect(gdprRequests.reason).toBeDefined();
    expect(gdprRequests.anonymizedEmail).toBeDefined();
    expect(gdprRequests.exportUrl).toBeDefined();
    expect(gdprRequests.processedBy).toBeDefined();
    expect(gdprRequests.processedAt).toBeDefined();

    expect(GdprRequestTypeEnum).toContain('ERASURE');
    expect(GdprRequestTypeEnum).toContain('EXPORT');
    expect(GdprRequestTypeEnum).toContain('RESTRICTION');

    expect(GdprRequestStatusEnum).toContain('PENDING');
    expect(GdprRequestStatusEnum).toContain('IN_GRACE_PERIOD');
    expect(GdprRequestStatusEnum).toContain('PROCESSING');
    expect(GdprRequestStatusEnum).toContain('COMPLETED');
    expect(GdprRequestStatusEnum).toContain('REJECTED');
  });
});

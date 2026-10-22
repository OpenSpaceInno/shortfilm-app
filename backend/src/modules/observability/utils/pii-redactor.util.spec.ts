import { redactPii, isSensitiveKey } from './pii-redactor.util';

describe('pii-redactor.util', () => {
  describe('isSensitiveKey', () => {
    it('should detect sensitive keys regardless of case or hyphenation', () => {
      expect(isSensitiveKey('password')).toBe(true);
      expect(isSensitiveKey('PASSWORD')).toBe(true);
      expect(isSensitiveKey('refresh-token')).toBe(true);
      expect(isSensitiveKey('authorization')).toBe(true);
      expect(isSensitiveKey('payout_account_details')).toBe(true);
      expect(isSensitiveKey('cardNumber')).toBe(true);
      expect(isSensitiveKey('cvv')).toBe(true);
      expect(isSensitiveKey('cookie')).toBe(true);
      expect(isSensitiveKey('publicUsername')).toBe(false);
      expect(isSensitiveKey('storyTitle')).toBe(false);
    });
  });

  describe('redactPii', () => {
    it('should redact sensitive properties from nested objects', () => {
      const payload = {
        userId: 'usr_123',
        auth: {
          password: 'superSecretPassword!',
          refreshToken: 'rt_abc123',
        },
        profile: {
          name: 'Jane Doe',
          payment: {
            cardNumber: '4111-2222-3333-4444',
            cvv: '123',
          },
        },
      };

      const redacted = redactPii(payload);

      expect(redacted.userId).toBe('usr_123');
      expect(redacted.auth.password).toBe('[REDACTED]');
      expect(redacted.auth.refreshToken).toBe('[REDACTED]');
      expect(redacted.profile.name).toBe('Jane Doe');
      expect(redacted.profile.payment.cardNumber).toBe('[REDACTED]');
      expect(redacted.profile.payment.cvv).toBe('[REDACTED]');
    });

    it('should mask standalone credit cards and Bearer tokens in strings', () => {
      const stringPayload = {
        message: 'Transaction on card 4111222233334444 was processed',
        header: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMCda8Yhe3iZaWbvV5XKSTbuAn0M',
      };

      const redacted = redactPii(stringPayload);
      expect(redacted.message).toContain('[REDACTED]');
      expect(redacted.message).not.toContain('4111222233334444');
      expect(redacted.header).toBe('Bearer [REDACTED]');
    });

    it('should safely handle arrays and circular references without crashing', () => {
      const circularObj: any = {
        name: 'Circular Test',
        items: [{ password: 'secretInArray' }],
      };
      circularObj.self = circularObj;

      const redacted = redactPii(circularObj);
      expect(redacted.name).toBe('Circular Test');
      expect(redacted.items[0].password).toBe('[REDACTED]');
      expect(redacted.self).toBe('[CIRCULAR]');
    });

    it('should preserve null, undefined, dates, and primitives', () => {
      const date = new Date('2026-10-12T00:00:00Z');
      expect(redactPii(null)).toBeNull();
      expect(redactPii(undefined)).toBeUndefined();
      expect(redactPii(12345)).toBe(12345);
      expect(redactPii(date)).toEqual(date);
    });
  });
});

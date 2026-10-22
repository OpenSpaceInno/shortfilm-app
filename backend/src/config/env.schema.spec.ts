import { validateEnv, envSchema } from './env.schema';

describe('Environment Configuration Validation', () => {
  it('should accept valid configuration with default values', () => {
    const config = validateEnv({});
    expect(config.NODE_ENV).toBe('development');
    expect(config.PORT).toBe(3000);
    expect(config.DATABASE_HOST).toBe('localhost');
    expect(config.AUTH0_DOMAIN).toBe('shortreel-dev.auth0.com');
  });

  it('should override defaults with provided environment variables', () => {
    const config = validateEnv({
      NODE_ENV: 'production',
      PORT: '8080',
      DATABASE_NAME: 'shortreel_prod',
      AUTH0_DOMAIN: 'shortreel.auth0.com',
    });

    expect(config.NODE_ENV).toBe('production');
    expect(config.PORT).toBe(8080);
    expect(config.DATABASE_NAME).toBe('shortreel_prod');
    expect(config.AUTH0_DOMAIN).toBe('shortreel.auth0.com');
  });

  it('should reject invalid NODE_ENV', () => {
    expect(() => {
      validateEnv({
        NODE_ENV: 'invalid_env',
      });
    }).toThrow('Environment configuration validation error');
  });
});

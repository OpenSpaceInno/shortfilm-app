import { createHelmetConfig } from './helmet-config.util';

describe('createHelmetConfig', () => {
  it('should generate valid development helmet options', () => {
    const config = createHelmetConfig(false);

    expect(config.hidePoweredBy).toBe(true);
    expect(config.noSniff).toBe(true);
    expect(config.frameguard).toEqual({ action: 'deny' });
    expect(config.hsts).toEqual({
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    });

    const csp = config.contentSecurityPolicy as any;
    expect(csp).toBeDefined();
    expect(csp.directives.defaultSrc).toContain("'self'");
    expect(csp.directives.frameAncestors).toEqual(["'none'"]);
    expect(csp.directives.objectSrc).toEqual(["'none'"]);
    expect(csp.directives.scriptSrc).toContain("'unsafe-inline'");
    expect(csp.directives.mediaSrc).toContain('https://videodelivery.net');
    expect(csp.directives.upgradeInsecureRequests).toBeUndefined();
  });

  it('should generate strict production helmet options without unsafe-inline in scripts', () => {
    const config = createHelmetConfig(true);

    const csp = config.contentSecurityPolicy as any;
    expect(csp.directives.scriptSrc).not.toContain("'unsafe-inline'");
    expect(csp.directives.scriptSrc).toContain("'self'");
    expect(csp.directives.upgradeInsecureRequests).toEqual([]);
    expect(csp.directives.frameAncestors).toEqual(["'none'"]);
  });
});

import { HelmetOptions } from 'helmet';

/**
 * Generates production-hardened Helmet options with strict Content Security Policy (CSP).
 *
 * Designed for ShortReel's modular monolith architecture:
 * - Prevents clickjacking (frameAncestors: none, frameguard: deny)
 * - Restricts media & streams to trusted video CDNs (Cloudflare Stream / videodelivery.net)
 * - Allows Auth0 authentication endpoints
 * - Enforces Strict-Transport-Security (HSTS) with subdomains and preloading
 */
export function createHelmetConfig(isProduction: boolean = false): HelmetOptions {
  return {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          // In development and Swagger UI docs, inline scripts and cdnjs are permitted
          ...(isProduction ? [] : ["'unsafe-inline'"]),
          'https://cdnjs.cloudflare.com',
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
        ],
        fontSrc: [
          "'self'",
          'https://fonts.gstatic.com',
          'data:',
        ],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https:',
        ],
        mediaSrc: [
          "'self'",
          'https://*.cloudflarestream.com',
          'https://videodelivery.net',
          'blob:',
        ],
        connectSrc: [
          "'self'",
          'https://*.auth0.com',
          'https://*.cloudflarestream.com',
          'https://videodelivery.net',
          'https://api.shortreel.io',
        ],
        frameSrc: [
          "'self'",
          'https://*.cloudflarestream.com',
        ],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        ...(isProduction ? { upgradeInsecureRequests: [] } : {}),
      },
    },
    // Cross-origin policies tailored for media streaming and modern browsers
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
  };
}

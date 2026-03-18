import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Block clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // Limit referrer leakage to same-origin cross-origin requests
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features not needed by this app
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Enforce HTTPS for 2 years, including subdomains
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Disable legacy XSS auditor (can be weaponized)
  { key: "X-XSS-Protection", value: "0" },
  // Restrict resource loading to same origin
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js requires 'unsafe-inline' for inline styles in App Router
      "style-src 'self' 'unsafe-inline'",
      // Next.js hydration and Framer Motion require 'unsafe-inline' for scripts in dev;
      // in production Next.js inlines a small runtime chunk — use nonce in a future hardening pass
      "script-src 'self' 'unsafe-inline'",
      // Images from self, data URIs (blob previews), and the R2 CDN
      "img-src 'self' data: blob: https://pub-dfc589fa07b74fc9a27e7a2c2f0645d9.r2.dev",
      // API calls go to the backend and AbacatePay checkout (redirect target)
      "connect-src 'self' https://ecomm-api.deuxcerie.com.br",
      // Fonts from self only
      "font-src 'self'",
      // Local video assets (loading.mp4)
      "media-src 'self'",
      // No plugins, no object embeds
      "object-src 'none'",
      // Prevent base tag hijacking
      "base-uri 'self'",
      // Disallow form submissions to external origins
      "form-action 'self'",
      // Do not allow this page to be framed by anyone
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

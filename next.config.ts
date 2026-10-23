import type { NextConfig } from 'next'
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })

/** Nagłówki bezpieczeństwa wspólne dla całej strony. */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  async rewrites() {
    // Landingi lokalne mają płaski adres pod SEO (/biuro-rachunkowe-krowodrza), a App Router nie
    // obsługuje segmentu dynamicznego z prefiksem - stąd rewrite na wewnętrzną trasę (ADR-006).
    return [{ source: '/biuro-rachunkowe-:dzielnica', destination: '/lokalnie/:dzielnica' }]
  },
  async redirects() {
    // Wewnętrzny adres nie może konkurować w indeksie z publicznym.
    return [{ source: '/lokalnie/:dzielnica', destination: '/biuro-rachunkowe-:dzielnica', permanent: true }]
  },
}

export default withBundleAnalyzer(nextConfig)

// Lighthouse CI: mobile, 5 przebiegów (mediana), progi z planu - 95 w każdej kategorii, LCP < 1,8 s, CLS < 0,05.
// Pomiar z rzeczywistym dławieniem (slow 4G, CPU ×4), nie symulacją Lantern - powód i wynik PSI w ADR-011.
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm start --port 3320',
      startServerReadyPattern: 'Ready',
      url: ['http://localhost:3320/', 'http://localhost:3320/wycena', 'http://localhost:3320/ksef'],
      numberOfRuns: 5,
      settings: {
        formFactor: 'mobile',
        throttlingMethod: 'devtools',
        screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75 },
        // Serwer w CI to HTTP na localhost; produkcja (Vercel) działa po HTTPS z HSTS z next.config.ts.
        skipAudits: ['is-on-https'],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95, aggregationMethod: 'median-run' }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 1800, aggregationMethod: 'median-run' }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.05 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
}

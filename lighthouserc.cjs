// Lighthouse CI: mobile, 5 przebiegów (mediana), progi z planu - 95 w każdej kategorii, LCP < 1,8 s, CLS < 0,05.
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm start --port 3320',
      startServerReadyPattern: 'Ready',
      url: ['http://localhost:3320/', 'http://localhost:3320/wycena', 'http://localhost:3320/ksef'],
      numberOfRuns: 5,
      settings: { preset: 'perf', formFactor: 'mobile', screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75 } },
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

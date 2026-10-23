// Budżet JS: liczy JS (gzip), który przeglądarka pobiera dla kluczowych stron po `next build`.
// Polyfille `noModule` są pomijane - nowoczesne przeglądarki ich nie pobierają.
// Plan zakładał 110 kB dla strony głównej, ale sam runtime Next 16 + React 19 to ~138 kB (ADR-009),
// dlatego budżet pilnuje całości i - przede wszystkim - kodu własnego ponad framework.
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

const BUDGETS = { index: 170, wycena: 200, ksef: 150 } // kB gzip, łącznie z frameworkiem

let failed = false
for (const [page, budget] of Object.entries(BUDGETS)) {
  const html = readFileSync(`.next/server/app/${page}.html`, 'utf8')
  const scripts = [...html.matchAll(/<script[^>]*src="(\/_next\/static\/[^"]+\.js)"[^>]*>/g)]
    .filter(match => !/nomodule/i.test(match[0]))
    .map(match => match[1])
  const total = [...new Set(scripts)].reduce((sum, src) => sum + gzipSync(readFileSync(`.next${src.replace('/_next', '')}`)).length, 0) / 1024
  const ok = total <= budget
  failed ||= !ok
  console.log(`${ok ? '✓' : '✗'} /${page === 'index' ? '' : page}: ${total.toFixed(1)} kB gzip (budżet ${budget} kB)`)
}
process.exit(failed ? 1 : 0)

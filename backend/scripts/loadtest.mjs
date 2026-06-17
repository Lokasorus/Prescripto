import { performance } from 'node:perf_hooks'

function percentile(sortedMs, p) {
  if (sortedMs.length === 0) return null
  const idx = Math.ceil((p / 100) * sortedMs.length) - 1
  return sortedMs[Math.min(Math.max(idx, 0), sortedMs.length - 1)]
}

async function worker(url, requestCount, results) {
  for (let i = 0; i < requestCount; i++) {
    const start = performance.now()
    try {
      const res = await fetch(url)
      // Drain body so timing includes response payload
      await res.arrayBuffer().catch(() => {})
      const ms = performance.now() - start
      results.push({ ok: res.ok, status: res.status, ms })
    } catch (err) {
      const ms = performance.now() - start
      results.push({ ok: false, status: 0, ms, error: String(err?.message || err) })
    }
  }
}

function usageAndExit() {
  // Example:
  // node scripts/loadtest.mjs http://localhost:4000/api/admin/test 2000 20
  console.log('Usage: node scripts/loadtest.mjs <url> <requests> <concurrency>')
  console.log('Example: node scripts/loadtest.mjs http://localhost:4000/api/admin/test 2000 20')
  process.exit(1)
}

const url = process.argv[2]
const requests = Number(process.argv[3] || '0')
const concurrency = Number(process.argv[4] || '0')

if (!url || !Number.isFinite(requests) || !Number.isFinite(concurrency) || requests <= 0 || concurrency <= 0) {
  usageAndExit()
}

const perWorker = Math.floor(requests / concurrency)
const remainder = requests % concurrency

const results = []
const startAll = performance.now()

const workers = Array.from({ length: concurrency }, (_, idx) => {
  const count = perWorker + (idx < remainder ? 1 : 0)
  return worker(url, count, results)
})

await Promise.all(workers)

const totalMs = performance.now() - startAll
const okCount = results.filter(r => r.ok).length
const errCount = results.length - okCount

const latencies = results.map(r => r.ms).sort((a, b) => a - b)
const avg = latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1)
const p50 = percentile(latencies, 50)
const p95 = percentile(latencies, 95)
const p99 = percentile(latencies, 99)
const min = latencies[0]
const max = latencies[latencies.length - 1]
const rps = (results.length / totalMs) * 1000

const statuses = new Map()
for (const r of results) {
  statuses.set(r.status, (statuses.get(r.status) || 0) + 1)
}

const out = {
  url,
  requests: results.length,
  concurrency,
  durationMs: Math.round(totalMs),
  rps: Number(rps.toFixed(2)),
  ok: okCount,
  errors: errCount,
  errorRatePct: Number(((errCount / results.length) * 100).toFixed(2)),
  latencyMs: {
    min: Number(min?.toFixed?.(2) ?? 0),
    avg: Number(avg.toFixed(2)),
    p50: Number((p50 ?? 0).toFixed(2)),
    p95: Number((p95 ?? 0).toFixed(2)),
    p99: Number((p99 ?? 0).toFixed(2)),
    max: Number(max?.toFixed?.(2) ?? 0),
  },
  statusCounts: Object.fromEntries(Array.from(statuses.entries()).sort((a, b) => a[0] - b[0])),
}

console.log(JSON.stringify(out, null, 2))

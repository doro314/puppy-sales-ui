// Drives headless Chrome over CDP with zero dependencies. Pins the clock and
// reports the y-coordinate and height of every block on a page, plus counts of
// things a screenshot won't surface and the image bytes the page pulled.
//
//   node scripts/measure/measure.mjs [--path /bella] [--query ?parents=true]
//                                    [--w 390] [--h 844] [--date 2026-11-24]
//                                    [--shot out.png] [--full]
//                                    [--origin http://localhost:4173]
//
// --path is the page: / for Home, /bella for a puppy, /contact?about=bella.
// --date moves "today". A litter's readyDate turns its available puppies into
//   "Ready Jul 28", so a run is only comparable to another pinned to the same side.
// --full makes the screenshot the whole page rather than the first screen.
//
// Measure the production build, not the dev server — dev serves the original
// 2–4 MB phone photos, so image weights from it are meaningless:
//
//   npm run build && npx vite preview --port 4173 --strictPort &
//   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
//     --headless=new --remote-debugging-port=9222 \
//     --user-data-dir=/tmp/cdp-puppy about:blank &

import { writeFileSync } from 'node:fs'

// ── ADAPT ────────────────────────────────────────────────────────────────────
const TARGETS = {
  header:       '.site-header',
  gallery:      '.hero .carousel-frame, .hero--empty',
  litterCard:   '.litter-card-panel',
  tiles:        '.litter-tiles',
  deposit:      '.home-deposit',
  nextStep:     '.home-button',
  puppiesHead:  '.home-sechead',
  firstCard:    '.puppy-card',
  firstChip:    '.puppy-card .status-chip',
  puppyPhoto:   '.pup-photos .carousel-frame, .pup-photos-empty',
  puppyTitle:   '.pup-title',
  puppyStatus:  '.pup-id .status-chip',
  inquire:      '.pup-button',
  facts:        '.pup-facts',
  litterStrip:  '.litter-strip',
  littermates:  '.pup > .pup-mates',
  contactTitle: '.contact-title',
  footer:       '.site-footer',
}

const COUNTS = {
  navPuppies:   '.site-nav-name',
  statusChips:  '.status-chip',
  puppyCards:   '.puppy-card',
  tiles:        '.litter-tile',
  facts:        '.pup-fact',
  buttons:      'button',
  inquiryPaths: '.pup-button, .home-deposit, .home-button',
}

// counterapi.dev is the live visit counter. A measurement run must never count
// as a visit, whatever isLikelyBot() happens to think of the headless UA.
const BLOCKED = ['*counterapi.dev*']
// ─────────────────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2)
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 ? argv[i + 1] : fallback
}
const flag = (name) => argv.includes(`--${name}`)

const ORIGIN = arg('origin', 'http://localhost:4173')
const W = Number(arg('w', 390))
const H = Number(arg('h', 844))
const PATH = arg('path', '/')
const QUERY = arg('query', '')
const SHOT = arg('shot', null)
const FULL = flag('full')
const SETTLE = Number(arg('settle', 1800))
const [yy, mo, dd] = arg('date', '2026-11-24').split('-').map(Number)
const PINNED = new Date(yy, mo - 1, dd, 10, 30, 0).getTime()

const list = await (await fetch('http://127.0.0.1:9222/json')).json()
const page = list.find((t) => t.type === 'page')
if (!page) { console.error('no page target — is Chrome running with --remote-debugging-port=9222?'); process.exit(1) }
const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r))

let id = 0
const pending = new Map()
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data)
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)
  }
})
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const n = ++id
    pending.set(n, { resolve, reject })
    ws.send(JSON.stringify({ id: n, method, params }))
  })

const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? 'eval failed')
  return r.result.value
}

const navigate = async (url) => {
  const done = new Promise((r) => {
    const on = (e) => {
      if (JSON.parse(e.data).method === 'Page.loadEventFired') { ws.removeEventListener('message', on); r() }
    }
    ws.addEventListener('message', on)
  })
  await send('Page.navigate', { url })
  await done
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

await send('Page.enable')
await send('Runtime.enable')
await send('Network.enable')
await send('Network.setBlockedURLs', { urls: BLOCKED })
await send('Network.setCacheDisabled', { cacheDisabled: true })
const metrics = { width: W, height: H, deviceScaleFactor: 2, mobile: W < 768 }
await send('Emulation.setDeviceMetricsOverride', metrics)

// Pin the clock before any app code runs: the ready-date badges and the
// copyright year both read it.
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `(() => {
    const Real = Date
    const shift = ${PINNED} - Real.now()
    function Fake(...args) {
      if (!(this instanceof Fake)) return new Fake().toString()
      return args.length ? new Real(...args) : new Real(Real.now() + shift)
    }
    Fake.prototype = Real.prototype
    Fake.now = () => Real.now() + shift
    Fake.parse = Real.parse
    Fake.UTC = Real.UTC
    globalThis.Date = Fake
  })()`,
})

await navigate(`${ORIGIN}${PATH}${QUERY}`)
await wait(SETTLE)

const report = await evaluate(`
  (async () => {
    // The hidden breakpoint's copy of an element has a zero rect. Take the
    // first match that occupies space.
    const y = (sel) => {
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect()
        if (r.height > 0) return {
          top: Math.round(r.top + scrollY),
          bottom: Math.round(r.bottom + scrollY),
          h: Math.round(r.height),
        }
      }
      return null
    }
    const out = {
      vw: innerWidth, vh: innerHeight,
      path: location.pathname + location.search,
      pageHeight: Math.round(document.documentElement.scrollHeight),
    }
    const t = ${JSON.stringify(TARGETS)}
    out.blocks = {}
    for (const k in t) { const v = y(t[k]); if (v) out.blocks[k] = v }
    const c = ${JSON.stringify(COUNTS)}
    out.counts = {}
    for (const k in c) out.counts[k] = document.querySelectorAll(c[k]).length
    out.counts.emptyValues = [...document.querySelectorAll('main *')]
      .filter((el) => !el.children.length && /^(——|undefined|null)$/.test(el.textContent.trim())).length
    out.text = {
      title: document.querySelector('main h2')?.textContent.trim() ?? null,
      subtitle: document.querySelector('.hero-sub, .pup-sub')?.textContent.trim() ?? null,
      status: document.querySelector('.pup-id .status-chip')?.textContent.trim() ?? null,
      nextStep: document.querySelector('.pup-button, .home-deposit, .home-button')?.textContent.trim() ?? null,
    }
    const imgs = performance.getEntriesByType('resource').filter((e) => e.initiatorType === 'img')
    out.images = {
      requests: imgs.length,
      kb: Math.round(imgs.reduce((s, e) => s + (e.encodedBodySize || 0), 0) / 1024),
    }
    const main = document.querySelector('.carousel-slide img')
    if (main && main.naturalWidth) {
      const r = main.getBoundingClientRect()
      out.images.mainNatural = main.naturalWidth + 'x' + main.naturalHeight
      out.images.mainShown = Math.round(r.width) + 'x' + Math.round(r.height)
    }
    const card = document.querySelector('.puppy-card-photo, .carousel-thumb img, .pup-mate-photo')
    if (card && card.naturalWidth) {
      const r = card.getBoundingClientRect()
      out.images.cardNatural = card.naturalWidth + 'x' + card.naturalHeight
      out.images.cardShown = Math.round(r.width) + 'x' + Math.round(r.height)
    }
    return out
  })()
`)
console.log(JSON.stringify(report, null, 2))

if (SHOT) {
  const { data } = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: FULL,
    ...(FULL ? { clip: { x: 0, y: 0, width: W, height: report.pageHeight, scale: 1 } } : {}),
  })
  writeFileSync(SHOT, Buffer.from(data, 'base64'))
}

ws.close()
process.exit(0)

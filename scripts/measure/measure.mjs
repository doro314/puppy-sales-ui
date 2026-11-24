// Drives headless Chrome over CDP with zero dependencies. Pins the clock and
// reports the y-coordinate and height of every block on a page, plus counts of
// things a screenshot won't surface and the image bytes the page pulled.
//
//   node scripts/measure/measure.mjs [--tab Olive] [--query ?parents=true]
//                                    [--w 390] [--h 844] [--date 2026-11-24]
//                                    [--shot out.png] [--full]
//                                    [--origin http://localhost:4173]
//
// --tab clicks the sidebar tab with that label before measuring. Navigation is
//   React state, not URLs, so there is no other way to reach a puppy page.
// --full resizes the viewport to the content height before the screenshot.
//   Mobile locks .app-wrapper to 100dvh and scrolls .main-content instead of
//   the document, so captureBeyondViewport alone only ever returns one screen.
// --date moves "today". readyToAdoptDate flips every puppy to Available Soon,
//   so a run is only comparable to another run pinned to the same side of it.
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
  header:      '.site-header',
  navTrigger:  '.mobile-nav-trigger',
  sidebar:     '.sidebar',
  title:       '.gallery-title, .contact-title',
  deposit:     '.deposit-banner',
  details:     '.puppy-details',
  statusBadge: '.status-badge',
  litterInfo:  '.litter-info',
  photo:       '.main-image-container, .paw-placeholder-container',
  photoFooter: '.image-card-footer',
  thumbs:      '.thumbnail-strip',
  cta:         '.cta-card',
  ctaButton:   '.cta-button',
  copyright:   '.gallery-copyright',
}

const COUNTS = {
  navTabs:      '.sidebar-tab',
  statCells:    '.details-stat, .details-grid-item',
  thumbnails:   '.thumbnail-btn',
  ctaCards:     '.cta-card',
  buttons:      'button',
  inquiryPaths: '.cta-button, .deposit-banner-btn, .contact-tab',
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
const TAB = arg('tab', null)
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

// Pin the clock before any app code runs: isAvailableSoon and the copyright
// year both read it.
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

await navigate(`${ORIGIN}/${QUERY}`)
await wait(600)

if (TAB) {
  const clicked = await evaluate(`(() => {
    const want = ${JSON.stringify(TAB)}.toLowerCase()
    const tab = [...document.querySelectorAll('.sidebar-tab')]
      .find((b) => b.textContent.trim().toLowerCase() === want)
    if (!tab) return false
    tab.click()
    return true
  })()`)
  if (!clicked) { console.error(`no sidebar tab labelled "${TAB}"`); process.exit(1) }
}
await wait(SETTLE)

const report = await evaluate(`
  (async () => {
    // The hidden breakpoint's copy of an element has a zero rect. Take the
    // first match that occupies space. Positions are page positions: the
    // mobile scroller is .main-content, so add its scrollTop as well.
    const scroller = document.querySelector('.main-content')
    const sTop = scroller ? scroller.scrollTop : 0
    const y = (sel) => {
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect()
        if (r.height > 0) return {
          top: Math.round(r.top + scrollY + sTop),
          bottom: Math.round(r.bottom + scrollY + sTop),
          h: Math.round(r.height),
        }
      }
      return null
    }
    const isLocked = getComputedStyle(document.querySelector('.app-wrapper')).overflow === 'hidden'
    const out = {
      vw: innerWidth, vh: innerHeight,
      scroller: isLocked ? '.main-content (document locked)' : 'document',
      pageHeight: isLocked
        ? Math.round(scroller.getBoundingClientRect().top + scroller.scrollHeight)
        : Math.round(document.documentElement.scrollHeight),
    }
    const t = ${JSON.stringify(TARGETS)}
    out.blocks = {}
    for (const k in t) { const v = y(t[k]); if (v) out.blocks[k] = v }
    const c = ${JSON.stringify(COUNTS)}
    out.counts = {}
    for (const k in c) out.counts[k] = document.querySelectorAll(c[k]).length
    out.counts.emptyValues = [...document.querySelectorAll('.details-stat-value')]
      .filter((el) => el.textContent.trim() === '\\u2014\\u2014').length
    out.text = {
      title: document.querySelector('.gallery-title, .contact-title')?.textContent.trim() ?? null,
      badge: document.querySelector('.status-badge')?.textContent.trim() ?? null,
      cta: document.querySelector('.cta-card-heading')?.textContent.trim() ?? null,
      ctaButton: document.querySelector('.cta-button')?.textContent.trim() ?? null,
    }
    const imgs = performance.getEntriesByType('resource').filter((e) => e.initiatorType === 'img')
    out.images = {
      requests: imgs.length,
      kb: Math.round(imgs.reduce((s, e) => s + (e.encodedBodySize || 0), 0) / 1024),
    }
    const main = document.querySelector('.main-image')
    if (main && main.naturalWidth) {
      const r = main.getBoundingClientRect()
      out.images.mainNatural = main.naturalWidth + 'x' + main.naturalHeight
      out.images.mainShown = Math.round(r.width) + 'x' + Math.round(r.height)
    }
    const thumb = document.querySelector('.thumbnail')
    if (thumb && thumb.naturalWidth) {
      const r = thumb.getBoundingClientRect()
      out.images.thumbNatural = thumb.naturalWidth + 'x' + thumb.naturalHeight
      out.images.thumbShown = Math.round(r.width) + 'x' + Math.round(r.height)
    }
    return out
  })()
`)
console.log(JSON.stringify(report, null, 2))

if (SHOT) {
  if (FULL) {
    await send('Emulation.setDeviceMetricsOverride', { ...metrics, height: Math.max(H, report.pageHeight + 24) })
    await wait(500)
  }
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: !FULL })
  writeFileSync(SHOT, Buffer.from(data, 'base64'))
  if (FULL) await send('Emulation.setDeviceMetricsOverride', metrics)
}

ws.close()
process.exit(0)

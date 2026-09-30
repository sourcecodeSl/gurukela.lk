import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const OUT = process.argv[2] || 'C:/Users/ASUS/AppData/Local/Temp/claude/d--My-Projects-gurukela-lk/ea1e2b4d-4d1f-4634-be76-64d203300ae9/scratchpad/shots'
mkdirSync(OUT, { recursive: true })

// iPhone 11: 414 x 896 CSS px, DPR 2
const VW = 414, VH = 896

const routes = [
  ['home', '/'],
  ['login', '/login'],
  ['register', '/register'],
  ['lecturer-registration', '/lecturer-registration'],
  ['lecturers', '/lecturers'],
  ['seminars', '/seminars'],
  ['about', '/about'],
  ['contact', '/contact'],
  ['terms', '/terms'],
]

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars=false'],
})
const page = await browser.newPage()
await page.setViewport({ width: VW, height: VH, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1')

const report = []
for (const [name, path] of routes) {
  try {
    await page.goto('http://localhost:5173' + path, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 900))
    // Measure horizontal overflow and find offending elements.
    const info = await page.evaluate((vw) => {
      const de = document.documentElement
      const scrollW = Math.max(de.scrollWidth, document.body.scrollWidth)
      const overflow = scrollW - de.clientWidth
      const offenders = []
      if (overflow > 1) {
        const all = document.querySelectorAll('*')
        for (const el of all) {
          const r = el.getBoundingClientRect()
          if (r.width === 0 || r.height === 0) continue
          if (r.right > de.clientWidth + 1 || r.left < -1) {
            offenders.push({
              tag: el.tagName.toLowerCase(),
              cls: (el.className && el.className.toString ? el.className.toString() : '').slice(0, 60),
              left: Math.round(r.left),
              right: Math.round(r.right),
              w: Math.round(r.width),
            })
          }
        }
      }
      return { scrollW, clientW: de.clientWidth, overflow, offenders: offenders.slice(0, 12) }
    }, VW)
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
    report.push({ name, path, ...info })
    console.log(`[${name}] overflow=${info.overflow}px scrollW=${info.scrollW} client=${info.clientW}`)
    if (info.offenders.length) {
      for (const o of info.offenders) console.log(`   > <${o.tag} class="${o.cls}"> left=${o.left} right=${o.right} w=${o.w}`)
    }
  } catch (e) {
    console.log(`[${name}] ERROR ${e.message}`)
    report.push({ name, path, error: e.message })
  }
}

console.log('\n=== SUMMARY ===')
for (const r of report) {
  if (r.error) console.log(`${r.name}: ERROR ${r.error}`)
  else console.log(`${r.name}: overflow ${r.overflow}px ${r.overflow > 1 ? '⚠️ OVERFLOW' : 'ok'}`)
}
console.log('shots dir:', OUT)
await browser.close()
